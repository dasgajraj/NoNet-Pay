import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';

type SendMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SendMoney'>;
type SendMoneyScreenRouteProp = RouteProp<RootStackParamList, 'SendMoney'>;

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

const SendMoneyScreen: React.FC = () => {
  const navigation = useNavigation<SendMoneyScreenNavigationProp>();
  const route = useRoute<SendMoneyScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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

    if (route.params?.upiId) {
      setPhoneNumber(route.params.upiId);
    }
  }, [fadeAnim, route.params?.upiId, slideAnim]);

  const handleSendMoney = async () => {
    if (!phoneNumber || !amount) {
      return;
    }

    try {
      Vibration.vibrate([0, 100, 100, 100]);

      if (phoneNumber.includes('@')) {
        await Clipboard.setString(phoneNumber);
        ToastAndroid.show('UPI ID copied. Paste it in the *99# dialog.', ToastAndroid.LONG);
        await new Promise(resolve => setTimeout(resolve, 500));
        await dialUssd(USSD_CODES.SEND_VIA_UPI, setLoading);
      } else {
        await dialUssd(USSD_CODES.SEND_VIA_MOBILE(phoneNumber, amount), setLoading);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 18,
              paddingBottom: 180 + insets.bottom,
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
                <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>Make a payment</Text>
                <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Send money</Text>
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
              <View style={[styles.heroBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon name="cellphone-link" size={16} color={theme.colors.primary} />
                <Text style={[styles.heroBadgeText, { color: theme.colors.primary }]}>Works without internet</Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                Pay using a mobile number or scanned UPI ID.
              </Text>
              <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
                Keep the recipient handy, confirm the amount, and we’ll open the right USSD flow.
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
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Recipient</Text>
              <View style={[styles.inputShell, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                <Icon name="account-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Mobile number or UPI ID"
                  placeholderTextColor={theme.colors.placeholder}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  autoCapitalize="none"
                />
                {phoneNumber.length > 0 && (
                  <TouchableOpacity onPress={() => setPhoneNumber('')}>
                    <Icon name="close-circle" size={18} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Amount</Text>
              <View style={[styles.inputShell, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                <Text style={[styles.currency, { color: theme.colors.text }]}>₹</Text>
                <TextInput
                  style={[styles.input, styles.amountInput, { color: theme.colors.text }]}
                  placeholder="0"
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

              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Note</Text>
              <View style={[styles.inputShell, styles.multilineShell, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                <Icon name="text-box-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput, { color: theme.colors.text }]}
                  placeholder="Optional payment note"
                  placeholderTextColor={theme.colors.placeholder}
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>
            </View>

            {(phoneNumber || amount) && (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Payment summary</Text>
                  <View style={[styles.summaryPill, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.summaryPillText, { color: theme.colors.textSecondary }]}>
                      {phoneNumber.includes('@') ? 'UPI ID' : 'Mobile'}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Recipient</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]} numberOfLines={1}>
                    {phoneNumber || 'Not entered'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
                  <Text style={[styles.summaryTotal, { color: theme.colors.text }]}>
                    {amount ? `₹${amount}` : 'Pending'}
                  </Text>
                </View>
                {note ? (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Note</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.text }]} numberOfLines={2}>
                      {note}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: theme.colors.tabBar,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.footerHint, { color: theme.colors.textSecondary }]}>
            {phoneNumber.includes('@')
              ? 'We’ll copy the UPI ID so you can paste it into the *99# flow.'
              : 'Mobile payments open *99# with recipient and amount ready.'}
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: phoneNumber && amount ? theme.colors.primary : theme.colors.disabled },
            ]}
            onPress={handleSendMoney}
            disabled={!phoneNumber || !amount || loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.buttonText} />
            ) : (
              <>
                <Icon name="send-outline" size={20} color={theme.colors.buttonText} />
                <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
                  {phoneNumber.includes('@') ? 'Send via UPI ID' : 'Send via mobile'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  inputShell: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineShell: {
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: Platform.OS === 'ios' ? 0 : 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
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
});

export default SendMoneyScreen;
