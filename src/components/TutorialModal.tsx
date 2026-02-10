import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/styles';

const TUTORIAL_KEY = '@nonetpay_tutorial_shown';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDontShowAgain = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>📱 How to Use USSD</Text>

          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1️⃣</Text>
              <Text style={styles.stepText}>
                Enter UPI ID or Mobile Number in the app
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNumber}>2️⃣</Text>
              <Text style={styles.stepText}>
                Tap "Request" - Your data will be copied to clipboard
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNumber}>3️⃣</Text>
              <Text style={styles.stepText}>
                USSD dialer opens automatically
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNumber}>4️⃣</Text>
              <Text style={styles.stepText}>
                <Text style={styles.highlight}>Long press</Text> on the input field → Select{' '}
                <Text style={styles.highlight}>Paste</Text>
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNumber}>5️⃣</Text>
              <Text style={styles.stepText}>Complete the transaction in USSD</Text>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Pro Tip:</Text>
            <Text style={styles.tipText}>
              Look for the toast notification showing what was copied!
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDontShowAgain}>
              <Text style={styles.secondaryButtonText}>Don't Show Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 20,
    marginRight: 12,
    minWidth: 30,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  highlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  tipBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export { TUTORIAL_KEY };
export default TutorialModal;
