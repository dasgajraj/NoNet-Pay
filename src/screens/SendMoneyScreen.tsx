import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styles } from '../constants/styles';
import { USSD_CODES } from '../services/ussdService';
import { NavigationProps, UssdServiceProps } from '../types';

interface SendMoneyScreenProps extends NavigationProps, UssdServiceProps {}

const SendMoneyScreen: React.FC<SendMoneyScreenProps> = ({
  setCurrentScreen,
  dialUssd,
  loading,
}) => {
  const [sendMobile, setSendMobile] = useState('');
  const [sendAmount, setSendAmount] = useState('');

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
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          maxLength={10}
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
          onPress={() => dialUssd(USSD_CODES.SEND_VIA_MOBILE(sendMobile, sendAmount), sendMobile)}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>📱 Send via Mobile Number</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, !isFormValid && styles.disabledButton]}
          onPress={() => dialUssd(USSD_CODES.SEND_VIA_UPI, sendMobile)}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#5f4dee" />
          ) : (
            <Text style={styles.secondaryButtonText}>🆔 Send via UPI ID</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>Opens respective payment option directly</Text>
      </ScrollView>
    </View>
  );
};

export default SendMoneyScreen;
