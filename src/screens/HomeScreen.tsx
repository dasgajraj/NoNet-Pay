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
import { USSD_CODES, dialUssd, requestPermissions } from '../services/ussdService';
import QRScanner from '../components/QRScanner';

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
  const [biometryType, setBiometryType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Delay initialization to ensure Activity is ready
    const timer = setTimeout(() => {
      initBiometric();
      requestPermissions();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLocked) {
      animateContent();
    }
  }, [isLocked]);

  const initBiometric = async () => {
    try {
      const { available, biometryType } = await checkBiometricAvailability();
      if (available && biometryType) {
        setBiometryType(getBiometricName(biometryType));
        // Automatically trigger biometric authentication
        handleBiometricAuth();
      } else {
        // No biometric available, unlock immediately
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error initializing biometric:', error);
      // On error, unlock immediately
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

  const skipBiometric = () => {
    setIsLocked(false);
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



  const quickActions: QuickAction[] = [
    {
      id: 'send',
      title: 'Send Money',
      icon: 'arrow-up',
      gradient: ['#2c2c2c', '#2c2c2c'],
      screen: 'SendMoney',
    },
    {
      id: 'request',
      title: 'Request',
      icon: 'arrow-down',
      gradient: ['#404040', '#404040'],
      screen: 'RequestMoney',
    },
    {
      id: 'scan',
      title: 'Scan QR',
      icon: 'qrcode-scan',
      gradient: ['#2c2c2c', '#2c2c2c'],
      screen: 'SendMoney',
    },
    {
      id: 'balance',
      title: 'Balance',
      icon: 'wallet-outline',
      gradient: ['#404040', '#404040'],
      screen: 'Home',
    },
    {
      id: 'transactions',
      title: 'History',
      icon: 'clock-outline',
      gradient: ['#2c2c2c', '#2c2c2c'],
      screen: 'Home',
    },
    {
      id: 'pending',
      title: 'Pending',
      icon: 'progress-clock',
      gradient: ['#404040', '#404040'],
      screen: 'Home',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'account-outline',
      gradient: ['#2c2c2c', '#2c2c2c'],
      screen: 'Home',
    },
    {
      id: 'upipin',
      title: 'UPI PIN',
      icon: 'lock-outline',
      gradient: ['#404040', '#404040'],
      screen: 'Home',
    },
  ];

  const handleActionPress = async (action: QuickAction) => {
    switch (action.id) {
      case 'send':
        navigation.navigate('SendMoney', {});
        break;
      case 'request':
        navigation.navigate('RequestMoney');
        break;
      case 'scan':
        setShowQRScanner(true);
        break;
      case 'balance':
        await dialUssd(USSD_CODES.CHECK_BALANCE, setLoading);
        break;
      case 'transactions':
        await dialUssd(USSD_CODES.TRANSACTIONS, setLoading);
        break;
      case 'pending':
        await dialUssd(USSD_CODES.PENDING_REQUESTS, setLoading);
        break;
      case 'profile':
        await dialUssd(USSD_CODES.PROFILE, setLoading);
        break;
      case 'upipin':
        await dialUssd(USSD_CODES.UPI_PIN, setLoading);
        break;
      default:
        navigation.navigate(action.screen as any);
    }
  };



  if (isLocked) {
    return (
      <View style={styles.lockContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.lockGradient}>
          <View style={styles.lockContent}>
            <Icon name="shield-lock-outline" size={80} color="#2c2c2c" />
            <Text style={styles.lockTitle}>OfflineUPI</Text>
            <Text style={styles.lockSubtitle}>Secure Payment App</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2c2c2c" />
                <Text style={styles.loadingText}>
                  {biometryType ? `Authenticating with ${biometryType}...` : 'Authenticating...'}
                </Text>
              </View>
            ) : (
              <View style={styles.authOptions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleBiometricAuth}
                >
                  <Icon name="fingerprint" size={24} color="#fff" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipBiometric}
                >
                  <Text style={styles.skipButtonText}>Skip Authentication</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      {/* Header with Balance Card */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome to</Text>
            <Text style={styles.userName}>Offline UPI</Text>
          </View>
          <TouchableOpacity style={styles.lockIcon} onPress={() => setIsLocked(true)}>
            <Icon name="lock-outline" size={24} color="#2c2c2c" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
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
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <View style={styles.actionGradient}>
                    {loading && (action.id === 'balance' || action.id === 'transactions' || action.id === 'pending' || action.id === 'profile' || action.id === 'upipin') ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Icon name={action.icon} size={28} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* USSD Info Banner */}
        <Animated.View
          style={[
            styles.featureBanner,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.bannerGradient}>
            <Icon name="phone-outline" size={32} color="#2c2c2c" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Powered by *99#</Text>
              <Text style={styles.bannerSubtitle}>
                Offline UPI via USSD - Works without internet
              </Text>
            </View>
          </View>
        </Animated.View>



        {/* Features Banner */}
        <Animated.View
          style={[
            styles.featureBanner,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.bannerGradient}>
            <Icon name="shield-check-outline" size={32} color="#2c2c2c" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>100% Secure</Text>
              <Text style={styles.bannerSubtitle}>
                Protected with biometric authentication
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={(upiId) => {
          setShowQRScanner(false);
          navigation.navigate('SendMoney', { upiId });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  lockContainer: {
    flex: 1,
  },
  lockGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  lockContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c2c2c',
    marginTop: 30,
    letterSpacing: -0.5,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#6b6b6b',
    marginTop: 12,
    marginBottom: 50,
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#2c2c2c',
    fontSize: 15,
    marginTop: 16,
  },
  authOptions: {
    alignItems: 'center',
    marginTop: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#6b6b6b',
    fontSize: 14,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 30,
    backgroundColor: '#fafafa',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6b6b6b',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2c2c',
    marginTop: 4,
    letterSpacing: -0.5,
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
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    color: '#6b6b6b',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 3,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  actionGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#2c2c2c',
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    lineHeight: 14,
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
    color: '#2c2c2c',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureBanner: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  bannerGradient: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    fontWeight: '400',
    lineHeight: 18,
  },
});

export default HomeScreen;
