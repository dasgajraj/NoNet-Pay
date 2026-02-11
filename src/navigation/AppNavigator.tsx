import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import RequestMoneyScreen from '../screens/RequestMoneyScreen';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/OnboardingScreen';
import QRScanner from '../components/QRScanner';
import CustomBottomTab from '../components/CustomBottomTab';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  SendMoney: { upiId?: string };
  RequestMoney: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SendMoney: { upiId?: string };
  RequestMoney: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const { theme } = useTheme();
  const { isLocked } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => 
          !isLocked ? (
            <CustomBottomTab
              {...props}
              onScanPress={() => setShowScanner(true)}
            />
          ) : null
        }
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="SendMoney" component={SendMoneyScreen} />
        <Tab.Screen name="RequestMoney" component={RequestMoneyScreen} />
      </Tab.Navigator>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(upiId) => {
          setShowScanner(false);
          // Navigate to SendMoney with scanned UPI ID
        }}
      />
    </>
  );
};

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {!hasCompletedOnboarding && (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        )}
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
