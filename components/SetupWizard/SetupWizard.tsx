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

// Import extracted constants and types
import {
  steps,
  trainingExperienceOptions,
  bodyFatOptions,
  trainingDaysOptions,
  musclePriorityOptions,
  pumpWorkOptions,
  recoveryOptions,
  durationOptions,
  aiGenerationSteps
} from '@/constants/wizard.constants';
import { type WizardStep, type WizardPreferences } from './types';
import { styles } from './styles';

interface SetupWizardProps {
  onClose: () => void;
}

export default function SetupWizard({ onClose }: SetupWizardProps) {
  const router = useRouter();
  const { user, setWizardCompleted } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCheckProgramButton, setShowCheckProgramButton] = useState(false);
  const [generatedProgramData, setGeneratedProgramData] = useState<any>(null);
  const [isNavigatingToProgram, setIsNavigatingToProgram] = useState(false);
  const [showProgramView, setShowProgramView] = useState(false);
  
  const [preferences, setPreferences] = useState<WizardPreferences>({
    // Step 2: Current Strength
    squatKg: '',
    benchKg: '',
    deadliftKg: '',
    
    // Step 3: Training Experience
    trainingExperience: '',
    
    // Step 4: Body Fat
    bodyFatLevel: '',
    
    // Step 5: Weekly Schedule
    trainingDaysPerWeek: 3,
    preferredTrainingDays: [],
    
    // Step 6: Muscle Priorities
    musclePriorities: [],
    
    // Step 7: Pump Work
    pumpWorkPreference: '',
    
    // Step 8: Recovery
    recoveryProfile: '',
    
    // Step 9: Duration
    programDurationWeeks: 12
  });

  const validateCurrentStep = (): boolean => {
    setValidationError('');
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return true;

      case 'current-strength':
        return true; // Optional fields

      case 'training-experience':
        if (!preferences.trainingExperience) {
          setValidationError('Please select your training experience');
          return false;
        }
        return true;

      case 'body-fat':
        if (!preferences.bodyFatLevel) {
          setValidationError('Please select your body fat estimate');
          return false;
        }
        return true;

      case 'weekly-schedule':
        if (!preferences.trainingDaysPerWeek) {
          setValidationError('Please select how many days you can train');
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

      case 'recovery-profile':
        if (!preferences.recoveryProfile) {
          setValidationError('Please select your recovery profile');
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
      
      // Simulate AI generation process
      await simulateAIGeneration();
      
      // Generate the actual program
      const wizardResponses: WizardResponses = {
        trainingExperience: preferences.trainingExperience as any,
        bodyFatLevel: preferences.bodyFatLevel as any,
        trainingDaysPerWeek: preferences.trainingDaysPerWeek,
        musclePriorities: preferences.musclePriorities,
        pumpWorkPreference: preferences.pumpWorkPreference as any,
        recoveryProfile: preferences.recoveryProfile as any,
        programDurationWeeks: preferences.programDurationWeeks,
        preferredTrainingDays: preferences.preferredTrainingDays
      };

      const generatedProgram = ProgramGenerator.generateProgram(wizardResponses);
      
      // Save to database
      if (user) {
        await wizardResultsService.create({
          userId: user.email,
          trainingExperience: preferences.trainingExperience,
          bodyFatLevel: preferences.bodyFatLevel,
          trainingDaysPerWeek: preferences.trainingDaysPerWeek,
          preferredTrainingDays: JSON.stringify(preferences.preferredTrainingDays),
          musclePriorities: JSON.stringify(preferences.musclePriorities),
          pumpWorkPreference: preferences.pumpWorkPreference,
          recoveryProfile: preferences.recoveryProfile,
          programDurationWeeks: preferences.programDurationWeeks,
          generatedSplit: JSON.stringify(generatedProgram),
          suggestedPrograms: JSON.stringify([generatedProgram.programName]),
          squatKg: preferences.squatKg ? parseFloat(preferences.squatKg) : null,
          benchKg: preferences.benchKg ? parseFloat(preferences.benchKg) : null,
          deadliftKg: preferences.deadliftKg ? parseFloat(preferences.deadliftKg) : null,
        });
      }
      
      // Store the generated program data
      setGeneratedProgramData(generatedProgram);
      
      // Mark wizard as completed and close the wizard
      setWizardCompleted();
      console.log('🚀 Generated program:', generatedProgram.programName);
      console.log('✅ Wizard marked as completed, closing wizard');
      
      // Close the wizard immediately
      onClose();

    } catch (error) {
      console.error('❌ Failed to save wizard results:', error);
      setIsGeneratingProgram(false);
      setGenerationStep('❌ Error generating program');
    }
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
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Answer 8 quick questions and we'll create the perfect 12-week program tailored to your goals and preferences.
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
                onChangeText={(value) => handleInputChange('squatKg', value)}
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
                onChangeText={(value) => handleInputChange('benchKg', value)}
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
                onChangeText={(value) => handleInputChange('deadliftKg', value)}
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
                onPress={() => handleInputChange('bodyFatLevel', option.id)}
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
          <View style={styles.optionsContainer}>
            {trainingDaysOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.trainingDaysPerWeek === option.id && styles.selectedOption,
                ]}
                onPress={() => handleInputChange('trainingDaysPerWeek', option.id)}
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
                onPress={() => handleInputChange('recoveryProfile', option.id)}
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

      case 'complete':
        return (
          <View style={styles.completeContent}>
            <Text style={styles.completeText}>
              Perfect! We have everything we need to create your personalized program.
            </Text>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Your Preferences:</Text>
              <Text style={styles.summaryItem}>• Experience: {trainingExperienceOptions.find(o => o.id === preferences.trainingExperience)?.label}</Text>
              <Text style={styles.summaryItem}>• Training Days: {preferences.trainingDaysPerWeek} days per week</Text>
              <Text style={styles.summaryItem}>• Focus: {preferences.musclePriorities.join(', ')}</Text>
              <Text style={styles.summaryItem}>• Duration: {preferences.programDurationWeeks} weeks</Text>
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
            <Icon name="arrow-right" size={20} color={colors.white} />
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
  const step = steps[currentStep];
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
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </View>

        {/* Step-specific content */}
        {renderStepContent()}
        
        {validationError ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{validationError}</Text>
        ) : null}
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