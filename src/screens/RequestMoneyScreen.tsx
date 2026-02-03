import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles, colors } from '../constants/styles';
import { USSD_CODES } from '../services/ussdService';
import { NavigationProps, UssdServiceProps } from '../types';

interface RequestMoneyScreenProps extends NavigationProps, UssdServiceProps {}

const RequestMoneyScreen: React.FC<RequestMoneyScreenProps> = ({
  setCurrentScreen,
  dialUssd,
  loading,
}) => {
  const [requestUpiId, setRequestUpiId] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [inputType, setInputType] = useState<'upi' | 'mobile'>('upi');

  const isFormValid = requestUpiId && requestAmount;

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Request Money</Text>
      </View>

      <View style={styles.formCard}>
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: inputType === 'upi' ? colors.primary : colors.white,
              borderRadius: 10,
              marginRight: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
            onPress={() => {
              setInputType('upi');
              setRequestUpiId('');
            }}
          >
            <Text style={{ 
              color: inputType === 'upi' ? colors.white : colors.primary, 
              textAlign: 'center',
              fontWeight: '600',
            }}>
              UPI ID
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: inputType === 'mobile' ? colors.primary : colors.white,
              borderRadius: 10,
              marginLeft: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
            onPress={() => {
              setInputType('mobile');
              setRequestUpiId('');
            }}
          >
            <Text style={{ 
              color: inputType === 'mobile' ? colors.white : colors.primary, 
              textAlign: 'center',
              fontWeight: '600',
            }}>
              Mobile Number
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>
          {inputType === 'upi' ? 'UPI ID' : 'Mobile Number'}
        </Text>
        <TextInput
          style={styles.inputField}
          placeholder={inputType === 'upi' ? 'Enter UPI ID (e.g., name@upi)' : 'Enter Mobile Number'}
          placeholderTextColor="#999"
          keyboardType={inputType === 'mobile' ? 'phone-pad' : 'default'}
          maxLength={inputType === 'mobile' ? 10 : undefined}
          value={requestUpiId}
          onChangeText={setRequestUpiId}
        />

        <Text style={styles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={requestAmount}
          onChangeText={setRequestAmount}
        />

        <TouchableOpacity
          style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
          onPress={() => dialUssd(USSD_CODES.REQUEST_MONEY, requestUpiId)}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Request</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>Opens Request Money option directly</Text>
      </View>
    </View>
  );
};

export default RequestMoneyScreen;
