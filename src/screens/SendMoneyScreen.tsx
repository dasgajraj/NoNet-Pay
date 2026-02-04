import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Vibration, Clipboard, ToastAndroid } from 'react-native';
import { styles } from '../constants/styles';
import { USSD_CODES } from '../services/ussdService';
import { NavigationProps, UssdServiceProps } from '../types';

interface SendMoneyScreenProps extends NavigationProps, UssdServiceProps {
  scannedUpiId?: string | null;
}

const SendMoneyScreen: React.FC<SendMoneyScreenProps> = ({
  setCurrentScreen,
  dialUssd,
  loading,
  scannedUpiId,
}) => {
  const [sendMobile, setSendMobile] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // Pre-fill with scanned UPI ID
  useEffect(() => {
    if (scannedUpiId) {
      setSendMobile(scannedUpiId);
    }
  }, [scannedUpiId]);

  const isFormValid = sendMobile && sendAmount;

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Send Money</Text>
      </View>

      <ScrollView style={styles.formCard}>
        <Text style={styles.inputLabel}>Mobile Number / UPI ID</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter Mobile Number or UPI ID"
          placeholderTextColor="#999"
          keyboardType="default"
          value={sendMobile}
          onChangeText={setSendMobile}
        />

        <Text style={styles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={sendAmount}
          onChangeText={setSendAmount}
        />

        <Text style={styles.sectionTitle}>Choose Payment Method</Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
          onPress={async () => {
            // Check if it's a UPI ID (contains @)
            if (sendMobile.includes('@')) {
              // Copy UPI ID and show toast
              await Clipboard.setString(sendMobile);
              Vibration.vibrate([0, 100, 100, 100]);
              ToastAndroid.show('✅ UPI ID IS COPIED - Paste in dialog!', ToastAndroid.LONG);
              await new Promise(resolve => setTimeout(resolve, 500));
              dialUssd(USSD_CODES.SEND_VIA_UPI);
            } else {
              // Mobile number - no vibration, no copy
              dialUssd(USSD_CODES.SEND_VIA_MOBILE(sendMobile, sendAmount));
            }
          }}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {sendMobile.includes('@') ? '🆔 Send via UPI ID' : '📱 Send via Mobile Number'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          {sendMobile.includes('@') 
            ? 'UPI ID will be copied - paste it in the dialog!' 
            : 'Opens payment with mobile & amount filled'}
        </Text>
      </ScrollView>
    </View>
  );
};

export default SendMoneyScreen;
