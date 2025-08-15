import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/auth-store';
import { biometricAuthService } from '@/services/biometric-auth';

interface AuthScreenProps {
  onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  const { 
    authenticateWithBiometric, 
    authenticateWithPIN, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();
  
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    clearError();
    checkBiometricStatus();
    // Try biometric authentication immediately if enabled
    tryBiometricAuth();
  }, []);

  const checkBiometricStatus = async () => {
    const supported = await biometricAuthService.isSupported();
    const enabled = await biometricAuthService.isBiometricEnabled();
    
    setBiometricSupported(supported);
    setBiometricEnabled(enabled);
    
    if (supported) {
      const types = await biometricAuthService.getSupportedTypes();
      const typeName = biometricAuthService.getBiometricName(types);
      setBiometricType(typeName);
    }
  };

  const tryBiometricAuth = async () => {
    if (biometricEnabled && biometricSupported) {
      const result = await authenticateWithBiometric();
      
      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onComplete();
      } else if (!result.cancelled) {
        // If biometric failed (not cancelled), show PIN input
        setShowPinInput(true);
      } else {
        // User cancelled biometric, show PIN input
        setShowPinInput(true);
      }
    } else {
      // Biometric not enabled, show PIN input directly
      setShowPinInput(true);
    }
  };

  const handleBiometricAuth = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await authenticateWithBiometric();
    
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
    } else if (!result.cancelled) {
      Alert.alert('Authentication Failed', result.error || 'Please try again or use your PIN.');
    }
  };

  const handlePinAuth = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!pin || pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter your 4-digit PIN.');
      return;
    }

    const result = await authenticateWithPIN(pin);
    
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPin('');
      onComplete();
    } else {
      Alert.alert('Incorrect PIN', result.error || 'Please try again.');
      setPin('');
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    setPin(numericValue);
  };

  const renderBiometricAuth = () => (
    <View style={styles.authContainer}>
      <View style={styles.iconContainer}>
        <Icon 
          name={biometricType === 'Face ID' ? 'user' : 'shield'} 
          size={64} 
          color={colors.primary} 
        />
      </View>
      
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Use {biometricType} to access your workouts
      </Text>
      
      <TouchableOpacity
        style={styles.biometricButton}
        onPress={handleBiometricAuth}
        disabled={isLoading}
      >
        <Icon 
          name={biometricType === 'Face ID' ? 'user' : 'shield'} 
          size={24} 
          color={colors.white} 
        />
        <Text style={styles.biometricButtonText}>
          Use {biometricType}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.pinFallbackButton}
        onPress={() => setShowPinInput(true)}
      >
        <Text style={styles.pinFallbackText}>Use PIN instead</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPinAuth = () => (
    <View style={styles.authContainer}>
      <View style={styles.iconContainer}>
        <Icon name="lock" size={64} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Enter Your PIN</Text>
      <Text style={styles.subtitle}>
        Enter your PIN to access your workouts
      </Text>
      
      <View style={styles.pinInputContainer}>
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={handlePinChange}
          placeholder="Enter 4-digit PIN"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          returnKeyType="done"
          onSubmitEditing={handlePinAuth}
          autoFocus
        />
      </View>
      
      <TouchableOpacity
        style={[styles.pinButton, isLoading && styles.pinButtonDisabled]}
        onPress={handlePinAuth}
        disabled={isLoading || !pin}
      >
        <Text style={styles.pinButtonText}>
          {isLoading ? 'Authenticating...' : 'Unlock'}
        </Text>
      </TouchableOpacity>
      
      {biometricEnabled && biometricSupported && (
        <TouchableOpacity
          style={styles.biometricFallbackButton}
          onPress={() => {
            setShowPinInput(false);
            setPin('');
          }}
        >
          <Icon 
            name={biometricType === 'Face ID' ? 'user' : 'shield'} 
            size={16} 
            color={colors.lightGray} 
          />
          <Text style={styles.biometricFallbackText}>
            Use {biometricType} instead
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>RORK DENSE</Text>
              <Text style={styles.logoSubtitle}>Your Fitness Journey</Text>
            </View>
            
            {showPinInput ? renderPinAuth() : renderBiometricAuth()}
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 2,
  },
  logoSubtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    marginTop: 4,
  },
  authContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  biometricButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
  pinFallbackButton: {
    padding: 12,
  },
  pinFallbackText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
  },
  pinInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  pinInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    letterSpacing: 4,
  },
  pinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  pinButtonDisabled: {
    opacity: 0.6,
  },
  pinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  biometricFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  biometricFallbackText: {
    fontSize: 14,
    color: colors.lightGray,
    marginLeft: 6,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});