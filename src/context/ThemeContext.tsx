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
    background: '#121212', // Deep charcoal
    surface: 'rgba(30, 30, 30, 0.7)', // Glassmorphism surface
    primary: '#7C3AED', // Royal Purple
    secondary: '#06D6A0', // Neon Teal
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: 'rgba(255, 255, 255, 0.08)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: 'rgba(45, 45, 50, 0.65)', // Enhanced glassmorphism
    cardShadow: 'rgba(124, 58, 237, 0.25)',
    buttonText: '#FFFFFF',
    inputBackground: 'rgba(55, 55, 60, 0.6)',
    placeholder: '#808080',
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
