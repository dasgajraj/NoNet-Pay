import { NativeModules, NativeEventEmitter } from 'react-native';

const { UssdModule } = NativeModules;
const ussdEventEmitter = new NativeEventEmitter(UssdModule);

export const dialUssd = (ussdCode: string): Promise<string> => {
  return UssdModule.dialUssd(ussdCode);
};

export const dialUssdWithIntent = (ussdCode: string): Promise<string> => {
  return UssdModule.dialUssdWithIntent(ussdCode);
};

export const onUssdResponse = (callback: (response: string) => void) => {
  return ussdEventEmitter.addListener('ussdResponse', callback);
};

export const onUssdError = (callback: (error: string) => void) => {
  return ussdEventEmitter.addListener('ussdError', callback);
};

export default {
  dialUssd,
  dialUssdWithIntent,
  onUssdResponse,
  onUssdError,
};
