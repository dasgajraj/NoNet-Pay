import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { USSD_CODES } from '../services/ussdService';
import TutorialModal, { TUTORIAL_KEY } from './TutorialModal';
import { useTheme } from '../context/ThemeContext';

interface RequestMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  dialUssd: (code: string, dataToCopy?: string) => Promise<void>;
  loading: boolean;
}

const RequestMoneyModal: React.FC<RequestMoneyModalProps> = ({
  visible,
  onClose,
  dialUssd,
  loading,
}) => {
  const { theme } = useTheme();
  const [requestUpiId, setRequestUpiId] = useState('');
  const [inputType, setInputType] = useState<'upi' | 'mobile'>('upi');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (visible) {
      checkFirstTime();
    }
  }, [visible]);

  const checkFirstTime = async () => {
    const hasSeenTutorial = await AsyncStorage.getItem(TUTORIAL_KEY);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  };

  const handleSubmit = () => {
    if (requestUpiId) {
      dialUssd(USSD_CODES.REQUEST_MONEY, requestUpiId);
      setRequestUpiId('');
      onClose();
    }
  };

  const handleClose = () => {
    setRequestUpiId('');
    setInputType('upi');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border }]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Request money</Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  Quick request flow for UPI ID or mobile number.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.helpButton, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => setShowTutorial(true)}
              >
                <Icon name="help-circle-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
              {(['upi', 'mobile'] as const).map(type => {
                const active = inputType === type;
                const toggleStyle = {
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.toggleButton, toggleStyle]}
                    onPress={() => {
                      setInputType(type);
                      setRequestUpiId('');
                    }}
                  >
                    <Text style={[styles.toggleText, { color: active ? theme.colors.buttonText : theme.colors.textSecondary }]}>
                      {type === 'upi' ? 'UPI ID' : 'Mobile'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              {inputType === 'upi' ? 'UPI ID' : 'Mobile Number'}
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
                placeholder={inputType === 'upi' ? 'Enter UPI ID (e.g. name@upi)' : 'Enter mobile number'}
                placeholderTextColor={theme.colors.placeholder}
                keyboardType={inputType === 'mobile' ? 'phone-pad' : 'default'}
                maxLength={inputType === 'mobile' ? 10 : undefined}
                value={requestUpiId}
                onChangeText={setRequestUpiId}
              />
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                We’ll copy the {inputType === 'upi' ? 'UPI ID' : 'mobile number'} so you can paste it into the USSD prompt if needed.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.borderStrong }]}
                onPress={handleClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: requestUpiId ? theme.colors.primary : theme.colors.disabled },
                ]}
                onPress={handleSubmit}
                disabled={!requestUpiId || loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.buttonText} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: theme.colors.buttonText }]}>Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TutorialModal
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
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
  infoBox: {
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RequestMoneyModal;
