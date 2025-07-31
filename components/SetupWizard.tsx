import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

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
  const [preferences, setPreferences] = useState({
    workoutTime: '',
    workoutDays: [] as string[],
    fitnessGoals: [] as string[],
    preferredEquipment: [] as string[],
    notificationSettings: {
      workoutReminders: true,
      progressUpdates: true,
      nutritionTips: false,
    },
  });

  // Reset wizard when it becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setValidationError('');
      setPreferences({
        workoutTime: '',
        workoutDays: [] as string[],
        fitnessGoals: [] as string[],
        preferredEquipment: [] as string[],
        notificationSettings: {
          workoutReminders: true,
          progressUpdates: true,
          nutritionTips: false,
        },
      });
    }
  }, [visible]);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DENSE! 💪',
      subtitle: 'Let\'s customize your fitness journey',
      icon: 'target',
      color: colors.primary,
    },
    {
      id: 'workout-time',
      title: 'When do you prefer to workout?',
      subtitle: 'Choose your optimal training time',
      icon: 'clock',
      color: colors.secondary,
    },
    {
      id: 'workout-days',
      title: 'How many days per week?',
      subtitle: 'Select your preferred workout schedule',
      icon: 'calendar',
      color: colors.primary,
    },
    {
      id: 'fitness-goals',
      title: 'What are your main goals?',
      subtitle: 'Help us personalize your experience',
      icon: 'award',
      color: colors.secondary,
    },
    {
      id: 'equipment',
      title: 'What equipment do you have?',
      subtitle: 'We\'ll suggest appropriate exercises',
      icon: 'settings',
      color: colors.primary,
    },
    {
      id: 'notifications',
      title: 'Stay motivated with reminders',
      subtitle: 'Configure your notification preferences',
      icon: 'bell',
      color: colors.secondary,
    },
    {
      id: 'complete',
      title: 'All set! 🚀',
      subtitle: 'Your personalized journey begins now',
      icon: 'check-circle',
      color: colors.success,
    },
  ];

  const workoutTimes = ['Morning (6-9 AM)', 'Afternoon (12-3 PM)', 'Evening (6-9 PM)', 'Night (9-11 PM)'];
  const weekDays = ['3 days', '4 days', '5 days', '6 days', '7 days'];
  const goals = ['Build Muscle', 'Lose Weight', 'Get Stronger', 'Improve Endurance', 'General Fitness'];
  const equipment = ['Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 'Gym Access', 'Bodyweight Only'];

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    setValidationError('');

    switch (step.id) {
      case 'workout-time':
        if (!preferences.workoutTime) {
          setValidationError('Please select your preferred workout time');
          return false;
        }
        break;
      case 'workout-days':
        if (preferences.workoutDays.length === 0) {
          setValidationError('Please select at least one workout frequency');
          return false;
        }
        break;
      case 'fitness-goals':
        if (preferences.fitnessGoals.length === 0) {
          setValidationError('Please select at least one fitness goal');
          return false;
        }
        break;
      case 'equipment':
        if (preferences.preferredEquipment.length === 0) {
          setValidationError('Please select at least one equipment option');
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

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Navigate to Home tab and close wizard
    router.push('/(tabs)');
    onComplete();
    onClose();
    // Note: Reset happens automatically when wizard is opened again via useEffect
  };

  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    // Clear validation error when user makes a selection
    setValidationError('');
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              We'll guide you through a quick setup to personalize your experience and help you achieve your fitness goals faster.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="target" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Personalized workout plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="trending-up" size={20} color={colors.secondary} />
                <Text style={styles.featureText}>Progress tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="bell" size={20} color={colors.success} />
                <Text style={styles.featureText}>Smart reminders</Text>
              </View>
            </View>
          </View>
        );

      case 'workout-time':
        return (
          <View style={styles.optionsContainer}>
            {workoutTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  preferences.workoutTime === time && styles.selectedOption,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({ ...preferences, workoutTime: time });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.workoutTime === time && styles.selectedOptionText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'workout-days':
        return (
          <View style={styles.optionsContainer}>
            {weekDays.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.optionButton,
                  preferences.workoutDays.includes(days) && styles.selectedOption,
                ]}
                onPress={() => toggleArrayValue(preferences.workoutDays, days, (newDays) => 
                  setPreferences({ ...preferences, workoutDays: newDays })
                )}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.workoutDays.includes(days) && styles.selectedOptionText,
                  ]}
                >
                  {days}
                </Text>
              </TouchableOpacity>
            ))}
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
                  preferences.fitnessGoals.includes(goal) && styles.selectedOption,
                ]}
                onPress={() => toggleArrayValue(preferences.fitnessGoals, goal, (newGoals) => 
                  setPreferences({ ...preferences, fitnessGoals: newGoals })
                )}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.fitnessGoals.includes(goal) && styles.selectedOptionText,
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'equipment':
        return (
          <View style={styles.optionsContainer}>
            {equipment.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  preferences.preferredEquipment.includes(item) && styles.selectedOption,
                ]}
                onPress={() => toggleArrayValue(preferences.preferredEquipment, item, (newEquipment) => 
                  setPreferences({ ...preferences, preferredEquipment: newEquipment })
                )}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.preferredEquipment.includes(item) && styles.selectedOptionText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Workout Reminders</Text>
                <Text style={styles.notificationSubtitle}>Get notified when it's time to exercise</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.notificationSettings.workoutReminders && styles.toggleActive,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      workoutReminders: !preferences.notificationSettings.workoutReminders,
                    },
                  });
                }}
              >
                <View style={[
                  styles.toggleIndicator,
                  preferences.notificationSettings.workoutReminders && styles.toggleIndicatorActive,
                ]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Progress Updates</Text>
                <Text style={styles.notificationSubtitle}>Celebrate your achievements</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.notificationSettings.progressUpdates && styles.toggleActive,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      progressUpdates: !preferences.notificationSettings.progressUpdates,
                    },
                  });
                }}
              >
                <View style={[
                  styles.toggleIndicator,
                  preferences.notificationSettings.progressUpdates && styles.toggleIndicatorActive,
                ]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Nutrition Tips</Text>
                <Text style={styles.notificationSubtitle}>Daily nutrition advice and tips</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  preferences.notificationSettings.nutritionTips && styles.toggleActive,
                ]}
                onPress={() => {
                  setValidationError('');
                  setPreferences({
                    ...preferences,
                    notificationSettings: {
                      ...preferences.notificationSettings,
                      nutritionTips: !preferences.notificationSettings.nutritionTips,
                    },
                  });
                }}
              >
                <View style={[
                  styles.toggleIndicator,
                  preferences.notificationSettings.nutritionTips && styles.toggleIndicatorActive,
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.completeContent}>
            <View style={styles.congratulationsContainer}>
              <Text style={styles.congratulationsTitle}>🎉 Congratulations!</Text>
              <Text style={styles.congratulationsSubtitle}>
                Your personalized fitness journey is ready to begin!
              </Text>
              <Text style={styles.completeText}>
                We've customized your experience based on your preferences. 
                You're all set to start achieving your fitness goals!
              </Text>
            </View>
            
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Your Setup:</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Icon name="clock" size={20} color={colors.primary} />
                  <Text style={styles.summaryCardTitle}>Workout Time</Text>
                  <Text style={styles.summaryCardValue}>{preferences.workoutTime || 'Not set'}</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Icon name="calendar" size={20} color={colors.secondary} />
                  <Text style={styles.summaryCardTitle}>Frequency</Text>
                  <Text style={styles.summaryCardValue}>{preferences.workoutDays.join(', ') || 'Not set'}</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Icon name="target" size={20} color={colors.success} />
                  <Text style={styles.summaryCardTitle}>Goals</Text>
                  <Text style={styles.summaryCardValue}>{preferences.fitnessGoals.slice(0, 2).join(', ') || 'Not set'}</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <Icon name="settings" size={20} color={colors.warning} />
                  <Text style={styles.summaryCardTitle}>Equipment</Text>
                  <Text style={styles.summaryCardValue}>{preferences.preferredEquipment.slice(0, 2).join(', ') || 'Not set'}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.getStartedButton} onPress={handleComplete}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <Icon name="arrow-right" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        </ScrollView>

        {steps[currentStep].id !== 'complete' && (
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
    </Modal>
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
});