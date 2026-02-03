export type Screen = 'home' | 'send';

export interface NavigationProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
}

export interface UssdServiceProps {
  loading: boolean;
  dialUssd: (code: string, dataToCopy?: string) => Promise<void>;
}
