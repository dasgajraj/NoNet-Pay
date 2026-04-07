import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  isAccessibilityServiceEnabled,
  onUssdAccessibilityText,
  openAccessibilitySettings,
} from '../UssdModule';
import { loadPaymentAttempts, savePaymentAttempts } from '../services/paymentAttemptStore';
import { parseUssdResult } from '../services/ussdParser';
import { dialUssd } from '../services/ussdService';
import Log from '../services/Logger';
import { PaymentAttempt, PaymentAttemptStatus, StartTrackedPaymentInput, VerificationRecord } from '../types';

const TAG = 'UssdSession';

interface UssdSessionContextType {
  attempts: PaymentAttempt[];
  activeAttempt: PaymentAttempt | null;
  accessibilityEnabled: boolean;
  startTrackedPayment: (input: StartTrackedPaymentInput) => Promise<void>;
  refreshAccessibilityStatus: () => Promise<void>;
  openAccessibilitySetup: () => Promise<void>;
}

const UssdSessionContext = createContext<UssdSessionContextType | undefined>(undefined);

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
    verificationCodes: [],
    status: 'awaiting_user_completion',
    createdAt: timestamp,
    updatedAt: timestamp,
    verificationRecords: [],
    verificationSummary: 'Waiting for USSD result',
    verificationDetail: 'Complete the transfer in the USSD dialog. The app will read success or failure text from that dialog.',
  };
};

const mapOutcomeToStatus = (outcome: 'success' | 'failed' | 'unknown'): PaymentAttemptStatus => {
  if (outcome === 'success') {
    return 'success';
  }

  if (outcome === 'failed') {
    return 'failed';
  }

  return 'awaiting_user_completion';
};

export const UssdSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const attemptsRef = useRef<PaymentAttempt[]>([]);

  useEffect(() => {
    loadPaymentAttempts().then(storedAttempts => {
      setAttempts(storedAttempts);
      const pending = storedAttempts.find(attempt => attempt.status === 'awaiting_user_completion');
      if (pending) {
        setActiveAttemptId(pending.id);
      }
    });
  }, []);

  useEffect(() => {
    attemptsRef.current = attempts;
    savePaymentAttempts(attempts);
  }, [attempts]);

  const refreshAccessibilityStatus = useCallback(async () => {
    try {
      const enabled = await isAccessibilityServiceEnabled();
      setAccessibilityEnabled(enabled);
    } catch (error) {
      Log.warn(TAG, 'Could not refresh accessibility status', error);
      setAccessibilityEnabled(false);
    }
  }, []);

  useEffect(() => {
    refreshAccessibilityStatus();
  }, [refreshAccessibilityStatus]);

  const activeAttempt = useMemo(
    () => attempts.find(attempt => attempt.id === activeAttemptId) ?? null,
    [attempts, activeAttemptId],
  );

  const updateAttempt = useCallback((attemptId: string, updater: (attempt: PaymentAttempt) => PaymentAttempt) => {
    setAttempts(prev => prev.map(attempt => (attempt.id === attemptId ? updater(attempt) : attempt)));
  }, []);

  const appendRecord = useCallback((attemptId: string, record: VerificationRecord) => {
    updateAttempt(attemptId, attempt => ({
      ...attempt,
      verificationRecords: [record, ...attempt.verificationRecords].slice(0, 12),
      updatedAt: record.timestamp,
    }));
  }, [updateAttempt]);

  useEffect(() => {
    const subscription = onUssdAccessibilityText(payload => {
      const text = payload?.text?.trim();
      if (!text) {
        return;
      }

      const targetAttempt = activeAttemptId
        ? attemptsRef.current.find(attempt => attempt.id === activeAttemptId)
        : attemptsRef.current.find(attempt => attempt.status === 'awaiting_user_completion');

      if (!targetAttempt) {
        return;
      }

      const parsed = parseUssdResult(text);
      const timestamp = new Date().toISOString();

      appendRecord(targetAttempt.id, {
        code: targetAttempt.dialCode,
        source: 'response',
        message: text,
        outcome: parsed.outcome,
        timestamp,
      });

      updateAttempt(targetAttempt.id, current => ({
        ...current,
        status: mapOutcomeToStatus(parsed.outcome),
        verificationSummary:
          parsed.outcome === 'unknown'
            ? 'USSD response detected'
            : parsed.summary,
        verificationDetail: parsed.detail,
        updatedAt: timestamp,
      }));

      if (parsed.outcome === 'success' || parsed.outcome === 'failed') {
        Log.info(TAG, `Marked attempt ${targetAttempt.id} as ${parsed.outcome}`);
        setActiveAttemptId(null);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeAttemptId, appendRecord, updateAttempt]);

  const startTrackedPayment = useCallback(async (input: StartTrackedPaymentInput) => {
    const attempt = createAttempt(input);
    setActiveAttemptId(attempt.id);
    setAttempts(prev => [attempt, ...prev].slice(0, 20));

    const started = await dialUssd(input.dialCode, input.setLoading, input.clipboardValue);

    if (!started) {
      updateAttempt(attempt.id, current => ({
        ...current,
        status: 'failed',
        verificationSummary: 'Could not start USSD flow',
        verificationDetail: 'The app was unable to open the USSD dialog.',
        updatedAt: new Date().toISOString(),
      }));
      setActiveAttemptId(null);
    }
  }, [updateAttempt]);

  const openAccessibilitySetup = useCallback(async () => {
    await openAccessibilitySettings();
  }, []);

  return (
    <UssdSessionContext.Provider
      value={{
        attempts,
        activeAttempt,
        accessibilityEnabled,
        startTrackedPayment,
        refreshAccessibilityStatus,
        openAccessibilitySetup,
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
