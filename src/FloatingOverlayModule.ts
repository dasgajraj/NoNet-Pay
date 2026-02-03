import { NativeModules } from 'react-native';

const { FloatingOverlayModule } = NativeModules;

export const showFloatingOverlay = (data: string): void => {
  if (FloatingOverlayModule) {
    FloatingOverlayModule.show(data);
  }
};

export const hideFloatingOverlay = (): void => {
  if (FloatingOverlayModule) {
    FloatingOverlayModule.hide();
  }
};
