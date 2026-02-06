/**
 * Modern Request Money Screen with Interactive UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RequestMoneyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RequestMoney'>;

const RequestMoneyScreen: React.FC = () => {
  const navigation = useNavigation<RequestMoneyScreenNavigationProp>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [upiId, setUpiId] = useState('yourname@upi');
  const [showQR, setShowQR] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const qrAnim = useState(new Animated.Value(0))[0];

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

  const generateQRCode = () => {
    if (!amount) {
      Alert.alert('Enter Amount', 'Please enter the amount you want to request');
      return;
    }
    setShowQR(true);
    Animated.spring(qrAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const sharePaymentLink = async () => {
    const message = `Please pay ₹${amount} to ${upiId}${note ? `\nNote: ${note}` : ''}`;
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5f4dee" />

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
          <View style={styles.headerCard}>
            <LinearGradient
              colors={['#5f4dee', '#7b68ee']}
              style={styles.headerGradient}
            >
              <Icon name="cash-multiple" size={48} color="#fff" />
              <Text style={styles.headerTitle}>Request Payment</Text>
              <Text style={styles.headerSubtitle}>
                Generate QR or share payment link
              </Text>
            </LinearGradient>
          </View>

          {/* UPI ID Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Your UPI ID</Text>
            <View style={styles.inputCard}>
              <Icon name="at" size={20} color="#5f4dee" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="yourname@upi"
                placeholderTextColor="#999"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
              <Icon name="check-circle" size={20} color="#4CAF50" />
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount to Request</Text>
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
                placeholder="What's this payment for?"
                placeholderTextColor="#999"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
          </View>

          {/* QR Code Section */}
          {showQR && (
            <Animated.View
              style={[
                styles.qrCard,
                {
                  opacity: qrAnim,
                  transform: [
                    {
                      scale: qrAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.qrTitle}>Scan to Pay</Text>
              <View style={styles.qrPlaceholder}>
                <Icon name="qrcode" size={150} color="#5f4dee" />
              </View>
              <Text style={styles.qrAmount}>₹{amount}</Text>
              {note && <Text style={styles.qrNote}>{note}</Text>}
              <Text style={styles.qrUpi}>{upiId}</Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, !amount && styles.actionBtnDisabled]}
              onPress={generateQRCode}
              disabled={!amount}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={amount ? ['#5f4dee', '#7b68ee'] : ['#ccc', '#999']}
                style={styles.actionBtnGradient}
              >
                <Icon name="qrcode-scan" size={24} color="#fff" />
                <Text style={styles.actionBtnText}>Generate QR</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, !amount && styles.actionBtnDisabled]}
              onPress={sharePaymentLink}
              disabled={!amount}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={amount ? ['#f093fb', '#f5576c'] : ['#ccc', '#999']}
                style={styles.actionBtnGradient}
              >
                <Icon name="share-variant" size={24} color="#fff" />
                <Text style={styles.actionBtnText}>Share Link</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
            <View style={styles.paymentMethods}>
              {[
                { icon: 'google-pay', name: 'Google Pay', color: '#4285F4' },
                { icon: 'credit-card', name: 'PhonePe', color: '#5f259f' },
                { icon: 'bank', name: 'Paytm', color: '#00BAF2' },
                { icon: 'wallet', name: 'All UPI', color: '#FF9800' },
              ].map((method, index) => (
                <View key={index} style={styles.paymentMethod}>
                  <Icon name={method.icon} size={32} color={method.color} />
                  <Text style={styles.paymentMethodText}>{method.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Icon name="information" size={24} color="#5f4dee" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Share the QR code or payment link with the person you want to request money from. They can scan the QR or click the link to pay instantly.
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  headerCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 28,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 28,
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
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5f4dee',
    marginBottom: 8,
  },
  qrNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrUpi: {
    fontSize: 14,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentMethod: {
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f4fd',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default RequestMoneyScreen;
