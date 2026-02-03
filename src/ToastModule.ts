import { NativeModules } from 'react-native';

const { ToastModule } = NativeModules;

export const showToast = (message: string): void => {
  if (ToastModule) {
    ToastModule.show(message);
  }
};

export const showLongToast = (message: string): void => {
  if (ToastModule) {
    ToastModule.showLong(message);
  }
};
