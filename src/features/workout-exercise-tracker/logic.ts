import { useState, useEffect, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { useTimerStore } from '@/store/timer-store';
import { wizardResultsService, userProgressService } from '@/db/services';

export const useWorkoutExerciseTrackerLogic = () => {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { user } = useAuthStore();
  const { sessionId, exercises: sessionExercises, getExerciseById } = useActiveWorkout();
  const { isWorkoutActive, timeElapsed, updateTimeElapsed } = useTimerStore();
  
  // --- STATE ---
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  
  const isCustomExercise = exerciseId?.startsWith('custom-');
  
  // Complete button state passed up from Child Component
  const [completeButtonState, setCompleteButtonState] = useState<{
    allCompleted: boolean;
    isCompleting: boolean;
    isLoading: boolean;
    onComplete: () => void;
  } | null>(null);

  // --- EFFECTS ---

  useEffect(() => {
    console.log('🔄 [WorkoutExerciseTracker] Component mounted/updated');
    console.log('📋 [WorkoutExerciseTracker] exerciseId:', exerciseId);
    console.log('📋 [WorkoutExerciseTracker] sessionId:', sessionId);
    console.log('📋 [WorkoutExerciseTracker] sessionExercises count:', sessionExercises?.length);
    loadExerciseData();
  }, [exerciseId, user, sessionId]);

  // Update timer every second when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      const interval = setInterval(() => {
        updateTimeElapsed();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWorkoutActive, updateTimeElapsed]);

  useEffect(() => {
    // Only show loading overlay if exercise is completed
    if (isExerciseCompleted) {
      setShowLoadingOverlay(true);
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isExerciseCompleted]);

  // --- DATA LOADING LOGIC ---

  const loadExerciseData = async () => {
    if (!user?.id || !exerciseId) {
      setLoading(false);
      return;
    }

    let progress: any = null;
    let program: any = null;
    let foundExercise: any = null;

    try {
      const cache = useWorkoutCacheStore.getState();
      
      // 1. Check for manual exercises FIRST
      if (exerciseId.startsWith('manual-')) {
        const manualWorkout = cache.manualWorkout;
        if (manualWorkout?.exercises) {
          const found = manualWorkout.exercises.find((ex: any) => ex.id === exerciseId);
          if (found) {
            foundExercise = {
              ...found,
              targetMuscle: found.targetMuscle || 'General',
              restTime: Math.min(found.restTime || 60, 120),
            };
            setIsExerciseCompleted(false);
            setExercise(foundExercise);
            setLoading(false);
            return; // Exit early for manual
          }
        }
      }
      
      // 2. Fetch User Progress (Check Cache -> Then DB)
      progress = cache.userProgressData;
      program = cache.generatedProgram;
      
      const needsFetch = !progress || !cache.isCacheValid();
      if (needsFetch) {
        progress = await userProgressService.getByUserId(user.id);
      }
      if (!progress) {
        progress = await userProgressService.getByUserId(user.id);
      }
      
      // 3. Check completion status from NEW system
      console.log('🔍 [WorkoutExerciseTracker] Checking exercise completion status...');
      console.log('📊 [WorkoutExerciseTracker] Looking for exerciseId:', exerciseId);
      
      let isCompleted = false;
      if (sessionId && exerciseId) {
        // Check NEW system (workout_sessions)
        const exerciseData = getExerciseById(exerciseId);
        console.log('🗄️ [WorkoutExerciseTracker] Exercise data from NEW system:', {
          found: !!exerciseData,
          status: exerciseData?.status,
          setsCount: exerciseData?.sets?.length,
          completedSets: exerciseData?.sets?.filter((s: any) => s.is_completed).length
        });
        
        if (exerciseData) {
          isCompleted = exerciseData.status === 'COMPLETED';
          console.log('✅ [WorkoutExerciseTracker] Exercise completion from NEW system:', isCompleted);
        }
      } else {
        console.log('⚠️ [WorkoutExerciseTracker] No sessionId - cannot check NEW system');
        
        // Fallback to OLD system (for legacy data)
        if (progress?.weeklyWeights) {
          const weeklyWeights = typeof progress.weeklyWeights === 'string'
            ? JSON.parse(progress.weeklyWeights)
            : progress.weeklyWeights;
          const today = new Date().toISOString().split('T')[0];
          const exerciseLogs = weeklyWeights?.exerciseLogs || {};
          const todaySession = exerciseLogs[exerciseId]?.find((session: any) => session.date === today);
          
          if (todaySession?.sets) {
            isCompleted = todaySession.sets.every((set: any) => set.isCompleted);
            console.log('📦 [WorkoutExerciseTracker] Exercise completion from OLD system:', isCompleted);
          }
        }
      }
      
      console.log('🎯 [WorkoutExerciseTracker] Final isCompleted status:', isCompleted);
      setIsExerciseCompleted(isCompleted);
      
      // 4. Find the Exercise Object
      if (exerciseId.startsWith('custom-')) {
        // A. Custom Exercises
        if (progress?.weeklyWeights) {
          const weeklyWeights = typeof progress.weeklyWeights === 'string'
            ? JSON.parse(progress.weeklyWeights)
            : progress.weeklyWeights;
          const today = new Date().toISOString().split('T')[0];
          const customExercises = weeklyWeights?.customExercises?.[today] || [];
          
          foundExercise = customExercises.find((ex: any) => ex.id === exerciseId);
          if (foundExercise) {
            foundExercise = {
              ...foundExercise,
              targetMuscle: foundExercise.targetMuscle || 'Custom',
              restTime: Math.min(foundExercise.restSeconds || 60, 120),
            };
          }
        }
      } else {
        // B. Template System (New)
        const currentWorkoutType = progress?.currentWorkout;
        if (currentWorkoutType) {
          const { getWorkoutTemplate } = await import('@/lib/workout-templates');
          const workoutTemplate = getWorkoutTemplate(currentWorkoutType);
          if (workoutTemplate) {
            const found = workoutTemplate.exercises.find((ex) => ex.id === exerciseId);
            if (found) {
              foundExercise = {
                ...found,
                restTime: Math.min(found.restTime || 60, 120),
              };
            }
          }
        }
        
        // C. Legacy Program Fallback
        if (!foundExercise) {
          if (!program) {
            const wizardResults = await wizardResultsService.getByUserId(user.id);
            if ((wizardResults as any)?.generatedSplit) {
              program = typeof (wizardResults as any).generatedSplit === 'string'
                ? JSON.parse((wizardResults as any).generatedSplit)
                : (wizardResults as any).generatedSplit;
            }
          }
          
          if (program) {
            const programData = typeof program === 'string' ? JSON.parse(program) : program;
            for (const workout of programData.weeklyStructure || []) {
              const found = workout.exercises?.find((ex: any) => 
                ex.id === exerciseId || ex.name.replace(/\s+/g, '-').toLowerCase() === exerciseId
              );
              if (found) {
                foundExercise = {
                  ...found,
                  id: found.id || found.name.replace(/\s+/g, '-').toLowerCase(),
                  targetMuscle: found.targetMuscle || 'General',
                  restTime: Math.min(found.restSeconds || 60, 120),
                };
                break;
              }
            }
          }
        }
        
        // D. Static DB Fallback
        if (!foundExercise) {
          try {
            const { exerciseDatabase } = await import('@/constants/exercise-database');
            const dbExercise = exerciseDatabase.find(ex => ex.id === exerciseId);
            if (dbExercise) {
              foundExercise = {
                id: dbExercise.id,
                name: dbExercise.name,
                targetMuscle: dbExercise.targetMuscle,
                sets: 3, reps: '10', restTime: 60, notes: '',
              };
            }
          } catch (error) {
            console.error('❌ Error loading from exercise database:', error);
          }
        }
      }

      setExercise(foundExercise);
      if (progress) setUserProgressData(progress);
      
    } catch (error) {
      console.error('❌ Failed to load exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomExercise = async () => {
    Alert.alert('Delete Exercise', `Remove "${exercise?.name}" from today's workout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!user?.id || !exerciseId) return;
            const progress = await userProgressService.getByUserId(user.id);
            if (progress?.weeklyWeights) {
              const weeklyWeights = typeof progress.weeklyWeights === 'string' ? JSON.parse(progress.weeklyWeights) : progress.weeklyWeights;
              const today = new Date().toISOString().split('T')[0];
              
              if (weeklyWeights.customExercises && weeklyWeights.customExercises[today]) {
                weeklyWeights.customExercises[today] = weeklyWeights.customExercises[today].filter((ex: any) => ex.id !== exerciseId);
              }
              
              await userProgressService.update(progress.id, { weeklyWeights: JSON.stringify(weeklyWeights) });
              router.back();
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete exercise.');
          }
        },
      },
    ]);
  };

  const handleBackPress = useCallback(() => router.back(), []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // Stable noop for registerSave
  const noopRegisterSave = useCallback(() => {}, []);

  return {
    exercise,
    loading,
    showLoadingOverlay,
    userProgressData,
    completeButtonState,
    setCompleteButtonState, // Exposed for child component
    isCustomExercise,
    handleDeleteCustomExercise,
    handleBackPress,
    noopRegisterSave,
    // Timer
    formattedTime: formatTime(timeElapsed),
    isWorkoutActive,
  };
};