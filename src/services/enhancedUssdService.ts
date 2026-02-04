/**
 * Enhanced USSD Service with Accessibility Support
 * 
 * This utility combines USSD dialing with accessibility service features
 * to provide a seamless user experience.
 */

import { useEffect, useState } from 'react';
import { Vibration } from 'react-native';
import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  setPendingInput,
  setAutoInput,
  onUssdDetected as onAccessibilityUssdDetected,
  checkAndPromptAccessibility,
} from '../AccessibilityServiceModule';
import {
  dialUssd as nativeDialUssd,
  dialUssdWithIntent,
  onUssdResponse,
  onUssdError,
} from '../UssdModule';

export interface UssdOptions {
  /** Automatically fill input fields with this value */
  autoInput?: string;
  /** Automatically close the USSD dialog after reading */
  autoClose?: boolean;
  /** Show accessibility prompt if not enabled */
  promptAccessibility?: boolean;
  /** Enable haptic feedback */
  enableVibration?: boolean;
  /** Callback when USSD is detected by accessibility service */
  onDetected?: (text: string) => void;
  /** Callback for USSD response (from native module) */
  onResponse?: (response: string) => void;
  /** Callback for USSD error */
  onError?: (error: string) => void;
}

export class EnhancedUssdService {
  private static accessibilityEnabled = false;
  private static subscriptions: any[] = [];

  /**
   * Initialize the enhanced USSD service
   * Checks accessibility status and sets up listeners
   */
  static async initialize(): Promise<boolean> {
    try {
      this.accessibilityEnabled = await isAccessibilityServiceEnabled();
      return this.accessibilityEnabled;
    } catch (error) {
      console.error('Error initializing enhanced USSD service:', error);
      return false;
    }
  }

  /**
   * Dial a USSD code with enhanced features
   */
  static async dial(
    ussdCode: string,
    options: UssdOptions = {}
  ): Promise<void> {
    const {
      autoInput,
      autoClose = false,
      promptAccessibility = true,
      enableVibration = true,
      onDetected,
      onResponse,
      onError,
    } = options;

    try {
      // Check if accessibility is enabled
      const isEnabled = await isAccessibilityServiceEnabled();

      // Prompt user if not enabled and prompt is requested
      if (!isEnabled && promptAccessibility) {
        const shouldContinue = await checkAndPromptAccessibility();
        if (!shouldContinue) {
          throw new Error('Accessibility service not enabled');
        }
      }

      // Set up auto-input if provided
      if (autoInput && isEnabled) {
        await setAutoInput(true);
        await setPendingInput(autoInput);
      }

      // Set up auto-close if requested
      if (autoClose && isEnabled) {
        const { setAutoClose } = await import('../AccessibilityServiceModule');
        await setAutoClose(true);
      }

      // Set up listeners
      if (onDetected && isEnabled) {
        const originalOnDetected = onDetected;
        const wrappedOnDetected = (text: string) => {
          // Vibrate when USSD is detected (2 short pulses for success)
          if (enableVibration) {
            Vibration.vibrate([0, 100, 100, 100]);
          }
          originalOnDetected(text);
        };
        const subscription = onAccessibilityUssdDetected(wrappedOnDetected);
        this.subscriptions.push(subscription);

        // Auto-remove after 30 seconds to prevent memory leaks
        setTimeout(() => {
          const index = this.subscriptions.indexOf(subscription);
          if (index > -1) {
            subscription.remove();
            this.subscriptions.splice(index, 1);
          }
        }, 30000);
      }

      if (onResponse) {
        const subscription = onUssdResponse(onResponse);
        this.subscriptions.push(subscription);

        setTimeout(() => {
          const index = this.subscriptions.indexOf(subscription);
          if (index > -1) {
            subscription.remove();
            this.subscriptions.splice(index, 1);
          }
        }, 30000);
      }

      if (onError) {
        const originalOnError = onError;
        const wrappedOnError = (error: string) => {
          // Vibrate on error (long pulse)
          if (enableVibration) {
            Vibration.vibrate(500);
          }
          originalOnError(error);
        };
        const subscription = onUssdError(wrappedOnError);
        this.subscriptions.push(subscription);

        setTimeout(() => {
          const index = this.subscriptions.indexOf(subscription);
          if (index > -1) {
            subscription.remove();
            this.subscriptions.splice(index, 1);
          }
        }, 30000);
      }

      // Dial the USSD code
      await dialUssdWithIntent(ussdCode);
    } catch (error) {
      console.error('Error dialing USSD:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Clean up all subscriptions
   */
  static cleanup(): void {
    this.subscriptions.forEach(sub => {
      try {
        sub.remove();
      } catch (error) {
        console.error('Error removing subscription:', error);
      }
    });
    this.subscriptions = [];
  }

  /**
   * Check if accessibility service is enabled
   */
  static async isAccessibilityEnabled(): Promise<boolean> {
    this.accessibilityEnabled = await isAccessibilityServiceEnabled();
    return this.accessibilityEnabled;
  }

  /**
   * Open accessibility settings
   */
  static async openAccessibilitySettings(): Promise<boolean> {
    return openAccessibilitySettings();
  }
}

/**
 * Hook for using enhanced USSD service in React components
 */
export const useEnhancedUssd = () => {
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize on mount
    EnhancedUssdService.initialize().then(setAccessibilityEnabled);

    // Cleanup on unmount
    return () => {
      EnhancedUssdService.cleanup();
    };
  }, []);

  const dialUssd = async (
    ussdCode: string,
    options: UssdOptions = {}
  ): Promise<void> => {
    setLoading(true);
    try {
      await EnhancedUssdService.dial(ussdCode, options);
    } finally {
      setLoading(false);
    }
  };

  const checkAccessibility = async (): Promise<boolean> => {
    const enabled = await EnhancedUssdService.isAccessibilityEnabled();
    setAccessibilityEnabled(enabled);
    return enabled;
  };

  const openSettings = async (): Promise<boolean> => {
    return EnhancedUssdService.openAccessibilitySettings();
  };

  return {
    dialUssd,
    loading,
    accessibilityEnabled,
    checkAccessibility,
    openSettings,
  };
};

// For backwards compatibility, export individual functions
export const dialUssdEnhanced = (
  ussdCode: string,
  options?: UssdOptions
): Promise<void> => {
  return EnhancedUssdService.dial(ussdCode, options);
};

export default EnhancedUssdService;
