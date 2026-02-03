import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from '../screens/HomeScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import RequestMoneyScreen from '../screens/RequestMoneyScreen';
import { Screen } from '../types';
import { requestPermissions, dialUssd as dialUssdService } from '../services/ussdService';

const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const dialUssd = useCallback(async (code: string, dataToCopy?: string) => {
    await dialUssdService(code, setLoading, dataToCopy);
  }, []);

  const renderScreen = () => {
    const commonProps = {
      currentScreen,
      setCurrentScreen,
      loading,
      dialUssd,
    };

    switch (currentScreen) {
      case 'home':
        return <HomeScreen {...commonProps} />;
      case 'send':
        return <SendMoneyScreen {...commonProps} />;
      case 'request':
        return <RequestMoneyScreen {...commonProps} />;
      default:
        return <HomeScreen {...commonProps} />;
    }
  };

  return renderScreen();
};

export default AppNavigator;
