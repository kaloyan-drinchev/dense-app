import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { wizardResultsService, userProfileService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';

interface AuthContentProps {
  onComplete: () => void;
  onBack: () => void;
}

const AuthContent: React.FC<AuthContentProps> = ({ onComplete, onBack }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTabSwitch = (tab: 'login' | 'register') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    setValidationErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (activeTab === 'register') {
      if (!formData.name) {
        errors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (validateForm()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
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
    onComplete();
  };

  return (
    <View style={styles.authContent}>
      {/* Header */}
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Save Your Progress! 🎉</Text>
        <Text style={styles.authSubtitle}>
          Create an account to save your personalized preferences and track your fitness journey
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.authTabContainer}>
        <TouchableOpacity
          style={[styles.authTab, activeTab === 'register' && styles.authActiveTab]}
          onPress={() => handleTabSwitch('register')}
        >
          <Text style={[styles.authTabText, activeTab === 'register' && styles.authActiveTabText]}>
            Create Account
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authTab, activeTab === 'login' && styles.authActiveTab]}
          onPress={() => handleTabSwitch('login')}
        >
          <Text style={[styles.authTabText, activeTab === 'login' && styles.authActiveTabText]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>

      {/* Social Login Buttons */}
      <View style={styles.authSocialContainer}>
        <TouchableOpacity 
          style={styles.authSocialButton}
          onPress={() => handleSocialLogin('Google')}
        >
          <Icon name="globe" size={20} color={colors.white} />
          <Text style={styles.authSocialButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.authSocialButton}
          onPress={() => handleSocialLogin('Apple')}
        >
          <Icon name="smartphone" size={20} color={colors.white} />
          <Text style={styles.authSocialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.authDividerContainer}>
        <View style={styles.authDividerLine} />
        <Text style={styles.authDividerText}>or</Text>
        <View style={styles.authDividerLine} />
      </View>

      {/* Form */}
      <View style={styles.authFormContainer}>
        {activeTab === 'register' && (
          <View style={styles.authInputContainer}>
            <View style={styles.authInputWrapper}>
              <Icon name="user" size={20} color={colors.lightGray} />
              <TextInput
                style={styles.authTextInput}
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
              <Text style={styles.authErrorText}>{validationErrors.name}</Text>
            )}
          </View>
        )}

        <View style={styles.authInputContainer}>
          <View style={styles.authInputWrapper}>
            <Icon name="mail" size={20} color={colors.lightGray} />
            <TextInput
              style={styles.authTextInput}
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
            <Text style={styles.authErrorText}>{validationErrors.email}</Text>
          )}
        </View>

        <View style={styles.authInputContainer}>
          <View style={styles.authInputWrapper}>
            <Icon name="lock" size={20} color={colors.lightGray} />
            <TextInput
              style={styles.authTextInput}
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
              style={styles.authEyeButton}
            >
              <Icon 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={colors.lightGray} 
              />
            </TouchableOpacity>
          </View>
          {validationErrors.password && (
            <Text style={styles.authErrorText}>{validationErrors.password}</Text>
          )}
        </View>

        {activeTab === 'register' && (
          <View style={styles.authInputContainer}>
            <View style={styles.authInputWrapper}>
              <Icon name="lock" size={20} color={colors.lightGray} />
              <TextInput
                style={styles.authTextInput}
                placeholder="Confirm Password"
                placeholderTextColor={colors.lightGray}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                passwordRules=""
                importantForAutofill="no"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.authEyeButton}
              >
                <Icon 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={colors.lightGray} 
                />
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text style={styles.authErrorText}>{validationErrors.confirmPassword}</Text>
            )}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.authSubmitButton} onPress={handleSubmit}>
        <Text style={styles.authSubmitButtonText}>
          {activeTab === 'register' ? 'Create Account' : 'Sign In'}
        </Text>
        <Icon name="arrow-right" size={20} color={colors.white} />
      </TouchableOpacity>

      {/* Skip Option */}
      <TouchableOpacity style={styles.authSkipButton} onPress={onComplete}>
        <Text style={styles.authSkipButtonText}>Skip for now</Text>
      </TouchableOpacity>

      {/* Back to wizard */}
      <TouchableOpacity style={styles.authBackButton} onPress={onBack}>
        <Icon name="chevron-left" size={20} color={colors.lightGray} />
        <Text style={styles.authBackButtonText}>Back to setup</Text>
      </TouchableOpacity>
    </View>
  );
};

interface SetupWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [preferences, setPreferences] = useState({
    primaryGoal: '',
    focusMuscle: '',
    trainingTime: '',
    // Profile details
    age: '',
    weight: '',
    height: '',
    fitnessLevel: '',
  });

  // Reset wizard when it becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setValidationError('');
      setShowAuthScreen(false);
      setPreferences({
        primaryGoal: '',
        focusMuscle: '',
        trainingTime: '',
        // Profile details
        age: '',
        weight: '',
        height: '',
        fitnessLevel: '',
      });
    }
  }, [visible]);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DENSE! 💪',
      subtitle: 'Let\'s find your perfect program',
      icon: 'target',
      color: colors.primary,
    },
    {
      id: 'fitness-goals',
      title: 'What are your fitness goals?',
      subtitle: 'Choose your primary objective',
      icon: 'award',
      color: colors.secondary,
    },
    {
      id: 'muscle-focus',
      title: 'Which muscle group to focus on?',
      subtitle: 'Select your main area of development',
      icon: 'zap',
      color: colors.primary,
    },
    {
      id: 'training-time',
      title: 'How much time can you train?',
      subtitle: 'Choose your preferred workout duration',
      icon: 'clock',
      color: colors.secondary,
    },
    {
      id: 'profile-details',
      title: 'Complete your profile',
      subtitle: 'Help us personalize your experience',
      icon: 'user',
      color: colors.primary,
    },
    {
      id: 'complete',
      title: 'Perfect Match Found! 🎯',
      subtitle: 'We\'ve found the ideal program for you',
      icon: 'check-circle',
      color: colors.success,
    },
  ];

  const goals = ['Build Muscle', 'Get Stronger', 'Lose Weight', 'General Fitness'];
  const muscleGroups = ['Chest', 'Back', 'Shoulders'];
  const trainingTimes = ['30-45 minutes', '45-60 minutes', '60-90 minutes'];
  const fitnessLevels = ['Beginner', 'Intermediate', 'Advanced'];



  const validateCurrentStep = () => {
    const step = steps[currentStep];
    setValidationError('');

    switch (step.id) {
      case 'fitness-goals':
        if (!preferences.primaryGoal) {
          setValidationError('Please select your primary fitness goal');
          return false;
        }
        break;
      case 'muscle-focus':
        if (!preferences.focusMuscle) {
          setValidationError('Please select your muscle group focus');
          return false;
        }
        break;
      case 'training-time':
        if (!preferences.trainingTime) {
          setValidationError('Please select your preferred training duration');
          return false;
        }
        break;
      case 'profile-details':
        if (!preferences.age || !preferences.weight || !preferences.height || !preferences.fitnessLevel) {
          setValidationError('Please fill in all profile details');
          return false;
        }
        if (parseInt(preferences.age) < 16 || parseInt(preferences.age) > 80) {
          setValidationError('Please enter a valid age (16-80)');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Clear validation error when successfully proceeding
    setValidationError('');
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Clear validation error when going back
    setValidationError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    try {
      // Get current user
      const { user, setWizardCompleted } = useAuthStore.getState();
      if (!user) {
        console.error('No user found for wizard completion');
        setShowAuthScreen(true);
        return;
      }

      // Get matched program
      const matchedProgram = getMatchedProgram();
      
      // Save wizard results to database
      await wizardResultsService.create({
        userId: user.email,
        primaryGoal: preferences.primaryGoal.toLowerCase().replace(' ', '_'),
        fitnessLevel: preferences.fitnessLevel.toLowerCase(),
        workoutFrequency: '5_times', // Default based on training programs
        preferredWorkoutLength: preferences.trainingTime.replace('-', '_').replace(' ', '_'),
        workoutLocation: 'gym', // Default for our muscle-focused programs
        focusMuscle: preferences.focusMuscle.toLowerCase(),
        suggestedPrograms: JSON.stringify([matchedProgram.id]),
      });

      // Update user profile with new details
      await userProfileService.update(user.email, {
        age: parseInt(preferences.age),
        weight: parseFloat(preferences.weight),
        height: parseFloat(preferences.height),
        goal: preferences.primaryGoal,
      });

      // Mark wizard as completed
      setWizardCompleted();
      
      console.log('✅ Wizard completed and saved:', {
        goal: preferences.primaryGoal,
        muscle: preferences.focusMuscle,
        time: preferences.trainingTime,
        program: matchedProgram.name,
      });

    } catch (error) {
      console.error('❌ Failed to save wizard results:', error);
    }
    
    setShowAuthScreen(true);
  };

  // Program matching logic
  const getMatchedProgram = () => {
    const { primaryGoal, focusMuscle, trainingTime } = preferences;
    
    // Match muscle focus to program
    let programName = '';
    let programId = '';
    
    switch (focusMuscle.toLowerCase()) {
      case 'chest':
        programName = 'Chest Domination';
        programId = 'chest-focus-program';
        break;
      case 'back':
        programName = 'Back Builder Elite';
        programId = 'back-focus-program';
        break;
      case 'shoulders':
        programName = 'Shoulder Sculptor';
        programId = 'shoulders-focus-program';
        break;
      default:
        programName = 'Chest Domination';
        programId = 'chest-focus-program';
    }
    
    return {
      id: programId,
      name: programName,
      description: `Perfect for your ${primaryGoal.toLowerCase()} goals with ${focusMuscle.toLowerCase()} focus`,
      duration: '12 weeks',
      focusArea: focusMuscle.toLowerCase(),
      trainingTime: trainingTime,
      goal: primaryGoal,
    };
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Answer 3 quick questions and we'll recommend the perfect 12-week program tailored to your goals and preferences.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="target" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Muscle-focused programs</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="trending-up" size={20} color={colors.secondary} />
                <Text style={styles.featureText}>12-week structured plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="zap" size={20} color={colors.success} />
                <Text style={styles.featureText}>Personalized recommendations</Text>
              </View>
            </View>
          </View>
        );

      case 'fitness-goals':
        return (
          <View style={styles.optionsContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  preferences.primaryGoal === goal && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, primaryGoal: goal });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.primaryGoal === goal && styles.selectedOptionText,
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'muscle-focus':
        return (
          <View style={styles.optionsContainer}>
            {muscleGroups.map((muscle) => (
              <TouchableOpacity
                key={muscle}
                style={[
                  styles.optionButton,
                  preferences.focusMuscle === muscle && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, focusMuscle: muscle });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.focusMuscle === muscle && styles.selectedOptionText,
                  ]}
                >
                  {muscle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'training-time':
        return (
          <View style={styles.optionsContainer}>
            {trainingTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  preferences.trainingTime === time && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, trainingTime: time });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.trainingTime === time && styles.selectedOptionText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'profile-details':
        return (
          <View style={styles.profileContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your age"
                placeholderTextColor={colors.lightGray}
                value={preferences.age}
                onChangeText={(value) => {
                  setValidationError('');
                  setPreferences({ ...preferences, age: value });
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="70"
                  placeholderTextColor={colors.lightGray}
                  value={preferences.weight}
                  onChangeText={(value) => {
                    setValidationError('');
                    setPreferences({ ...preferences, weight: value });
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="175"
                  placeholderTextColor={colors.lightGray}
                  value={preferences.height}
                  onChangeText={(value) => {
                    setValidationError('');
                    setPreferences({ ...preferences, height: value });
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fitness Level</Text>
              <View style={styles.optionsContainer}>
                {fitnessLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      preferences.fitnessLevel === level && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setValidationError('');
                      setPreferences({ ...preferences, fitnessLevel: level });
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        preferences.fitnessLevel === level && styles.selectedOptionText,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 'complete':
        const matchedProgram = getMatchedProgram();
        return (
          <View style={styles.completeContent}>
            <View style={styles.congratulationsContainer}>
              <Text style={styles.congratulationsTitle}>🎯 Perfect Match!</Text>
              <Text style={styles.congratulationsSubtitle}>
                We found the ideal program for you
              </Text>
            </View>
            
            <View style={styles.programCard}>
              <View style={styles.programHeader}>
                <Text style={styles.programName}>{matchedProgram.name}</Text>
                <Text style={styles.programDuration}>{matchedProgram.duration}</Text>
              </View>
              <Text style={styles.programDescription}>{matchedProgram.description}</Text>
              
              <View style={styles.programDetails}>
                <View style={styles.programDetailItem}>
                  <Icon name="target" size={16} color={colors.primary} />
                  <Text style={styles.programDetailText}>Goal: {matchedProgram.goal}</Text>
                </View>
                <View style={styles.programDetailItem}>
                  <Icon name="zap" size={16} color={colors.secondary} />
                  <Text style={styles.programDetailText}>Focus: {matchedProgram.focusArea}</Text>
                </View>
                <View style={styles.programDetailItem}>
                  <Icon name="clock" size={16} color={colors.success} />
                  <Text style={styles.programDetailText}>Time: {matchedProgram.trainingTime}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.programActions}>
              <TouchableOpacity style={styles.getStartedButton} onPress={handleComplete}>
                <Text style={styles.getStartedButtonText}>Save & Continue</Text>
                <Icon name="arrow-right" size={20} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.seeProgramButton} 
                onPress={() => {
                  const matchedProgram = getMatchedProgram();
                  router.push(`/program/${matchedProgram.id}`);
                }}
              >
                <Text style={styles.seeProgramButtonText}>See the Program</Text>
                <Icon name="eye" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
        <View style={styles.header}>
          {!showAuthScreen && (
            <Text style={styles.stepCounter}>
              {currentStep + 1} of {steps.length}
            </Text>
          )}
        </View>

        {!showAuthScreen && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / steps.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {!showAuthScreen ? (
            <>
              <View style={[
                styles.stepHeader, 
                steps[currentStep].id === 'complete' && styles.compactStepHeader
              ]}>
                <View style={[
                  styles.stepIcon, 
                  steps[currentStep].id === 'complete' && styles.compactStepIcon,
                  { backgroundColor: steps[currentStep].color + '20' }
                ]}>
                  <Icon 
                    name={steps[currentStep].icon as any} 
                    size={steps[currentStep].id === 'complete' ? 24 : 32} 
                    color={steps[currentStep].color} 
                  />
                </View>
                <Text style={[
                  styles.stepTitle,
                  steps[currentStep].id === 'complete' && styles.compactStepTitle
                ]}>{steps[currentStep].title}</Text>
                <Text style={[
                  styles.stepSubtitle,
                  steps[currentStep].id === 'complete' && styles.compactStepSubtitle
                ]}>{steps[currentStep].subtitle}</Text>
              </View>

              {renderStepContent()}
              
              {/* Validation Error Display */}
              {validationError && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              )}
            </>
          ) : (
            <AuthContent 
              onComplete={() => {
                router.push('/(tabs)');
                onComplete();
                onClose();
              }}
              onBack={() => {
                setShowAuthScreen(false);
              }}
            />
          )}
        </ScrollView>

        {steps[currentStep].id !== 'complete' && !showAuthScreen && (
          <View style={styles.navigationContainer}>
            {currentStep === 0 ? (
              // First step: Next button on bottom right
              <View style={styles.firstStepNavigation}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Icon name="chevron-right" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              // Other steps: Normal navigation
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Icon name="chevron-left" size={20} color={colors.lightGray} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Icon name="chevron-right" size={20} color={colors.white} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </LinearGradient>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  stepCounter: {
    fontSize: 16,
    color: colors.lightGray,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.darkGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  compactStepHeader: {
    marginBottom: 20,
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  compactStepIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  compactStepTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  compactStepSubtitle: {
    fontSize: 14,
  },
  welcomeContent: {
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.lightGray,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  optionButton: {
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  notificationsContainer: {
    gap: 20,
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 20,
    borderRadius: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: colors.lightGray,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  toggleIndicatorActive: {
    transform: [{ translateX: 20 }],
  },
  completeContent: {
    paddingBottom: 20,
  },
  congratulationsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  congratulationsTitle: {
    fontSize: 26,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratulationsSubtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  completeText: {
    fontSize: 16,
    color: colors.lightGray,
    lineHeight: 24,
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.dark,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  summaryCardTitle: {
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryItem: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 8,
  },
  getStartedButtonText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginHorizontal: 4,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  firstStepNavigation: {
    width: '100%',
    alignItems: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.lightGray,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  nextButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  // Auth Content Styles
  authContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  authTabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 7,
    alignItems: 'center',
  },
  authActiveTab: {
    backgroundColor: colors.primary,
  },
  authTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightGray,
  },
  authActiveTabText: {
    color: colors.white,
  },
  authSocialContainer: {
    gap: 10,
    marginBottom: 24,
  },
  authSocialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
  },
  authSocialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  authDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mediumGray,
  },
  authDividerText: {
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: '500',
  },
  authFormContainer: {
    gap: 16,
    marginBottom: 24,
  },
  authInputContainer: {
    gap: 6,
  },
  authInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 10,
  },
  authTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    paddingVertical: 14,
  },
  authEyeButton: {
    padding: 4,
  },
  authErrorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
  authSubmitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  authSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  authSkipButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  authSkipButtonText: {
    fontSize: 14,
    color: colors.lightGray,
    fontWeight: '500',
  },
  authBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  authBackButtonText: {
    fontSize: 14,
    color: colors.lightGray,
    fontWeight: '500',
  },
  // Program Card Styles
  programCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  programDuration: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  programDescription: {
    fontSize: 16,
    color: colors.lightGray,
    lineHeight: 22,
    marginBottom: 16,
  },
  programDetails: {
    gap: 8,
  },
  programDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programDetailText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
  },
  // Profile Form Styles
  profileContainer: {
    gap: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Program Actions
  programActions: {
    gap: 16,
  },
  seeProgramButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  seeProgramButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
});