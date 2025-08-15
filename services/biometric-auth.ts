import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_STORAGE_KEY = 'user_pin';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export const biometricAuthService = {
  // Check if device supports biometric authentication
  async isSupported(): Promise<boolean> {
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    return hasHardware && isEnrolled;
  },

  // Get available biometric types
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  // Get friendly name for biometric type
  getBiometricName(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scanner';
    }
    return 'Biometric';
  },

  // Authenticate using biometric
  async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      const isSupported = await this.isSupported();
      if (!isSupported) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock RORK DENSE',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          cancelled: true,
          error: result.error || 'Authentication failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  },

  // Set up PIN
  async setupPIN(pin: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(PIN_STORAGE_KEY, pin);
      return true;
    } catch (error) {
      console.error('Failed to set PIN:', error);
      return false;
    }
  },

  // Verify PIN
  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return storedPin === pin;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  },

  // Check if PIN is set
  async hasPIN(): Promise<boolean> {
    try {
      const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return pin !== null;
    } catch (error) {
      return false;
    }
  },

  // Enable/disable biometric authentication
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
  },

  // Check if biometric is enabled
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  },

  // Main authentication method - tries biometric first, falls back to PIN
  async authenticate(): Promise<BiometricAuthResult> {
    const biometricEnabled = await this.isBiometricEnabled();
    const biometricSupported = await this.isSupported();

    // Try biometric first if enabled and supported
    if (biometricEnabled && biometricSupported) {
      const biometricResult = await this.authenticateWithBiometric();
      if (biometricResult.success) {
        return biometricResult;
      }
      // If biometric fails but not cancelled, return the error
      if (!biometricResult.cancelled) {
        return biometricResult;
      }
      // If cancelled, user will need to use PIN (handled in UI)
    }

    // If biometric not available or cancelled, PIN authentication will be handled in UI
    return { success: false, cancelled: true };
  },

  // Clear all authentication data (for logout/reset)
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PIN_STORAGE_KEY, BIOMETRIC_ENABLED_KEY]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  },
};
