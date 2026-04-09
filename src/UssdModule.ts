import { NativeEventEmitter, NativeModules } from 'react-native';

type AccessibilityPayload = {
  text: string;
  packageName?: string;
  className?: string;
  timestamp?: number;
};

const nativeUssdModule = NativeModules.UssdModule;
const ussdEventEmitter = nativeUssdModule ? new NativeEventEmitter(nativeUssdModule) : null;

export const dialUssd = (ussdCode: string): Promise<string> => {
  if (!nativeUssdModule) {
    return Promise.reject(new Error('UssdModule is unavailable'));
  }

  return nativeUssdModule.dialUssd(ussdCode);
};

export const dialUssdWithIntent = (ussdCode: string): Promise<string> => {
  if (!nativeUssdModule) {
    return Promise.reject(new Error('UssdModule is unavailable'));
  }

  return nativeUssdModule.dialUssdWithIntent(ussdCode);
};

export const openAccessibilitySettings = (): Promise<boolean> => {
  if (!nativeUssdModule) {
    return Promise.reject(new Error('UssdModule is unavailable'));
  }

  return nativeUssdModule.openAccessibilitySettings();
};

export const isAccessibilityServiceEnabled = (): Promise<boolean> => {
  if (!nativeUssdModule) {
    return Promise.resolve(false);
  }

  return nativeUssdModule.isAccessibilityServiceEnabled();
};

export const playSuccessTone = (): Promise<boolean> => {
  if (!nativeUssdModule) {
    return Promise.resolve(false);
  }

  return nativeUssdModule.playSuccessTone();
};

export const setSecureScreenEnabled = (enabled: boolean): Promise<boolean> => {
  if (!nativeUssdModule) {
    return Promise.resolve(false);
  }

  return nativeUssdModule.setSecureScreenEnabled(enabled);
};

export const onUssdResponse = (callback: (response: string) => void) => {
  if (!ussdEventEmitter) {
    return { remove: () => undefined };
  }

  return ussdEventEmitter.addListener('ussdResponse', callback);
};

export const onUssdError = (callback: (error: string) => void) => {
  if (!ussdEventEmitter) {
    return { remove: () => undefined };
  }

  return ussdEventEmitter.addListener('ussdError', callback);
};

export const onUssdAccessibilityText = (callback: (payload: AccessibilityPayload) => void) => {
  if (!ussdEventEmitter) {
    return { remove: () => undefined };
  }

  return ussdEventEmitter.addListener('ussdAccessibilityText', callback);
};

export default {
  dialUssd,
  dialUssdWithIntent,
  openAccessibilitySettings,
  isAccessibilityServiceEnabled,
  playSuccessTone,
  setSecureScreenEnabled,
  onUssdResponse,
  onUssdError,
  onUssdAccessibilityText,
};
