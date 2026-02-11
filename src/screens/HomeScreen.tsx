/**
 * NoNet Pay - Home Screen
 * High-Fidelity Fintech UI with Glassmorphism
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd, requestPermissions } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  getBiometricName,
} from '../services/BiometricAuth';
import QRScanner from '../components/QRScanner';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Home'>;

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  gradient: string[];
  screen: keyof MainTabParamList;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const { isLocked, setIsLocked } = useAuth();
  const [biometryType, setBiometryType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
        handleBiometricAuth();
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error initializing biometric:', error);
      setIsLocked(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    const success = await authenticateWithBiometric('Unlock NoNet Pay');
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



  const quickActions: QuickAction[] = [
    {
      id: 'balance',
      title: 'Check Balance',
      icon: 'wallet-outline',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'Home',
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      icon: 'history',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'Home',
    },
    {
      id: 'upipin',
      title: 'UPI PIN',
      icon: 'lock-outline',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'Home',
    },
    {
      id: 'request',
      title: 'Request Money',
      icon: 'cash-refund',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'RequestMoney',
    },
    {
      id: 'send',
      title: 'Send Money',
      icon: 'send-outline',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'SendMoney',
    },
    {
      id: 'pending',
      title: 'Pending',
      icon: 'clock-time-four-outline',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'Home',
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: 'account-outline',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'Home',
    },
    {
      id: 'support',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      gradient: [theme.colors.secondary, theme.colors.secondary],
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={styles.lockContent}>
          <Icon name="shield-lock-outline" size={88} color={theme.colors.primary} />
          <Text style={[styles.lockTitle, { color: theme.colors.text }]}>NoNet Pay</Text>
          <Text style={[styles.lockSubtitle, { color: theme.colors.textSecondary }]}>Secure Payment App</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                {biometryType ? `Authenticating with ${biometryType}...` : 'Authenticating...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleBiometricAuth}
            >
              <Icon name="fingerprint" size={26} color={theme.colors.buttonText} />
              <Text style={[styles.retryButtonText, { color: theme.colors.buttonText }]}>
                Authenticate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>NoNet Pay</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsLocked(true)}
            style={[styles.lockButton, { backgroundColor: theme.colors.card }]}
          >
            <Icon name="lock-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Premium Status Card with Glassmorphism */}
        <Animated.View
          style={[
            styles.statusCard,
            {
              opacity: fadeAnim,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <View style={[styles.signalBadge, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Icon name="signal" size={18} color={theme.colors.secondary} />
              <Text style={[styles.signalText, { color: theme.colors.secondary }]}>Offline Mode Active</Text>
            </View>
          </View>
          
          {/* Large Scan Button with Glassmorphism */}
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
            onPress={() => setShowQRScanner(true)}
            activeOpacity={0.8}
          >
            <Icon name="qrcode-scan" size={38} color={theme.colors.buttonText} />
            <Text style={styles.scanButtonText}>Scan any QR</Text>
            <Text style={styles.scanButtonSubtext}>For instant payment</Text>
          </TouchableOpacity>

          <View style={styles.ussdInfo}>
            <Icon name="phone-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.ussdText, { color: theme.colors.textSecondary }]}>Powered by *99# USSD</Text>
          </View>
        </Animated.View>

        {/* Quick Actions Grid (4x2) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
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
                        outputRange: [0, 50 + index * 5],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  {loading && (action.id === 'balance' || action.id === 'transactions' || action.id === 'pending' || action.id === 'profile' || action.id === 'upipin') ? (
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                  ) : (
                    <Icon name={action.icon} size={32} color={theme.colors.primary} style={{ opacity: 0.95 }} />
                  )}
                  <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{action.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Security Banner */}
        <Animated.View
          style={[
            styles.securityBanner,
            {
              opacity: fadeAnim,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="shield-check" size={26} color={theme.colors.success} />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>100% Secure & Private</Text>
            <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
              No data shared • Completely offline
            </Text>
          </View>
        </Animated.View>
        
        <View style={{ height: 110 }} />
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
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  userName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  lockButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  statusCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 32,
  },
  statusHeader: {
    marginBottom: 20,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  signalText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  scanButton: {
    paddingVertical: 32,
    paddingHorizontal: 36,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 15,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.6,
  },
  scanButtonSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  ussdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  ussdText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  actionCard: {
    width: (width - 48 - 42) / 4, // 48 for padding (24*2), 42 for gaps (14*3)
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 13,
    letterSpacing: -0.1,
    paddingHorizontal: 4,
  },
  securityBanner: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  lockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 32,
    letterSpacing: -0.8,
  },
  lockSubtitle: {
    fontSize: 17,
    marginTop: 14,
    marginBottom: 54,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 18,
    letterSpacing: -0.2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 24,
    gap: 14,
    marginTop: 44,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});

export default HomeScreen;
