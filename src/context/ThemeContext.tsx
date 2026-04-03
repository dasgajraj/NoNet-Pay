import React, { createContext, useContext, ReactNode } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  statusBar: 'light-content' | 'dark-content';
  navigationTheme: NavigationTheme;
  colors: {
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceVariant: string;
    surfaceMuted: string;
    card: string;
    cardElevated: string;
    tabBar: string;
    primary: string;
    primaryContainer: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderStrong: string;
    outline: string;
    overlay: string;
    shadow: string;
    success: string;
    successContainer: string;
    warning: string;
    warningContainer: string;
    error: string;
    disabled: string;
    buttonText: string;
    inputBackground: string;
    placeholder: string;
  };
}

const lightColors = {
  background: '#F5F7F2',
  backgroundSecondary: '#EDF1EA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F4EE',
  surfaceMuted: '#E6EBE4',
  card: '#FCFDFB',
  cardElevated: '#FFFFFF',
  tabBar: 'rgba(255, 255, 255, 0.92)',
  primary: '#205C4F',
  primaryContainer: '#DCEFE8',
  secondary: '#5E7C73',
  accent: '#6F8F83',
  text: '#18201C',
  textSecondary: '#5D6A64',
  textTertiary: '#86918B',
  border: '#DCE4DD',
  borderStrong: '#C7D1CA',
  outline: 'rgba(24, 32, 28, 0.08)',
  overlay: 'rgba(24, 32, 28, 0.42)',
  shadow: 'rgba(18, 28, 24, 0.10)',
  success: '#1D7B5B',
  successContainer: '#E0F3EA',
  warning: '#B7791F',
  warningContainer: '#FFF1D9',
  error: '#C24141',
  disabled: '#AEB8B2',
  buttonText: '#FFFFFF',
  inputBackground: '#F7F9F6',
  placeholder: '#8B9590',
};

const darkColors = {
  background: '#0F1412',
  backgroundSecondary: '#151B18',
  surface: '#171D1A',
  surfaceVariant: '#1D2420',
  surfaceMuted: '#232B26',
  card: '#181F1B',
  cardElevated: '#1D2521',
  tabBar: 'rgba(23, 29, 26, 0.94)',
  primary: '#8EC8B8',
  primaryContainer: '#1F3D35',
  secondary: '#9EB8AF',
  accent: '#B7CEC5',
  text: '#F4F7F4',
  textSecondary: '#B4BEB8',
  textTertiary: '#88928D',
  border: '#26302B',
  borderStrong: '#334039',
  outline: 'rgba(244, 247, 244, 0.08)',
  overlay: 'rgba(5, 8, 7, 0.62)',
  shadow: 'rgba(0, 0, 0, 0.34)',
  success: '#75D8AE',
  successContainer: '#173328',
  warning: '#E6B869',
  warningContainer: '#392A12',
  error: '#FF8A8A',
  disabled: '#53615B',
  buttonText: '#0F1412',
  inputBackground: '#121815',
  placeholder: '#75807A',
};

const lightTheme: Theme = {
  dark: false,
  statusBar: 'dark-content',
  navigationTheme: {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: lightColors.primary,
      background: lightColors.background,
      card: lightColors.surface,
      text: lightColors.text,
      border: lightColors.border,
      notification: lightColors.primary,
    },
  },
  colors: lightColors,
};

const darkTheme: Theme = {
  dark: true,
  statusBar: 'light-content',
  navigationTheme: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: darkColors.primary,
      background: darkColors.background,
      card: darkColors.surface,
      text: darkColors.text,
      border: darkColors.border,
      notification: darkColors.primary,
    },
  },
  colors: darkColors,
};

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const theme = deviceColorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
