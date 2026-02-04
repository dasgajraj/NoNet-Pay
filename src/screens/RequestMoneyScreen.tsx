import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Vibration, Clipboard, ToastAndroid } from 'react-native';
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

  // For mobile mode, only mobile number is required. For UPI mode, both are required.
  const isFormValid = inputType === 'mobile' ? requestUpiId : (requestUpiId && requestAmount);

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => {
          try {
            Vibration.vibrate(50); // Button press feedback
          } catch (e) {
            console.error('Vibration error:', e);
          }
          setCurrentScreen('home');
        }}>
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
              try {
                Vibration.vibrate(50); // Button press feedback
              } catch (e) {
                console.error('Vibration error:', e);
              }
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
              try {
                Vibration.vibrate(50); // Button press feedback
              } catch (e) {
                console.error('Vibration error:', e);
              }
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

        <Text style={styles.inputLabel}>
          Amount (₹) {inputType === 'mobile' ? '(Optional - enter in dialog)' : ''}
        </Text>
        <TextInput
          style={styles.inputField}
          placeholder={inputType === 'mobile' ? 'Enter in USSD dialog' : 'Enter amount'}
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={requestAmount}
          onChangeText={setRequestAmount}
        />

        <TouchableOpacity
          style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
          onPress={async () => {
            try {
              Vibration.vibrate([0, 100, 100, 100]); // Success pattern
              
              if (inputType === 'upi') {
                // Copy UPI ID to clipboard
                await Clipboard.setString(requestUpiId);
                ToastAndroid.show('✅ UPI ID IS COPIED - Paste in dialog!', ToastAndroid.LONG);
                
                // Wait 500ms before opening USSD
                await new Promise(resolve => setTimeout(resolve, 500));
                dialUssd(USSD_CODES.REQUEST_MONEY, requestUpiId);
              } else {
                // Mobile number mode - use direct USSD code without amount
                ToastAndroid.show('💡 Enter amount and UPI PIN in dialog', ToastAndroid.LONG);
                const ussdCode = `*99*2*${requestUpiId}#`;
                
                // Wait 500ms before opening USSD
                await new Promise(resolve => setTimeout(resolve, 500));
                dialUssd(ussdCode);
              }
            } catch (error) {
              console.error('Error:', error);
            }
          }}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Request</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          {inputType === 'upi' 
            ? 'UPI ID will be copied - just paste it in the dialog!' 
            : 'Opens Request Money - enter amount and UPI PIN in dialog'}
        </Text>
      </View>
    </View>
  );
};

export default RequestMoneyScreen;
