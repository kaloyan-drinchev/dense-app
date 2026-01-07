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
import { calculateWorkoutCalories } from '@/utils/exercise-calories';
import { typography } from '@/constants/typography';

export default function FinishedWorkoutsDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { date, workoutName } = useLocalSearchParams<{ date: string; workoutName: string }>();
  const [workout, setWorkout] = useState<any>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, any[]>>({});
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [cardioEntries, setCardioEntries] = useState<any[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState<number | null>(null);
  const [workoutPercentage, setWorkoutPercentage] = useState<number | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null);
  const [workoutFinishTime, setWorkoutFinishTime] = useState<string | null>(null);
  const [userWeight, setUserWeight] = useState<number>(70);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [completedWorkoutEntry, setCompletedWorkoutEntry] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        // First, load the completed workout entry to get exercise data
        const progress = await userProgressService.getByUserId(user.id);
        let workoutEntry = null;
        
        if (progress?.completedWorkouts && date) {
          try {
            const completedData = Array.isArray(progress.completedWorkouts)
              ? progress.completedWorkouts
              : (typeof progress.completedWorkouts === 'string'
                  ? JSON.parse(progress.completedWorkouts)
                  : []);
            
            const normalizedWorkoutName = workoutName 
              ? String(workoutName).toLowerCase().trim()
              : '';
            
            workoutEntry = completedData.find((item: any) => {
              if (typeof item !== 'object' || !item.date) return false;
              const dateMatch = new Date(item.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
              if (!dateMatch) return false;
              const itemWorkoutName = item.workoutName 
                ? String(item.workoutName).toLowerCase().trim()
                : '';
              return itemWorkoutName === normalizedWorkoutName;
            });
            
            if (workoutEntry) {
              setCompletedWorkoutEntry(workoutEntry);
            }
          } catch (err) {
            console.error('Error parsing completed workouts:', err);
          }
        }
        
        // NEW SYSTEM: Load workout template based on workoutName
        if (workoutName && typeof workoutName === 'string') {
          // Parse workout name to get workout type (e.g., "Push Day - Chest Focus" -> "push-a")
          const lowerName = workoutName.toLowerCase();
          let workoutType = '';
          
          // Check if it's a cardio or manual workout
          if (lowerName.startsWith('cardio:') || lowerName.startsWith('manual:')) {
            // For cardio/manual workouts, use exercises from completed workout entry
            const exercisesFromEntry = workoutEntry?.exercises || [];
            
            setWorkout({
              id: 'cardio-manual',
              name: workoutName,
              type: lowerName.startsWith('manual:') ? 'manual' : 'cardio',
              category: lowerName.startsWith('manual:') ? 'manual' : 'cardio',
              estimatedDuration: 0,
              exercises: exercisesFromEntry,
            } as any);
            console.log('✅ Loaded cardio/manual workout:', workoutName, 'with', exercisesFromEntry.length, 'exercises');
          } else {
            // Match by focus keywords (updated for new naming)
            if (lowerName.includes('push') && lowerName.includes('chest')) {
              workoutType = 'push-a';
            } else if (lowerName.includes('push') && lowerName.includes('shoulder')) {
              workoutType = 'push-b';
            } else if (lowerName.includes('pull') && lowerName.includes('width')) {
              workoutType = 'pull-a';
            } else if (lowerName.includes('pull') && lowerName.includes('thickness')) {
              workoutType = 'pull-b';
            } else if (lowerName.includes('leg') && lowerName.includes('quad')) {
              workoutType = 'leg-a';
            } else if (lowerName.includes('leg') && lowerName.includes('hamstring')) {
              workoutType = 'leg-b';
            }
            // Fallback: Check for old naming format (day a/b) for backward compatibility
            else if (lowerName.includes('push') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) {
              workoutType = 'push-a';
            } else if (lowerName.includes('push') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) {
              workoutType = 'push-b';
            } else if (lowerName.includes('pull') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) {
              workoutType = 'pull-a';
            } else if (lowerName.includes('pull') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) {
              workoutType = 'pull-b';
            } else if (lowerName.includes('leg') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) {
              workoutType = 'leg-a';
            } else if (lowerName.includes('leg') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) {
              workoutType = 'leg-b';
            }
            
            console.log('🔍 Parsing workout name:', workoutName, '-> Type:', workoutType);
            
            if (workoutType) {
              const { getWorkoutTemplate } = await import('@/lib/workout-templates');
              const workoutTemplate = getWorkoutTemplate(workoutType);
              if (workoutTemplate) {
                setWorkout(workoutTemplate);
                console.log('✅ Loaded workout template:', workoutTemplate.name);
              }
        }
          }
        }
        
        const wiz = await wizardResultsService.getByUserId(user.id);
        if (wiz?.weight) {
          setUserWeight(wiz.weight);
        }
        
        // Use the progress we already loaded above
        if (progress?.weeklyWeights) {
          try {
            // Handle both string (JSON) and object (JSONB) types
            const ww = typeof progress.weeklyWeights === 'string'
              ? JSON.parse(progress.weeklyWeights)
              : progress.weeklyWeights;
            setExerciseLogs(ww.exerciseLogs || {});
            
            if (date && ww.customExercises) {
              const dateKey = String(date).slice(0, 10);
              setCustomExercises(ww.customExercises[dateKey] || []);
            }
            
            if (date && ww.cardioEntries) {
              const dateKey = String(date).slice(0, 10);
              setCardioEntries(ww.cardioEntries[dateKey] || []);
            }
          } catch {}
        }
        
        // Use the workoutEntry we already found above
            if (workoutEntry) {
              if (workoutEntry.duration) {
                setWorkoutDuration(workoutEntry.duration);
              }
              if (workoutEntry.percentageSuccess !== undefined) {
                setWorkoutPercentage(workoutEntry.percentageSuccess);
              }
              
              const finishTime = workoutEntry.finishTime || workoutEntry.date;
              if (finishTime) {
                setWorkoutFinishTime(finishTime);
              }
              
              if (workoutEntry.startTime) {
                setWorkoutStartTime(workoutEntry.startTime);
              } else if (finishTime && workoutEntry.duration) {
                const finishDate = new Date(finishTime);
            // duration is in minutes, convert to milliseconds: minutes * 60 * 1000
            const startDate = new Date(finishDate.getTime() - (workoutEntry.duration * 60000));
                setWorkoutStartTime(startDate.toISOString());
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, date, workoutName]);

  const dateKey = String(date || '').slice(0, 10);

  useEffect(() => {
    if (!workout || !date) return;
    
    const dateKey = String(date).slice(0, 10);
    const completedExercises: Array<{ 
      name: string; 
      sets: number;
      setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
    }> = [];
    
    workout.exercises?.forEach((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      const sessions = exerciseLogs[exId] || [];
      const sessionForDay = sessions.find((s: any) => s.date === dateKey);
      const sets = typeof ex.sets === 'number' ? ex.sets : 3;
      
      if (sessionForDay?.sets && sessionForDay.sets.length > 0) {
        completedExercises.push({
          name: ex.name,
          sets: sets,
          setsData: sessionForDay.sets
        });
      } else {
        completedExercises.push({
          name: ex.name,
          sets: sets
        });
      }
    });
    
    customExercises.forEach((ex: any) => {
      const exId = ex.id;
      const sessions = exerciseLogs[exId] || [];
      const sessionForDay = sessions.find((s: any) => s.date === dateKey);
      const sets = typeof ex.sets === 'number' ? ex.sets : 3;
      
      if (sessionForDay?.sets && sessionForDay.sets.length > 0) {
        completedExercises.push({
          name: ex.name,
          sets: sets,
          setsData: sessionForDay.sets
        });
      } else {
        completedExercises.push({
          name: ex.name,
          sets: sets
        });
      }
    });
    
    const exerciseCalories = completedExercises.length > 0 
      ? calculateWorkoutCalories(completedExercises, userWeight)
      : 0;
    
    const cardioCalories = cardioEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.calories || 0);
    }, 0);
    
    const total = exerciseCalories + cardioCalories;
    setTotalCalories(total);
  }, [workout, exerciseLogs, customExercises, cardioEntries, date, userWeight]);

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
            <View style={styles.headerLeft}>
              <Text style={styles.dateText}>{new Date(String(date)).toLocaleDateString()}</Text>
            </View>
            <View style={styles.headerRight}>
              {workoutPercentage !== null && (
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageText}>
                    {workoutPercentage === 100 ? '100% Completed' : `${workoutPercentage}%`}
                  </Text>
                </View>
              )}
              {totalCalories > 0 && (
                <View style={styles.caloriesContainer}>
                  <Icon name="zap" size={14} color={colors.primary} />
                  <Text style={styles.caloriesText}>~{totalCalories} cal</Text>
                </View>
              )}
            </View>
          </View>
          
          {totalCalories >= 200 && (
            <View style={styles.motivationalMessage}>
              <Text style={styles.motivationalText}>
                {totalCalories >= 500 
                  ? "🔥 This calorie burn is for LEGENDS! " 
                  : totalCalories >= 300
                  ? "💪 Incredible effort! You're absolutely CRUSHING it!"
                  : "⭐ Nice work! Keep PUSHING forward!"}
              </Text>
            </View>
          )}
          
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
          
          {/* Cardio Section */}
          {cardioEntries.length > 0 && (
            <View style={styles.cardioSection}>
              <Text style={styles.cardioSectionTitle}>Cardio</Text>
              {cardioEntries.map((cardio: any) => {
                const durationText = cardio.hours > 0 
                  ? `${cardio.hours}h ${cardio.minutes || 0}m`
                  : `${cardio.durationMinutes || cardio.minutes || 0}m`;
                
                return (
                  <View key={cardio.id} style={styles.cardioCard}>
                    <View style={styles.cardioCardContent}>
                      <Icon name="activity" size={20} color={colors.primary} />
                      <View style={styles.cardioCardInfo}>
                        <View style={styles.cardioCardHeader}>
                          <Text style={styles.cardioCardName}>{cardio.typeName}</Text>
                          <View style={styles.cardioCompletedBadge}>
                            <Icon name="check-circle" size={14} color={colors.success} />
                            <Text style={styles.cardioCompletedBadgeText}>Completed</Text>
                          </View>
                        </View>
                        <Text style={styles.cardioCardDetails}>
                          {durationText} • {cardio.calories} cal
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
    marginBottom: 12,
    width: '100%',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  dateText: { 
    color: colors.lighterGray, 
    fontSize: 14,
  },
  workoutTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  timeValue: {
    fontFamily: typography.workoutTimer.fontFamily,
    fontSize: 20,
    color: colors.white,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '600',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  caloriesText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  motivationalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  motivationalText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
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
  cardioSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  cardioSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  cardioCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  cardioCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardioCardInfo: {
    flex: 1,
  },
  cardioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardioCardName: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  cardioCardDetails: {
    fontSize: 14,
    color: colors.lightGray,
  },
  cardioCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  cardioCompletedBadgeText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
});


