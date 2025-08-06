import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { wizardResultsService, userProfileService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { ProgramGenerator, type WizardResponses } from '@/utils/program-generator';

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
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const [showCheckProgramButton, setShowCheckProgramButton] = useState(false);
  const [generatedProgramData, setGeneratedProgramData] = useState<any>(null);
  const [isNavigatingToProgram, setIsNavigatingToProgram] = useState(false);
  const [showProgramView, setShowProgramView] = useState(false);
  const [preferences, setPreferences] = useState({
    // Step 2: Current Strength
    squatKg: '',
    benchKg: '',
    deadliftKg: '',
    // Step 3: Training Experience
    trainingExperience: '',
    // Step 4: Body Fat
    bodyFatLevel: '',
    // Step 5: Weekly Schedule
    trainingDaysPerWeek: '',
    preferredTrainingDays: [] as string[],
    // Step 6: Muscle Priorities (max 3)
    musclePriorities: [] as string[],
    // Step 7: Pump Work
    pumpWorkPreference: '',
    // Step 8: Recovery
    recoveryProfile: '',
    // Step 9: Duration
    programDurationWeeks: '',
  });

  // Reset wizard when it becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setValidationError('');
      setShowAuthScreen(false);
      setPreferences({
        // Step 2: Current Strength
        squatKg: '',
        benchKg: '',
        deadliftKg: '',
        // Step 3: Training Experience
        trainingExperience: '',
        // Step 4: Body Fat
        bodyFatLevel: '',
        // Step 5: Weekly Schedule
        trainingDaysPerWeek: '',
        preferredTrainingDays: [],
        // Step 6: Muscle Priorities (max 3)
        musclePriorities: [],
        // Step 7: Pump Work
        pumpWorkPreference: '',
        // Step 8: Recovery
        recoveryProfile: '',
        // Step 9: Duration
        programDurationWeeks: '',
      });
    }
  }, [visible]);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DENSE',
      subtitle: 'This is version 1 of our app — focused ONLY on one thing:\nGetting you stronger and leaner. Fast.\n\nAnswer 8 quick questions and we\'ll build your fully custom training program.',
      icon: 'target',
      color: colors.primary,
    },
    {
      id: 'current-strength',
      title: 'Where are you starting from?',
      subtitle: 'Don\'t worry if you don\'t know your exact numbers — just estimate or leave blank.',
      icon: 'trending-up',
      color: colors.secondary,
    },
    {
      id: 'training-experience',
      title: 'How long have you been lifting?',
      subtitle: 'This helps us set the right intensity',
      icon: 'clock',
      color: colors.primary,
    },
    {
      id: 'body-fat',
      title: 'What\'s your current body fat level?',
      subtitle: 'Optional visual reference to help estimate',
      icon: 'user',
      color: colors.secondary,
    },
    {
      id: 'weekly-schedule',
      title: 'How many days per week can you train?',
      subtitle: 'We\'ll design your split based on your availability',
      icon: 'calendar',
      color: colors.primary,
    },
    {
      id: 'muscle-priorities',
      title: 'Which muscles do you want to focus on?',
      subtitle: 'Choose up to 3 weak points. We\'ll give them extra volume and pump sets.',
      icon: 'zap',
      color: colors.secondary,
    },
    {
      id: 'pump-work',
      title: 'Do you want extra pump work at the end of your sessions?',
      subtitle: 'Add finishing moves for muscle growth',
      icon: 'activity',
      color: colors.primary,
    },
    {
      id: 'recovery-profile',
      title: 'Do you recover quickly between intense workouts?',
      subtitle: 'This affects session spacing and volume',
      icon: 'refresh-cw',
      color: colors.secondary,
    },
    {
      id: 'program-duration',
      title: 'How long do you want to follow this plan?',
      subtitle: 'We\'ll pace your progression accordingly',
      icon: 'target',
      color: colors.primary,
    },
    {
      id: 'complete',
      title: 'You\'re Ready! 💪',
      subtitle: 'Time to generate the perfect program tailored just for you',
      icon: 'zap',
      color: colors.primary,
    },
  ];

  // Step 3: Training Experience Options
  const trainingExperienceOptions = [
    { id: 'new', label: 'I\'m new (less than 6 months)' },
    { id: '6_18_months', label: 'I\'ve been consistent for 6–18 months' },
    { id: '2_plus_years', label: 'I\'ve trained for 2+ years and track progress seriously' },
  ];

  // Step 4: Body Fat Options
  const bodyFatOptions = [
    { id: 'lean_10_14', label: 'Lean (10–14%)' },
    { id: 'athletic_15_18', label: 'Athletic (15–18%)' },
    { id: 'average_18_22', label: 'Average (18–22%)' },
    { id: 'high_22_plus', label: 'High (22%+)' },
  ];

  // Step 5: Training Days Options
  const trainingDaysOptions = [
    { id: '3', label: '3 days per week' },
    { id: '4', label: '4 days per week' },
    { id: '5', label: '5 days per week' },
    { id: '6', label: '6 days per week' },
  ];
  const weekDays = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ];

  // Step 6: Muscle Priorities Options
  const musclePriorityOptions = [
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'arms', label: 'Arms' },
    { id: 'quads', label: 'Quads' },
    { id: 'hamstrings_glutes', label: 'Hamstrings & Glutes' },
    { id: 'calves', label: 'Calves' },
    { id: 'abs', label: 'Abs' },
  ];

  // Step 7: Pump Work Options
  const pumpWorkOptions = [
    { id: 'yes_love_burn', label: 'Yes — I love the burn' },
    { id: 'maybe_sometimes', label: 'Maybe sometimes' },
    { id: 'no_minimal', label: 'No thanks, keep it minimal' },
  ];

  // Step 8: Recovery Options
  const recoveryOptions = [
    { id: 'fast_recovery', label: 'Yes, I recover fast' },
    { id: 'need_more_rest', label: 'Not really — I need more rest' },
    { id: 'not_sure', label: 'Not sure yet' },
  ];

  // Step 9: Duration Options
  const durationOptions = [
    { id: '4', label: '4 weeks' },
    { id: '8', label: '8 weeks' },
    { id: '12', label: '12 weeks' },
  ];

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    setValidationError('');

    switch (step.id) {
      case 'current-strength':
        // Optional fields - no validation needed
        return true;
      case 'training-experience':
        if (!preferences.trainingExperience) {
          setValidationError('Please select your training experience');
          return false;
        }
        break;
      case 'body-fat':
        if (!preferences.bodyFatLevel) {
          setValidationError('Please select your body fat level');
          return false;
        }
        break;
      case 'weekly-schedule':
        if (!preferences.trainingDaysPerWeek) {
          setValidationError('Please select how many days per week you can train');
          return false;
        }
        // Validate user selected correct number of preferred days
        const selectedDaysCount = preferences.preferredTrainingDays.length;
        const requiredDaysCount = parseInt(preferences.trainingDaysPerWeek);
        if (selectedDaysCount !== requiredDaysCount) {
          setValidationError(`Please select exactly ${requiredDaysCount} days to match your training schedule`);
          return false;
        }
        break;
      case 'muscle-priorities':
        if (preferences.musclePriorities.length === 0) {
          setValidationError('Please select at least one muscle group to focus on');
          return false;
        }
        break;
      case 'pump-work':
        if (!preferences.pumpWorkPreference) {
          setValidationError('Please select your pump work preference');
          return false;
        }
        break;
      case 'recovery-profile':
        if (!preferences.recoveryProfile) {
          setValidationError('Please select your recovery profile');
          return false;
        }
        break;
      case 'program-duration':
        if (!preferences.programDurationWeeks) {
          setValidationError('Please select your program duration');
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

  const simulateAIGeneration = async (): Promise<void> => {
    const steps = [
      { text: 'Initializing AI engine...', emoji: '🤖', duration: 1500 },
      { text: 'Processing experience data...', emoji: '📈', duration: 1600 },
      { text: 'Analyzing strength baseline...', emoji: '🏋️‍♂️', duration: 1400 },
      { text: 'Calculating training split...', emoji: '📊', duration: 1700 },
      { text: 'Selecting exercises...', emoji: '🎯', duration: 1500 },
      { text: 'Setting volume & intensity...', emoji: '⚡', duration: 1600 },
      { text: 'Adding pump work...', emoji: '🔥', duration: 1400 },
      { text: 'Optimizing recovery...', emoji: '🔄', duration: 1500 },
      { text: 'Finalizing program...', emoji: '✨', duration: 1300 },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = ((i + 1) / steps.length) * 100;
      
      setGenerationStep(`${step.emoji} ${step.text}`);
      setGenerationProgress(progress);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }
  };

  const handleComplete = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Start AI generation loading
    setIsGeneratingProgram(true);
    setGenerationProgress(0);
    
    try {
      // Get current user
      const { user, setWizardCompleted } = useAuthStore.getState();
      if (!user) {
        console.error('No user found for wizard completion');
        setShowAuthScreen(true);
        setIsGeneratingProgram(false);
        return;
      }

      // 🧠 Generate custom program using AI logic with beautiful loading
      const wizardResponses: WizardResponses = {
        squatKg: preferences.squatKg ? parseFloat(preferences.squatKg) : undefined,
        benchKg: preferences.benchKg ? parseFloat(preferences.benchKg) : undefined,
        deadliftKg: preferences.deadliftKg ? parseFloat(preferences.deadliftKg) : undefined,
        trainingExperience: preferences.trainingExperience as any,
        bodyFatLevel: preferences.bodyFatLevel as any,
        trainingDaysPerWeek: parseInt(preferences.trainingDaysPerWeek),
        preferredTrainingDays: preferences.preferredTrainingDays,
        musclePriorities: preferences.musclePriorities,
        pumpWorkPreference: preferences.pumpWorkPreference as any,
        recoveryProfile: preferences.recoveryProfile as any,
        programDurationWeeks: parseInt(preferences.programDurationWeeks),
      };

      // Simulate AI generation process
      await simulateAIGeneration();
      
      console.log('🧠 Generating AI program with responses:', wizardResponses);
      const generatedProgram = ProgramGenerator.generateProgram(wizardResponses);
      console.log('✅ AI Generated Program:', generatedProgram);

      // Save wizard results to database with ALL new fields + generated program
      await wizardResultsService.create({
        userId: user.email,
        // DENSE V1 9-Step Data
        squatKg: preferences.squatKg ? parseFloat(preferences.squatKg) : null,
        benchKg: preferences.benchKg ? parseFloat(preferences.benchKg) : null,
        deadliftKg: preferences.deadliftKg ? parseFloat(preferences.deadliftKg) : null,
        trainingExperience: preferences.trainingExperience,
        bodyFatLevel: preferences.bodyFatLevel,
        trainingDaysPerWeek: parseInt(preferences.trainingDaysPerWeek),
        preferredTrainingDays: JSON.stringify(preferences.preferredTrainingDays),
        musclePriorities: JSON.stringify(preferences.musclePriorities),
        pumpWorkPreference: preferences.pumpWorkPreference,
        recoveryProfile: preferences.recoveryProfile,
        programDurationWeeks: parseInt(preferences.programDurationWeeks),
        // AI Generated Program
        suggestedPrograms: JSON.stringify([generatedProgram.programName]),
        generatedSplit: JSON.stringify(generatedProgram),
      });

      console.log('✅ DENSE V1 Wizard completed and saved:', {
        experience: preferences.trainingExperience,
        bodyFat: preferences.bodyFatLevel,
        days: preferences.trainingDaysPerWeek,
        priorities: preferences.musclePriorities,
        duration: preferences.programDurationWeeks,
        generatedProgram: generatedProgram.programName,
        totalWorkouts: generatedProgram.weeklyStructure.length,
      });

      // Show final success messages
      setGenerationStep('🎉 Program Generated Successfully!');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGenerationStep('🚀 Your custom program is ready to transform your physique!');
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Store the generated program data
      setGeneratedProgramData(generatedProgram);
      
      // Stop loading and go directly to check program button
      setIsGeneratingProgram(false);
      setShowCheckProgramButton(true);
      
      console.log('🚀 Generated program:', generatedProgram.programName);

    } catch (error) {
      console.error('❌ Failed to save wizard results:', error);
      setIsGeneratingProgram(false);
      setGenerationStep('❌ Error generating program');
    }
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

      case 'current-strength':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Squat (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="80"
                placeholderTextColor={colors.lightGray}
                value={preferences.squatKg}
                onChangeText={(value) => {
                  setValidationError('');
                  setPreferences({ ...preferences, squatKg: value });
                }}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bench Press (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="60"
                placeholderTextColor={colors.lightGray}
                value={preferences.benchKg}
                onChangeText={(value) => {
                  setValidationError('');
                  setPreferences({ ...preferences, benchKg: value });
                }}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deadlift (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="100"
                placeholderTextColor={colors.lightGray}
                value={preferences.deadliftKg}
                onChangeText={(value) => {
                  setValidationError('');
                  setPreferences({ ...preferences, deadliftKg: value });
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 'training-experience':
        return (
          <View style={styles.optionsContainer}>
            {trainingExperienceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.trainingExperience === option.id && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, trainingExperience: option.id });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.trainingExperience === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'body-fat':
        return (
          <View style={styles.optionsContainer}>
            {bodyFatOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.bodyFatLevel === option.id && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, bodyFatLevel: option.id });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.bodyFatLevel === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'weekly-schedule':
        return (
          <View style={styles.scheduleContainer}>
            {/* Days per week selection */}
            <View style={styles.optionsContainer}>
              {trainingDaysOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    preferences.trainingDaysPerWeek === option.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setValidationError('');
                    setPreferences({ 
                      ...preferences, 
                      trainingDaysPerWeek: option.id,
                      preferredTrainingDays: [] // Reset selected days when changing number
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      preferences.trainingDaysPerWeek === option.id && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day selection */}
            {preferences.trainingDaysPerWeek && (
              <View style={styles.daySelectionContainer}>
                <Text style={styles.daySelectionLabel}>Select your preferred days:</Text>
                <View style={styles.daysGrid}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayButton,
                        preferences.preferredTrainingDays.includes(day.id) && styles.selectedDayButton,
                      ]}
                      onPress={() => {
                        setValidationError('');
                        const currentDays = preferences.preferredTrainingDays;
                        const maxDays = parseInt(preferences.trainingDaysPerWeek);
                        
                        if (currentDays.includes(day.id)) {
                          // Remove day
                          setPreferences({
                            ...preferences,
                            preferredTrainingDays: currentDays.filter(d => d !== day.id)
                          });
                        } else if (currentDays.length < maxDays) {
                          // Add day
                          setPreferences({
                            ...preferences,
                            preferredTrainingDays: [...currentDays, day.id]
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          preferences.preferredTrainingDays.includes(day.id) && styles.selectedDayButtonText,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'muscle-priorities':
        return (
          <View style={styles.optionsContainer}>
            {musclePriorityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.musclePriorities.includes(option.id) && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  const currentPriorities = preferences.musclePriorities;
                  
                  if (currentPriorities.includes(option.id)) {
                    // Remove priority
                    setPreferences({
                      ...preferences,
                      musclePriorities: currentPriorities.filter(p => p !== option.id)
                    });
                  } else if (currentPriorities.length < 3) {
                    // Add priority (max 3)
                    setPreferences({
                      ...preferences,
                      musclePriorities: [...currentPriorities, option.id]
                    });
                  }
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.musclePriorities.includes(option.id) && styles.selectedOptionText,
                  ]}
                >
                  {option.label} {preferences.musclePriorities.includes(option.id) ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.helperText}>
              Selected: {preferences.musclePriorities.length}/3
            </Text>
          </View>
        );

      case 'pump-work':
        return (
          <View style={styles.optionsContainer}>
            {pumpWorkOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.pumpWorkPreference === option.id && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, pumpWorkPreference: option.id });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.pumpWorkPreference === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'recovery-profile':
        return (
          <View style={styles.optionsContainer}>
            {recoveryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.recoveryProfile === option.id && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, recoveryProfile: option.id });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.recoveryProfile === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'program-duration':
        return (
          <View style={styles.optionsContainer}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.programDurationWeeks === option.id && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, programDurationWeeks: option.id });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.programDurationWeeks === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'complete':
        return (
          <View style={styles.completeContent}>
            <View style={styles.readyContainer}>
              <Text style={styles.readyTitle}>🎯 All Set!</Text>
              <Text style={styles.readyMessage}>
                You've answered all the questions we need to build your perfect training program.
              </Text>
            </View>
            
            <View style={styles.completeSummaryCard}>
              <Text style={styles.completeSummaryTitle}>Your Profile Summary:</Text>
              
              <View style={styles.completeSummaryItem}>
                <Text style={styles.summaryLabel}>Training Experience:</Text>
                <Text style={styles.summaryValue}>
                  {preferences.trainingExperience === 'new' ? 'Beginner' : 
                   preferences.trainingExperience === '6_18_months' ? 'Intermediate' : 'Advanced'}
                </Text>
              </View>
              
              <View style={styles.completeSummaryItem}>
                <Text style={styles.summaryLabel}>Training Days:</Text>
                <Text style={styles.summaryValue}>{preferences.trainingDaysPerWeek} days per week</Text>
              </View>
              
              {preferences.musclePriorities.length > 0 && (
                <View style={styles.completeSummaryItem}>
                  <Text style={styles.summaryLabel}>Focus Areas:</Text>
                  <Text style={styles.summaryValue}>
                    {preferences.musclePriorities.map(priority => 
                      musclePriorityOptions.find(opt => opt.id === priority)?.label
                    ).join(', ')}
                  </Text>
                </View>
              )}
              
              <View style={styles.completeSummaryItem}>
                <Text style={styles.summaryLabel}>Program Duration:</Text>
                <Text style={styles.summaryValue}>{preferences.programDurationWeeks} weeks</Text>
              </View>
            </View>
            
            <View style={styles.finalMessage}>
              <Text style={styles.finalMessageText}>
                🤖 Our AI will now analyze your answers and create a fully customized Push/Pull/Legs program designed specifically for your goals, experience level, and preferences.
              </Text>
            </View>
            
            <View style={styles.programActions}>
              <TouchableOpacity style={styles.getStartedButton} onPress={handleComplete}>
                <Text style={styles.getStartedButtonText}>Generate My Program 💪</Text>
                <Icon name="arrow-right" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Show AI generation loading screen
  if (isGeneratingProgram) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <View style={styles.loadingHeader}>
            <Text style={styles.loadingTitle}>🧠 AI Generating Your Program</Text>
            <Text style={styles.loadingSubtitle}>
              Creating your personalized Push/Pull/Legs routine...
            </Text>
          </View>
          
          <View style={styles.loadingContent}>
            <View style={styles.loadingAnimation}>
              <Text style={styles.loadingEmoji}>🤖</Text>
              <View style={styles.loadingDots}>
                <View style={[styles.loadingDot, styles.loadingDot1]} />
                <View style={[styles.loadingDot, styles.loadingDot2]} />
                <View style={[styles.loadingDot, styles.loadingDot3]} />
              </View>
            </View>
            
            <Text style={styles.loadingStep}>{generationStep}</Text>
            
            <View style={styles.loadingProgress}>
              <View style={[styles.loadingProgressBar, { width: `${generationProgress}%` }]} />
            </View>
            
            <View style={styles.loadingStats}>
              <View style={styles.loadingStat}>
                <Text style={styles.loadingStatNumber}>{preferences.trainingDaysPerWeek}</Text>
                <Text style={styles.loadingStatLabel}>Days/Week</Text>
              </View>
              <View style={styles.loadingStat}>
                <Text style={styles.loadingStatNumber}>{preferences.musclePriorities.length}</Text>
                <Text style={styles.loadingStatLabel}>Focus Areas</Text>
              </View>
              <View style={styles.loadingStat}>
                <Text style={styles.loadingStatNumber}>{preferences.programDurationWeeks}</Text>
                <Text style={styles.loadingStatLabel}>Weeks</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }



  // Show program view within wizard
  if (showProgramView && generatedProgramData) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Program</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inlineProgram}>
            <Text style={styles.inlineProgramName}>{generatedProgramData.programName}</Text>
            <Text style={styles.inlineProgramDescription}>{generatedProgramData.overview}</Text>
            
            <View style={styles.programStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgramData.totalWeeks}</Text>
                <Text style={styles.statLabel}>Weeks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgramData.weeklyStructure.length}</Text>
                <Text style={styles.statLabel}>Days/Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgramData.weeklyStructure.reduce((total: number, day: any) => total + day.exercises.length, 0)}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
            </View>
          </View>

          {generatedProgramData.weeklyStructure.map((day: any, index: number) => (
            <View key={index} style={styles.workoutCard}>
              <Text style={styles.workoutName}>{day.name}</Text>
              <Text style={styles.workoutDuration}>{day.estimatedDuration} min</Text>
              
              {day.exercises.map((exercise: any, exerciseIndex: number) => (
                <View key={exerciseIndex} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                </View>
              ))}
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={() => {
              const { setWizardCompleted } = useAuthStore.getState();
              setWizardCompleted();
            }}
          >
            <Text style={styles.finishButtonText}>Finish Setup</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Hide wizard when navigating to program view
  if (isNavigatingToProgram) {
    return null;
  }

  // Show check program button
  if (showCheckProgramButton) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.checkProgramContainer}>
          <View style={styles.programReadyCard}>
            <Text style={styles.programReadyEmoji}>💪</Text>
            <Text style={styles.programReadyTitle}>Your Program is Ready!</Text>
            <Text style={styles.programReadySubtitle}>
              {generatedProgramData?.programName || 'Custom Push/Pull/Legs Program'}
            </Text>
            <Text style={styles.programReadyDescription}>
              Designed specifically for your goals, experience level, and muscle priorities.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkProgramButton}
            onPress={() => {
              console.log('🚀 Showing program view within wizard');
              setShowCheckProgramButton(false);
              setShowProgramView(true);
            }}
          >
            <Text style={styles.checkProgramButtonText}>Check Your Program</Text>
            <Icon name="arrow-right" size={20} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewLaterButton}
            onPress={() => {
              // Mark wizard as completed and close wizard
              const { setWizardCompleted } = useAuthStore.getState();
              setWizardCompleted();
              setShowCheckProgramButton(false);
            }}
          >
            <Text style={styles.viewLaterButtonText}>View Later in Programs Tab</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
              // First step: Start Setup button on bottom right
              <View style={styles.firstStepNavigation}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Start Setup</Text>
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
  // Workout Preview Styles
  workoutPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    gap: 8,
  },
  workoutPreviewTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutPreviewText: {
    fontSize: 14,
    color: colors.lightGray,
    lineHeight: 20,
  },
  // AI Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContent: {
    alignItems: 'center',
    width: '100%',
  },
  loadingAnimation: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  loadingDot1: {
    animationDelay: '0s',
  },
  loadingDot2: {
    animationDelay: '0.2s',
  },
  loadingDot3: {
    animationDelay: '0.4s',
  },
  loadingStep: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 50,
  },
  loadingProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.darkGray,
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  loadingProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  loadingStat: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    minWidth: 80,
  },
  loadingStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  loadingStatLabel: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Input Container Styles
  inputContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  // Schedule Container Styles
  scheduleContainer: {
    gap: 24,
  },
  daySelectionContainer: {
    gap: 16,
  },
  daySelectionLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  dayButton: {
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: colors.lightGray,
    fontWeight: '500',
  },
  selectedDayButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Helper Text
  helperText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  // Complete Step Styles
  readyContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  readyMessage: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  completeSummaryCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  completeSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  completeSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.lightGray,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  finalMessage: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  finalMessageText: {
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Success Animation Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successAnimation: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 26,
  },
  successStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  successStat: {
    alignItems: 'center',
    flex: 1,
  },
  successStatNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  successStatLabel: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
  },
  // Check Program Styles
  checkProgramContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  programReadyCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  programReadyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  programReadyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  programReadySubtitle: {
    fontSize: 20,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  programReadyDescription: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  checkProgramButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  checkProgramButtonText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  viewLaterButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  viewLaterButtonText: {
    fontSize: 16,
    color: colors.lightGray,
    fontWeight: '500',
  },
  // Program View Styles
  backText: {
    fontSize: 16,
    color: colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  inlineProgram: {
    paddingVertical: 20,
  },
  inlineProgramName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  inlineProgramDescription: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  workoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  exerciseName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
  },
  exerciseDetails: {
    fontSize: 12,
    color: colors.primary,
  },
  finishButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  finishButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
  },
});