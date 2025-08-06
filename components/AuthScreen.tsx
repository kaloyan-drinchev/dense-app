import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

interface AuthScreenProps {
  onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear any auth errors when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const handleTabSwitch = (tab: 'login' | 'register') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    setValidationErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Register-specific validations
    if (activeTab === 'register') {
      if (!formData.name) {
        errors.name = 'Name is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (validateForm()) {
      try {
        let result;
        
        if (activeTab === 'login') {
          result = await login(formData.email, formData.password);
        } else {
          result = await register(formData.email, formData.password, formData.name);
        }

        if (result.success) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          handleContinueToApp();
        } else {
          Alert.alert('Error', result.error || 'Authentication failed');
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement social login
    // For now, simulate success
    handleContinueToApp();
  };

  const handleContinueToApp = () => {
    onComplete();
  };

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Save Your Progress! 🎉</Text>
                <Text style={styles.welcomeSubtitle}>
                  Create an account to save your personalized preferences and track your fitness journey
                </Text>
              </View>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'register' && styles.activeTab]}
                onPress={() => handleTabSwitch('register')}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                  Create Account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                onPress={() => handleTabSwitch('login')}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Google')}
              >
                <Icon name="globe" size={20} color={colors.white} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Apple')}
              >
                <Icon name="smartphone" size={20} color={colors.white} />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {activeTab === 'register' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Icon name="user" size={20} color={colors.lightGray} />
                                          <TextInput
                        style={styles.textInput}
                        placeholder="Full Name"
                        placeholderTextColor={colors.lightGray}
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="name"
                      />
                  </View>
                  {validationErrors.name && (
                    <Text style={styles.errorText}>{validationErrors.name}</Text>
                  )}
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon name="mail" size={20} color={colors.lightGray} />
                                      <TextInput
                      style={styles.textInput}
                      placeholder="Email Address"
                      placeholderTextColor={colors.lightGray}
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="username"
                      textContentType="emailAddress"
                    />
                </View>
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color={colors.lightGray} />
                                      <TextInput
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor={colors.lightGray}
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      autoComplete="off"
                      textContentType="oneTimeCode"
                      passwordRules=""
                      importantForAutofill="no"
                    />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Icon 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={colors.lightGray} 
                    />
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text style={styles.errorText}>{validationErrors.password}</Text>
                )}
              </View>

              {activeTab === 'login' && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading 
                  ? (activeTab === 'register' ? 'Creating Account...' : 'Signing In...') 
                  : (activeTab === 'register' ? 'Create Account' : 'Sign In')
                }
              </Text>
              {!isLoading && <Icon name="arrow-right" size={20} color={colors.white} />}
            </TouchableOpacity>

            {/* Show auth error if any */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Terms */}
            {activeTab === 'register' && (
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.lightGray,
  },
  activeTabText: {
    color: colors.white,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mediumGray,
  },
  dividerText: {
    fontSize: 14,
    color: colors.lightGray,
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
    marginBottom: 30,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.white,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  termsText: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
});