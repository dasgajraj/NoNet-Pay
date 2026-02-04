import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from '../screens/HomeScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import { Screen } from '../types';
import { requestPermissions, dialUssd as dialUssdService } from '../services/ussdService';

const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [loading, setLoading] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const dialUssd = useCallback(async (code: string, dataToCopy?: string) => {
    await dialUssdService(code, setLoading, dataToCopy);
  }, []);

  const handleScanQR = useCallback((upiId: string) => {
    setScannedUpiId(upiId);
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
        return <HomeScreen {...commonProps} onScanQR={handleScanQR} />;
      case 'send':
        return <SendMoneyScreen {...commonProps} scannedUpiId={scannedUpiId} />;
      default:
        return <HomeScreen {...commonProps} onScanQR={handleScanQR} />;
    }
  };

  return renderScreen();
};

export default AppNavigator;
