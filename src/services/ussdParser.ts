type ParsedOutcome = 'success' | 'failed' | 'unknown';

export interface ParsedUssdResult {
  outcome: ParsedOutcome;
  summary: string;
  detail: string;
}

const SUCCESS_PATTERN =
  /your payment to\s+(.+?),\s*for\s+rs\.?\s*([\d,.]+)\s+is\s+successful\s*\{?\s*ref(?:id)?\s*:\s*([a-z0-9-]+)\s*\}?/i;

const FAILURE_PATTERN =
  /your payment to\s+(.+?)\s+(?:for\s+rs\.?\s*([\d,.]+)\s+)?(?:has\s+)?(failed|unsuccessful|declined)/i;

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

  const successMatch = message.match(SUCCESS_PATTERN);
  if (successMatch) {
    const [, payee, amount, referenceId] = successMatch;
    return {
      outcome: 'success',
      summary: `Payment successful to ${payee.trim()}`,
      detail: `Amount: Rs. ${amount.trim()}  Ref ID: ${referenceId.trim()}`,
    };
  }

  const failureMatch = message.match(FAILURE_PATTERN);
  if (failureMatch) {
    const [, payee, amount] = failureMatch;
    return {
      outcome: 'failed',
      summary: `Payment failed${payee ? ` to ${payee.trim()}` : ''}`,
      detail: amount ? `Attempted amount: Rs. ${amount.trim()}` : message,
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
