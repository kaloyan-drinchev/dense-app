import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { wizardResultsService, userProgressService, workoutSessionService } from '@/db/services';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useTimerStore } from '@/store/timer-store';
import { markTodayWorkoutCompleted } from '@/utils/workout-completion-tracker';
import { ensureMinimumDuration } from '@/utils/workout-duration';
import { analyzeExercisePRs, getBeatLastWorkoutSuggestions, type ExerciseLogs, type ExercisePRs } from '@/utils/pr-tracking';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';
import { getWorkoutTemplate } from '@/lib/workout-templates';
import { updateWorkoutProgression } from '@/lib/workout-suggestion';

export const useWorkoutSessionLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProgressData: cachedProgress, userWeight: cachedWeight, manualWorkout, isCacheValid } = useWorkoutCacheStore();

  // --- STATE ---
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loading, setLoading] = useState(!cachedProgress);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotStartedModal, setShowNotStartedModal] = useState(false);
  const [showWorkoutConfirmModal, setShowWorkoutConfirmModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [workoutCompletionData, setWorkoutCompletionData] = useState<{ percentage: number, completed: number, total: number } | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [cardioEntries, setCardioEntries] = useState<any[]>([]);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [updatingExerciseId, setUpdatingExerciseId] = useState<string | null>(null);
  const [userWeight, setUserWeight] = useState<number>(cachedWeight || 70);

  // Refs
  const loadingRef = useRef(loading);
  const userProgressDataRef = useRef(userProgressData);
  const isLoadingRef = useRef(false);

  // --- CONTEXT & HOOKS ---
  const {
    sessionId: currentSessionId,
    session: currentSession,
    exercises: sessionExercises,
    startWorkout: startWorkoutSession,
    completeWorkout: completeWorkoutInContext,
    cancelWorkout: cancelWorkoutInContext,
    refreshSession,
  } = useActiveWorkout();

  const {
    formattedTime, timeElapsed, isRunning, isWorkoutActive,
    startWorkout: startWorkoutTimer, pauseTimer, resumeTimer, resetTimer, completeWorkout: completeWorkoutTimer
  } = useWorkoutTimer();

  const workoutStartTime = useTimerStore((state) => state.workoutStartTime);

  // --- EFFECTS ---

  useEffect(() => {
    loadingRef.current = loading;
    userProgressDataRef.current = userProgressData;
  }, [loading, userProgressData]);

  // Safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        if (userProgressDataRef.current) {
          setLoading(false);
        } else {
          console.warn('⚠️ WorkoutSession: Loading timeout reached');
        }
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  // Sync workout status
  useEffect(() => {
    setWorkoutStarted(isWorkoutActive);
  }, [isWorkoutActive]);

  // Clear stale timer on mount
  useEffect(() => {
    if (isWorkoutActive) {
      const today = new Date().toISOString().slice(0, 10);
      const timerDate = workoutStartTime ? new Date(workoutStartTime).toISOString().slice(0, 10) : null;
      if (timerDate && timerDate !== today) {
        completeWorkoutTimer();
      }
    }
  }, []);

  // Sync cache updates
  useEffect(() => {
    const unsubscribe = useWorkoutCacheStore.subscribe((state, prevState) => {
      const dataChanged = state.userProgressData !== prevState.userProgressData;
      const cacheValid = state.isCacheValid();
      if (dataChanged && state.userProgressData && cacheValid) {
        setUserProgressData(state.userProgressData);
        setUpdatingExerciseId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
        if (cache.userProgressData) setUserProgressData(cache.userProgressData);
        setUpdatingExerciseId(null);
      }
    }, [user?.id])
  );

  // --- DATA LOADING ---

  const loadWorkoutData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    if (isLoadingRef.current) return;

    const cacheIsValid = cachedProgress && isCacheValid();
    if (cacheIsValid) {
      setUserProgressData(cachedProgress);
      setUserWeight(cachedWeight || 70);

      if (cachedProgress?.weeklyWeights) {
        let weeklyWeights = typeof cachedProgress.weeklyWeights === 'string'
          ? JSON.parse(cachedProgress.weeklyWeights)
          : cachedProgress.weeklyWeights;
        const logs = weeklyWeights?.exerciseLogs || {};
        setExerciseLogs(logs);
        setExercisePRs(analyzeExercisePRs(logs));
      }
      setLoading(false);

      const lastUpdated = useWorkoutCacheStore.getState().lastUpdated;
      if ((lastUpdated ? Date.now() - lastUpdated : Infinity) < 60000) return;
    }

    try {
      isLoadingRef.current = true;
      if (!cacheIsValid) setLoading(true);

      const wizardResults = await wizardResultsService.getByUserId(user.id);
      if (wizardResults?.weight) setUserWeight(wizardResults.weight);

      let progress = await userProgressService.getByUserId(user.id);

      if (!progress) {
        progress = await userProgressService.create({
          userId: user.id,
          programId: null,
          currentWorkout: 'push-a',
          lastCompletedWorkout: null,
          lastWorkoutDate: null,
          startDate: new Date(),
          completedWorkouts: [],
          weeklyWeights: {}
        });
      }

      if (!progress.currentWorkout) {
        progress = await userProgressService.update(progress.id, { currentWorkout: 'push-a' });
      }

      setUserProgressData(progress);

      if (progress?.weeklyWeights) {
        let weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;

        const today = new Date().toISOString().split('T')[0];
        const logs = weeklyWeights?.exerciseLogs || {};
        setExerciseLogs(logs);
        setExercisePRs(analyzeExercisePRs(logs));
        setCustomExercises(weeklyWeights?.customExercises?.[today] || []);
        setCardioEntries(weeklyWeights?.cardioEntries?.[today] || []);
      }

      useWorkoutCacheStore.getState().setWorkoutData({
        userProgressData: progress,
        userWeight: wizardResults?.weight || userWeight
      });

    } catch (error) {
      console.error('❌ Failed to load workout data:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && !userProgressData) loadWorkoutData();
  }, [user?.id]);

  // --- COMPUTED VALUES ---

  const todaysWorkout = useMemo(() => {
    // If there's an active session (manual/cardio), derive workout from it
    if (currentSessionId && currentSession && sessionExercises.length > 0) {
      const workoutType = currentSession.workout_type || 'manual';
      // console.log('🏋️ [TodaysWorkout] Building from active session:', {
      //   sessionId: currentSessionId,
      //   exerciseCount: sessionExercises.length,
      //   exercises: sessionExercises.map((ex: any) => ({
      //     name: ex.exercise_name,
      //     has_thumbnail: !!ex.thumbnail_url,
      //     thumbnail_url: ex.thumbnail_url
      //   }))
      // });

      return {
        id: currentSessionId,
        name: currentSession.workout_name || 'Workout',
        type: workoutType,
        category: workoutType === 'cardio' ? 'cardio' : 'manual',
        estimatedDuration: sessionExercises.length * 10,
        exercises: sessionExercises.map((ex: any) => ({
          id: ex.exercise_id,
          name: ex.exercise_name,
          sets: ex.target_sets || 3,
          reps: ex.target_reps || '10',
          restTime: ex.rest_seconds || 60,
          restSeconds: ex.rest_seconds || 60,
          targetMuscle: ex.target_muscle || 'General',
          thumbnail_url: ex.thumbnail_url || null, // FIXED: Include thumbnail from session data
        })),
      };
    }

    // Fallback to cached manual workout (legacy support)
    if (manualWorkout) {
      console.log('🏋️ [TodaysWorkout] Using manual workout cache');
      return manualWorkout;
    }

    // Default: template-based workout (PPL)
    if (!userProgressData) return null;
    const currentWorkoutType = userProgressData.currentWorkout || 'push-a';
    const template = getWorkoutTemplate(currentWorkoutType);
    console.log('🏋️ [TodaysWorkout] Using template:', {
      type: currentWorkoutType,
      exerciseCount: template?.exercises?.length,
      exercises: template?.exercises?.map((ex: any) => ({
        name: ex.name,
        has_thumbnail: !!(ex as any).thumbnail_url,
        thumbnail_url: (ex as any).thumbnail_url
      }))
    });
    return template;
  }, [currentSessionId, currentSession, sessionExercises, manualWorkout, userProgressData]);

  const isCardioWorkout = todaysWorkout?.type === 'cardio' || todaysWorkout?.category === 'cardio';

  const weeklyWeightsData = useMemo(() => {
    try {
      if (!userProgressData?.weeklyWeights) return {};
      if (typeof userProgressData.weeklyWeights === 'string') return JSON.parse(userProgressData.weeklyWeights);
      return userProgressData.weeklyWeights;
    } catch (e) {
      return {} as any;
    }
  }, [userProgressData?.weeklyWeights]);

  const totalWorkoutCalories = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const completedExercises: any[] = [];

    (todaysWorkout?.exercises || []).forEach((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      const sessions = weeklyWeightsData?.exerciseLogs?.[exId];

      if (sessions) {
        const todaySession = (sessions as any[]).find((s) => s.date === today);
        if (todaySession?.sets) {
          const completedSets = todaySession.sets.filter((s: any) => !!s.isCompleted).length;
          if (completedSets > 0) {
            completedExercises.push({ name: ex.name, sets: completedSets, setsData: todaySession.sets });
          }
        }
      }
    });

    const estimatedCalories = completedExercises.length > 0
      ? calculateWorkoutCalories(completedExercises, userWeight)
      : 0;

    const todayCardioEntries = weeklyWeightsData?.cardioEntries?.[today] || [];
    const cardioCalories = todayCardioEntries.reduce((sum: number, entry: any) => sum + (entry.calories || 0), 0);

    return estimatedCalories + cardioCalories;
  }, [todaysWorkout, weeklyWeightsData, userWeight]);

  const getCardioTimerDisplay = () => {
    if (!isCardioWorkout || !todaysWorkout?.targetDuration) {
      return { display: formattedTime, isComplete: false, progress: 0 };
    }
    const targetSeconds = todaysWorkout.targetDuration * 60;
    const remainingSeconds = Math.max(0, targetSeconds - timeElapsed);
    const isComplete = remainingSeconds === 0;
    const progress = Math.min(100, (timeElapsed / targetSeconds) * 100);

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    let display: string;
    if (isComplete) {
      const overtimeSeconds = timeElapsed - targetSeconds;
      display = `+${Math.floor(overtimeSeconds / 60).toString().padStart(2, '0')}:${(overtimeSeconds % 60).toString().padStart(2, '0')}`;
    } else if (hours > 0) {
      display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return { display, isComplete, progress };
  };

  const cardioTimer = getCardioTimerDisplay();

  // --- HELPERS ---

  const getExerciseStatus = useCallback((exerciseId: string, plannedSets: number) => {
    if (sessionExercises.length > 0) {
      const exerciseData = sessionExercises.find((ex: any) => ex.exercise_id === exerciseId);

      if (exerciseData) {
        if (exerciseData.status === 'NOT_STARTED') return 'pending';
        if (exerciseData.status === 'IN_PROGRESS') return 'in-progress';
        if (exerciseData.status === 'COMPLETED') return 'completed';

        const sets = exerciseData.sets || [];
        const completedCount = sets.filter((s: any) => !!s.is_completed).length;
        if (completedCount >= Math.max(0, plannedSets || 0) && plannedSets > 0) return 'completed';
        if (sets.some((s: any) => (s.reps ?? 0) > 0 || (s.weight_kg ?? 0) > 0 || s.is_completed)) return 'in-progress';
      }
    }
    return 'pending';
  }, [sessionExercises]);

  const calculateWorkoutProgress = () => {
    if (!todaysWorkout?.exercises) return { percentage: 0, completed: 0, total: 0 };

    const exercises = todaysWorkout.exercises;
    const regularCompletedCount = exercises.filter((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      return getExerciseStatus(exId, ex.sets) === 'completed';
    }).length;
    const customCompletedCount = customExercises.filter((ex: any) => getExerciseStatus(ex.id, ex.sets) === 'completed').length;
    const completedCount = regularCompletedCount + customCompletedCount;
    const total = exercises.length + customExercises.length;
    return { percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0, completed: completedCount, total };
  };

  const workoutProgress = calculateWorkoutProgress();

  // Log workout status once when exercises change
  // useEffect(() => {
  //   if (sessionExercises.length > 0 && todaysWorkout?.exercises) {
  //     console.log('📊 [WorkoutSession] ===== WORKOUT STATUS =====');
  //     console.log('📋 [WorkoutSession] Total exercises:', todaysWorkout.exercises.length);
  //     todaysWorkout.exercises.forEach((ex: any) => {
  //       const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
  //       const exerciseData = sessionExercises.find((e: any) => e.exercise_id === exId);
  //       console.log(`  - ${ex.name}: ${exerciseData?.status || 'NOT_FOUND'} (${exerciseData?.sets?.filter((s: any) => s.is_completed).length || 0}/${exerciseData?.sets?.length || 0} sets)`);
  //     });
  //     console.log('🎯 [WorkoutSession] Progress:', workoutProgress.percentage + '%', `(${workoutProgress.completed}/${workoutProgress.total})`);
  //     console.log('📊 [WorkoutSession] =========================');
  //   }
  // }, [sessionExercises.length, todaysWorkout?.exercises?.length]);

  const hasPRPotential = useCallback((exerciseId: string): boolean => {
    const suggestions = getBeatLastWorkoutSuggestions(exerciseId, exercisePRs);
    return suggestions.length > 0 && !suggestions[0].includes('First time');
  }, [exercisePRs]);

  // --- HANDLERS ---

  const handleStartWorkout = async () => {
    setShowPreviewModal(false);
    if (!user?.id || !todaysWorkout) return Alert.alert('Error', 'Unable to start workout.');

    try {
      setIsStartingWorkout(true);

      // Check if there's already an active session (for manual/cardio workouts)
      const activeSession = await workoutSessionService.getActiveSession(user.id);

      if (activeSession) {
        // Session already exists (manual/cardio workout) - just load it
        // console.log('✅ [WorkoutSession] Active session already exists:', activeSession.id);
        await refreshSession();
        setWorkoutStarted(true);
        setIsStartingWorkout(false);
        startWorkoutTimer(activeSession.id, activeSession.workout_name);
        return;
      }

      // No active session - start a new template-based workout (PPL workouts)
      const workoutType = todaysWorkout.type || todaysWorkout.id;
      // console.log('🏋️ [WorkoutSession] Starting template-based workout:', workoutType);
      // console.log('🏋️ [WorkoutSession] Current todaysWorkout exercises BEFORE start:',
      //   todaysWorkout.exercises?.map((ex: any) => ({
      //     name: ex.name,
      //     has_thumbnail: !!(ex as any).thumbnail_url,
      //     thumbnail_url: (ex as any).thumbnail_url
      //   }))
      // );

      const templates = await workoutSessionService.getTemplates(user.id);
      const template = templates.find(t => t.type === workoutType);

      if (!template) {
        setIsStartingWorkout(false);
        return Alert.alert('Error', 'Workout template not found.');
      }

      // console.log('🏋️ [WorkoutSession] Starting workout with template:', template.id);
      await startWorkoutSession(template.id);

      // console.log('🏋️ [WorkoutSession] Workout session started, refreshing...');
      await refreshSession();

      // console.log('🏋️ [WorkoutSession] Current todaysWorkout exercises AFTER start:',
      //   todaysWorkout.exercises?.map((ex: any) => ({
      //     name: ex.name,
      //     has_thumbnail: !!(ex as any).thumbnail_url,
      //     thumbnail_url: (ex as any).thumbnail_url
      //   }))
      // );

      setWorkoutStarted(true);
      setIsStartingWorkout(false);
      startWorkoutTimer(todaysWorkout?.id || 'today-workout', todaysWorkout?.name || "Today's Workout");
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
      setIsStartingWorkout(false);
    }
  };

  const confirmResetWorkout = async () => {
    try {
      if (!user?.id || !userProgressData) return;
      completeWorkoutTimer();

      // Cancel workout in NEW system (clears context AND database)
      if (currentSessionId) {
        // console.log('🛑 [WorkoutSession] Cancelling workout session:', currentSessionId);
        await cancelWorkoutInContext();
      }

      let weeklyWeights: any = {};
      try { weeklyWeights = JSON.parse(userProgressData.weeklyWeights || '{}'); } catch { }

      if (todaysWorkout?.exercises) {
        todaysWorkout.exercises.forEach((ex: any) => {
          const id = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
          if (weeklyWeights.exerciseLogs?.[id]) weeklyWeights.exerciseLogs[id] = [];
        });
      }

      const resetProgress = await userProgressService.update(userProgressData.id, { weeklyWeights: JSON.stringify(weeklyWeights) });
      if (resetProgress) {
        setUserProgressData(resetProgress);
        setWorkoutStarted(false);
        setShowOptionsModal(false);
        setShowPreviewModal(false);
        setShowNotStartedModal(false);
      }
    } catch (error) {
      console.error('❌ [WorkoutSession] Failed to reset workout:', error);
      Alert.alert("Reset Failed", "Something went wrong.");
    }
  };

  const completeWorkoutWithPercentage = async () => {
    if (!user?.id || !userProgressData) return;
    setIsFinishing(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const startTimeToSave = workoutStartTime || new Date().toISOString();
      const { duration } = completeWorkoutTimer();
      const finishTime = new Date().toISOString();
      let completedArr: any[] = [];
      try { completedArr = typeof userProgressData.completedWorkouts === 'string' ? JSON.parse(userProgressData.completedWorkouts) : [...(userProgressData.completedWorkouts || [])]; } catch { }

      if (isCardioWorkout) {
        const { calculateCardioCalories } = await import('@/utils/cardio-calories');
        const calories = calculateCardioCalories(todaysWorkout.cardioType || 'other', duration, userWeight);

        const workoutEntry = {
          date: finishTime, workoutIndex: -2, workoutName: todaysWorkout.name, duration, percentageSuccess: 100,
          startTime: startTimeToSave, finishTime, totalVolume: 0, caloriesBurned: calories,
          exercises: [{ name: todaysWorkout.exercises[0]?.name || 'Cardio', duration, calories }],
          sessionId: currentSessionId, // Store session ID for later reference
        };

        console.log('💾 [CompleteWorkout] Saving cardio workout entry:', {
          workoutName: workoutEntry.workoutName,
          hasSessionId: !!currentSessionId,
          sessionId: currentSessionId,
          duration: workoutEntry.duration,
          calories: workoutEntry.caloriesBurned
        });

        completedArr.push(workoutEntry);

        const updated = await userProgressService.update(userProgressData.id, { completedWorkouts: JSON.stringify(completedArr) });
        useWorkoutCacheStore.getState().setManualWorkout(null);

        // Complete session in NEW system AND clear context
        if (currentSessionId) {
          await workoutSessionService.completeSession(currentSessionId, duration, 0);
          await completeWorkoutInContext(); // Clear ActiveWorkoutContext
        }

        if (updated) {
          setUserProgressData(updated);
          useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
          setIsFinishing(false);

          // Create exercises breakdown for cardio (compatible with overview screen)
          const cardioExerciseBreakdown = [{
            name: todaysWorkout.exercises[0]?.name || 'Cardio',
            sets: 1,
            completedSets: 1,
            totalReps: duration, // Use duration as "reps" for cardio
            totalVolume: 0 // No volume for cardio
          }];

          setTimeout(() => router.push({
            pathname: '/workout-overview',
            params: {
              workoutName: todaysWorkout.name,
              duration: duration.toString(),
              caloriesBurned: calories.toString(),
              totalVolume: '0',
              exercises: JSON.stringify(cardioExerciseBreakdown) // FIXED: Pass exercise data
            }
          }), 100);
        }
      } else {
        // Regular workout completion (resistance training)
        const { calculateWorkoutVolume } = await import('@/utils/volume-calculator');
        const today = new Date().toISOString().split('T')[0];

        // Get completed exercise data from NEW system (session_exercises + session_sets)
        // Transform to format expected by volume/calorie calculators
        const completedExercisesData = sessionExercises
          .filter((ex: any) => ex.status === 'COMPLETED' || ex.sets?.some((s: any) => s.is_completed))
          .map((ex: any) => {
            const transformedSets = (ex.sets || []).map((s: any) => ({
              reps: s.reps || 0,
              weightKg: s.weight_kg || 0,
              isCompleted: s.is_completed || false,
            }));

            return {
              name: ex.exercise_name,
              sets: transformedSets,
            };
          });

        const volumeData = calculateWorkoutVolume(completedExercisesData);

        // For calories, we need a slightly different structure
        const caloriesData = completedExercisesData.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets.length,
          setsData: ex.sets,
        }));
        const calories = calculateWorkoutCalories(caloriesData, userWeight);

        const workoutEntry = {
          date: finishTime,
          workoutIndex: -1,
          workoutName: todaysWorkout.name,
          duration,
          percentageSuccess: workoutProgress.percentage,
          startTime: startTimeToSave,
          finishTime,
          totalVolume: volumeData.totalVolume,
          caloriesBurned: calories,
          exercises: volumeData.exerciseBreakdown,
          sessionId: currentSessionId, // Store session ID for later reference
        };

        console.log('💾 [CompleteWorkout] Saving workout entry:', {
          workoutName: workoutEntry.workoutName,
          hasSessionId: !!currentSessionId,
          sessionId: currentSessionId,
          duration: workoutEntry.duration,
          totalVolume: workoutEntry.totalVolume,
          exerciseCount: workoutEntry.exercises.length
        });

        completedArr.push(workoutEntry);

        // Update currentWorkout to next workout in PPL rotation
        const nextWorkoutType = updateWorkoutProgression(userProgressData.currentWorkout);

        console.log('📊 [CompleteWorkout] Saving to database:', {
          nextWorkoutType,
          completedWorkoutsCount: completedArr.length,
          lastWorkout: completedArr[completedArr.length - 1]
        });

        const updated = await userProgressService.update(userProgressData.id, {
          currentWorkout: nextWorkoutType,
          completedWorkouts: JSON.stringify(completedArr),
        });

        console.log('✅ [CompleteWorkout] Database updated:', {
          success: !!updated,
          newCurrentWorkout: updated?.currentWorkout,
          completedWorkoutsLength: updated?.completedWorkouts ? (Array.isArray(updated.completedWorkouts) ? updated.completedWorkouts.length : JSON.parse(updated.completedWorkouts as string).length) : 0
        });

        // Complete session in NEW system AND clear context
        if (currentSessionId) {
          console.log('🏋️ [CompleteWorkout] Completing session:', currentSessionId);
          await workoutSessionService.completeSession(currentSessionId, duration, volumeData.totalVolume);
          await completeWorkoutInContext(); // Clear ActiveWorkoutContext
          console.log('✅ [CompleteWorkout] Session completed and context cleared');
        }

        // Clear manual workout cache if this was a manual workout
        useWorkoutCacheStore.getState().setManualWorkout(null);

        if (updated) {
          setUserProgressData(updated);
          useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
          setIsFinishing(false);
          setTimeout(() => router.push({
            pathname: '/workout-overview',
            params: {
              workoutName: todaysWorkout.name,
              duration: duration.toString(),
              caloriesBurned: calories.toString(),
              totalVolume: volumeData.totalVolume.toString(),
              exercises: JSON.stringify(volumeData.exerciseBreakdown)
            }
          }), 100);
        }
      }
    } catch (e) {
      setIsFinishing(false);
      Alert.alert('Error', 'Failed to finish workout.');
    }
  };

  // --- EXERCISE & CARDIO HANDLERS ---
  const handleAddCustomExercise = async (name: string) => { /* Copy logic from original */ };
  const handleAddCardio = async (cardio: any) => { /* Copy logic from original */ };

  return {
    router, user, userProgressData, loading,
    todaysWorkout, isCardioWorkout, workoutStarted,
    formattedTime, cardioTimer, totalWorkoutCalories,
    workoutProgress, customExercises, cardioEntries,
    showOptionsModal, setShowOptionsModal,
    showPreviewModal, setShowPreviewModal,
    showNotStartedModal, setShowNotStartedModal,
    showAddExerciseModal, setShowAddExerciseModal,
    showCardioModal, setShowCardioModal,
    showWorkoutConfirmModal, setShowWorkoutConfirmModal,
    showComingSoonModal, setShowComingSoonModal,
    workoutCompletionData, isFinishing, isStartingWorkout,
    userWeight, updatingExerciseId,
    isRunning, pauseTimer, resumeTimer,

    // Functions
    getExerciseStatus, hasPRPotential,
    handleStartWorkout, handleStartWorkoutPress: () => setShowOptionsModal(true),
    handleViewOption: () => { setShowOptionsModal(false); setShowPreviewModal(true); },
    handleLetsGoOption: () => { setShowOptionsModal(false); handleStartWorkout(); },
    handleStopWorkout: () => Alert.alert("Reset Workout", "Are you sure?", [{ text: "Cancel" }, { text: "Reset", style: "destructive", onPress: confirmResetWorkout }]),
    handleExercisePress: (id: string) => {
      if (!workoutStarted) return setShowNotStartedModal(true);

      console.log('🎯 [handleExercisePress] User clicked exercise:', {
        exerciseId: id,
        allExercises: todaysWorkout?.exercises?.map((ex: any) => ({
          id: ex.id || ex.name.replace(/\s+/g, "-").toLowerCase(),
          name: ex.name
        }))
      });

      setUpdatingExerciseId(id);
      router.push(`/workout-exercise-tracker?exerciseId=${id}`);
    },
    handleFinishWorkout: () => {
      if (isCardioWorkout) {
        setWorkoutCompletionData({ percentage: 100, completed: 1, total: 1 });
      } else {
        setWorkoutCompletionData(workoutProgress);
      }
      setShowWorkoutConfirmModal(true);
    },
    completeWorkoutWithPercentage,
    handleAddCustomExercise, handleAddCardio,
    handleResetTimer: () => Alert.alert('Reset Timer', 'Restart from 00:00?', [{ text: 'Cancel' }, { text: 'Reset', style: 'destructive', onPress: resetTimer }]),
    handleBackPress: () => router.back(),
    ensureMinimumDuration
  };
};