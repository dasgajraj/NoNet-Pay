/**
 * NoNet Pay - Home Screen
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
import { RootStackParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd, requestPermissions } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  getBiometricName,
} from '../services/BiometricAuth';
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
  const { theme } = useTheme();
  const [isLocked, setIsLocked] = useState(true);
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
      id: 'send',
      title: 'Send Money',
      icon: 'arrow-up',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'SendMoney',
    },
    {
      id: 'request',
      title: 'Request',
      icon: 'arrow-down',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'RequestMoney',
    },
    {
      id: 'scan',
      title: 'Scan QR',
      icon: 'qrcode-scan',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'SendMoney',
    },
    {
      id: 'balance',
      title: 'Balance',
      icon: 'wallet-outline',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'Home',
    },
    {
      id: 'transactions',
      title: 'History',
      icon: 'clock-outline',
      gradient: [theme.colors.primary, theme.colors.primary],
      screen: 'Home',
    },
    {
      id: 'pending',
      title: 'Pending',
      icon: 'progress-clock',
      gradient: [theme.colors.secondary, theme.colors.secondary],
      screen: 'Home',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'account-outline',
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
          <Icon name="shield-lock-outline" size={80} color={theme.colors.primary} />
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
              <Icon name="fingerprint" size={24} color={theme.colors.buttonText} />
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
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {/* Header with Balance Card */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Welcome to</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>NoNet Pay</Text>
          </View>
          <TouchableOpacity onPress={() => setIsLocked(true)}>
            <Icon name="lock-outline" size={24} color={theme.colors.primary} />
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
                  style={[styles.actionCard, { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    shadowColor: theme.dark ? '#000' : '#000',
                  }]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <View style={[styles.actionGradient, { backgroundColor: action.gradient[0] }]}>
                    {loading && (action.id === 'balance' || action.id === 'transactions' || action.id === 'pending' || action.id === 'profile' || action.id === 'upipin') ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Icon name={action.icon} size={28} color="#fff" />
                    )}
                  </View>
                  <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{action.title}</Text>
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
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.bannerGradient}>
            <Icon name="phone-outline" size={32} color={theme.colors.primary} />
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>Powered by *99#</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
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
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.bannerGradient}>
            <Icon name="shield-check-outline" size={32} color={theme.colors.success} />
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>100% Secure & Private</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                No data shared, completely offline payments
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
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    letterSpacing: -0.3,
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
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
    borderWidth: 1,
  },
  actionGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  lockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 30,
    letterSpacing: -0.5,
  },
  lockSubtitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 50,
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    marginTop: 40,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    borderWidth: 1,
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
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
});

export default HomeScreen;
