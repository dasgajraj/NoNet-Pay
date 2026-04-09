import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const TUTORIAL_KEY = '@nonetpay_tutorial_shown';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const steps = [
  'Enter a UPI ID or mobile number in the app.',
  'Tap the action button to open the USSD flow.',
  'If something was copied, long-press the USSD input and paste it.',
  'Review the amount and finish the confirmation in your bank dialog.',
];

const TutorialModal: React.FC<TutorialModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, visible]);

  const handleDontShowAgain = async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim, backgroundColor: theme.colors.overlay }]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: theme.colors.cardElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon name="help-circle-outline" size={28} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Using USSD the easy way</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            A quick walkthrough for first-time offline payment flows.
          </Text>

          <View style={styles.stepContainer}>
            {steps.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.colors.text }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.tipCard, { backgroundColor: theme.colors.warningContainer }]}>
            <Text style={[styles.tipTitle, { color: theme.colors.warning }]}>Tip</Text>
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Watch for the confirmation toast if the app copies a UPI ID before opening *99#.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.borderStrong }]}
              onPress={handleDontShowAgain}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Don't show again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>Got it</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  stepContainer: {
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  tipCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1.2,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export { TUTORIAL_KEY };
export default TutorialModal;
