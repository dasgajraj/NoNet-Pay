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
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });
    return success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
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
