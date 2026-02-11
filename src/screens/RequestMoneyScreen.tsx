/**
 * NoNet Pay - Request Money Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Vibration,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd } from '../services/ussdService';
import { useTheme } from '../context/ThemeContext';

type RequestMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RequestMoney'>;

const RequestMoneyScreen: React.FC = () => {
  const navigation = useNavigation<RequestMoneyScreenNavigationProp>();
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [inputType, setInputType] = useState<'upi' | 'mobile'>('upi');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quickAmounts = [50, 100, 250, 500, 1000, 2000];

  const selectAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  const handleRequestMoney = async () => {
    if (!upiId) {
      return;
    }

    try {
      Vibration.vibrate([0, 100, 100, 100]);
      
      if (inputType === 'upi') {
        // Copy UPI ID to clipboard
        await Clipboard.setString(upiId);
        ToastAndroid.show('✅ UPI ID IS COPIED - Paste in dialog!', ToastAndroid.LONG);
        
        // Wait 500ms before opening USSD
        await new Promise(resolve => setTimeout(resolve, 500));
        await dialUssd(USSD_CODES.REQUEST_MONEY, setLoading, upiId);
      } else {
        // Mobile number mode - use direct USSD code without amount
        ToastAndroid.show('💡 Enter amount and UPI PIN in dialog', ToastAndroid.LONG);
        const ussdCode = `*99*2*${upiId}#`;
        
        // Wait 500ms before opening USSD
        await new Promise(resolve => setTimeout(resolve, 500));
        await dialUssd(ussdCode, setLoading);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Card */}
          <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.headerGradient}>
              <Icon name="cash-multiple" size={44} color={theme.colors.primary} />
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Request Payment</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                Request money via USSD *99#
              </Text>
            </View>
          </View>

          {/* Input Type Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  inputType === 'upi' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setInputType('upi');
                  setUpiId('');
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    inputType === 'upi' && styles.toggleTextActive,
                  ]}
                >
                  UPI ID
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  inputType === 'mobile' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setInputType('mobile');
                  setUpiId('');
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    inputType === 'mobile' && styles.toggleTextActive,
                  ]}
                >
                  Mobile Number
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* UPI ID / Mobile Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {inputType === 'upi' ? 'UPI ID' : 'Mobile Number'}
            </Text>
            <View style={[styles.inputCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
              <Icon 
                name={inputType === 'upi' ? 'at' : 'phone-outline'} 
                size={20} 
                color={theme.colors.primary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder={
                  inputType === 'upi' 
                    ? 'Enter UPI ID (e.g., name@upi)' 
                    : 'Enter Mobile Number'
                }
                placeholderTextColor={theme.colors.placeholder}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType={inputType === 'mobile' ? 'phone-pad' : 'default'}
                maxLength={inputType === 'mobile' ? 10 : undefined}
              />
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Amount (₹) {inputType === 'mobile' ? '(Optional - enter in dialog)' : ''}
            </Text>
            <View style={[styles.inputCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, styles.amountInput, { color: theme.colors.text }]}
                placeholder={inputType === 'mobile' ? 'Enter in USSD dialog' : 'Enter amount'}
                placeholderTextColor={theme.colors.placeholder}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAmountBtn,
                    amount === amt.toString() && styles.quickAmountBtnSelected,
                  ]}
                  onPress={() => selectAmount(amt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      amount === amt.toString() && styles.quickAmountTextSelected,
                    ]}
                  >
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Request Button */}
          <TouchableOpacity
            style={[styles.requestButton, !upiId && styles.requestButtonDisabled]}
            onPress={handleRequestMoney}
            disabled={!upiId || loading}
            activeOpacity={0.8}
          >
            <View
              style={[styles.requestButtonGradient, upiId ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.disabled }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.buttonText} />
              ) : (
                <>
                  <Icon name="cash-multiple" size={24} color={theme.colors.buttonText} />
                  <Text style={[styles.requestButtonText, { color: theme.colors.buttonText }]}>
                    Request via *99#
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Helper Text */}
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            {inputType === 'upi' 
              ? 'UPI ID will be copied - paste it in the *99# dialog' 
              : 'Enter amount and UPI PIN in the *99# dialog'}
          </Text>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Icon name="information-outline" size={24} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>How it works</Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Use USSD *99# to request money from any mobile number or UPI ID. 
                The request will be sent directly through your bank's USSD service.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  headerCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c2c2c',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c2c2c',
    padding: 0,
  },
  amountInput: {
    fontSize: 26,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2c2c2c',
    marginRight: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  quickAmountBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  quickAmountBtnSelected: {
    backgroundColor: '#2c2c2c',
    borderColor: '#2c2c2c',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  quickAmountTextSelected: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2c2c2c',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  toggleTextActive: {
    color: '#fff',
  },
  requestButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  requestButtonActive: {
    backgroundColor: '#2c2c2c',
  },
  requestButtonInactive: {
    backgroundColor: '#d4d4d4',
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  helperText: {
    fontSize: 13,
    color: '#6b6b6b',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#6b6b6b',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b6b6b',
    lineHeight: 18,
  },
});

export default RequestMoneyScreen;
