import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
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

const TabBar = ({ isLocked, onScanPress, ...props }: any) => {
  if (isLocked) {
    return null;
  }

  return <CustomBottomTab {...props} onScanPress={onScanPress} />;
};

const MainTabs: React.FC = () => {
  const { isLocked } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <Tab.Navigator
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBar={props => <TabBar {...props} isLocked={isLocked} onScanPress={() => setShowScanner(true)} />}
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
        onScan={() => {
          setShowScanner(false);
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

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.colors.background} />
        <View style={[styles.loadingCard, { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer theme={theme.navigationTheme}>
        <Stack.Navigator
          initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          {!hasCompletedOnboarding && (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ gestureEnabled: false }}
            />
          )}
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
});

export default AppNavigator;
