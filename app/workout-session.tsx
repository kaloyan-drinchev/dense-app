import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import {
  Feather as Icon,
} from '@expo/vector-icons';
import { ExerciseCard } from '@/components/ExerciseCard';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutData();
  }, [user]);

  // Reload when screen gains focus (coming back from tracker)
  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [user?.email])
  );

  const loadWorkoutData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Load program data
      const wizardResults = await wizardResultsService.getByUserId(user.email);
      if (wizardResults?.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit);
        setGeneratedProgram(program);
      }

      // Load progress data
      const progress = await userProgressService.getByUserId(user.email);
      setUserProgressData(progress);
    } catch (error) {
      console.error('❌ Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaysWorkout = () => {
    if (!generatedProgram || !userProgressData) return null;
    
    const currentWorkoutIndex = userProgressData.currentWorkout - 1;
    const workout = generatedProgram.weeklyStructure?.[currentWorkoutIndex];
    
    return workout || null;
  };

  const handleExercisePress = (exercise: any) => {
    // Navigate to the workout-specific exercise tracker
    const exerciseId = exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase();
    router.push(`/workout-exercise-tracker?exerciseId=${exerciseId}`);
  };

  const todaysWorkout = getTodaysWorkout();
  // Parse exercise logs for status computation
  const weeklyWeightsData = (() => {
    try {
      return userProgressData?.weeklyWeights ? JSON.parse(userProgressData.weeklyWeights) : {};
    } catch {
      return {} as any;
    }
  })();

  const getExerciseStatus = (
    exerciseId: string,
    plannedSets: number
  ): 'pending' | 'in-progress' | 'completed' => {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = weeklyWeightsData?.exerciseLogs?.[exerciseId] as
      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
      | undefined;
    if (!sessions || sessions.length === 0) return 'pending';
    const todaySession = sessions.find((s) => s.date === today);
    if (!todaySession || !todaySession.sets || todaySession.sets.length === 0) return 'pending';
    const normalizedSets = todaySession.sets.filter((s) => (s.reps ?? 0) > 0 || (s.weightKg ?? 0) > 0 || !!s.isCompleted);
    if (normalizedSets.length === 0) return 'pending';
    const completedCount = normalizedSets.filter((s) => !!s.isCompleted).length;
    const anyTouched = normalizedSets.length > 0;
    const required = Math.max(0, plannedSets || 0);
    if (required > 0 && completedCount >= required) return 'completed';
    return anyTouched ? 'in-progress' : 'pending';
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading your workout...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!todaysWorkout) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Workout Session</Text>
          </View>
          
          <View style={styles.noWorkoutContainer}>
            <Icon name="check-circle" size={64} color={colors.primary} />
            <Text style={styles.noWorkoutTitle}>All Done!</Text>
            <Text style={styles.noWorkoutText}>You've completed all workouts for today</Text>
            <TouchableOpacity 
              style={styles.backHomeButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.backHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{todaysWorkout.estimatedDuration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="target" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{todaysWorkout.type}</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>
              Week {userProgressData?.currentWeek} • Workout {userProgressData?.currentWorkout}
            </Text>
          </View>

          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>Exercises ({todaysWorkout.exercises?.length || 0})</Text>
            
            {todaysWorkout.exercises?.map((exercise: any, index: number) => {
              // Convert the exercise format to match ExerciseCard expectations
              const exerciseWithId = {
                ...exercise,
                id: exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
                targetMuscle: exercise.targetMuscle || 'General',
                restTime: exercise.restSeconds || 60,
                isCompleted:
                  getExerciseStatus(
                    exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
                    exercise.sets
                  ) === 'completed',
              };
              
              return (
                <ExerciseCard
                  key={index}
                  exercise={exerciseWithId}
                  index={index}
                  onPress={() => handleExercisePress(exerciseWithId)}
                  status={getExerciseStatus(exerciseWithId.id, exerciseWithId.sets)}
                />
              );
            }) || (
              <Text style={styles.noExercisesText}>No exercises found for today</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.lightGray,
    textTransform: 'capitalize',
  },
  progressIndicator: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  exercisesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },

  noExercisesText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 32,
  },
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noWorkoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noWorkoutText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backHomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
