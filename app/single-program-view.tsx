import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { wizardResultsService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { ensureMinimumDuration } from '@/utils/workout-duration';
import { ProgramGenerator } from '@/utils/program-generator';

// Helper function to format overview text as bullet points
const formatOverviewAsBullets = (overview: string): string[] => {
  // Split the overview into logical bullet points
  const sentences = overview.split('. ');
  const bullets = [];
  
  // First bullet: Main program description
  if (sentences[0]) {
    bullets.push(sentences[0] + (sentences[0].endsWith('.') ? '' : '.'));
  }
  
  // Second bullet: Training frequency
  if (sentences[1]) {
    bullets.push(sentences[1] + (sentences[1].endsWith('.') ? '' : '.'));
  }
  
  // Third bullet: Priority focus
  if (sentences[2]) {
    bullets.push(sentences[2] + (sentences[2].endsWith('.') ? '' : '.'));
  }
  
  return bullets.filter(bullet => bullet.trim().length > 0);
};

// Helper function to render text with DENSE and random letters highlighted in green
const renderTextWithHighlight = (text: string) => {
  // First, handle DENSE highlighting
  const parts = text.split(/(DENSE)/g);
  
  return parts.map((part, index) => {
    if (part === 'DENSE') {
      return (
        <Text key={index} style={[styles.bulletText, styles.highlightedText]}>
          {part}
        </Text>
      );
    } else if (part.length > 0) {
      // For non-DENSE parts, randomly highlight 2 letters
      return renderRandomHighlights(part, index);
    }
    return (
      <Text key={index} style={styles.bulletText}>
        {part}
      </Text>
    );
  }).flat(); // Flatten the array since renderRandomHighlights returns an array
};

// Helper function to randomly highlight 2 letters in a text part
const renderRandomHighlights = (text: string, partIndex: number) => {
  // Get only letters (exclude spaces and punctuation)
  const letters = text.split('').map((char, index) => ({ char, index }))
    .filter(item => /[a-zA-Z]/.test(item.char));
  
  if (letters.length < 2) {
    return [<Text key={`${partIndex}-text`} style={styles.bulletText}>{text}</Text>]; // Not enough letters to highlight
  }
  
  // Randomly select 2 different letter positions
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  const highlightIndices = new Set([shuffled[0].index, shuffled[1].index]);
  
  // Render text with highlighted letters
  return text.split('').map((char, index) => {
    if (highlightIndices.has(index)) {
      return (
        <Text key={`${partIndex}-${index}`} style={[styles.bulletText, styles.highlightedText]}>
          {char}
        </Text>
      );
    }
    return (
      <Text key={`${partIndex}-${index}`} style={styles.bulletText}>
        {char}
      </Text>
    );
  });
};

// Helper function to generate default schedules for old programs
const generateDefaultSchedule = (trainingDays: number) => {
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let trainDays: string[] = [];
  
  switch (trainingDays) {
    case 3:
      trainDays = ['monday', 'wednesday', 'friday'];
      break;
    case 4:
      trainDays = ['monday', 'tuesday', 'thursday', 'friday'];
      break;
    case 5:
      trainDays = ['monday', 'tuesday', 'thursday', 'friday', 'saturday'];
      break;
    case 6:
      trainDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      break;
    case 7:
      trainDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      break;
    default:
      trainDays = ['monday', 'tuesday', 'thursday', 'friday'];
  }
  
  const restDays = allDays.filter(day => !trainDays.includes(day));
  return { trainDays, restDays };
};

const SingleProgramView = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [wizardResponses, setWizardResponses] = useState<any>(null);
  const [showDescription, setShowDescription] = useState(false);

  React.useEffect(() => {
    loadGeneratedProgram();
  }, []);

  const loadGeneratedProgram = async () => {
    console.log('🔍 Loading generated program for user:', user?.id);
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      console.log('📊 Wizard results:', wizardResults);
      
      if (wizardResults && wizardResults.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit as string);
        
        // Reconstruct wizard responses from the individual fields
        const responses = {
          squatKg: wizardResults.squatKg,
          benchKg: wizardResults.benchKg,
          deadliftKg: wizardResults.deadliftKg,
          trainingExperience: wizardResults.trainingExperience,
          bodyFatLevel: wizardResults.bodyFatLevel,
          trainingDaysPerWeek: wizardResults.trainingDaysPerWeek,
          preferredTrainingDays: wizardResults.preferredTrainingDays ? JSON.parse(wizardResults.preferredTrainingDays as string) : [],
          musclePriorities: wizardResults.musclePriorities ? JSON.parse(wizardResults.musclePriorities as string) : [],
          pumpWorkPreference: wizardResults.pumpWorkPreference,
          recoveryProfile: wizardResults.recoveryProfile,
          programDurationWeeks: wizardResults.programDurationWeeks,
        };
        
        console.log('✅ Program loaded:', program.programName);
        console.log('🗓️ Training schedule debug:', {
          hasTrainingSchedule: !!program.trainingSchedule,
          trainingSchedule: program.trainingSchedule,
          hasRestDays: !!program.restDays,
          restDays: program.restDays,
          allKeys: Object.keys(program)
        });
        setGeneratedProgram(program);
        setWizardResponses(responses);
      } else {
        console.log('⚠️ No generated program found');
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
    }
  };

  if (!generatedProgram) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading your program...</Text>
            <Text style={styles.loadingSubtext}>Getting your custom workout ready</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Get week ranges instead of individual weeks
  const weekRanges = wizardResponses ? ProgramGenerator.getWeekRanges(generatedProgram.totalWeeks) : [];
  
  // Get the current week structure for the selected range
  const getCurrentWeekStructure = () => {
    if (!wizardResponses || !weekRanges[selectedRangeIndex]) return generatedProgram?.weeklyStructure || [];
    const selectedRange = weekRanges[selectedRangeIndex];
    return ProgramGenerator.generateWeekStructureForRange(wizardResponses, selectedRange.startWeek);
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            // Mark wizard as completed when user finishes viewing program
            const { setWizardCompleted } = useAuthStore.getState();
            setWizardCompleted();
            router.back();
          }} style={styles.backButton} activeOpacity={1}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Program</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Program Overview */}
          <View style={styles.programOverview}>
            <Text style={styles.programName}>{generatedProgram.programName}</Text>
            
            {/* Info Button to toggle description */}
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowDescription(!showDescription)}
            >
              <Icon name="info-outline" size={20} color={colors.primary} />
              <Text style={styles.infoButtonText}>
                {showDescription ? 'Hide Info' : 'Show Info'}
              </Text>
            </TouchableOpacity>

            {/* Collapsible Overview Bullets */}
            {showDescription && (
              <View style={styles.overviewBullets}>
                {formatOverviewAsBullets(generatedProgram.overview).map((bullet, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletTextContainer}>
                      {renderTextWithHighlight(bullet)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.programStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgram.totalWeeks}</Text>
                <Text style={styles.statLabel}>Weeks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgram.weeklyStructure.length}</Text>
                <Text style={styles.statLabel}>Days/Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{generatedProgram.weeklyStructure.reduce((total: number, day: any) => total + (day.exercises?.length || 0), 0)}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
            </View>
          </View>

          {/* Training Schedule Tip */}
          {generatedProgram && (
            <View style={styles.scheduleContainer}>
              <View style={styles.scheduleContent}>
                <Icon name="schedule" size={20} color={colors.primary} style={styles.scheduleIcon} />
                <View style={styles.scheduleTextContainer}>
                  <Text style={styles.scheduleTitle}>Training Schedule</Text>
                  {generatedProgram.trainingSchedule ? (
                    <View style={styles.daysContainer}>
                      <View style={styles.dayTypeSection}>
                        <Text style={styles.dayTypeLabel}>TRAIN</Text>
                        <View style={styles.daysRow}>
                          {generatedProgram.trainingSchedule.map((day: string) => (
                            <View key={day} style={styles.trainDay}>
                              <Text style={styles.trainDayText}>
                                {day.slice(0, 3).toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      {generatedProgram.restDays && generatedProgram.restDays.length > 0 && (
                        <View style={styles.dayTypeSection}>
                          <Text style={styles.dayTypeLabel}>REST</Text>
                          <View style={styles.daysRow}>
                            {generatedProgram.restDays.map((day: string) => (
                              <View key={day} style={styles.restDay}>
                                <Text style={styles.restDayText}>
                                  {day.slice(0, 3).toUpperCase()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.daysContainer}>
                      <View style={styles.dayTypeSection}>
                        <Text style={styles.dayTypeLabel}>TRAIN</Text>
                        <View style={styles.daysRow}>
                          {generateDefaultSchedule(generatedProgram.weeklyStructure?.length || 4).trainDays.map((day: string) => (
                            <View key={day} style={styles.trainDay}>
                              <Text style={styles.trainDayText}>
                                {day.slice(0, 3).toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.dayTypeSection}>
                        <Text style={styles.dayTypeLabel}>REST</Text>
                        <View style={styles.daysRow}>
                          {generateDefaultSchedule(generatedProgram.weeklyStructure?.length || 4).restDays.map((day: string) => (
                            <View key={day} style={styles.restDay}>
                              <Text style={styles.restDayText}>
                                {day.slice(0, 3).toUpperCase()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Week Range Selector */}
          <View style={styles.weekSelector}>
            <Text style={styles.sectionTitle}>Training Phases</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScrollView}>
              {weekRanges.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekButton,
                    selectedRangeIndex === index && styles.selectedWeekButton,
                  ]}
                  onPress={() => setSelectedRangeIndex(index)}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.weekButtonText,
                      selectedRangeIndex === index && styles.selectedWeekButtonText,
                    ]}
                  >
                    {range.range}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Weekly Workouts */}
          <View style={styles.weeklyWorkouts}>
            <Text style={styles.sectionTitle}>
              {weekRanges[selectedRangeIndex]?.range || 'Week 1'} Workouts
            </Text>
            {getCurrentWeekStructure().map((day: any, index: number) => (
              <View key={index} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutDay}>Day {index + 1}</Text>
                  <Text style={styles.workoutName}>{day.name}</Text>
                  <Text style={styles.workoutDuration}>{ensureMinimumDuration(day.estimatedDuration)} min</Text>
                </View>
                
                <View style={styles.muscleGroupSection}>
                  <Text style={styles.muscleGroupTitle}>{day.type.toUpperCase()}</Text>
                  {day.exercises?.map((exercise: any, exerciseIndex: number) => (
                    <View key={exerciseIndex} style={styles.exerciseItem}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                        {exercise.notes && (
                          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                        )}
                      </View>
                    </View>
                  )) || (
                    <Text style={styles.exerciseNotes}>No exercises for this day</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Program Tips */}
          <View style={styles.programTips}>
            <Text style={styles.sectionTitle}>Nutrition Tips</Text>
            {generatedProgram.nutritionTips.map((tip: string, index: number) => (
              <View key={index} style={styles.tipItem}>
                <Icon name="lightbulb-outline" size={20} color={colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.programTips}>
            <Text style={styles.sectionTitle}>Progression Notes</Text>
            {generatedProgram.progressionNotes.map((note: string, index: number) => (
              <View key={index} style={styles.tipItem}>
                <Icon name="trending-up" size={20} color={colors.secondary} />
                <Text style={styles.tipText}>{note}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 8,
  },
  loadingSubtext: {
    ...typography.bodySmall,
    color: colors.lightGray,
    opacity: 0.7,
  },
  programOverview: {
    paddingVertical: 24,
  },
  programName: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16,
    marginHorizontal: 60,
  },
  infoButtonText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  programDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  overviewBullets: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletDot: {
    ...typography.body,
    color: colors.primary,
    marginRight: 12,
    marginTop: 2,
    fontSize: 24,
    fontWeight: 'bold',
  },
  bulletText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 22,
  },
  bulletTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightedText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.timerMedium,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  // Schedule styles
  scheduleContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  scheduleTextContainer: {
    flex: 1,
  },
  scheduleTitle: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 4,
  },
  scheduleSubtitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 2,
  },
  scheduleNote: {
    ...typography.bodySmall,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  daysContainer: {
    marginTop: 12,
  },
  dayTypeSection: {
    marginBottom: 12,
  },
  dayTypeLabel: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 1,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trainDay: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  trainDayText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 12,
  },
  restDay: {
    backgroundColor: colors.mediumGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  restDayText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontWeight: 'bold',
    fontSize: 12,
  },
  weekSelector: {
    paddingVertical: 20,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  weekScrollView: {
    flexDirection: 'row',
  },
  weekButton: {
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
  },
  selectedWeekButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekButtonText: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  selectedWeekButtonText: {
    color: colors.black,
    fontWeight: '600',
  },
  weeklyWorkouts: {
    paddingBottom: 20,
  },
  workoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  workoutHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  workoutDay: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
  },
  workoutName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  workoutDuration: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  muscleGroupSection: {
    marginBottom: 16,
  },
  muscleGroupTitle: {
    ...typography.body,
    color: colors.secondary,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.dark,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
  },
  exerciseNotes: {
    ...typography.caption,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  programTips: {
    paddingVertical: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.lightGray,
    lineHeight: 20,
  },
});

export default SingleProgramView;