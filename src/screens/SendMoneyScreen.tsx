/**
 * Modern Send Money Screen with Interactive UI
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SendMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SendMoney'>;

const SendMoneyScreen: React.FC = () => {
  const navigation = useNavigation<SendMoneyScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
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
  }, []);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const recentContacts = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', avatar: '👨' },
    { id: '2', name: 'Priya Sharma', phone: '+91 98123 45678', avatar: '👩' },
    { id: '3', name: 'Amit Patel', phone: '+91 97654 32109', avatar: '👨' },
  ];

  const handleSendMoney = async () => {
    if (!phoneNumber || !amount) {
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 2000);
  };

  const selectContact = (contact: typeof recentContacts[0]) => {
    setPhoneNumber(contact.phone);
    setSelectedContact(contact.id);
  };

  const selectAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5f4dee" />
      
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
            {/* Recent Contacts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Contacts</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.contactsScroll}
              >
                {recentContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactCard,
                      selectedContact === contact.id && styles.contactCardSelected,
                    ]}
                    onPress={() => selectContact(contact)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>{contact.avatar}</Text>
                    </View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.contactCard} activeOpacity={0.7}>
                  <View style={[styles.contactAvatar, styles.addContact]}>
                    <Icon name="plus" size={24} color="#5f4dee" />
                  </View>
                  <Text style={styles.contactName}>Add New</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Phone Number Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Mobile Number / UPI ID</Text>
              <View style={styles.inputCard}>
                <Icon name="phone" size={20} color="#5f4dee" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number or UPI ID"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
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
                <Icon name="note-text" size={20} color="#5f4dee" style={styles.inputIcon} />
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
            <LinearGradient
              colors={phoneNumber && amount ? ['#5f4dee', '#7b68ee'] : ['#ccc', '#999']}
              style={styles.sendButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="send" size={24} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Money</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A2E',
    padding: 0,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5f4dee',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickAmountBtnSelected: {
    backgroundColor: '#5f4dee',
    borderColor: '#5f4dee',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
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
    backgroundColor: '#f0ebff',
    borderWidth: 2,
    borderColor: '#5f4dee',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0ebff',
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
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A2E',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5f4dee',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sendButton: {
    borderRadius: 16,
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
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SendMoneyScreen;
