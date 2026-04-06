import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { onUssdError, onUssdResponse } from '../UssdModule';
import { loadPaymentAttempts, savePaymentAttempts } from '../services/paymentAttemptStore';
import { parseUssdResult } from '../services/ussdParser';
import { dialUssd, sendUssdRequest, USSD_CODES } from '../services/ussdService';
import Log from '../services/Logger';
import { PaymentAttempt, PaymentAttemptStatus, StartTrackedPaymentInput, VerificationRecord } from '../types';

const TAG = 'UssdSession';
const VERIFICATION_TIMEOUT_MS = 12000;

interface UssdSessionContextType {
  attempts: PaymentAttempt[];
  activeAttempt: PaymentAttempt | null;
  startTrackedPayment: (input: StartTrackedPaymentInput) => Promise<void>;
  retryVerification: (attemptId: string) => Promise<void>;
}

const UssdSessionContext = createContext<UssdSessionContextType | undefined>(undefined);

const buildVerificationCodes = (kind: PaymentAttempt['kind']): string[] => {
  if (kind === 'request') {
    return [USSD_CODES.PENDING_REQUESTS, USSD_CODES.TRANSACTIONS];
  }

  return [USSD_CODES.TRANSACTIONS, USSD_CODES.CHECK_BALANCE];
};

const createAttempt = (input: StartTrackedPaymentInput): PaymentAttempt => {
  const timestamp = new Date().toISOString();
  return {
    id: `attempt-${Date.now()}`,
    kind: input.kind,
    recipientType: input.recipientType,
    recipientValue: input.recipientValue,
    amount: input.amount,
    note: input.note,
    dialCode: input.dialCode,
    verificationCodes: buildVerificationCodes(input.kind),
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    verificationRecords: [],
  };
};

export const UssdSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const attemptsRef = useRef<PaymentAttempt[]>([]);
  const verificationRef = useRef<{ attemptId: string; stepIndex: number; timeout: ReturnType<typeof setTimeout> | null } | null>(null);

  useEffect(() => {
    loadPaymentAttempts().then(storedAttempts => {
      setAttempts(storedAttempts);
      const pending = storedAttempts.find(attempt =>
        ['ussd_started', 'awaiting_user_completion', 'verifying'].includes(attempt.status),
      );
      if (pending) {
        setActiveAttemptId(pending.id);
      }
    });
  }, []);

  useEffect(() => {
    savePaymentAttempts(attempts);
  }, [attempts]);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  const activeAttempt = useMemo(
    () => attempts.find(attempt => attempt.id === activeAttemptId) ?? null,
    [attempts, activeAttemptId],
  );

  const updateAttempt = useCallback((attemptId: string, updater: (attempt: PaymentAttempt) => PaymentAttempt) => {
    setAttempts(prev =>
      prev.map(attempt => (attempt.id === attemptId ? updater(attempt) : attempt)),
    );
  }, []);

  const finalizeAttempt = useCallback((attemptId: string, status: PaymentAttemptStatus, summary: string, detail: string) => {
    updateAttempt(attemptId, attempt => ({
      ...attempt,
      status,
      updatedAt: new Date().toISOString(),
      verificationSummary: summary,
      verificationDetail: detail,
    }));
    setActiveAttemptId(null);
    if (verificationRef.current?.timeout) {
      clearTimeout(verificationRef.current.timeout);
    }
    verificationRef.current = null;
  }, [updateAttempt]);

  const appendVerificationRecord = useCallback((attemptId: string, record: VerificationRecord) => {
    updateAttempt(attemptId, attempt => ({
      ...attempt,
      verificationRecords: [record, ...attempt.verificationRecords].slice(0, 8),
      updatedAt: record.timestamp,
    }));
  }, [updateAttempt]);

  const runVerificationStep = useCallback(async (attemptId: string, stepIndex: number) => {
    const attempt = attemptsRef.current.find(item => item.id === attemptId);
    if (!attempt) {
      return;
    }

    const code = attempt.verificationCodes[stepIndex];
    if (!code) {
      finalizeAttempt(
        attemptId,
        'unknown',
        'Could not confirm payment yet',
        'No verification response matched success or failure. Please verify with your bank.',
      );
      return;
    }

    updateAttempt(attemptId, current => ({
      ...current,
      status: 'verifying',
      updatedAt: new Date().toISOString(),
      verificationSummary: `Running verification step ${stepIndex + 1}`,
      verificationDetail: `Dialing ${code} to confirm the latest status.`,
    }));

    const sent = await sendUssdRequest(code);
    if (!sent) {
      if (stepIndex + 1 < attempt.verificationCodes.length) {
        runVerificationStep(attemptId, stepIndex + 1);
        return;
      }

      finalizeAttempt(
        attemptId,
        'unknown',
        'Verification could not start',
        'The app could not send a direct verification USSD request.',
      );
      return;
    }

    if (verificationRef.current?.timeout) {
      clearTimeout(verificationRef.current.timeout);
    }

    verificationRef.current = {
      attemptId,
      stepIndex,
      timeout: setTimeout(() => {
        Log.warn(TAG, `Verification timeout for ${attemptId} at step ${stepIndex}`);
        const latestAttempt = attemptsRef.current.find(item => item.id === attemptId);
        if (latestAttempt && stepIndex + 1 < latestAttempt.verificationCodes.length) {
          runVerificationStep(attemptId, stepIndex + 1);
        } else {
          finalizeAttempt(
            attemptId,
            'unknown',
            'Verification timed out',
            'The carrier did not return a verification response in time.',
          );
        }
      }, VERIFICATION_TIMEOUT_MS),
    };
  }, [finalizeAttempt, updateAttempt]);

  const beginVerification = useCallback(async (attemptId: string) => {
    const attempt = attemptsRef.current.find(item => item.id === attemptId);
    if (!attempt) {
      return;
    }

    Log.info(TAG, `Beginning verification for ${attemptId}`);
    await runVerificationStep(attemptId, 0);
  }, [runVerificationStep]);

  useEffect(() => {
    const responseSubscription = onUssdResponse((response: string) => {
      if (!verificationRef.current) {
        return;
      }

      const { attemptId, stepIndex, timeout } = verificationRef.current;
      if (timeout) {
        clearTimeout(timeout);
      }

      const parsed = parseUssdResult(response);
      appendVerificationRecord(attemptId, {
        code: attemptsRef.current.find(attempt => attempt.id === attemptId)?.verificationCodes[stepIndex] ?? 'unknown',
        source: 'response',
        message: response,
        outcome: parsed.outcome,
        timestamp: new Date().toISOString(),
      });

      if (parsed.outcome === 'success' || parsed.outcome === 'failed') {
        finalizeAttempt(attemptId, parsed.outcome, parsed.summary, parsed.detail);
        return;
      }

      const attempt = attemptsRef.current.find(item => item.id === attemptId);
      if (attempt && stepIndex + 1 < attempt.verificationCodes.length) {
        runVerificationStep(attemptId, stepIndex + 1);
      } else {
        finalizeAttempt(attemptId, 'unknown', parsed.summary, parsed.detail);
      }
    });

    const errorSubscription = onUssdError((errorMessage: string) => {
      if (!verificationRef.current) {
        return;
      }

      const { attemptId, stepIndex, timeout } = verificationRef.current;
      if (timeout) {
        clearTimeout(timeout);
      }

      appendVerificationRecord(attemptId, {
        code: attemptsRef.current.find(attempt => attempt.id === attemptId)?.verificationCodes[stepIndex] ?? 'unknown',
        source: 'error',
        message: errorMessage,
        outcome: 'unknown',
        timestamp: new Date().toISOString(),
      });

      const attempt = attemptsRef.current.find(item => item.id === attemptId);
      if (attempt && stepIndex + 1 < attempt.verificationCodes.length) {
        runVerificationStep(attemptId, stepIndex + 1);
      } else {
        finalizeAttempt(
          attemptId,
          'unknown',
          'Verification returned an error',
          errorMessage,
        );
      }
    });

    return () => {
      responseSubscription.remove();
      errorSubscription.remove();
    };
  }, [appendVerificationRecord, finalizeAttempt, runVerificationStep]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (
        (previousState === 'background' || previousState === 'inactive') &&
        nextAppState === 'active' &&
        activeAttempt &&
        activeAttempt.status === 'awaiting_user_completion'
      ) {
        updateAttempt(activeAttempt.id, attempt => ({
          ...attempt,
          returnedToAppAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        beginVerification(activeAttempt.id);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeAttempt, beginVerification, updateAttempt]);

  const startTrackedPayment = async (input: StartTrackedPaymentInput) => {
    const attempt = createAttempt(input);
    setActiveAttemptId(attempt.id);
    setAttempts(prev => [attempt, ...prev].slice(0, 20));

    updateAttempt(attempt.id, current => ({
      ...current,
      status: 'ussd_started',
      updatedAt: new Date().toISOString(),
      verificationSummary: 'Launching USSD flow',
      verificationDetail: 'Opening the bank USSD dialog for completion.',
    }));

    const started = await dialUssd(input.dialCode, input.setLoading, input.clipboardValue);

    if (started) {
      updateAttempt(attempt.id, current => ({
        ...current,
        status: 'awaiting_user_completion',
        updatedAt: new Date().toISOString(),
        verificationSummary: 'Waiting for completion',
        verificationDetail: 'Complete the payment in the USSD dialog, then return to the app for verification.',
      }));
    } else {
      finalizeAttempt(
        attempt.id,
        'failed',
        'Could not start USSD flow',
        'The app was unable to open the USSD dialog.',
      );
    }
  };

  const retryVerification = async (attemptId: string) => {
    setActiveAttemptId(attemptId);
    await beginVerification(attemptId);
  };

  return (
    <UssdSessionContext.Provider
      value={{
        attempts,
        activeAttempt,
        startTrackedPayment,
        retryVerification,
      }}
    >
      {children}
    </UssdSessionContext.Provider>
  );
};

export const useUssdSession = (): UssdSessionContextType => {
  const context = useContext(UssdSessionContext);
  if (!context) {
    throw new Error('useUssdSession must be used within a UssdSessionProvider');
  }
  return context;
};
