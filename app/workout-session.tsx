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
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
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
  const { formattedTime, startTimer, stopTimer, resetTimer } = useWorkoutTimer();

  useEffect(() => {
    loadWorkoutData();
    // Start timer when workout session begins
    startTimer();
    
    // Cleanup timer when component unmounts
    return () => {
      stopTimer();
    };
  }, [user]);

  // Reload when screen gains focus (coming back from tracker)
  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [user?.id])
  );

  const loadWorkoutData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Load program data
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      if (wizardResults?.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit);
        setGeneratedProgram(program);
      }

      // Load progress data
      const progress = await userProgressService.getByUserId(user.id);
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
    // Treat a set as "touched" only if reps or weight > 0 (ignore isCompleted when values are zero)
    const touchedSets = todaySession.sets.filter((s) => (s.reps ?? 0) > 0 || (s.weightKg ?? 0) > 0);
    if (touchedSets.length === 0) return 'pending';
    // Count a set as completed only if marked done AND has non-zero values
    const completedCount = todaySession.sets.filter(
      (s) => !!s.isCompleted && (s.reps ?? 0) > 0 && (s.weightKg ?? 0) > 0
    ).length;
    const anyTouched = touchedSets.length > 0;
    const required = Math.max(0, plannedSets || 0);
    if (required > 0 && completedCount >= required) return 'completed';
    return anyTouched ? 'in-progress' : 'pending';
  };

  const allExercisesCompleted = (() => {
    if (!todaysWorkout) return false;
    return (todaysWorkout.exercises || []).every((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      return getExerciseStatus(exId, ex.sets) === 'completed';
    });
  })();

  const handleFinishWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    try {
      const currentWorkoutIndex = userProgressData.currentWorkout - 1;
      const completedRaw = userProgressData.completedWorkouts || '[]';
      let completedArr: any[] = [];
      try { completedArr = JSON.parse(completedRaw); } catch { completedArr = []; }
      completedArr.push({
        date: new Date().toISOString(),
        workoutIndex: currentWorkoutIndex,
        workoutName: todaysWorkout?.name,
      });
      const nextWorkout = Math.min(
        (userProgressData.currentWorkout || 1) + 1,
        (generatedProgram?.weeklyStructure?.length || 1)
      );
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: nextWorkout,
        completedWorkouts: JSON.stringify(completedArr),
      });
      if (updated) {
        setUserProgressData(updated);
        // Stop the timer when workout is finished
        stopTimer();
        // Go back to Home after finishing workout
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('❌ Failed to finish workout:', e);
    }
  };

  // TESTING HELPERS
  const upsertTodaySessionForExercise = (
    dataObj: any,
    exercise: any,
    markCompleted: boolean
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const exerciseId = exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase();
    const plannedSets = exercise.sets || 0;
    if (!dataObj.exerciseLogs) dataObj.exerciseLogs = {};
    if (!dataObj.exerciseLogs[exerciseId]) dataObj.exerciseLogs[exerciseId] = [];
    const sessions: any[] = dataObj.exerciseLogs[exerciseId];
    const todayIdx = sessions.findIndex((s) => s.date === today);
    const todaySession = todayIdx >= 0 ? sessions[todayIdx] : null;
    // Find last non-today session as fallback for values
    const lastSession = [...sessions]
      .filter((s) => s.date !== today)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    // Parse default reps from exercise.reps if string like "8-12"
    const parseDefaultReps = () => {
      const r = exercise.reps;
      if (typeof r === 'number') return r;
      if (typeof r === 'string') {
        const m = r.match(/(\d+)(?:\s*-\s*(\d+))?/);
        if (m) return parseInt(m[1], 10);
      }
      return 10;
    };
    const defaultReps = parseDefaultReps();

    const newSets = Array.from({ length: plannedSets }, (_, i) => {
      const fromToday = todaySession?.sets?.[i];
      const fromLast = lastSession?.sets?.[i];
      const weightFallback = markCompleted ? 2.5 : 0;
      const pickPositive = (a?: number, b?: number, fallback?: number) => {
        if (typeof a === 'number' && a > 0) return a;
        if (typeof b === 'number' && b > 0) return b;
        return fallback ?? 0;
      };
      const repsFallback = defaultReps;
      const weightKg = pickPositive(fromToday?.weightKg, fromLast?.weightKg, weightFallback);
      const reps = pickPositive(fromToday?.reps, fromLast?.reps, repsFallback);
      return {
        setNumber: i + 1,
        weightKg,
        reps,
        isCompleted: !!markCompleted,
      };
    });
    const entry = { date: today, unit: (todaySession?.unit || lastSession?.unit || 'kg') as 'kg' | 'lb', sets: newSets };
    if (todayIdx >= 0) sessions[todayIdx] = entry; else sessions.push(entry);
  };

  const handleMockAllCompleted = async () => {
    if (!userProgressData || !todaysWorkout) return;
    try {
      let data: any = {};
      try { data = userProgressData.weeklyWeights ? JSON.parse(userProgressData.weeklyWeights) : {}; } catch { data = {}; }
      for (const ex of todaysWorkout.exercises || []) {
        upsertTodaySessionForExercise(data, ex, true);
      }
      const updated = await userProgressService.update(userProgressData.id, {
        weeklyWeights: JSON.stringify(data),
      });
      if (updated) {
        setUserProgressData(updated);
        // also recompute derived data by reloading progress from DB
        const refreshed = await userProgressService.getByUserId(user?.id || '');
        if (refreshed) setUserProgressData(refreshed);
      }
    } catch (e) {
      console.error('❌ Mock complete all failed:', e);
    }
  };

  const handleMockAllPending = async () => {
    if (!userProgressData || !todaysWorkout) return;
    try {
      let data: any = {};
      try { data = userProgressData.weeklyWeights ? JSON.parse(userProgressData.weeklyWeights) : {}; } catch { data = {}; }
      for (const ex of todaysWorkout.exercises || []) {
        // Pending: reset values to zero
        const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
        if (!data.exerciseLogs) data.exerciseLogs = {};
        if (!data.exerciseLogs[exId]) data.exerciseLogs[exId] = [];
        const today = new Date().toISOString().slice(0, 10);
        const sessions: any[] = data.exerciseLogs[exId];
        const idx = sessions.findIndex((s) => s.date === today);
        const sets = Array.from({ length: ex.sets || 0 }, (_, i) => ({ setNumber: i + 1, weightKg: 0, reps: 0, isCompleted: false }));
        const entry = { date: today, unit: 'kg' as const, sets };
        if (idx >= 0) sessions[idx] = entry; else sessions.push(entry);
      }
      const updated = await userProgressService.update(userProgressData.id, {
        weeklyWeights: JSON.stringify(data),
      });
      if (updated) setUserProgressData(updated);
    } catch (e) {
      console.error('❌ Mock pending all failed:', e);
    }
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
            
            {/* Workout Timer */}
            <View style={styles.timerContainer}>
              <Icon name="watch" size={20} color={colors.primary} />
              <Text style={styles.timerText}>{formattedTime}</Text>
            </View>
            
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
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity style={[styles.finishButton, { backgroundColor: colors.primary }]} onPress={handleMockAllCompleted}>
                <Text style={styles.finishButtonText}>Mock: All Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.finishButton, { backgroundColor: colors.darkGray }]} onPress={handleMockAllPending}>
                <Text style={styles.finishButtonText}>Mock: All Pending</Text>
              </TouchableOpacity>
            </View>
            {allExercisesCompleted && (
              <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
                <Text style={styles.finishButtonText}>Finish Workout</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(58, 81, 153, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(58, 81, 153, 0.3)',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
    fontFamily: 'monospace',
    letterSpacing: 2,
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
  finishButton: {
    marginTop: 16,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
