import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
  eyebrow: string;
}

const slides: OnboardingSlide[] = [
  {
    eyebrow: 'Welcome',
    title: 'Payments that keep working when data does not.',
    description: 'NoNet Pay is designed for essential UPI transfers over USSD, so the core experience stays available even offline.',
    icon: 'cellphone-nfc',
  },
  {
    eyebrow: 'Offline first',
    title: 'Built on the trusted *99# banking rail.',
    description: 'Use supported bank and telecom USSD flows instead of depending on mobile internet for every payment step.',
    icon: 'signal-distance-variant',
  },
  {
    eyebrow: 'Private',
    title: 'Sensitive steps stay close to your device and bank.',
    description: 'Requests and transfers are routed through official USSD prompts, while biometric lock helps protect access inside the app.',
    icon: 'shield-lock-outline',
  },
  {
    eyebrow: 'Ready',
    title: 'Scan, send, and request with a cleaner flow.',
    description: 'Modern controls, light and dark themes, and focused actions make the offline payment journey feel simple and dependable.',
    icon: 'sparkles',
  },
];

const ONBOARDING_KEY = '@nonetpay_onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animateTransition = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 16,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const goToIndex = (index: number) => {
    animateTransition();
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      onComplete();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && currentIndex < slides.length - 1) {
          handleNext();
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          handlePrevious();
        }
      },
    }),
  ).current;

  const currentSlide = slides[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.decorPrimary, { backgroundColor: theme.colors.primaryContainer }]} />
      <View style={[styles.decorSecondary, { backgroundColor: theme.colors.surfaceVariant }]} />

      <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={handleComplete}
          style={[styles.skipButton, { backgroundColor: theme.colors.cardElevated, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.96}
        style={styles.flex}
        onPress={handleNext}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY }],
                backgroundColor: theme.colors.cardElevated,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name={currentSlide.icon} size={42} color={theme.colors.primary} />
            </View>

            <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>{currentSlide.eyebrow}</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>{currentSlide.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {currentSlide.description}
            </Text>

            <View style={styles.featureRow}>
              <View style={[styles.featureChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Icon name="wifi-off" size={16} color={theme.colors.text} />
                <Text style={[styles.featureChipText, { color: theme.colors.text }]}>Offline ready</Text>
              </View>
              <View style={[styles.featureChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Icon name="shield-check-outline" size={16} color={theme.colors.text} />
                <Text style={[styles.featureChipText, { color: theme.colors.text }]}>Bank-backed</Text>
              </View>
            </View>

            <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
              Tap anywhere or swipe to continue
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      <View style={styles.bottomArea}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const active = index === currentIndex;
            return (
              <TouchableOpacity key={index} onPress={() => goToIndex(index)}>
                <View
                  style={[
                    styles.dot,
                    {
                      width: active ? 30 : 10,
                      backgroundColor: active ? theme.colors.primary : theme.colors.borderStrong,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
              {currentIndex === slides.length - 1 ? 'Get started' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {currentIndex > 0 ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.cardElevated }]}
              onPress={handlePrevious}
              activeOpacity={0.9}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  decorPrimary: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  decorSecondary: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  topRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  skipButton: {
    height: 42,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 28,
    minHeight: 500,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.9,
    marginBottom: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomArea: {
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    height: 10,
    borderRadius: 999,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export { ONBOARDING_KEY };
export default OnboardingScreen;
