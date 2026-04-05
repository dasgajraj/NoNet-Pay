import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { UssdSessionProvider } from './src/context/UssdSessionContext';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UssdSessionProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </UssdSessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
