import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import RequestMoneyScreen from '../screens/RequestMoneyScreen';

export type RootStackParamList = {
  Home: undefined;
  SendMoney: { upiId?: string };
  RequestMoney: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="SendMoney" 
          component={SendMoneyScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#fafafa',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#2c2c2c',
            headerTitle: 'Send Money',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen 
          name="RequestMoney" 
          component={RequestMoneyScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#fafafa',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#2c2c2c',
            headerTitle: 'Request Money',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
