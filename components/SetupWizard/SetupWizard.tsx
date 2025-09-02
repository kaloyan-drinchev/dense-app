import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { wizardResultsService, userProfileService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { ProgramGenerator, type WizardResponses } from '@/utils/program-generator';
import { SubscriptionScreen } from '@/components/SubscriptionScreen';

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

export default function SetupWizard({ onClose }: SetupWizardProps) {
  const router = useRouter();
  const { user, setWizardCompleted } = useAuthStore();
  const { setSubscriptionStatus } = useSubscriptionStore();
  

  
  const [currentStep, setCurrentStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  
  // Safety check: ensure currentStep is valid when component mounts or steps change
  useEffect(() => {
    if (steps.length === 0) {
      console.warn('⚠️ Steps array is empty');
      return;
    }
    
    if (currentStep >= steps.length) {
      console.warn('⚠️ currentStep out of bounds, resetting to 0. currentStep:', currentStep, 'steps.length:', steps.length);
      setCurrentStep(0);
    } else if (currentStep < 0) {
      console.warn('⚠️ currentStep is negative, resetting to 0. currentStep:', currentStep);
      setCurrentStep(0);
    }
  }, [currentStep, steps.length]);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCheckProgramButton, setShowCheckProgramButton] = useState(false);
  const [generatedProgramData, setGeneratedProgramData] = useState<any>(null);
  const [isNavigatingToProgram, setIsNavigatingToProgram] = useState(false);
  const [showProgramView, setShowProgramView] = useState(false);
  const [showSubscriptionScreen, setShowSubscriptionScreen] = useState(false);
  
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
      setCurrentStep(0);
      return false;
    }
    
    const step = steps[currentStep];
    if (!step) {
      console.error('❌ Step is undefined at index:', currentStep);
      setCurrentStep(0);
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
        const tdeeErrors = validateTDEEInputs({
          age: preferences.age ? parseInt(preferences.age) : undefined,
          gender: preferences.gender as 'male' | 'female',
          weight: preferences.weight ? parseFloat(preferences.weight) : undefined,
          height: preferences.height ? parseFloat(preferences.height) : undefined,
          activityLevel: preferences.trainingDaysPerWeek ? getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek) : undefined,
          goal: preferences.goal
        });
        
        // Add training days validation
        if (!preferences.trainingDaysPerWeek) {
          setValidationError('Please select how many days you can train per week');
          return false;
        }
        
        if (tdeeErrors.length > 0) {
          setValidationError(tdeeErrors[0]);
          return false;
        }
        return true;

      case 'muscle-priorities':
        if (preferences.musclePriorities.length === 0) {
          setValidationError('Please select at least 1 muscle group');
          return false;
        }
        if (preferences.musclePriorities.length > 3) {
          setValidationError('Please select maximum 3 muscle groups');
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

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsGeneratingProgram(true);
      
      // Create user if not exists (with name from wizard)
      let currentUser = user;
      if (!currentUser || !currentUser.id) {
        const { setupNewUser } = useAuthStore.getState();
        const result = await setupNewUser(preferences.name);
        
        if (!result.success) {
          console.error('❌ Failed to create user:', result.error);
          Alert.alert('Error', 'Failed to create user. Please try again.');
          setIsGeneratingProgram(false);
          return;
        }
        
        // Get the newly created user
        currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          console.error('❌ User creation failed: No user returned');
          Alert.alert('Error', 'User creation failed. Please restart the app.');
          setIsGeneratingProgram(false);
          return;
        }
      }
      
      // Simulate AI generation process
      await simulateAIGeneration();
      
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

        await wizardResultsService.create({
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

        // TDEE data is now being saved to the database for the nutrition tab
        if (tdeeData) {
          console.log('✅ TDEE calculation completed and saved to database');
        }
      } else {
        console.error('❌ No user or user.id available:', { currentUser, userId: currentUser?.id });
        throw new Error('User not authenticated or missing ID');
      }
      
      // Store the generated program data
      setGeneratedProgramData(generatedProgram);
      
      console.log('🚀 Generated program:', generatedProgram.programName);
      
      // Show subscription screen instead of completing wizard
      setIsGeneratingProgram(false);
      setShowSubscriptionScreen(true);

    } catch (error) {
      console.error('❌ Failed to save wizard results:', error);
      setIsGeneratingProgram(false);
      setGenerationStep('❌ Error generating program');
    }
  };

  const handleSubscriptionComplete = async () => {
    // Refresh subscription status using the store method
    const { refreshSubscriptionStatus } = useSubscriptionStore.getState();
    await refreshSubscriptionStatus();
    
    // Mark wizard as completed and close
    setWizardCompleted();
    console.log('✅ Subscription completed, wizard marked as completed');
    
    // Close the wizard
    onClose();
  };

  const handleSubscriptionSkip = () => {
    // User chose not to subscribe, go back to wizard
    setShowSubscriptionScreen(false);
    setIsGeneratingProgram(false);
    // Could also show a different flow or just stay on the last step
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
      handleInputChange('musclePriorities', current.filter(m => m !== muscle));
    } else {
      if (current.length < 3) {
        handleInputChange('musclePriorities', [...current, muscle]);
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
              Answer 9 quick questions and we'll create the perfect 12-week program tailored to your goals and preferences.
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

      case 'motivation':
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.priorityHint}>
              Choose what brings you to DENSE ({preferences.motivation.length} selected)
            </Text>
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
              >
                <View style={styles.motivationOption}>
                  <Text style={styles.motivationEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      preferences.motivation.includes(option.id) && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
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
                  style={styles.textInput}
                  value={preferences.age}
                  onChangeText={(value) => {
                    // Filter to only allow numbers (no range validation while typing)
                    const numericValue = value.replace(/[^0-9]/g, '');
                    handleInputChange('age', numericValue);
                  }}
                  placeholder="e.g 25"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        { flex: 1, marginBottom: 0 },
                        preferences.gender === option.id && styles.selectedOption,
                      ]}
                      onPress={() => handleInputChange('gender', option.id)}
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
                  style={styles.textInput}
                  value={preferences.weight}
                  onChangeText={(value) => {
                    // Filter to allow numbers and decimal point (no range validation while typing)
                    const filteredValue = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filteredValue.split('.');
                    const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                    handleInputChange('weight', cleanValue);
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
                  style={styles.textInput}
                  value={preferences.height}
                  onChangeText={(value) => {
                    // Filter to allow numbers and decimal point (no range validation while typing)
                    const filteredValue = value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filteredValue.split('.');
                    const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                    handleInputChange('height', cleanValue);
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
              <View style={styles.optionsContainer}>
                {goalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      preferences.goal === option.id && styles.selectedOption,
                    ]}
                    onPress={() => handleInputChange('goal', option.id)}
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
              <View style={styles.trainingDaysContainer}>
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
                    }}
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
            {musclePriorityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.musclePriorities.includes(option.id) && styles.selectedOption,
                  preferences.musclePriorities.length >= 3 &&
                  !preferences.musclePriorities.includes(option.id) && styles.disabledOption,
                ]}
                onPress={() => toggleMusclePriority(option.id)}
                disabled={
                  preferences.musclePriorities.length >= 3 &&
                  !preferences.musclePriorities.includes(option.id)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.musclePriorities.includes(option.id) && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
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
          >
            <Text style={styles.viewLaterButtonText}>View Later in Programs Tab</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Show loading screen during generation
  // Show subscription screen after program generation
  if (showSubscriptionScreen) {
    return (
      <SubscriptionScreen
        onSubscribed={handleSubscriptionComplete}
        onSkip={handleSubscriptionSkip}
        showSkipOption={false} // Don't allow skipping - must subscribe
        programPreview={generatedProgramData}
      />
    );
  }

  if (isGeneratingProgram) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <View style={[styles.content, styles.contentContainer]}>
          <Text style={styles.generatingIcon}>⚡</Text>
          <Text style={styles.stepTitle}>Creating Your Custom Program</Text>
          <Text style={styles.generatingDescription}>
            We're analyzing your preferences and building a personalized 12-week workout plan just for you
          </Text>
          <Text style={styles.stepSubtitle}>{generationStep}</Text>
          
          <View style={styles.loadingProgressContainer}>
            <View style={styles.loadingProgressBar}>
              <View style={[styles.loadingProgressFill, { width: `${generationProgress * 100}%` }]} />
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Main wizard interface  
  // Safety check: ensure currentStep is within valid bounds
  if (currentStep < 0 || currentStep >= steps.length) {
    console.error('❌ Main render: currentStep out of bounds:', currentStep, 'steps.length:', steps.length);
    // Reset to first step and return loading state
    setTimeout(() => setCurrentStep(0), 0);
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
    setTimeout(() => setCurrentStep(0), 0);
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

      {/* Content */}
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={step.subtitle ? styles.stepHeader : styles.stepHeaderNoSubtitle}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.stepSubtitle}>{step.subtitle}</Text> : null}
          
          {/* Validation error below subtitle */}
          {validationError ? (
            <Text style={styles.stepValidationError}>{validationError}</Text>
          ) : null}
        </View>

        {/* Step-specific content */}
        {renderStepContent()}
      </ScrollView>

      {/* Navigation buttons - Fixed at bottom */}
      <View style={styles.bottomNavigationContainer}>
        {currentStep > 0 ? (
          <TouchableOpacity 
            onPress={() => setCurrentStep(currentStep - 1)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
        
        <TouchableOpacity 
          onPress={handleNext}
          style={styles.nextButton}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Generate My Program! 💪' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}