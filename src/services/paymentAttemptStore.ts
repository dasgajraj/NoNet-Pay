import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentAttempt } from '../types';

const ATTEMPTS_KEY = '@nonetpay_payment_attempts';

export const loadPaymentAttempts = async (): Promise<PaymentAttempt[]> => {
  try {
    const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as PaymentAttempt[];
  } catch (error) {
    console.error('Failed to load payment attempts:', error);
    return [];
  }
};

export const savePaymentAttempts = async (attempts: PaymentAttempt[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Failed to save payment attempts:', error);
  }
};
