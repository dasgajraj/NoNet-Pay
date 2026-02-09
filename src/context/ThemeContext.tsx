import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    card: string;
    cardShadow: string;
    buttonText: string;
    inputBackground: string;
    placeholder: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    primary: '#6200ee',
    secondary: '#03dac6',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#b00020',
    success: '#4caf50',
    warning: '#ff9800',
    card: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    buttonText: '#ffffff',
    inputBackground: '#f9f9f9',
    placeholder: '#999999',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#bb86fc',
    secondary: '#03dac6',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#2c2c2c',
    error: '#cf6679',
    success: '#81c784',
    warning: '#ffb74d',
    card: '#1e1e1e',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    buttonText: '#000000',
    inputBackground: '#2c2c2c',
    placeholder: '#757575',
  },
};

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(deviceColorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(deviceColorScheme === 'dark' ? darkTheme : lightTheme);
  }, [deviceColorScheme]);

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
