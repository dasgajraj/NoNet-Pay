import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd, requestPermissions } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  getBiometricName,
} from '../services/BiometricAuth';
import QRScanner from '../components/QRScanner';
import { useUssdSession } from '../context/UssdSessionContext';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Home'>;

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tone: 'primary' | 'secondary';
  screen: keyof MainTabParamList;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isLocked, setIsLocked } = useAuth();
  const { attempts, retryVerification } = useUssdSession();
  const [biometryType, setBiometryType] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;

  const handleBiometricAuth = useCallback(async () => {
    setLoading(true);
    const success = await authenticateWithBiometric('Unlock NoNet Pay');
    setLoading(false);

    if (success) {
      setIsLocked(false);
    }
  }, [setIsLocked]);

  const initBiometric = useCallback(async () => {
    try {
      const { available, biometryType: detectedBiometryType } = await checkBiometricAvailability();
      if (available && detectedBiometryType) {
        setBiometryType(getBiometricName(detectedBiometryType));
        handleBiometricAuth();
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error initializing biometric:', error);
      setIsLocked(false);
    }
  }, [handleBiometricAuth, setIsLocked]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initBiometric();
      requestPermissions();
    }, 400);

    return () => clearTimeout(timer);
  }, [initBiometric]);

  useEffect(() => {
    if (!isLocked) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, isLocked, slideAnim]);

  const quickActions: QuickAction[] = [
    {
      id: 'balance',
      title: 'Check Balance',
      subtitle: 'Bank balance via *99#',
      icon: 'wallet-outline',
      tone: 'primary',
      screen: 'Home',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      subtitle: 'Recent USSD history',
      icon: 'history',
      tone: 'secondary',
      screen: 'Home',
    },
    {
      id: 'upipin',
      title: 'Manage UPI PIN',
      subtitle: 'Reset or change PIN',
      icon: 'shield-key-outline',
      tone: 'secondary',
      screen: 'Home',
    },
    {
      id: 'request',
      title: 'Request Money',
      subtitle: 'Raise a payment request',
      icon: 'cash-plus',
      tone: 'primary',
      screen: 'RequestMoney',
    },
    {
      id: 'send',
      title: 'Send Money',
      subtitle: 'Transfer to mobile or UPI',
      icon: 'send-outline',
      tone: 'primary',
      screen: 'SendMoney',
    },
    {
      id: 'pending',
      title: 'Pending Requests',
      subtitle: 'Review pending items',
      icon: 'progress-clock',
      tone: 'secondary',
      screen: 'Home',
    },
  ];

  const latestAttempt = attempts[0] ?? null;

  const handleActionPress = async (action: QuickAction) => {
    switch (action.id) {
      case 'send':
        navigation.navigate('SendMoney', {});
        break;
      case 'request':
        navigation.navigate('RequestMoney');
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
      case 'upipin':
        await dialUssd(USSD_CODES.UPI_PIN, setLoading);
        break;
      default:
        navigation.navigate(action.screen as never);
    }
  };

  if (isLocked) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.lockDecorTop, { backgroundColor: theme.colors.primaryContainer }]} />
        <View style={[styles.lockDecorBottom, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={[styles.lockContent, { paddingTop: insets.top + 32 }]}>
          <View
            style={[
              styles.lockBadge,
              {
                backgroundColor: theme.colors.cardElevated,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Icon name="shield-lock-outline" size={42} color={theme.colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: theme.colors.text }]}>NoNet Pay</Text>
          <Text style={[styles.lockSubtitle, { color: theme.colors.textSecondary }]}>
            Secure offline payments with biometric protection.
          </Text>

          <View
            style={[
              styles.lockCard,
              {
                backgroundColor: theme.colors.cardElevated,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Text style={[styles.lockCardTitle, { color: theme.colors.text }]}>Unlock to continue</Text>
            <Text style={[styles.lockCardBody, { color: theme.colors.textSecondary }]}>
              {biometryType ? `Use ${biometryType} to access your payment controls.` : 'Authenticate to continue.'}
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Verifying identity...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleBiometricAuth}
                activeOpacity={0.9}
              >
                <Icon name="fingerprint" size={20} color={theme.colors.buttonText} />
                <Text style={[styles.authButtonText, { color: theme.colors.buttonText }]}>Authenticate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 132 + insets.bottom,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>Offline payments</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>NoNet Pay</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsLocked(true)}
              style={[
                styles.lockButton,
                {
                  backgroundColor: theme.colors.cardElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon name="lock-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.colors.cardElevated,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <View style={styles.heroHeader}>
              <View style={[styles.heroPill, { backgroundColor: theme.colors.successContainer }]}>
                <Icon name="signal" size={14} color={theme.colors.success} />
                <Text style={[styles.heroPillText, { color: theme.colors.success }]}>Offline mode active</Text>
              </View>
              <Text style={[styles.heroKicker, { color: theme.colors.textSecondary }]}>Fastest way to pay</Text>
            </View>

            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              Scan a QR and continue payment even without data.
            </Text>
            <Text style={[styles.heroDescription, { color: theme.colors.textSecondary }]}>
              Built around UPI over USSD so essential transfers stay available on any network.
            </Text>

            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowQRScanner(true)}
              activeOpacity={0.92}
            >
              <Icon name="qrcode-scan" size={22} color={theme.colors.buttonText} />
              <Text style={[styles.heroButtonText, { color: theme.colors.buttonText }]}>Scan payment QR</Text>
            </TouchableOpacity>

            <View style={styles.metricRow}>
              <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>*99#</Text>
                <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>USSD rail</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>Secure</Text>
                <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Biometric lock</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick actions</Text>
            <Text style={[styles.sectionCaption, { color: theme.colors.textSecondary }]}>Common tasks, one tap away</Text>
          </View>

          <View style={styles.actionsGrid}>
            {quickActions.map(action => {
              const toneBackground =
                action.tone === 'primary' ? theme.colors.primaryContainer : theme.colors.surfaceVariant;
              const toneColor = action.tone === 'primary' ? theme.colors.primary : theme.colors.text;

              return (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: theme.colors.cardElevated,
                      borderColor: theme.colors.border,
                      shadowColor: theme.colors.shadow,
                    },
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.88}
                  disabled={loading}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: toneBackground }]}>
                    {loading &&
                    ['balance', 'transactions', 'pending', 'upipin'].includes(action.id) ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Icon name={action.icon} size={22} color={toneColor} />
                    )}
                  </View>
                  <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{action.title}</Text>
                  <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                    {action.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[
              styles.banner,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.bannerIconWrap, { backgroundColor: theme.colors.successContainer }]}>
              <Icon name="shield-check-outline" size={20} color={theme.colors.success} />
            </View>
            <View style={styles.bannerTextWrap}>
              <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>Private by design</Text>
              <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                Transactions go through your bank's USSD flow with no dependency on internet connectivity.
              </Text>
            </View>
          </View>

          {latestAttempt ? (
            <View
              style={[
                styles.trackingCard,
                {
                  backgroundColor: theme.colors.cardElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.trackingHeader}>
                <Text style={[styles.trackingTitle, { color: theme.colors.text }]}>Latest payment status</Text>
                <View style={[styles.trackingBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.trackingBadgeText, { color: theme.colors.textSecondary }]}>
                    {latestAttempt.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.trackingSummary, { color: theme.colors.text }]}>
                {latestAttempt.verificationSummary ?? 'Awaiting status'}
              </Text>
              <Text style={[styles.trackingDetail, { color: theme.colors.textSecondary }]}>
                {latestAttempt.verificationDetail ??
                  'Tracked USSD attempts will appear here after you start a send or request flow.'}
              </Text>
              {latestAttempt.status !== 'success' && latestAttempt.status !== 'failed' ? (
                <TouchableOpacity
                  style={[styles.trackingButton, { borderColor: theme.colors.borderStrong }]}
                  onPress={() => retryVerification(latestAttempt.id)}
                >
                  <Text style={[styles.trackingButtonText, { color: theme.colors.text }]}>Run verification</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={upiId => {
          setShowQRScanner(false);
          navigation.navigate('SendMoney', { upiId });
        }}
      />
    </View>
  );
};

const cardWidth = (width - 24 * 2 - 12) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  lockButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 22,
  },
  heroButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sectionCaption: {
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: cardWidth,
    minHeight: 156,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  bannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  trackingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  trackingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trackingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  trackingSummary: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  trackingDetail: {
    fontSize: 13,
    lineHeight: 20,
  },
  trackingButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lockDecorTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  lockDecorBottom: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  lockContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  lockBadge: {
    width: 88,
    height: 88,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  lockTitle: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  lockCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  lockCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockCardBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  authButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;
