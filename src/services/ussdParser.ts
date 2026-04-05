type ParsedOutcome = 'success' | 'failed' | 'unknown';

export interface ParsedUssdResult {
  outcome: ParsedOutcome;
  summary: string;
  detail: string;
}

const SUCCESS_KEYWORDS = [
  'successful',
  'successfully',
  'success',
  'debited',
  'credited',
  'completed',
  'processed',
  'request sent',
  'txn successful',
  'transaction successful',
  'payment successful',
];

const FAILURE_KEYWORDS = [
  'failed',
  'failure',
  'declined',
  'insufficient',
  'incorrect',
  'wrong',
  'invalid',
  'timed out',
  'timeout',
  'cancelled',
  'canceled',
  'not processed',
  'unable',
  'error',
  'unsuccessful',
];

export const parseUssdResult = (message: string): ParsedUssdResult => {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return {
      outcome: 'unknown',
      summary: 'No response received',
      detail: 'The carrier returned an empty USSD response.',
    };
  }

  if (SUCCESS_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return {
      outcome: 'success',
      summary: 'Payment likely succeeded',
      detail: message,
    };
  }

  if (FAILURE_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return {
      outcome: 'failed',
      summary: 'Payment likely failed',
      detail: message,
    };
  }

  return {
    outcome: 'unknown',
    summary: 'Could not confirm yet',
    detail: message,
  };
};
