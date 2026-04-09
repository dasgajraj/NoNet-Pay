export type Screen = 'home' | 'send';

export interface NavigationProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
}

export interface UssdServiceProps {
  loading: boolean;
  dialUssd: (code: string, dataToCopy?: string) => Promise<boolean>;
}

export type PaymentKind = 'send' | 'request';
export type RecipientType = 'upi' | 'mobile';
export type PaymentAttemptStatus =
  | 'draft'
  | 'ussd_started'
  | 'awaiting_user_completion'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'unknown';

export interface VerificationRecord {
  code: string;
  source: 'response' | 'error';
  message: string;
  outcome: 'success' | 'failed' | 'unknown';
  timestamp: string;
}

export interface ParsedTransactionDetails {
  name?: string;
  amount?: string;
  referenceId?: string;
}

export interface PaymentAttempt {
  id: string;
  kind: PaymentKind;
  recipientType: RecipientType;
  recipientValue: string;
  amount?: string;
  note?: string;
  dialCode: string;
  verificationCodes: string[];
  status: PaymentAttemptStatus;
  createdAt: string;
  updatedAt: string;
  verificationRecords: VerificationRecord[];
  verificationSummary?: string;
  verificationDetail?: string;
  returnedToAppAt?: string;
  parsedTransaction?: ParsedTransactionDetails;
}

export interface StartTrackedPaymentInput {
  kind: PaymentKind;
  recipientType: RecipientType;
  recipientValue: string;
  amount?: string;
  note?: string;
  dialCode: string;
  clipboardValue?: string;
  setLoading: (loading: boolean) => void;
}
