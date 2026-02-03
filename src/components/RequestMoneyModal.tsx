import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as globalStyles, colors } from '../constants/styles';
import { USSD_CODES } from '../services/ussdService';
import TutorialModal, { TUTORIAL_KEY } from './TutorialModal';

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
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.modalTitle}>Request Money</Text>
              <TouchableOpacity 
                style={modalStyles.helpButton}
                onPress={() => setShowTutorial(true)}
              >
                <Text style={modalStyles.helpButtonText}>❓</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.toggleContainer}>
              <TouchableOpacity
                style={[
                  modalStyles.toggleButton,
                  inputType === 'upi' && modalStyles.toggleButtonActive,
                ]}
                onPress={() => {
                  setInputType('upi');
                  setRequestUpiId('');
                }}
              >
                <Text
                  style={[
                    modalStyles.toggleText,
                    inputType === 'upi' && modalStyles.toggleTextActive,
                  ]}
                >
                  UPI ID
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.toggleButton,
                  inputType === 'mobile' && modalStyles.toggleButtonActive,
                ]}
                onPress={() => {
                  setInputType('mobile');
                  setRequestUpiId('');
                }}
              >
                <Text
                  style={[
                    modalStyles.toggleText,
                    inputType === 'mobile' && modalStyles.toggleTextActive,
                  ]}
                >
                  Mobile Number
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={globalStyles.inputLabel}>
              {inputType === 'upi' ? 'UPI ID' : 'Mobile Number'}
            </Text>
            <TextInput
              style={globalStyles.inputField}
              placeholder={
                inputType === 'upi' ? 'Enter UPI ID (e.g., name@upi)' : 'Enter Mobile Number'
              }
              placeholderTextColor="#999"
              keyboardType={inputType === 'mobile' ? 'phone-pad' : 'default'}
              maxLength={inputType === 'mobile' ? 10 : undefined}
              value={requestUpiId}
              onChangeText={setRequestUpiId}
            />

            <View style={modalStyles.infoBox}>
              <Text style={modalStyles.infoText}>
                💡 Your {inputType === 'upi' ? 'UPI ID' : 'mobile number'} will be copied.
                Long-press to paste in USSD!
              </Text>
            </View>

            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={[modalStyles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.submitButton,
                  !requestUpiId && globalStyles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!requestUpiId || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={modalStyles.submitButtonText}>Request</Text>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RequestMoneyModal;
