import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { useTimerStore } from '@/store/timer-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { wizardResultsService, userProgressService, activeWorkoutSessionService } from '@/db/services';
import { getWorkoutTemplate } from '@/lib/workout-templates';
import { getAlternateWorkout, updateWorkoutProgression } from '@/lib/workout-suggestion';
import { checkWorkoutAvailability, type WorkoutAvailability } from '@/utils/workout-availability';

export const useHomeLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram } = useWorkoutStore();
  const { 
    generatedProgram: cachedProgram, 
    userProgressData: cachedProgress, 
    manualWorkout: cachedManualWorkout 
  } = useWorkoutCacheStore();
  
  const { 
    isWorkoutActive, 
    timeElapsed, 
    isRunning, 
    updateTimeElapsed, 
    pauseTimer, 
    resumeTimer,
    completeWorkout
  } = useTimerStore();

  const [currentTime, setCurrentTime] = useState(timeElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Data States
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [loadingProgram, setLoadingProgram] = useState(!cachedProgram);
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loadingProgress, setLoadingProgress] = useState(!cachedProgress);
  
  // Context Data
  const { sessionId, exercises } = useActiveWorkout();
  
  // UI Loading States
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRefreshingWorkout, setIsRefreshingWorkout] = useState(false);

  // Modals
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  
  // Availability
  const [workoutAvailability, setWorkoutAvailability] = useState<WorkoutAvailability | null>(null);

  // --- LOGIC: Load Program ---
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) {
      setLoadingProgram(false);
      return;
    }

    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (!wizardResults) {
        setLoadingProgram(false);
        return;
      }
      
      let prog = null;
      if ((wizardResults as any).generatedSplit) {
        try {
          const generatedSplit = typeof (wizardResults as any).generatedSplit === 'string' 
            ? JSON.parse((wizardResults as any).generatedSplit)
            : (wizardResults as any).generatedSplit;
          prog = generatedSplit;
        } catch (e) {
          console.warn('⚠️ Failed to parse legacy program');
        }
      }
      
      setGeneratedProgram(prog);
      if (prog) {
        useWorkoutCacheStore.getState().setWorkoutData({ generatedProgram: prog });
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
    } finally {
      setLoadingProgram(false);
    }
  }, [user?.id]);

  // --- LOGIC: Load Progress ---
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) {
      setLoadingProgress(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: progress });
      } else {
        const defaultProgress = await userProgressService.create({
          userId: user.id,
          programId: null,
          currentWorkout: 'push-a',
          lastCompletedWorkout: null,
          lastWorkoutDate: null,
          startDate: new Date(),
          completedWorkouts: [],
          weeklyWeights: {}
        });
        setUserProgressData(defaultProgress);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: defaultProgress });
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user?.id]);

  // --- EFFECTS ---
  
  // Initial Load
  useEffect(() => {
    if (!user?.id) {
      setLoadingProgram(false);
      setLoadingProgress(false);
      return;
    }

    const cache = useWorkoutCacheStore.getState();
    if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
      setGeneratedProgram(cache.generatedProgram);
      setUserProgressData(cache.userProgressData);
      setLoadingProgram(false);
      setLoadingProgress(false);
      
      const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
      if (cacheAge < 60000) return;
      
      Promise.allSettled([loadGeneratedProgram(), loadUserProgress()])
        .then((results) => {
             // Optional: handle errors
        });
      return;
    }

    loadGeneratedProgram();
    loadUserProgress();
  }, [user?.id, loadGeneratedProgram, loadUserProgress]);

  // Availability Check
  useEffect(() => {
    if (user?.id && generatedProgram && userProgressData) {
      checkAvailability();
    }
  }, [user?.id, generatedProgram, userProgressData]);

  // Focus Effect (Refresh on return)
  useFocusEffect(
    useCallback(() => {
      const cache = useWorkoutCacheStore.getState();
      const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      if (cacheAge < 3000) {
        setIsRefreshingWorkout(true);
        timeoutId = setTimeout(() => {
          loadUserProgress()
            .then(() => setIsRefreshingWorkout(false))
            .catch(() => setIsRefreshingWorkout(false));
        }, 300);
      } else {
        loadUserProgress();
      }
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [loadUserProgress])
  );

  // Timer Effect
  useEffect(() => {
    if (isWorkoutActive) {
      intervalRef.current = setInterval(() => {
        updateTimeElapsed();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isWorkoutActive, updateTimeElapsed]);

  useEffect(() => {
    setCurrentTime(timeElapsed);
  }, [timeElapsed]);

  // --- HELPER FUNCTIONS ---

  const checkAvailability = async () => {
    if (!user?.id || !generatedProgram || !userProgressData) return;
    try {
      const availability = await checkWorkoutAvailability(
        user.id,
        generatedProgram,
        userProgressData
      );
      setWorkoutAvailability(availability);
    } catch (error) {
      console.error('❌ Failed to check availability:', error);
    }
  };

  const getNextWorkout = () => {
    if (cachedManualWorkout) return cachedManualWorkout;
    if (!userProgressData) return null;
    return getWorkoutTemplate(userProgressData.currentWorkout || 'push-a');
  };

  const nextWorkout = useMemo(() => getNextWorkout(), [cachedManualWorkout, userProgressData]);

  const calculateWorkoutStreak = (completedWorkouts: any[], trainingSchedule: string[]) => {
    if (!completedWorkouts || !trainingSchedule || trainingSchedule.length === 0) return 0;
    
    try {
      // Get all workout dates, sorted descending (most recent first)
      const workoutDates = completedWorkouts
        .filter(w => typeof w === 'object' && w.date && w.workoutName)
        .map(w => new Date(w.date).toISOString().split('T')[0])
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      if (workoutDates.length === 0) return 0;

      // Convert workout dates to Set for O(1) lookup
      const workoutDateSet = new Set(workoutDates);
      
      // Map training schedule to day indices (0 = Sunday, 1 = Monday, etc.)
      const dayNameToIndex: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      const scheduledDayIndices = trainingSchedule
        .map(day => dayNameToIndex[day.toLowerCase()])
        .filter(idx => idx !== undefined);

      if (scheduledDayIndices.length === 0) return 0;

      // Start from today or the most recent workout date
      const today = new Date();
      const mostRecentWorkoutDate = new Date(workoutDates[0]);
      const startDate = mostRecentWorkoutDate > today ? mostRecentWorkoutDate : today;
      
      let streak = 0;
      let currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Look back up to 365 days (sanity limit)
      for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        
        // Check if this is a scheduled training day
        if (scheduledDayIndices.includes(dayOfWeek)) {
          // If scheduled training day has a workout, increment streak
          if (workoutDateSet.has(dateStr)) {
            streak++;
          } else {
            // Scheduled training day was missed - streak ends
            break;
          }
        }
        // If not a scheduled training day (rest day), just skip it
        
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating workout streak:', error);
      return 0;
    }
  };

  const formatTimerTime = (seconds: number): string => {
    const isCardio = nextWorkout?.type === 'cardio' || nextWorkout?.category === 'cardio';
    let displaySeconds = seconds;
    
    if (isCardio && nextWorkout?.targetDuration) {
      const targetSeconds = nextWorkout.targetDuration * 60;
      const remainingSeconds = Math.max(0, targetSeconds - seconds);
      if (remainingSeconds === 0) {
        const overtime = seconds - targetSeconds;
        const om = Math.floor(overtime / 60);
        const os = overtime % 60;
        return `+${om.toString().padStart(2, '0')}:${os.toString().padStart(2, '0')}`;
      }
      displaySeconds = remainingSeconds;
    }
    
    const h = Math.floor(displaySeconds / 3600);
    const m = Math.floor((displaySeconds % 3600) / 60);
    const s = displaySeconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getFirstUncompletedExercise = useCallback(() => {
    if (!nextWorkout || !sessionId) return null;
    for (const exercise of nextWorkout.exercises) {
      const exerciseId = exercise.id || exercise.name.toLowerCase().replace(/\s+/g, '-');
      const sessionExercise = exercises.find(ex => ex.exercise_id === exerciseId);
      if (sessionExercise?.status === 'COMPLETED') continue;
      
      const completedSets = sessionExercise?.sets?.filter(s => s.is_completed).length || 0;
      const lastSet = sessionExercise?.sets?.[sessionExercise?.sets?.length - 1];
      
      return {
        name: exercise.name,
        sets: exercise.sets || 0,
        reps: exercise.reps || 0,
        lastWeight: lastSet?.weight_kg || 0,
        lastReps: lastSet?.reps || 0,
        completedSets,
      };
    }
    return null;
  }, [nextWorkout, sessionId, exercises]);

  // --- HANDLERS ---

  const handleStartWorkoutPress = () => {
    if (cachedManualWorkout) {
      router.push('/workout-session');
      return;
    }
    if (isWorkoutActive) {
      router.push('/workout-session');
      return;
    }
    if (workoutAvailability && !workoutAvailability.canStartWorkout) {
      setShowUnavailableModal(true);
      return;
    }
    router.push('/workout-session');
  };

  const handleSkipWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    setIsSkipping(true);
    try {
      useWorkoutCacheStore.getState().setManualWorkout(null);
      completeWorkout();
      await activeWorkoutSessionService.delete(user.id);
      
      const nextWorkoutType = updateWorkoutProgression(userProgressData.currentWorkout);
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: nextWorkoutType,
      });
      
      if (updated) {
        setUserProgressData(updated);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
      }
      setTimeout(() => setIsSkipping(false), 150);
    } catch (error) {
      Alert.alert('Error', 'Failed to skip workout.');
      setIsSkipping(false);
    }
  };

  const handleRegenerateWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    setIsRegenerating(true);
    try {
      useWorkoutCacheStore.getState().setManualWorkout(null);
      completeWorkout();
      await activeWorkoutSessionService.delete(user.id);
      
      const alternate = getAlternateWorkout(userProgressData.currentWorkout);
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: alternate.type,
      });
      
      if (updated) {
        setUserProgressData(updated);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
      }
      setTimeout(() => setIsRegenerating(false), 150);
    } catch (error) {
      Alert.alert('Error', 'Failed to regenerate.');
      setIsRegenerating(false);
    }
  };

  return {
    // Data
    user,
    generatedProgram,
    userProgressData,
    nextWorkout,
    workoutAvailability,
    currentTime,
    
    // Flags
    loadingProgram,
    loadingProgress,
    isRegenerating,
    isSkipping,
    isRefreshingWorkout,
    isWorkoutActive,
    isRunning,
    
    // Modals
    showWorkoutModal, setShowWorkoutModal,
    showVideoModal, setShowVideoModal,
    showComingSoonModal, setShowComingSoonModal,
    showUnavailableModal, setShowUnavailableModal,
    
    // Handlers
    handleStartWorkoutPress,
    handleSkipWorkout,
    handleRegenerateWorkout,
    handleConfirmWorkout: () => { setShowWorkoutModal(false); router.push('/workout-session'); },
    handleCancelWorkout: () => setShowWorkoutModal(false),
    handleShareWorkout: () => console.log('Share clicked'),
    handleAdjustDuration: () => console.log('Duration clicked'),
    pauseTimer,
    resumeTimer,
    formatTimerTime,
    getFirstUncompletedExercise,
    calculateWorkoutStreak
  };
};