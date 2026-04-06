import { NativeEventEmitter, NativeModules } from 'react-native';

const { UssdModule } = NativeModules;
const ussdEventEmitter = UssdModule ? new NativeEventEmitter(UssdModule) : null;

export const dialUssd = (ussdCode: string): Promise<string> => {
  if (!UssdModule) {
    return Promise.reject(new Error('UssdModule is unavailable'));
  }

  return UssdModule.dialUssd(ussdCode);
};

export const dialUssdWithIntent = (ussdCode: string): Promise<string> => {
  if (!UssdModule) {
    return Promise.reject(new Error('UssdModule is unavailable'));
  }

  return UssdModule.dialUssdWithIntent(ussdCode);
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

export default {
  dialUssd,
  dialUssdWithIntent,
  onUssdResponse,
  onUssdError,
};
