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
    background: '#F1F1F1', // Anti-Flash White
    surface: 'rgba(255, 255, 255, 0.9)', // White with transparency
    primary: '#6491DE', // United Nations Blue
    secondary: '#8fb4e8', // Light blue accent
    text: '#1a1a1a', // Dark text for contrast
    textSecondary: '#5a5a5a',
    border: 'rgba(100, 145, 222, 0.2)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: 'rgba(255, 255, 255, 0.95)', // White card with slight transparency
    cardShadow: 'rgba(100, 145, 222, 0.15)',
    buttonText: '#FFFFFF',
    inputBackground: 'rgba(100, 145, 222, 0.08)',
    placeholder: '#888888',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0a1628', // Dark navy blue
    surface: 'rgba(10, 34, 76, 0.7)', // Glassmorphism surface
    primary: '#6491DE', // United Nations Blue
    secondary: '#8fb4e8', // Light blue accent
    text: '#F1F1F1', // Anti-Flash White
    textSecondary: '#B0B8C5',
    border: 'rgba(100, 145, 222, 0.15)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: 'rgba(10, 61, 127, 0.65)', // Dark Cerulean glassmorphism
    cardShadow: 'rgba(100, 145, 222, 0.3)',
    buttonText: '#F1F1F1',
    inputBackground: 'rgba(7, 61, 127, 0.5)',
    placeholder: '#8893A5',
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
