/**
 * Modern Send Money Screen with USSD Integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { USSD_CODES, dialUssd } from '../services/ussdService';

type SendMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SendMoney'>;
type SendMoneyScreenRouteProp = RouteProp<RootStackParamList, 'SendMoney'>;

const SendMoneyScreen: React.FC = () => {
  const navigation = useNavigation<SendMoneyScreenNavigationProp>();
  const route = useRoute<SendMoneyScreenRouteProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

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

    // Pre-fill with scanned UPI ID if available
    if (route.params?.upiId) {
      setPhoneNumber(route.params.upiId);
    }
  }, [route.params?.upiId]);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleSendMoney = async () => {
    if (!phoneNumber || !amount) {
      return;
    }

    try {
      Vibration.vibrate([0, 100, 100, 100]);
      
      // Check if it's a UPI ID (contains @)
      if (phoneNumber.includes('@')) {
        // Copy UPI ID and show toast
        await Clipboard.setString(phoneNumber);
        ToastAndroid.show('✅ UPI ID IS COPIED - Paste in dialog!', ToastAndroid.LONG);
        await new Promise(resolve => setTimeout(resolve, 500));
        await dialUssd(USSD_CODES.SEND_VIA_UPI, setLoading);
      } else {
        // Mobile number - no vibration, no copy
        await dialUssd(USSD_CODES.SEND_VIA_MOBILE(phoneNumber, amount), setLoading);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const selectAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
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
            {/* Phone Number Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Mobile Number / UPI ID</Text>
              <View style={styles.inputCard}>
                <Icon name="phone-outline" size={20} color="#2c2c2c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number or UPI ID"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="default"
                  autoCapitalize="none"
                />
                {phoneNumber.length > 0 && (
                  <TouchableOpacity onPress={() => setPhoneNumber('')}>
                    <Icon name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputCard}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor="#999"
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

            {/* Note Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Add Note (Optional)</Text>
              <View style={styles.inputCard}>
                <Icon name="note-text-outline" size={20} color="#2c2c2c" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter note or message"
                  placeholderTextColor="#999"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>
            </View>

            {/* Transaction Details */}
            {phoneNumber && amount && (
              <Animated.View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Transaction Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Recipient</Text>
                  <Text style={styles.summaryValue}>{phoneNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount</Text>
                  <Text style={styles.summaryValueBold}>₹{amount}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Payable</Text>
                  <Text style={styles.summaryTotal}>₹{amount}</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.sendButton, (!phoneNumber || !amount) && styles.sendButtonDisabled]}
            onPress={handleSendMoney}
            disabled={!phoneNumber || !amount || loading}
            activeOpacity={0.8}
          >
            <View
              style={[styles.sendButtonGradient, phoneNumber && amount ? styles.sendButtonActive : styles.sendButtonInactive]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="send-outline" size={24} color="#fff" />
                  <Text style={styles.sendButtonText}>
                    {phoneNumber.includes('@') ? 'Send via UPI ID (*99#)' : 'Send via Mobile (*99#)'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {phoneNumber.includes('@') 
              ? 'UPI ID will be copied - paste it in the *99# dialog' 
              : 'Opens *99# USSD with mobile & amount filled'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 10,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
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
    fontSize: 24,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 24,
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
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
  contactsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  contactCardSelected: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#2c2c2c',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactAvatarText: {
    fontSize: 24,
  },
  addContact: {
    backgroundColor: '#f5f5f5',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 10,
    color: '#9e9e9e',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b6b6b',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c2c2c',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2c2c',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2c2c',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonActive: {
    backgroundColor: '#2c2c2c',
  },
  sendButtonInactive: {
    backgroundColor: '#d4d4d4',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  helperText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b6b6b',
    textAlign: 'center',
  },
});

export default SendMoneyScreen;
