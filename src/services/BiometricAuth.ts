/**
 * Biometric Authentication Service
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export interface BiometricCapability {
  available: boolean;
  biometryType: BiometryTypes | null;
}

export const checkBiometricAvailability = async (): Promise<BiometricCapability> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  } catch (error) {
    console.error('Biometric check error:', error);
    return { available: false, biometryType: null };
  }
};

export const authenticateWithBiometric = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<boolean> => {
  try {
    // Add a small delay to ensure FragmentActivity is ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });
    return success;
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    // If FragmentActivity is null, return false instead of throwing
    if (error?.message?.includes('FragmentActivity')) {
      console.warn('FragmentActivity not ready, skipping biometric auth');
    }
    return false;
  }
};

export const getBiometricIcon = (biometryType: BiometryTypes | null): string => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'face-recognition';
    case BiometryTypes.TouchID:
    case BiometryTypes.Biometrics:
      return 'fingerprint';
    default:
      return 'lock';
  }
};

export const getBiometricName = (biometryType: BiometryTypes | null): string => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'Face ID';
    case BiometryTypes.TouchID:
      return 'Touch ID';
    case BiometryTypes.Biometrics:
      return 'Biometric';
    default:
      return 'Biometric';
  }
};
