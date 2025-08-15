import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/auth-store';
import { biometricAuthService } from '@/services/biometric-auth';

interface BiometricSetupScreenProps {
  onComplete: () => void;
}

export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({ onComplete }) => {
  const { setupNewUser, isLoading, error, clearError } = useAuthStore();
  
  const [step, setStep] = useState<'name' | 'pin' | 'biometric'>('name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [enableBiometric, setEnableBiometric] = useState(false);

  useEffect(() => {
    clearError();
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await biometricAuthService.isSupported();
    setBiometricSupported(supported);
    
    if (supported) {
      const types = await biometricAuthService.getSupportedTypes();
      const typeName = biometricAuthService.getBiometricName(types);
      setBiometricType(typeName);
      setEnableBiometric(true); // Default to enabled if supported
    }
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (step === 'name') {
      if (!name.trim()) {
        Alert.alert('Name Required', 'Please enter your name to continue.');
        return;
      }
      setStep('pin');
    } else if (step === 'pin') {
      if (!pin || pin.length !== 4) {
        Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
        return;
      }
      if (pin !== confirmPin) {
        Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
        return;
      }
      
      if (biometricSupported) {
        setStep('biometric');
      } else {
        handleComplete();
      }
    } else if (step === 'biometric') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    const result = await setupNewUser(name.trim(), pin, enableBiometric);
    
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
    } else {
      Alert.alert('Setup Failed', result.error || 'Please try again.');
    }
  };

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Icon name="user" size={48} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Welcome to RORK DENSE</Text>
      <Text style={styles.subtitle}>Let's get you set up with a secure account</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>What's your name?</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.lightGray}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
        />
      </View>
    </View>
  );

  const renderPinStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Icon name="lock" size={48} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Create Your PIN</Text>
      <Text style={styles.subtitle}>This will be used to access your workout data</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Create PIN (4 digits)</Text>
        <TextInput
          style={styles.textInput}
          value={pin}
          onChangeText={setPin}
          placeholder="Enter 4-digit PIN"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          returnKeyType="next"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.textInput}
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="Confirm 4-digit PIN"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          returnKeyType="done"
        />
      </View>
      
      {pin && confirmPin && pin !== confirmPin && (
        <Text style={styles.errorText}>PINs do not match</Text>
      )}
    </View>
  );

  const renderBiometricStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Icon 
          name={biometricType === 'Face ID' ? 'smile' : 'fingerprint'} 
          size={48} 
          color={colors.primary} 
        />
      </View>
      
      <Text style={styles.title}>Enable {biometricType}?</Text>
      <Text style={styles.subtitle}>
        Use {biometricType} for quick and secure access to your workouts
      </Text>
      
      <View style={styles.biometricOptions}>
        <TouchableOpacity
          style={[styles.biometricOption, enableBiometric && styles.biometricOptionSelected]}
          onPress={() => {
            setEnableBiometric(true);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <Icon name="check-circle" size={24} color={enableBiometric ? colors.primary : colors.lightGray} />
          <Text style={styles.biometricOptionText}>
            Yes, enable {biometricType}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.biometricOption, !enableBiometric && styles.biometricOptionSelected]}
          onPress={() => {
            setEnableBiometric(false);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <Icon name="x-circle" size={24} color={!enableBiometric ? colors.primary : colors.lightGray} />
          <Text style={styles.biometricOptionText}>
            No, use PIN only
          </Text>
        </TouchableOpacity>
      </View>
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
            {step === 'name' && renderNameStep()}
            {step === 'pin' && renderPinStep()}
            {step === 'biometric' && renderBiometricStep()}
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {step === 'biometric' ? 'Complete Setup' : 'Next'}
              </Text>
              {!isLoading && (
                <Icon name="arrow-right" size={20} color={colors.white} style={styles.nextIcon} />
              )}
            </TouchableOpacity>
            
            <View style={styles.stepIndicator}>
              {/* Step 1: Name */}
              <View style={[
                styles.stepDot, 
                step === 'name' && styles.stepDotActive,
                (step === 'pin' || step === 'biometric') && styles.stepDotCompleted
              ]} />
              
              {/* Step 2: PIN */}
              <View style={[
                styles.stepDot, 
                step === 'pin' && styles.stepDotActive,
                step === 'biometric' && styles.stepDotCompleted
              ]} />
              
              {/* Step 3: Biometric (only if supported) */}
              {biometricSupported && (
                <View style={[
                  styles.stepDot, 
                  step === 'biometric' && styles.stepDotActive
                ]} />
              )}
            </View>
          </View>
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
    minHeight: '80%',
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  biometricOptions: {
    width: '100%',
    marginTop: 20,
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  biometricOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  biometricOptionText: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  nextIcon: {
    marginLeft: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mediumGray,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.primary,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
