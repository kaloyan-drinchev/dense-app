import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';

import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { wizardResultsService, userProfileService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store.js';
import { ProgramGenerator, type WizardResponses } from '@/utils/program-generator';
import { SubscriptionScreen } from '@/components/SubscriptionScreen';
import { AnimatePresence, MotiView } from 'moti';

// Import extracted constants and types
import {
  steps,
  trainingExperienceOptions,
  trainingDaysOptions,
  musclePriorityOptions,
  pumpWorkOptions,
  durationOptions,
  activityLevelOptions,
  genderOptions,
  goalOptions,
  motivationOptions,
  aiGenerationSteps
} from '@/constants/wizard.constants';
import { type WizardStep, type WizardPreferences, type TDEECalculation } from './types';
import { calculateTDEEAndMacros, validateTDEEInputs } from '@/utils/tdee-calculator';
import { styles } from './styles';

interface SetupWizardProps {
  onClose: () => void;
}

// Simple phase-based state machine (KISS principle)
type WizardPhase = 'wizard' | 'generating' | 'subscription' | 'complete';

export default function SetupWizard({ onClose }: SetupWizardProps) {
  const router = useRouter();
  const { user, setWizardCompleted, hasCompletedWizard, setWizardGenerating, isWizardGenerating } = useAuthStore();
  const { setSubscriptionStatus } = useSubscriptionStore();

  // SINGLE SOURCE OF TRUTH: One phase state replaces 8+ boolean flags
  // Initialize phase based on whether we're already generating (handles remounts)
  const [phase, setPhase] = useState<WizardPhase>(isWizardGenerating ? 'generating' : 'wizard');
  
  // Wizard step state with direction tracking for animations
  const [[currentStep, direction], setStepAndDirection] = useState<[number, number]>([0, 1]);
  const [validationError, setValidationError] = useState('');
  const [scrollKey, setScrollKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  
  // Generation state
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCheckProgramButton, setShowCheckProgramButton] = useState(false);
  const [generatedProgramData, setGeneratedProgramData] = useState<any>(null);
  const [isNavigatingToProgram, setIsNavigatingToProgram] = useState(false);
  const [showProgramView, setShowProgramView] = useState(false);
  
  // SIMPLE: Check wizard results ONCE on mount - no complex dependencies
  useEffect(() => {
    const initializePhase = async () => {
      // If we're already generating (from global store), don't reset phase
      if (isWizardGenerating) {
        console.log('🔄 Wizard: Resuming generation phase after remount');
        setPhase('generating');
        // Set a visual indicator that we are waiting for the background process
        setGenerationStep('Finalizing your program...');
        
        // Smooth "resume" animation from 0 to 90% instead of jumping
        // This makes it feel like it's processing rather than stuck
        const animateResume = async () => {
          const steps = 60; // 60 steps
          const duration = 2000; // 2 seconds
          const stepTime = duration / steps;
          
          for (let i = 0; i <= steps; i++) {
            // Check if we're still in generating phase (safety check)
            // Note: We can't easily check isMounted here without ref, but phase check helps
            // Ease-out curve: starts fast, slows down
            const ratio = i / steps;
            const progress = 0.9 * (1 - Math.pow(1 - ratio, 2));
            setGenerationProgress(progress);
            await new Promise(resolve => setTimeout(resolve, stepTime));
          }
        };
        
        // Start animation (fire-and-forget is intentional for background animation)
        animateResume().catch(() => {
          // Silently ignore errors (e.g., if component unmounts during animation)
        });
        return;
      }

      // Don't check if wizard is already completed
      if (hasCompletedWizard) {
        setPhase('complete');
        return;
      }
      
      // Don't check if no user yet
      if (!user?.id) {
        setPhase('wizard');
        return;
      }
      
      // Check if wizard results exist (program already generated)
      try {
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        if (wizardResults?.generatedSplit) {
          // Program exists but wizard not completed = subscription phase
          const programData = typeof wizardResults.generatedSplit === 'string'
            ? JSON.parse(wizardResults.generatedSplit)
            : wizardResults.generatedSplit;
          setGeneratedProgramData(programData);
          setPhase('subscription');
          console.log('✅ Found existing program, showing subscription screen');
        } else {
          // No program yet
          if (isWizardGenerating) {
            // Generation in progress - stay in generating phase
            setPhase('generating');
            console.log('✅ Generation in progress, showing generation screen');
          } else {
            // No generation, show wizard
            setPhase('wizard');
            console.log('✅ No existing program, showing wizard');
          }
        }
      } catch (error) {
        console.error('❌ Error checking wizard results:', error);
        // Default to wizard on error (unless generating)
        setPhase(isWizardGenerating ? 'generating' : 'wizard');
      }
    };
    
    initializePhase();
  }, []); // Run ONCE on mount - no dependencies to cause re-runs
  
  // Watch for global generation flag changes (handles background completion)
  useEffect(() => {
    const checkCompletion = async () => {
      // If global generation turned off, but we are still in 'generating' phase locally
      if (!isWizardGenerating && phase === 'generating') {
        console.log('🔄 Wizard: Global generation finished, checking for results...');
        
        let currentUserId = user?.id;
        
        // Polling for User ID
        if (!currentUserId) {
          console.log('⚠️ Wizard: User ID missing during completion check, polling...');
          let userRetries = 0;
          const maxUserRetries = 40; // 20 seconds
          
          while (!currentUserId && userRetries < maxUserRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.id) {
              currentUserId = currentUser.id;
              console.log('✅ Wizard: Found user ID after polling');
              break;
            }
            userRetries++;
            if (userRetries % 5 === 0) console.log(`⏳ Wizard: Waiting for user ID... (${userRetries}/${maxUserRetries})`);
          }
          
          if (!currentUserId) {
            console.error('❌ Wizard: Timed out waiting for user ID');
            setPhase('wizard');
            return;
          }
        }

        try {
          // Give DB a moment to settle
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let wizardResults = null;
          let resultRetries = 0;
          const maxResultRetries = 40; // 20 seconds
          
          console.log(`🔄 Wizard: Polling for results for user ${currentUserId}...`);
          
          while (!wizardResults && resultRetries < maxResultRetries) {
            try {
              const results = await wizardResultsService.getByUserId(currentUserId);
              if (results?.generatedSplit) {
                wizardResults = results;
                break;
              }
            } catch (e) {
              // Ignore errors during polling (e.g. 404 or connection issues)
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            resultRetries++;
            if (resultRetries % 2 === 0) console.log(`⏳ Wizard: Waiting for results... (${resultRetries}/${maxResultRetries})`);
          }

          if (wizardResults?.generatedSplit) {
            console.log('✅ Wizard: Found results after background generation');
            const programData = typeof wizardResults.generatedSplit === 'string'
              ? JSON.parse(wizardResults.generatedSplit)
              : wizardResults.generatedSplit;
            setGeneratedProgramData(programData);
            setPhase('subscription');
            setStepAndDirection([0, 0]);
          } else {
            console.log('❌ Wizard: Generation finished but no results found after polling');
            setPhase('wizard'); // Fallback to start
            Alert.alert('Error', 'Program generation failed. Please try again.');
          }
        } catch (error) {
          console.error('❌ Error checking results after generation:', error);
          setPhase('wizard');
        }
      }
    };
    
    checkCompletion();
  }, [isWizardGenerating, phase, user?.id]);
  
  // Safety check: ensure currentStep is valid when component mounts or steps change
  useEffect(() => {
    if (steps.length === 0) {
      console.warn('⚠️ Steps array is empty');
      return;
    }
    
    if (currentStep >= steps.length) {
      console.warn('⚠️ currentStep out of bounds, resetting to 0. currentStep:', currentStep, 'steps.length:', steps.length);
      setStepAndDirection([0, 0]);
    } else if (currentStep < 0) {
      console.warn('⚠️ currentStep is negative, resetting to 0. currentStep:', currentStep);
      setStepAndDirection([0, 0]);
    }
  }, [currentStep, steps.length]);
  
  const [preferences, setPreferences] = useState<WizardPreferences>({
    // Step 1: Motivation
    motivation: [],
    
    // Step 2: Name
    name: '',

    // Step 3: Current Strength - Default to moderate beginner weights
    // squatKg: '60',
    // benchKg: '50',
    // deadliftKg: '70',
    
    // Step 4: Training Experience - Default to intermediate
    trainingExperience: '6_18_months',
    
    // Step 5: TDEE Calculation - Default values
    age: '',
    gender: '',
    weight: '',
    height: '',
    activityLevel: '',
    goal: '',
    
    // Step 6: Weekly Schedule - Default to 4 days with common schedule
    trainingDaysPerWeek: 4,
    preferredTrainingDays: ['monday', 'tuesday', 'thursday', 'friday'],
    
    // Step 7: Muscle Priorities - Default to popular chest and back focus
    musclePriorities: ['chest', 'back'],
    
    // Step 8: Pump Work - Default to moderate preference
    pumpWorkPreference: 'maybe_sometimes',
    
    // Step 9: Recovery - Default to normal recovery
    recoveryProfile: 'need_more_rest',
    
    // Step 10: Duration - Default to 12 weeks
    programDurationWeeks: 12
  });

  const validateCurrentStep = (): boolean => {
    setValidationError('');
    
    // Safety check: ensure currentStep is within valid bounds
    if (currentStep < 0 || currentStep >= steps.length) {
      console.error('❌ currentStep out of bounds:', currentStep, 'steps.length:', steps.length);
      setStepAndDirection([0, 0]);
      return false;
    }
    
    const step = steps[currentStep];
    if (!step) {
      console.error('❌ Step is undefined at index:', currentStep);
      setStepAndDirection([0, 0]);
      return false;
    }

    switch (step.id) {
      case 'welcome':
        return true;

      case 'motivation':
        if (preferences.motivation.length === 0) {
          setValidationError('Please select at least one motivation');
          return false;
        }
        return true;

      case 'name':
        if (!preferences.name.trim()) {
          setValidationError('Please enter your name');
          return false;
        }
        if (preferences.name.length > 25) {
          setValidationError('Name must be 25 characters or less');
          return false;
        }
        return true;

      // case 'current-strength':
      //   return true; // Optional fields

      case 'training-experience':
        if (!preferences.trainingExperience) {
          setValidationError('Please select your training experience');
          return false;
        }
        return true;

      case 'tdee-calculation':
        const errors: Record<string, boolean> = {};
        let hasError = false;
        
        // Validate each field and track errors
        const ageValue = preferences.age ? parseInt(preferences.age) : undefined;
        if (!ageValue || ageValue < 16 || ageValue > 100) {
          errors.age = true;
          hasError = true;
        }
        
        if (!preferences.gender) {
          errors.gender = true;
          hasError = true;
        }
        
        const weightValue = preferences.weight ? parseFloat(preferences.weight) : undefined;
        if (!weightValue || weightValue < 30 || weightValue > 300) {
          errors.weight = true;
          hasError = true;
        }
        
        const heightValue = preferences.height ? parseFloat(preferences.height) : undefined;
        if (!heightValue || heightValue < 120 || heightValue > 250) {
          errors.height = true;
          hasError = true;
        }
        
        if (!preferences.goal) {
          errors.goal = true;
          hasError = true;
        }
        
        if (!preferences.trainingDaysPerWeek) {
          errors.trainingDays = true;
          hasError = true;
        }
        
        // Update field errors state
        setFieldErrors(errors);
        
        // If there are errors, show the first error message
        if (hasError) {
          const tdeeErrors = validateTDEEInputs({
            age: ageValue,
            gender: preferences.gender as 'male' | 'female',
            weight: weightValue,
            height: heightValue,
            activityLevel: preferences.trainingDaysPerWeek ? getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek) : undefined,
            goal: preferences.goal
          });
          
          if (!preferences.trainingDaysPerWeek) {
            setValidationError('Please select how many days you can train per week');
          } else if (tdeeErrors.length > 0) {
            setValidationError(tdeeErrors[0]);
          }
          return false;
        }
        
        // Clear field errors if validation passes
        setFieldErrors({});
        return true;

      case 'muscle-priorities':
        if (preferences.musclePriorities.length === 0) {
          setValidationError('Please select at least 1 muscle group');
          return false;
        }
        if (preferences.musclePriorities.length > 3) {
          // Auto-fix by keeping only first 3 selections
          const fixedPriorities = preferences.musclePriorities.slice(0, 3);
          handleInputChange('musclePriorities', fixedPriorities);
          setValidationError('Maximum 3 muscle groups allowed - automatically adjusted');
          return false;
        }
        return true;

      case 'pump-work':
        if (!preferences.pumpWorkPreference) {
          setValidationError('Please select your pump work preference');
          return false;
        }
        return true;



      case 'program-duration':
        if (!preferences.programDurationWeeks) {
          setValidationError('Please select program duration');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const paginate = (newDirection: number) => {
    const newStep = currentStep + newDirection;
    if (newStep >= 0 && newStep < steps.length) {
      setStepAndDirection([newStep, newDirection]);
      setValidationError(''); // Clear errors when navigating
      setScrollKey(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setScrollKey(prev => prev + 1);
      return;
    }

    if (currentStep < steps.length - 1) {
      paginate(1); // Move forward
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      console.log('🚀 Starting program generation...');
      // Mark global state as generating immediately to prevent premature completion checks
      useAuthStore.getState().setWizardGenerating(true);
      
      // Clear any previous program data and reset generation state
      setGeneratedProgramData(null);
      setPhase('generating'); // Simple: set phase to generating
      setGenerationStep('Initializing...');
      setGenerationProgress(0);
      
      // Create user if not exists (with name from wizard)
      let currentUser = user;
      if (!currentUser || !currentUser.id) {
        console.log('👤 Creating new user...');
        const { setupNewUser } = useAuthStore.getState();
        const result = await setupNewUser(preferences.name);
        
        if (!result.success) {
          console.error('❌ Failed to create user:', result.error);
          useAuthStore.getState().setWizardGenerating(false);
          Alert.alert('Error', 'Failed to create user. Please try again.');
          setPhase('wizard'); // Go back to wizard on error
          return;
        }
        
        // Get the newly created user
        currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          console.error('❌ User creation failed: No user returned');
          useAuthStore.getState().setWizardGenerating(false);
          Alert.alert('Error', 'User creation failed. Please restart the app.');
          setPhase('wizard'); // Go back to wizard on error
          return;
        }
        console.log('✅ User created:', currentUser.id);
      }
      
      // Simulate AI generation process
      console.log('⚡ Starting AI generation simulation...');
      await simulateAIGeneration();
      console.log('✅ AI generation simulation completed');
      
      // Generate the actual program
      const wizardResponses: WizardResponses = {
        trainingExperience: preferences.trainingExperience as any,
        bodyFatLevel: 'athletic_15_18' as any, // Default value since we now use TDEE calculation
        trainingDaysPerWeek: preferences.trainingDaysPerWeek,
        musclePriorities: preferences.musclePriorities,
        pumpWorkPreference: preferences.pumpWorkPreference as any,
        recoveryProfile: preferences.recoveryProfile as any,
        programDurationWeeks: preferences.programDurationWeeks,
        preferredTrainingDays: preferences.preferredTrainingDays
      };

      const generatedProgram = ProgramGenerator.generateProgram(wizardResponses);
      
      // Save to database
      if (currentUser && currentUser.id) {
        // Calculate and store TDEE data
        let tdeeData = null;
        try {
          if (preferences.age && preferences.gender && preferences.weight && preferences.height && preferences.trainingDaysPerWeek && preferences.goal) {
            const activityLevel = getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek);
            tdeeData = calculateTDEEAndMacros({
              age: parseInt(preferences.age),
              gender: preferences.gender as 'male' | 'female',
              weight: parseFloat(preferences.weight),
              height: parseFloat(preferences.height),
              activityLevel: activityLevel,
              goal: preferences.goal
            });
          }
        } catch (error) {
          console.warn('Failed to calculate TDEE:', error);
        }

        console.log('💾 Saving wizard results to database for user:', currentUser.id);
        
        try {
          const savedResults = await wizardResultsService.create({
            userId: currentUser.id,
            motivation: JSON.stringify(preferences.motivation),
            trainingExperience: preferences.trainingExperience,
            bodyFatLevel: 'athletic_15_18', // Default value since we now use TDEE calculation
            trainingDaysPerWeek: preferences.trainingDaysPerWeek,
            preferredTrainingDays: JSON.stringify(preferences.preferredTrainingDays),
            musclePriorities: JSON.stringify(preferences.musclePriorities),
            pumpWorkPreference: preferences.pumpWorkPreference,
            recoveryProfile: preferences.recoveryProfile,
            programDurationWeeks: preferences.programDurationWeeks,
            generatedSplit: JSON.stringify(generatedProgram),
            suggestedPrograms: JSON.stringify([generatedProgram.programName]),
            // squatKg: preferences.squatKg ? parseFloat(preferences.squatKg) : null,
            // benchKg: preferences.benchKg ? parseFloat(preferences.benchKg) : null,
            // deadliftKg: preferences.deadliftKg ? parseFloat(preferences.deadliftKg) : null,
            // // Store TDEE data for nutrition tracking
            tdeeData: tdeeData ? JSON.stringify(tdeeData) : null,
            age: preferences.age ? parseInt(preferences.age) : null,
            gender: preferences.gender || null,
            weight: preferences.weight ? parseFloat(preferences.weight) : null,
            height: preferences.height ? parseFloat(preferences.height) : null,
            activityLevel: preferences.trainingDaysPerWeek ? getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek) : null,
            goal: preferences.goal || null,
          });
          
          console.log('✅ Wizard results saved successfully:', savedResults?.id);
          
          // Verify the save was successful by checking if we can retrieve it
          const verifyResults = await wizardResultsService.getByUserId(currentUser.id);
          if (!verifyResults) {
            throw new Error('Failed to verify wizard results were saved - database may be empty or connection issue');
          }
          console.log('✅ Verified wizard results exist in database');
          
        } catch (dbError: any) {
          console.error('❌ Database error saving wizard results:', dbError);
          const errorMessage = dbError?.message || 'Unknown database error';
          
          // Check if it's a connection/auth issue
          if (errorMessage.includes('JWT') || errorMessage.includes('auth') || errorMessage.includes('permission')) {
            throw new Error('Database authentication failed. Please check your database connection.');
          }
          
          // Check if it's a foreign key constraint issue
          if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
            throw new Error('Database constraint error. The user profile may not exist. Please try creating a new profile.');
          }
          
          // Generic database error
          throw new Error(`Failed to save program to database: ${errorMessage}`);
        }

        // TDEE data is now being saved to the database for the nutrition tab
        if (tdeeData) {
          console.log('✅ TDEE calculation completed and saved to database');
        }
        
        // DO NOT mark wizard as completed here - wait until subscription is handled
        // Marking it here triggers app navigator which checks subscription status
        // and skips the subscription screen if it finds an active trial
        console.log('✅ Wizard results saved (wizard will be marked complete after subscription)');
      } else {
        console.error('❌ No user or user.id available:', { currentUser, userId: currentUser?.id });
        throw new Error('User not authenticated or missing ID');
      }
      
      // Store the generated program data FIRST
      setGeneratedProgramData(generatedProgram);
      
      console.log('🚀 Generated program:', generatedProgram.programName);
      console.log('✅ Program generation completed successfully');
      
      // CRITICAL: Set phase to subscription IMMEDIATELY and synchronously
      // React will batch these updates, but checking generatedProgramData in render ensures
      // subscription screen shows even if phase hasn't updated yet
      setPhase('subscription');
      setStepAndDirection([0, 0]); // Reset step to prevent showing wizard steps
      
      // Generation is done
      useAuthStore.getState().setWizardGenerating(false);
      
      console.log('✅ Phase set to subscription, subscription screen should show now');

    } catch (error: any) {
      console.error('❌ Failed to save wizard results:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      useAuthStore.getState().setWizardGenerating(false);
      setPhase('wizard'); // Go back to wizard on error
      
      // Show user-friendly error message
      const errorMessage = error?.message || 'Unknown error occurred';
      setGenerationStep(`❌ Error: ${errorMessage}`);
      
      // Alert the user with actionable information
      Alert.alert(
        'Program Generation Failed',
        errorMessage + '\n\nPlease check your internet connection and try again. If the problem persists, try restarting the app.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset generation state but keep user on wizard
              // DON'T reset currentStep - keep user on the last step they were on
              setGenerationStep('');
              setGenerationProgress(0);
            }
          }
        ]
      );
    }
  };

  const handleSubscriptionComplete = async () => {
    console.log('✅ User subscribed');
    setWizardCompleted();
    setPhase('complete');
    
    // Refresh subscription status
    const { refreshSubscriptionStatus } = useSubscriptionStore.getState();
    await refreshSubscriptionStatus();
    
    // Navigate to home
    router.replace('/(tabs)' as any);
    onClose();
  };

  const handleSubscriptionSkip = async () => {
    console.log('✅ User skipped subscription');
    setWizardCompleted();
    setPhase('complete');
    
    // Navigate to home
    router.replace('/(tabs)' as any);
    onClose();
  };

  const simulateAIGeneration = async () => {
    const totalSteps = aiGenerationSteps.length;
    
    for (let i = 0; i < aiGenerationSteps.length; i++) {
      const step = aiGenerationSteps[i];
      setGenerationStep(step.text);
      setGenerationProgress((i + 1) / totalSteps);
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }
  };

  const handleInputChange = (field: keyof WizardPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationError('');
  };

  // Helper function to map training days to activity level
  const getActivityLevelFromTrainingDays = (trainingDays: number): string => {
    if (trainingDays <= 3) return 'lightly_active';    // 1-3 days = Lightly Active
    if (trainingDays <= 5) return 'moderately_active'; // 4-5 days = Moderately Active
    return 'very_active';                               // 6-7 days = Very Active
  };

  const toggleMotivation = (motivationId: string) => {
    const current = preferences.motivation;
    const isSelected = current.includes(motivationId);
    
    if (isSelected) {
      handleInputChange('motivation', current.filter(m => m !== motivationId));
    } else {
      handleInputChange('motivation', [...current, motivationId]);
    }
  };

  const toggleMusclePriority = (muscle: string) => {
    const current = preferences.musclePriorities;
    const isSelected = current.includes(muscle);
    
    if (isSelected) {
      // Always allow deselection
      handleInputChange('musclePriorities', current.filter(m => m !== muscle));
    } else {
      // Only allow selection if under limit
      if (current.length < 3) {
        handleInputChange('musclePriorities', [...current, muscle]);
      } else {
        // Provide haptic feedback when limit reached
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
  };

  const renderStepContent = () => {
    // Safety check: ensure currentStep is within valid bounds
    if (currentStep < 0 || currentStep >= steps.length) {
      console.error('❌ renderStepContent: currentStep out of bounds:', currentStep, 'steps.length:', steps.length);
      return <Text style={styles.stepSubtitle}>Loading...</Text>;
    }
    
    const step = steps[currentStep];
    if (!step) {
      console.error('❌ renderStepContent: Step is undefined at index:', currentStep);
      return <Text style={styles.stepSubtitle}>Loading...</Text>;
    }

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Answer 9 quick questions and we'll create the perfect {preferences.programDurationWeeks || 12}-week program tailored to your goals and preferences.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="target" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Muscle-focused programs</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="trending-up" size={20} color={colors.secondary} />
                <Text style={styles.featureText}>{preferences.programDurationWeeks || 12}-week structured plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="zap" size={20} color={colors.success} />
                <Text style={styles.featureText}>Personalized recommendations</Text>
              </View>
            </View>
          </View>
        );

      case 'motivation':
        return (
          <View style={styles.optionsContainer}>
            {motivationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.motivation.includes(option.id) && styles.selectedOption,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  toggleMotivation(option.id);
                }}
                activeOpacity={1}
              >
                <Text style={styles.motivationEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.optionText,
                    preferences.motivation.includes(option.id) && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'name':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              value={preferences.name}
              onChangeText={(value: string) => handleInputChange('name', value)}
              placeholder="Enter your name"
              placeholderTextColor={colors.lightGray}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={25}
            />
          </View>
        );

      // case 'current-strength':
      //   return (
      //     <View style={styles.inputContainer}>
      //       <View style={styles.inputGroup}>
      //         <Text style={styles.inputLabel}>Squat (kg)</Text>
      //         <TextInput
      //           style={styles.textInput}
      //           placeholder="80 (max 300kg)"
      //           placeholderTextColor={colors.lightGray}
      //           value={preferences.squatKg}
      //           onChangeText={(value) => {
      //             const numValue = parseFloat(value) || 0;
      //             const limitedValue = Math.max(0, Math.min(300, numValue));
      //             handleInputChange('squatKg', limitedValue.toString());
      //           }}
      //           keyboardType="numeric"
      //         />
      //       </View>
      //       <View style={styles.inputGroup}>
      //         <Text style={styles.inputLabel}>Bench Press (kg)</Text>
      //         <TextInput
      //           style={styles.textInput}
      //           placeholder="60 (max 300kg)"
      //           placeholderTextColor={colors.lightGray}
      //           value={preferences.benchKg}
      //           onChangeText={(value) => {
      //             const numValue = parseFloat(value) || 0;
      //             const limitedValue = Math.max(0, Math.min(300, numValue));
      //             handleInputChange('benchKg', limitedValue.toString());
      //           }}
      //           keyboardType="numeric"
      //         />
      //       </View>
      //       <View style={styles.inputGroup}>
      //         <Text style={styles.inputLabel}>Deadlift (kg)</Text>
      //         <TextInput
      //           style={styles.textInput}
      //           placeholder="100 (max 300kg)"
      //           placeholderTextColor={colors.lightGray}
      //           value={preferences.deadliftKg}
      //           onChangeText={(value) => {
      //             const numValue = parseFloat(value) || 0;
      //             const limitedValue = Math.max(0, Math.min(300, numValue));
      //             handleInputChange('deadliftKg', limitedValue.toString());
      //           }}
      //           keyboardType="numeric"
      //         />
      //       </View>
      //     </View>
      //   );

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
                onPress={() => handleInputChange('trainingExperience', option.id)}
                activeOpacity={1}
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

      case 'tdee-calculation':
        return (
          <View style={styles.inputContainer}>
            {/* Age and Gender Row */}
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 0.6 }}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.age && { borderWidth: 1.5, borderColor: colors.validationWarning }
                  ]}
                  value={preferences.age}
                  onChangeText={(value) => {
                    // Filter to only allow numbers (no range validation while typing)
                    const numericValue = value.replace(/[^0-9]/g, '');
                    handleInputChange('age', numericValue);
                    // Clear error when user starts typing
                    if (fieldErrors.age) {
                      setFieldErrors(prev => ({ ...prev, age: false }));
                    }
                  }}
                  placeholder="e.g 25"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={{ 
                  flexDirection: 'row', 
                  gap: 8,
                  ...(fieldErrors.gender && { 
                    borderWidth: 1.5, 
                    borderColor: colors.validationWarning,
                    borderRadius: 8,
                    padding: 4 
                  })
                }}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        { flex: 1, marginBottom: 0 },
                        preferences.gender === option.id && styles.selectedOption,
                      ]}
                      onPress={() => {
                        handleInputChange('gender', option.id);
                        // Clear error when user selects
                        if (fieldErrors.gender) {
                          setFieldErrors(prev => ({ ...prev, gender: false }));
                        }
                      }}
                      activeOpacity={1}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          preferences.gender === option.id && styles.selectedOptionText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Weight and Height Row */}
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.weight && { borderWidth: 1.5, borderColor: colors.validationWarning }
                  ]}
                  value={preferences.weight}
                  onChangeText={(value) => {
                    // Filter to allow numbers and decimal point (no range validation while typing)
                    const filteredValue = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filteredValue.split('.');
                    const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                    handleInputChange('weight', cleanValue);
                    // Clear error when user starts typing
                    if (fieldErrors.weight) {
                      setFieldErrors(prev => ({ ...prev, weight: false }));
                    }
                  }}
                  placeholder="e.g 75"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.height && { borderWidth: 1.5, borderColor: colors.validationWarning }
                  ]}
                  value={preferences.height}
                  onChangeText={(value) => {
                    // Filter to allow numbers and decimal point (no range validation while typing)
                    const filteredValue = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filteredValue.split('.');
                    const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                    handleInputChange('height', cleanValue);
                    // Clear error when user starts typing
                    if (fieldErrors.height) {
                      setFieldErrors(prev => ({ ...prev, height: false }));
                    }
                  }}
                  placeholder="e.g 170"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Goal */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Goal</Text>
              <View style={[
                styles.optionsContainer,
                fieldErrors.goal && { 
                  borderWidth: 1.5, 
                  borderColor: colors.validationWarning,
                  borderRadius: 8,
                  padding: 8 
                }
              ]}>
                {goalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      preferences.goal === option.id && styles.selectedOption,
                    ]}
                    onPress={() => {
                      handleInputChange('goal', option.id);
                      // Clear error when user selects
                      if (fieldErrors.goal) {
                        setFieldErrors(prev => ({ ...prev, goal: false }));
                      }
                    }}
                    activeOpacity={1}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        preferences.goal === option.id && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Training Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Training Days per Week</Text>
              <View style={[
                styles.trainingDaysContainer,
                fieldErrors.trainingDays && { 
                  borderWidth: 1.5, 
                  borderColor: colors.validationWarning,
                  borderRadius: 8,
                  padding: 8 
                }
              ]}>
                {trainingDaysOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.trainingDayOption,
                      preferences.trainingDaysPerWeek === option.id && styles.selectedTrainingDay,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      handleInputChange('trainingDaysPerWeek', option.id);
                      // Clear error when user selects
                      if (fieldErrors.trainingDays) {
                        setFieldErrors(prev => ({ ...prev, trainingDays: false }));
                      }
                    }}
                    activeOpacity={1}
                  >
                    <View style={styles.trainingDayContent}>
                      <Text
                        style={[
                          styles.trainingDayLabel,
                          preferences.trainingDaysPerWeek === option.id && styles.selectedTrainingDayLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.trainingDayNickname,
                          preferences.trainingDaysPerWeek === option.id && styles.selectedTrainingDayNickname,
                        ]}
                      >
                        {option.nickname}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TDEE Preview */}
            {preferences.age && preferences.gender && preferences.weight && preferences.height && preferences.trainingDaysPerWeek && preferences.goal && (
              <View style={{ 
                backgroundColor: colors.darkGray, 
                borderRadius: 12, 
                padding: 16, 
                marginTop: 20,
                borderWidth: 1,
                borderColor: colors.primary 
              }}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                  📊 Your Daily Nutrition Targets
                </Text>
                {(() => {
                  try {
                    const activityLevel = getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek);
                    const tdeeResult = calculateTDEEAndMacros({
                      age: parseInt(preferences.age),
                      gender: preferences.gender as 'male' | 'female',
                      weight: parseFloat(preferences.weight),
                      height: parseFloat(preferences.height),
                      activityLevel: activityLevel,
                      goal: preferences.goal
                    });
                    
                    return (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold' }}>
                            {tdeeResult.adjustedCalories}
                          </Text>
                          <Text style={{ color: colors.lightGray, fontSize: 12 }}>Calories</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold' }}>
                            {tdeeResult.protein}g
                          </Text>
                          <Text style={{ color: colors.lightGray, fontSize: 12 }}>Protein</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold' }}>
                            {tdeeResult.carbs}g
                          </Text>
                          <Text style={{ color: colors.lightGray, fontSize: 12 }}>Carbs</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: colors.white, fontSize: 18, fontWeight: 'bold' }}>
                            {tdeeResult.fat}g
                          </Text>
                          <Text style={{ color: colors.lightGray, fontSize: 12 }}>Fat</Text>
                        </View>
                      </View>
                    );
                  } catch (error) {
                    return (
                      <Text style={{ color: colors.lightGray, textAlign: 'center' }}>
                        Complete all fields to see your targets
                      </Text>
                    );
                  }
                })()}
              </View>
            )}
          </View>
        );



      case 'muscle-priorities':
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.priorityHint}>
              Choose up to 3 muscle groups to prioritize ({preferences.musclePriorities.length}/3)
            </Text>
            {musclePriorityOptions.map((option) => {
              const isSelected = preferences.musclePriorities.includes(option.id);
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => toggleMusclePriority(option.id)}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
                onPress={() => handleInputChange('pumpWorkPreference', option.id)}
                activeOpacity={1}
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
                onPress={() => handleInputChange('programDurationWeeks', option.id)}
                activeOpacity={1}
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

      case 'review-preferences':
        return (
          <ScrollView style={styles.completeScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.completeContent}>
              
              <View style={styles.preferencesContainer}>
                {/* Motivation Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>✨</Text>
                    <Text style={styles.cardTitle}>What Brings You to DENSE</Text>
                  </View>
                  <View style={styles.motivationTags}>
                    {preferences.motivation.map((motivationId) => {
                      const motivation = motivationOptions.find(o => o.id === motivationId);
                      return motivation ? (
                        <View key={motivationId} style={styles.motivationTag}>
                          <Text style={styles.motivationTagEmoji}>{motivation.emoji}</Text>
                          <Text style={styles.motivationTagText}>{motivation.label}</Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>

                {/* Training Info Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>🏋️</Text>
                    <Text style={styles.cardTitle}>Training Schedule</Text>
                  </View>
                  <View style={styles.trainingInfoGrid}>
                    <View style={styles.trainingInfoItem}>
                      <Text style={styles.trainingInfoNumber}>
                        {preferences.trainingDaysPerWeek}
                      </Text>
                      <Text style={styles.trainingInfoLabel}>Days/Week</Text>
                      <Text style={styles.trainingInfoNickname}>
                        {trainingDaysOptions.find(o => o.id === preferences.trainingDaysPerWeek)?.nickname}
                      </Text>
                    </View>
                    <View style={styles.trainingInfoItem}>
                      <Text style={styles.trainingInfoNumber}>
                        {preferences.programDurationWeeks}
                      </Text>
                      <Text style={styles.trainingInfoLabel}>Weeks</Text>
                      <Text style={styles.trainingInfoNickname}>Program</Text>
                    </View>
                  </View>
                </View>

                {/* TDEE & Nutrition Targets Card */}
                {preferences.age && preferences.gender && preferences.weight && preferences.height && preferences.trainingDaysPerWeek && preferences.goal && (
                  <View style={styles.preferenceCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>🔥</Text>
                      <Text style={styles.cardTitle}>Daily Nutrition Targets</Text>
                    </View>
                    {(() => {
                      try {
                        const activityLevel = getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek);
                        const tdeeResult = calculateTDEEAndMacros({
                          age: parseInt(preferences.age),
                          gender: preferences.gender as 'male' | 'female',
                          weight: parseFloat(preferences.weight),
                          height: parseFloat(preferences.height),
                          activityLevel: activityLevel,
                          goal: preferences.goal
                        });
                        
                        return (
                          <View style={styles.tdeeCardContent}>
                            {/* Main Calorie Target */}
                            <View style={styles.calorieTargetSection}>
                              <View style={styles.calorieTargetMain}>
                                <Text style={styles.calorieTargetNumber}>
                                  {tdeeResult.adjustedCalories}
                                </Text>
                                <Text style={styles.calorieTargetLabel}>Daily Calories</Text>
                              </View>
                              <View style={styles.tdeeBreakdown}>
                                <View style={styles.tdeeRow}>
                                  <Text style={styles.tdeeLabel}>BMR (Base):</Text>
                                  <Text style={styles.tdeeValue}>{tdeeResult.bmr} cal</Text>
                                </View>
                                <View style={styles.tdeeRow}>
                                  <Text style={styles.tdeeLabel}>TDEE (Active):</Text>
                                  <Text style={styles.tdeeValue}>{tdeeResult.tdee} cal</Text>
                                </View>
                              </View>
                            </View>

                            {/* Macros Grid */}
                            <View style={styles.macrosGrid}>
                              <View style={styles.macroItem}>
                                <Text style={styles.macroIcon}>🥩</Text>
                                <Text style={styles.macroValue}>{tdeeResult.protein}g</Text>
                                <Text style={styles.macroLabel}>Protein</Text>
                                <Text style={styles.macroPercentage}>
                                  {Math.round((tdeeResult.protein * 4 / tdeeResult.adjustedCalories) * 100)}%
                                </Text>
                              </View>
                              <View style={styles.macroItem}>
                                <Text style={styles.macroIcon}>🍞</Text>
                                <Text style={styles.macroValue}>{tdeeResult.carbs}g</Text>
                                <Text style={styles.macroLabel}>Carbs</Text>
                                <Text style={styles.macroPercentage}>
                                  {Math.round((tdeeResult.carbs * 4 / tdeeResult.adjustedCalories) * 100)}%
                                </Text>
                              </View>
                              <View style={styles.macroItem}>
                                <Text style={styles.macroIcon}>🥑</Text>
                                <Text style={styles.macroValue}>{tdeeResult.fat}g</Text>
                                <Text style={styles.macroLabel}>Fats</Text>
                                <Text style={styles.macroPercentage}>
                                  {Math.round((tdeeResult.fat * 9 / tdeeResult.adjustedCalories) * 100)}%
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      } catch (error) {
                        return (
                          <View style={styles.tdeeError}>
                            <Text style={styles.tdeeErrorText}>
                              Unable to calculate nutrition targets. Please check your inputs.
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}

                {/* Goal Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>🎯</Text>
                    <Text style={styles.cardTitle}>Your Goal</Text>
                  </View>
                  <View style={styles.goalDisplay}>
                    <Text style={styles.goalText}>
                      {preferences.goal?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Experience & Focus Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>💪</Text>
                    <Text style={styles.cardTitle}>Experience & Focus</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.experienceRow}>
                      <Text style={styles.experienceLabel}>Level:</Text>
                      <Text style={styles.experienceValue}>
                        {trainingExperienceOptions.find(o => o.id === preferences.trainingExperience)?.label}
                      </Text>
                    </View>
                    <View style={styles.focusSection}>
                      <Text style={styles.focusLabel}>Priority Muscles:</Text>
                      <View style={styles.muscleTagsContainer}>
                        {preferences.musclePriorities.map((priority) => {
                          const muscle = musclePriorityOptions.find(o => o.id === priority);
                          return muscle ? (
                            <View key={priority} style={styles.muscleTag}>
                              <Text style={styles.muscleTagText}>{muscle.label}</Text>
                            </View>
                          ) : null;
                        })}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Body Stats Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📊</Text>
                    <Text style={styles.cardTitle}>Your Stats</Text>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.age}</Text>
                      <Text style={styles.statLabelSmall}>Years Old</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.weight}</Text>
                      <Text style={styles.statLabelSmall}>kg</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.height}</Text>
                      <Text style={styles.statLabelSmall}>cm</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {preferences.gender === 'male' ? '♂️' : '♀️'}
                      </Text>
                      <Text style={styles.statLabelSmall}>
                        {preferences.gender === 'male' ? 'Male' : 'Female'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 'complete':
        return (
          <View style={styles.completeContent}>
            <Text style={styles.finalTitle}>🚀 Ready to Transform?</Text>
            <Text style={styles.finalSubtitle}>
              Your personalized program is about to be generated based on your preferences!
            </Text>
            
            <View style={styles.finalCTA}>
              <Text style={styles.finalCTAIcon}>⚡</Text>
              <Text style={styles.finalCTAText}>
                Let's create your perfect training plan
              </Text>
            </View>
          </View>
        );

      default:
        return <Text style={styles.stepSubtitle}>Step content not found</Text>;
    }
  };

  // Show program view within wizard
  if (showProgramView && generatedProgramData) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Program</Text>
        </View>
        
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
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
          
          {/* Cloud Backup Callout */}
          <View style={styles.cloudBackupCallout}>
            <View style={styles.cloudBackupHeader}>
              <Text style={styles.cloudBackupIcon}>☁️</Text>
              <Text style={styles.cloudBackupTitle}>Protect Your Progress</Text>
            </View>
            <Text style={styles.cloudBackupDescription}>
              Want to keep your workout data safe? Setup iCloud backup in Settings → iCloud Backup to never lose your progress.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={() => {
              const { setWizardCompleted } = useAuthStore.getState();
              setWizardCompleted();
            }}
            activeOpacity={1}
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
          <View style={styles.checkProgramContent}>
            <Text style={styles.checkProgramEmoji}>🎉</Text>
            <Text style={styles.checkProgramTitle}>Program Generated!</Text>
            <Text style={styles.checkProgramSubtitle}>
              Your custom Push/Pull/Legs routine is ready
            </Text>
            
            <View style={styles.checkProgramStats}>
              <View style={styles.checkProgramStat}>
                <Text style={styles.checkProgramStatNumber}>{preferences.programDurationWeeks}</Text>
                <Text style={styles.checkProgramStatLabel}>Weeks</Text>
              </View>
              <View style={styles.checkProgramStat}>
                <Text style={styles.checkProgramStatNumber}>{preferences.trainingDaysPerWeek}</Text>
                <Text style={styles.checkProgramStatLabel}>Days/Week</Text>
              </View>
              <View style={styles.checkProgramStat}>
                <Text style={styles.checkProgramStatNumber}>{generatedProgramData?.weeklyStructure?.length || 0}</Text>
                <Text style={styles.checkProgramStatLabel}>Workouts</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.checkProgramButton}
            onPress={() => {
              console.log('🚀 Showing program view within wizard');
              setShowCheckProgramButton(false);
              setShowProgramView(true);
            }}
            activeOpacity={1}
          >
            <Text style={styles.checkProgramButtonText}>Check Your Program</Text>
            <Icon name="arrow-right" size={20} color={colors.black} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewLaterButton}
            onPress={() => {
              const { setWizardCompleted } = useAuthStore.getState();
              setWizardCompleted();
            }}
            activeOpacity={1}
          >
            <Text style={styles.viewLaterButtonText}>View Later in Programs Tab</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // SIMPLE RENDER LOGIC: Check phase in order - generating screen takes priority
  
  // Phase: Generating - check FIRST to show loading screen during generation
  // This must come before subscription check to ensure generating screen shows
  if (phase === 'generating') {
    // Show generating screen - this will display during simulateAIGeneration()
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={[styles.content, styles.contentContainer]}>
          <Text style={styles.generatingIcon}>⚡</Text>
          <Text style={styles.stepTitle}>Creating Your Custom Program</Text>
          <Text style={styles.generatingDescription}>
            We're analyzing your preferences and building a personalized {preferences.programDurationWeeks || 12}-week workout plan just for you
          </Text>
          <Text style={styles.stepSubtitle}>{generationStep || 'Initializing...'}</Text>
          
          <View style={styles.loadingProgressContainer}>
            <View style={styles.loadingProgressBar}>
              <View style={[styles.loadingProgressFill, { width: `${generationProgress * 100}%` }]} />
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Phase: Subscription - show after generation completes
  if (phase === 'subscription' && generatedProgramData) {
    return (
      <SubscriptionScreen
        onSubscribed={handleSubscriptionComplete}
        onSkip={handleSubscriptionSkip}
        showSkipOption={false}
        programPreview={generatedProgramData}
      />
    );
  }

  // Phase: Complete (shouldn't render, but just in case)
  if (phase === 'complete') {
    return null; // Component should be closed
  }

  // Phase: Wizard (default)
  // Main wizard interface  
  // Safety check: ensure currentStep is within valid bounds
  if (currentStep < 0 || currentStep >= steps.length) {
    console.error('❌ Main render: currentStep out of bounds:', currentStep, 'steps.length:', steps.length);
    // Reset to first step and return loading state
    setTimeout(() => setStepAndDirection([0, 0]), 0);
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.stepCounter}>Loading...</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.stepTitle}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  const step = steps[currentStep];
  if (!step) {
    console.error('❌ Main render: Step is undefined at index:', currentStep);
    // Reset to first step and return loading state
    setTimeout(() => setStepAndDirection([0, 0]), 0);
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.stepCounter}>Loading...</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.stepTitle}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  const progress = (currentStep + 1) / steps.length;

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Content with Moti AnimatePresence */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentStep}
            from={{
              opacity: 0,
              translateX: direction * 300, // Next (1): from right (300), Back (-1): from left (-300)
            }}
            animate={{
              opacity: 1,
              translateX: 0,
            }}
            exit={{
              opacity: 0,
              translateX: -direction * 300, // Next (1): to left (-300), Back (-1): to right (300)
            }}
            transition={{
              type: 'timing',
              duration: 300,
            }}
            style={{ flex: 1, width: '100%' }}
          >
            <ScrollView 
              key={scrollKey}
              style={styles.scrollContent} 
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={step.subtitle ? styles.stepHeader : styles.stepHeaderNoSubtitle}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.subtitle ? <Text style={styles.stepSubtitle}>{step.subtitle}</Text> : null}
                
                {/* Validation error below subtitle - always rendered to prevent layout shift */}
                <Text style={[styles.stepValidationError, { opacity: validationError ? 1 : 0 }]}>
                  {validationError || ' '}
                </Text>
              </View>

              {/* Step-specific content */}
              {renderStepContent()}
            </ScrollView>
          </MotiView>
        </AnimatePresence>
      </View>

      {/* Navigation buttons - Fixed at bottom */}
      <View style={styles.bottomNavigationContainer}>
        {currentStep > 0 ? (
          <TouchableOpacity 
            onPress={() => paginate(-1)}
            style={styles.backButton}
            activeOpacity={1}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
        
        <TouchableOpacity 
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Generate My Program! 💪' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}