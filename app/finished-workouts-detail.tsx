import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { Feather as Icon } from '@expo/vector-icons';
import { formatDuration } from '@/utils/format-duration';

export default function FinishedWorkoutsDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { date, workoutIndex } = useLocalSearchParams<{ date: string; workoutIndex: string }>();
  const [program, setProgram] = useState<any>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, any[]>>({});
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [workoutPercentage, setWorkoutPercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const wiz = await wizardResultsService.getByUserId(user.id);
        if (wiz?.generatedSplit) {
          try { setProgram(JSON.parse(wiz.generatedSplit)); } catch {}
        }
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.weeklyWeights) {
          try {
            const ww = JSON.parse(progress.weeklyWeights as unknown as string);
            setExerciseLogs(ww.exerciseLogs || {});
            
            // Load custom exercises for this date
            if (date && ww.customExercises) {
              const dateKey = String(date).slice(0, 10);
              setCustomExercises(ww.customExercises[dateKey] || []);
            }
          } catch {}
        }
        
        // Get workout duration from completed workouts
        if (progress?.completedWorkouts && date) {
          try {
            const completedData = JSON.parse(progress.completedWorkouts as unknown as string) || [];
            const workoutEntry = completedData.find((item: any) => 
              typeof item === 'object' && 
              item.date && 
              new Date(item.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0] &&
              item.workoutIndex === parseInt(workoutIndex || '0', 10)
            );
            
            if (workoutEntry?.duration) {
              setWorkoutDuration(workoutEntry.duration);
            }
            if (workoutEntry?.percentageSuccess !== undefined) {
              setWorkoutPercentage(workoutEntry.percentageSuccess);
            }
          } catch (error) {
            console.error('Error parsing completed workouts:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, date, workoutIndex]);

  const workout = program?.weeklyStructure?.[parseInt(workoutIndex || '0', 10)];
  const dateKey = String(date || '').slice(0, 10);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{workout?.name || 'Finished Workout'}</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.workoutHeader}>
            <Text style={styles.dateText}>{new Date(String(date)).toLocaleString()}</Text>
            <View style={styles.metaRow}>
              {workoutDuration && (
                <View style={styles.durationContainer}>
                  <Icon name="clock" size={16} color={colors.primary} />
                  <Text style={styles.durationText}>{formatDuration(workoutDuration)}</Text>
                </View>
              )}
              {workoutPercentage !== null && (
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageText}>{workoutPercentage}% Complete</Text>
                </View>
              )}
            </View>
          </View>
          {workout?.exercises?.map((ex: any, i: number) => {
            const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
            const sessions = exerciseLogs[exId] || [];
            const sessionForDay = sessions.find((s: any) => s.date === dateKey);
            const isCompleted = !!sessionForDay && sessionForDay.sets && sessionForDay.sets.some((set: any) => set.isCompleted);
            
            return (
              <View key={i} style={{ marginTop: 8 }}>
                <View style={styles.exerciseHeader}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Icon name="check-circle" size={14} color={colors.success} />
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.notCompletedBadge}>
                      <Icon name="circle" size={14} color={colors.lightGray} />
                      <Text style={styles.notCompletedBadgeText}>Not Completed</Text>
                    </View>
                  )}
                </View>
                <ExerciseTracker
                  exercise={{
                    id: exId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restSeconds || 60,
                    targetMuscle: ex.targetMuscle || 'General',
                  }}
                  exerciseKey={exId}
                  readOnly
                  presetSession={sessionForDay ? { unit: sessionForDay.unit || 'kg', sets: sessionForDay.sets || [] } : undefined}
                />
              </View>
            );
          })}
          
          {/* Custom Exercises */}
          {customExercises.map((ex: any, i: number) => {
            const exId = ex.id;
            const sessions = exerciseLogs[exId] || [];
            const sessionForDay = sessions.find((s: any) => s.date === dateKey);
            const isCompleted = !!sessionForDay && sessionForDay.sets && sessionForDay.sets.some((set: any) => set.isCompleted);
            
            return (
              <View key={exId} style={{ marginTop: 8 }}>
                <View style={styles.exerciseHeader}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Icon name="check-circle" size={14} color={colors.success} />
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.notCompletedBadge}>
                      <Icon name="circle" size={14} color={colors.lightGray} />
                      <Text style={styles.notCompletedBadgeText}>Not Completed</Text>
                    </View>
                  )}
                </View>
                <ExerciseTracker
                  exercise={{
                    id: exId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restSeconds || 60,
                    targetMuscle: ex.targetMuscle || 'Custom',
                  }}
                  exerciseKey={exId}
                  readOnly
                  presetSession={sessionForDay ? { unit: sessionForDay.unit || 'kg', sets: sessionForDay.sets || [] } : undefined}
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: { marginRight: 16, padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 24 },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: { 
    color: colors.lighterGray, 
    fontSize: 16,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  percentageText: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '600',
  },
  exerciseHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completedBadgeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  notCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  notCompletedBadgeText: {
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: '500',
  },
});


