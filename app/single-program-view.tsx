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
import { wizardResultsService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';

const SingleProgramView = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);

  React.useEffect(() => {
    loadGeneratedProgram();
  }, []);

  const loadGeneratedProgram = async () => {
    console.log('🔍 Loading generated program for user:', user?.email);
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    try {
      const wizardResults = await wizardResultsService.getByUserId(user.email);
      console.log('📊 Wizard results:', wizardResults);
      
      if (wizardResults && wizardResults.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit);
        console.log('✅ Program loaded:', program.programName);
        setGeneratedProgram(program);
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

  const weekNumbers = Array.from({ length: generatedProgram.totalWeeks }, (_, i) => i + 1);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            // Mark wizard as completed when user finishes viewing program
            const { setWizardCompleted } = useAuthStore.getState();
            setWizardCompleted();
            router.back();
          }} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Program</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Program Overview */}
          <View style={styles.programOverview}>
            <Text style={styles.programName}>{generatedProgram.programName}</Text>
            <Text style={styles.programDescription}>{generatedProgram.overview}</Text>
            
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

          {/* Week Selector */}
          <View style={styles.weekSelector}>
            <Text style={styles.sectionTitle}>Select Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScrollView}>
              {weekNumbers.map((week) => (
                <TouchableOpacity
                  key={week}
                  style={[
                    styles.weekButton,
                    currentWeek === week && styles.selectedWeekButton,
                  ]}
                  onPress={() => setCurrentWeek(week)}
                >
                  <Text
                    style={[
                      styles.weekButtonText,
                      currentWeek === week && styles.selectedWeekButtonText,
                    ]}
                  >
                    Week {week}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Weekly Workouts */}
          <View style={styles.weeklyWorkouts}>
            <Text style={styles.sectionTitle}>Week {currentWeek} Workouts</Text>
            {generatedProgram.weeklyStructure.map((day: any, index: number) => (
              <View key={index} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutDay}>Day {index + 1}</Text>
                  <Text style={styles.workoutName}>{day.name}</Text>
                  <Text style={styles.workoutDuration}>{day.estimatedDuration} min</Text>
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
                <Icon name="lightbulb-outline" size={16} color={colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.programTips}>
            <Text style={styles.sectionTitle}>Progression Notes</Text>
            {generatedProgram.progressionNotes.map((note: string, index: number) => (
              <View key={index} style={styles.tipItem}>
                <Icon name="trending-up" size={16} color={colors.secondary} />
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
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 16,
    color: colors.lightGray,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.lightGray,
    opacity: 0.7,
  },
  programOverview: {
    paddingVertical: 24,
  },
  programName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.lightGray,
  },
  weekSelector: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  weekButtonText: {
    fontSize: 14,
    color: colors.lightGray,
    fontWeight: '500',
  },
  selectedWeekButtonText: {
    color: colors.primary,
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
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 14,
    color: colors.lightGray,
  },
  muscleGroupSection: {
    marginBottom: 16,
  },
  muscleGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  exerciseNotes: {
    fontSize: 12,
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
    fontSize: 14,
    color: colors.lightGray,
    lineHeight: 20,
  },
});

export default SingleProgramView;