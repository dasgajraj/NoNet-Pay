import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
}

const slides: OnboardingSlide[] = [
  {
    title: 'Welcome to NoNet Pay',
    description: 'The secure way to send and receive money using USSD technology without internet connection.',
    icon: '📱',
  },
  {
    title: 'Completely Offline',
    description: 'No internet required! Works entirely through USSD codes (*99#) supported by all telecom operators in India.',
    icon: '🔌',
  },
  {
    title: 'Your Privacy First',
    description: 'No data is shared with any third party. All transactions happen directly through your bank via USSD.',
    icon: '🔒',
  },
  {
    title: 'Fast & Secure',
    description: 'Make instant UPI payments using just your phone number. No apps, no internet, no compromise on security.',
    icon: '⚡',
  },
];

const ONBOARDING_KEY = '@nonetpay_onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && currentIndex < slides.length - 1) {
          handleNext();
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          handlePrevious();
        }
      },
    })
  ).current;

  const animateTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      animateTransition();
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      animateTransition();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = async () => {
    handleComplete();
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

  const currentSlide = slides[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent
      />

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Main Content - Clickable and Swipeable */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleNext}
        style={styles.contentContainer}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Icon with Background Circle */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.icon}>{currentSlide.icon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentSlide.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {currentSlide.description}
          </Text>

          {/* Tap to continue hint */}
          <Text style={[styles.tapHint, { color: theme.colors.textSecondary }]}>
            Tap anywhere to continue
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              animateTransition();
              setCurrentIndex(index);
            }}
          >
            <View
              style={[
                styles.dot,
                {
                  width: index === currentIndex ? 32 : 10,
                  backgroundColor:
                    index === currentIndex
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Next/Get Started Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Previous button if not on first slide */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: theme.colors.border }]}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 12,
    zIndex: 10,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 88,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.8,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 10,
    letterSpacing: -0.3,
  },
  tapHint: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 24,
    letterSpacing: -0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    transition: 'all 0.3s',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 12,
  },
  button: {
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  backButton: {
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  backButtonText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});

export { ONBOARDING_KEY };
export default OnboardingScreen;
