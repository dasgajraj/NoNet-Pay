/**
 * Modern Payment App Home Screen with Biometric Lock
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  getBiometricName,
} from '../services/BiometricAuth';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  gradient: string[];
  screen: keyof RootStackParamList;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLocked, setIsLocked] = useState(true);
  const [balance, setBalance] = useState('₹0.00');
  const [biometryType, setBiometryType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    initBiometric();
  }, []);

  useEffect(() => {
    if (!isLocked) {
      animateContent();
    }
  }, [isLocked]);

  const initBiometric = async () => {
    const { available, biometryType } = await checkBiometricAvailability();
    if (available && biometryType) {
      setBiometryType(getBiometricName(biometryType));
    } else {
      // No biometric available, unlock immediately
      setIsLocked(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    const success = await authenticateWithBiometric('Unlock OfflineUPI');
    setLoading(false);
    
    if (success) {
      setIsLocked(false);
    }
  };

  const animateContent = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setBalance('₹1,234.56');
      setRefreshing(false);
    }, 1500);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'send',
      title: 'Send Money',
      icon: 'arrow-up-circle',
      gradient: ['#FF6B6B', '#FF8E8E'],
      screen: 'SendMoney',
    },
    {
      id: 'request',
      title: 'Request',
      icon: 'arrow-down-circle',
      gradient: ['#4ECDC4', '#6FE7DD'],
      screen: 'RequestMoney',
    },
    {
      id: 'scan',
      title: 'Scan QR',
      icon: 'qrcode-scan',
      gradient: ['#95E1D3', '#AAF683'],
      screen: 'SendMoney',
    },
  ];

  const recentTransactions = [
    { id: '1', type: 'received', amount: '+₹500', from: 'Rajesh Kumar', time: '2h ago', icon: 'arrow-down', color: '#4ECDC4' },
    { id: '2', type: 'sent', amount: '-₹200', to: 'Grocery Store', time: '5h ago', icon: 'arrow-up', color: '#FF6B6B' },
    { id: '3', type: 'received', amount: '+₹1,000', from: 'Salary', time: '1d ago', icon: 'arrow-down', color: '#4ECDC4' },
  ];

  if (isLocked) {
    return (
      <View style={styles.lockContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          style={styles.lockGradient}
        >
          <View style={styles.lockContent}>
            <Icon name="shield-lock" size={100} color="#fff" />
            <Text style={styles.lockTitle}>OfflineUPI</Text>
            <Text style={styles.lockSubtitle}>Secure Payment App</Text>
            
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={handleBiometricAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="fingerprint" size={24} color="#fff" />
                  <Text style={styles.unlockButtonText}>
                    {biometryType ? `Unlock with ${biometryType}` : 'Unlock'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5f4dee" />
      
      {/* Header with Balance Card */}
      <LinearGradient
        colors={['#5f4dee', '#7c5fe8', '#9b7ded']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>UPI User</Text>
          </View>
          <TouchableOpacity style={styles.lockIcon} onPress={() => setIsLocked(true)}>
            <Icon name="lock" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.balanceCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.balanceCardGradient}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Icon name="eye" size={20} color="#fff" />
            </View>
            <Text style={styles.balanceAmount}>{balance}</Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceAction}>
                <Icon name="bank" size={16} color="#fff" />
                <Text style={styles.balanceActionText}>Link Bank</Text>
              </View>
              <TouchableOpacity onPress={onRefresh}>
                <Icon name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50 + index * 10],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => {
                    if (action.screen === 'SendMoney') {
                      navigation.navigate('SendMoney', {});
                    } else {
                      navigation.navigate(action.screen as any);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                  >
                    <Icon name={action.icon} size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.map((transaction, index) => (
            <Animated.View
              key={transaction.id}
              style={[
                styles.transactionCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, index % 2 === 0 ? -50 : 50],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.transactionIcon, { backgroundColor: transaction.color + '20' }]}>
                <Icon name={transaction.icon} size={24} color={transaction.color} />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionName}>
                  {transaction.type === 'received' ? transaction.from : transaction.to}
                </Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'received' ? '#4ECDC4' : '#FF6B6B' },
                ]}
              >
                {transaction.amount}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Features Banner */}
        <Animated.View
          style={[
            styles.featureBanner,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#FFA07A', '#FF7F50']}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="shield-check" size={40} color="#fff" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>100% Secure</Text>
              <Text style={styles.bannerSubtitle}>
                Protected with biometric authentication
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  lockContainer: {
    flex: 1,
  },
  lockGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
  },
  lockSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    marginBottom: 50,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 12,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  lockIcon: {
    padding: 8,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  balanceCardGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceActionText: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#5f4dee',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 13,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureBanner: {
    marginHorizontal: 20,
    marginVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
});

export default HomeScreen;
