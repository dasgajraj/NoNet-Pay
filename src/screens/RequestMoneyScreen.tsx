import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Vibration,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { USSD_CODES } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';
import { useUssdSession } from '../context/UssdSessionContext';

type RequestMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RequestMoney'>;

const quickAmounts = [50, 100, 250, 500, 1000, 2000];
const TAB_BAR_OFFSET = 110;

const RequestMoneyScreen: React.FC = () => {
  const navigation = useNavigation<RequestMoneyScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { attempts, activeAttempt, retryVerification, startTrackedPayment } = useUssdSession();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [inputType, setInputType] = useState<'upi' | 'mobile'>('upi');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePasteRecipient = async () => {
    try {
      const clipboardValue = (await Clipboard.getString())?.trim();
      if (!clipboardValue) {
        ToastAndroid.show('Clipboard is empty.', ToastAndroid.SHORT);
        return;
      }

      setUpiId(clipboardValue);
      ToastAndroid.show('Pasted from clipboard.', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Paste failed:', error);
      ToastAndroid.show('Unable to paste right now.', ToastAndroid.SHORT);
    }
  };

  const handleRequestMoney = async () => {
    if (!upiId) {
      return;
    }

    try {
      Vibration.vibrate([0, 100, 100, 100]);
      await startTrackedPayment({
        kind: 'request',
        recipientType: inputType,
        recipientValue: upiId,
        amount,
        dialCode: inputType === 'upi' ? USSD_CODES.REQUEST_MONEY : `*99*2*${upiId}#`,
        clipboardValue: inputType === 'upi' ? upiId : undefined,
        setLoading,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const latestRequestAttempt =
    activeAttempt?.kind === 'request'
      ? activeAttempt
      : attempts.find(attempt => attempt.kind === 'request') ?? null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 220 + insets.bottom + TAB_BAR_OFFSET,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>Collect a payment</Text>
              <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Request money</Text>
            </View>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Icon name="arrow-left" size={20} color={theme.colors.text} />
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
            <View style={[styles.heroBadge, { backgroundColor: theme.colors.warningContainer }]}>
              <Icon name="cash-plus" size={16} color={theme.colors.warning} />
              <Text style={[styles.heroBadgeText, { color: theme.colors.warning }]}>USSD request flow</Text>
            </View>
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              Ask for payment from a UPI ID or mobile number.
            </Text>
            <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
              The request stays lightweight and bank-driven, which makes it ideal for offline situations.
            </Text>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.cardElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Recipient type</Text>
            <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
              {(['upi', 'mobile'] as const).map(type => {
                const active = inputType === type;
                const segmentStyle = {
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.segmentButton, segmentStyle]}
                    onPress={() => {
                      Vibration.vibrate(40);
                      setInputType(type);
                      setUpiId('');
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? theme.colors.buttonText : theme.colors.textSecondary },
                      ]}
                    >
                      {type === 'upi' ? 'UPI ID' : 'Mobile'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              {inputType === 'upi' ? 'UPI ID' : 'Mobile number'}
            </Text>
            <View style={[styles.inputShell, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
              <Icon
                name={inputType === 'upi' ? 'at' : 'phone-outline'}
                size={20}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder={inputType === 'upi' ? 'name@upi' : '10-digit mobile number'}
                placeholderTextColor={theme.colors.placeholder}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType={inputType === 'mobile' ? 'phone-pad' : 'default'}
                maxLength={inputType === 'mobile' ? 10 : undefined}
              />
              <TouchableOpacity
                onPress={handlePasteRecipient}
                style={[styles.inputAction, { backgroundColor: theme.colors.surfaceVariant }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.inputActionText, { color: theme.colors.primary }]}>Paste</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              Amount {inputType === 'mobile' ? '(optional)' : ''}
            </Text>
            <View style={[styles.inputShell, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
              <Text style={[styles.currency, { color: theme.colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, styles.amountInput, { color: theme.colors.text }]}
                placeholder={inputType === 'mobile' ? 'Add in dialog if needed' : 'Enter amount'}
                placeholderTextColor={theme.colors.placeholder}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.amountRow}>
              {quickAmounts.map(value => {
                const selected = amount === value.toString();
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.amountChip,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setAmount(value.toString())}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.amountChipText,
                        { color: selected ? theme.colors.buttonText : theme.colors.text },
                      ]}
                    >
                      ₹{value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="information-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>What happens next</Text>
              <Text style={[styles.infoBody, { color: theme.colors.textSecondary }]}>
                {inputType === 'upi'
                  ? 'We copy the UPI ID first, then open *99# so you can paste and confirm the request.'
                  : 'We launch the direct mobile request flow. If amount is missing, you can complete it inside the USSD dialog.'}
              </Text>
            </View>
          </View>

          {latestRequestAttempt ? (
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.statusHeader}>
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Request tracking</Text>
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statusBadgeText, { color: theme.colors.textSecondary }]}>
                    {latestRequestAttempt.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.statusSummary, { color: theme.colors.text }]}>
                {latestRequestAttempt.verificationSummary ?? 'Waiting to start'}
              </Text>
              <Text style={[styles.statusDetail, { color: theme.colors.textSecondary }]}>
                {latestRequestAttempt.verificationDetail ??
                  'The app will verify the latest request attempt after you return from the USSD flow.'}
              </Text>
              {latestRequestAttempt.status !== 'success' && latestRequestAttempt.status !== 'failed' ? (
                <TouchableOpacity
                  style={[styles.retryButton, { borderColor: theme.colors.borderStrong }]}
                  onPress={() => retryVerification(latestRequestAttempt.id)}
                >
                  <Text style={[styles.retryButtonText, { color: theme.colors.text }]}>Verify again</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: theme.colors.tabBar,
            borderTopColor: theme.colors.border,
            bottom: TAB_BAR_OFFSET + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: upiId ? theme.colors.primary : theme.colors.disabled },
          ]}
          onPress={handleRequestMoney}
          disabled={!upiId || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.buttonText} />
          ) : (
            <>
              <Icon name="cash-plus" size={20} color={theme.colors.buttonText} />
              <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>Request via *99#</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.footerHint, { color: theme.colors.textSecondary }]}>
          Simple, bank-backed requests that stay usable in low-connectivity situations.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 30,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  segmentedControl: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  inputAction: {
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  inputActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 26,
    fontWeight: '700',
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  amountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  amountChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusSummary: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusDetail: {
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footerHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default RequestMoneyScreen;
