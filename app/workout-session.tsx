import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useTimerStore } from '@/store/timer-store';
import {
  Feather as Icon,
} from '@expo/vector-icons';
import { ExerciseCard } from '@/components/ExerciseCard';
import { WorkoutOptionsModal } from '@/components/WorkoutOptionsModal';
import { WorkoutPreviewModal } from '@/components/WorkoutPreviewModal';
import { WorkoutNotStartedModal } from '@/components/WorkoutNotStartedModal';
import { AddCustomExerciseModal } from '@/components/AddCustomExerciseModal';
import { CardioEntryModal } from '@/components/CardioEntryModal';
import { markTodayWorkoutCompleted } from '@/utils/workout-completion-tracker';
import { ensureMinimumDuration } from '@/utils/workout-duration';
import { 
  analyzeExercisePRs, 
  getBeatLastWorkoutSuggestions,
  type ExerciseLogs,
  type ExercisePRs
} from '@/utils/pr-tracking';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';

// NEW: Import workout template system
import { getWorkoutTemplate, type WorkoutTemplate } from '@/lib/workout-templates';
import { updateWorkoutProgression } from '@/lib/workout-suggestion';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, userWeight: cachedWeight, manualWorkout, isCacheValid } = useWorkoutCacheStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loading, setLoading] = useState(!cachedProgram || !cachedProgress); // Only load if cache is empty
  
  // Safety timeout to prevent infinite loading (one-time check on mount)
  // Use refs to access current state values in the timeout callback
  const loadingRef = useRef(loading);
  const generatedProgramRef = useRef(generatedProgram);
  const userProgressDataRef = useRef(userProgressData);
  
  // Keep refs in sync with state
  useEffect(() => {
    loadingRef.current = loading;
    generatedProgramRef.current = generatedProgram;
    userProgressDataRef.current = userProgressData;
  }, [loading, generatedProgram, userProgressData]);
  
  // Safety timeout - only runs once on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Access current state via refs to avoid stale closure values
      if (loadingRef.current) {
        // Check if we have data now before forcing loading to false
        if (generatedProgramRef.current && userProgressDataRef.current) {
          console.log('✅ WorkoutSession: Data loaded, setting loading to false');
          setLoading(false);
        } else {
          console.warn('⚠️ WorkoutSession: Loading timeout reached but no data - keeping loading state');
          // Don't force loading to false if we still don't have data
          // This allows the error screen to show properly
        }
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, []); // Empty dependency array - only run once on mount
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotStartedModal, setShowNotStartedModal] = useState(false);
  const [showWorkoutConfirmModal, setShowWorkoutConfirmModal] = useState(false);
  const [workoutCompletionData, setWorkoutCompletionData] = useState<{percentage: number, completed: number, total: number} | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [cardioEntries, setCardioEntries] = useState<any[]>([]);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [updatingExerciseId, setUpdatingExerciseId] = useState<string | null>(null);
  const [userWeight, setUserWeight] = useState<number>(cachedWeight || 70);
  const { 
    formattedTime, 
    isRunning, 
    isWorkoutActive,
    startWorkout, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    completeWorkout 
  } = useWorkoutTimer();
  const workoutStartTime = useTimerStore((state) => state.workoutStartTime);
  const isLoadingRef = useRef(false);

  // NEW: Get current workout from template system (no more week/day progression)
  const todaysWorkout = useMemo(() => {
    // Check for manual workout first
    if (manualWorkout) {
      console.log('✅ Loaded manual workout:', manualWorkout.name, `(${manualWorkout.exercises.length} exercises)`);
      return manualWorkout;
    }
    
    if (!userProgressData) {
      return null;
    }
    
    // Get the current workout type (e.g., 'push-a', 'pull-b')
    const currentWorkoutType = userProgressData.currentWorkout || 'push-a';
    
    // Load workout template
    const workoutTemplate = getWorkoutTemplate(currentWorkoutType);
    
    if (!workoutTemplate) {
      console.error('❌ Failed to load workout template:', currentWorkoutType);
      return null;
    }
    
    console.log('✅ Loaded workout template:', workoutTemplate.name, `(${workoutTemplate.exercises.length} exercises)`);
    
    return workoutTemplate;
  }, [manualWorkout, userProgressData]);

  const loadWorkoutData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    // Use cached data immediately if available and valid
    const cacheIsValid = cachedProgram && cachedProgress && isCacheValid();
    if (cacheIsValid) {
      setGeneratedProgram(cachedProgram);
      setUserProgressData(cachedProgress);
      setUserWeight(cachedWeight || 70);
      setLoading(false);
      
      // Check cache age to decide if background refresh is needed
      const lastUpdated = useWorkoutCacheStore.getState().lastUpdated;
      const cacheAge = lastUpdated ? Date.now() - lastUpdated : Infinity;
      if (cacheAge < 60000) { // Less than 1 minute - cache is fresh
        return; // Skip refresh if cache is fresh
      }
      
      // Cache is stale (1-5 minutes old) - refresh in background WITHOUT showing loading spinner
      // Use Promise to avoid blocking and prevent fallthrough
      Promise.resolve().then(async () => {
        try {
          const wizardResults = await wizardResultsService.getByUserId(user.id);
          let freshProgram = null;
          if (wizardResults?.generatedSplit) {
            freshProgram = typeof wizardResults.generatedSplit === 'string' 
              ? JSON.parse(wizardResults.generatedSplit)
              : wizardResults.generatedSplit;
            setGeneratedProgram(freshProgram);
          }
          if (wizardResults?.weight) {
            setUserWeight(wizardResults.weight);
          }
          const progress = await userProgressService.getByUserId(user.id);
          if (progress) {
            setUserProgressData(progress);
            // Update cache with fresh data - only set fields that have valid data
            const cacheUpdate: any = {
              userProgressData: progress,
            };
            // Only update program if we got valid data (don't overwrite with null)
            if (freshProgram) {
              cacheUpdate.generatedProgram = freshProgram;
            }
            // Only update weight if we got valid data
            if (wizardResults?.weight) {
              cacheUpdate.userWeight = wizardResults.weight;
            }
            useWorkoutCacheStore.getState().setWorkoutData(cacheUpdate);
          }
        } catch (error) {
          console.error('❌ Failed to refresh stale cache:', error);
        }
      });
      return; // Don't fall through to main loading logic
    }

    try {
      isLoadingRef.current = true;
      if (!cacheIsValid) {
        setLoading(true);
      }
      
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      // Store program in function scope so it can be used for caching
      let freshProgram: any = null;
      
      if (wizardResults?.generatedSplit) {
        // Handle both string (from JSON) and object (from JSONB) types
        freshProgram = typeof wizardResults.generatedSplit === 'string' 
          ? JSON.parse(wizardResults.generatedSplit)
          : wizardResults.generatedSplit;
        
        setGeneratedProgram(freshProgram);
      }
      
      if (wizardResults?.weight) {
        setUserWeight(wizardResults.weight);
      }

      let progress = await userProgressService.getByUserId(user.id);
      
      // Create default progress if none exists
      if (!progress) {
        progress = await userProgressService.create({
          userId: user.id,
          programId: null, // No program assigned yet
          currentWorkout: 'push-a', // Start with Push Day A
          lastCompletedWorkout: null,
          lastWorkoutDate: null,
          startDate: new Date(),
          completedWorkouts: [],
          weeklyWeights: {}
        });
      }
      
      // Ensure currentWorkout has valid default (fix any null/undefined values)
      if (!progress.currentWorkout) {
        progress = await userProgressService.update(progress.id, {
          currentWorkout: 'push-a'
        });
      }
      
      setUserProgressData(progress);
      
      if (progress?.weeklyWeights) {
        // Handle both string (from JSON) and object (from JSONB) types
        let weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;
        
        // NEW: No more cleanup needed! Sessions only tracked by date now
        const today = new Date().toISOString().split('T')[0];
        const logs = weeklyWeights?.exerciseLogs || {};
        setExerciseLogs(logs);
        
        const allPRs = analyzeExercisePRs(logs);
        setExercisePRs(allPRs);
        
        const customExs = weeklyWeights?.customExercises?.[today] || [];
        setCustomExercises(customExs);
        
        const cardioEntries = weeklyWeights?.cardioEntries?.[today] || [];
        setCardioEntries(cardioEntries);
      }
      
      // Update cache with fresh data - use freshProgram instead of stale generatedProgram state
      const { setWorkoutData } = useWorkoutCacheStore.getState();
      setWorkoutData({
        generatedProgram: freshProgram || generatedProgram, // Use fresh data if available, fallback to state
        userProgressData: progress,
        userWeight: wizardResults?.weight || userWeight
      });
      
    } catch (error) {
      console.error('❌ Failed to load workout data:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id, not cache values

  useEffect(() => {
    // Only load if we don't have data already (prevent duplicate loads)
    if (user?.id && !generatedProgram && !userProgressData) {
      console.log('🔄 Initial load triggered');
      loadWorkoutData();
    }
  }, [user?.id]); // Only trigger when user.id changes, not when loadWorkoutData changes

  // Clear stale timer on mount (from previous day/session)
  useEffect(() => {
    if (isWorkoutActive) {
      const today = new Date().toISOString().slice(0, 10);
      const timerDate = workoutStartTime ? new Date(workoutStartTime).toISOString().slice(0, 10) : null;
      
      if (timerDate && timerDate !== today) {
        completeWorkout(); // Reset timer if it's from a different day
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    setWorkoutStarted(isWorkoutActive);
  }, [isWorkoutActive]);

  // Note: We don't clear manual workout on unmount anymore
  // This allows users to navigate back to home and return to the active manual workout

  // Sync userProgressData with cache updates (for instant tag updates after completing exercises)
  // Subscribe to cache store changes and FORCE re-render
  useEffect(() => {
    const unsubscribe = useWorkoutCacheStore.subscribe((state, prevState) => {
      // Check if userProgressData actually changed
      const dataChanged = state.userProgressData !== prevState.userProgressData;
      const cacheValid = state.isCacheValid();
      
      if (dataChanged && state.userProgressData && cacheValid) {
        console.log('🔔 [Cache Subscription] Progress data updated, immediately showing completed status');
        setUserProgressData(state.userProgressData);
        // IMMEDIATELY clear the updating exercise ID to show completed badge
        setUpdatingExerciseId(null);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let updateTimeoutId: NodeJS.Timeout | null = null;
      let refreshTimeoutId: NodeJS.Timeout | null = null;
      
      if (user?.id && !isLoadingRef.current) {
        
        // Get cache state - always get fresh state
        const cache = useWorkoutCacheStore.getState();
        const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
        
        console.log('🔄 [Workout Focus] Cache check:', {
          cacheAge: cacheAge < 60000 ? `${(cacheAge / 1000).toFixed(1)}s` : 'stale',
          hasCache: !!cache.userProgressData,
          timestamp: cache.lastUpdated
        });
        
        // If cache was updated VERY recently (within 3 seconds), it means we just completed an exercise
        // or returned from video modal - Trust the cache completely
        if (cache.userProgressData && cacheAge < 3000) {
          console.log('✅ [Workout Focus] Using fresh cache, immediately showing completed status');
          setUserProgressData(cache.userProgressData);
          
          // IMMEDIATELY clear the updating exercise ID to show completed badge
          // We reduced the delay from 800ms to 0ms for instant feedback
          setUpdatingExerciseId(null);
          
          // Don't fetch from database - the cache subscription will handle updates
          return;
        }
        
        // If cache is slightly old (3-10 seconds), use it immediately
        if (cache.userProgressData && cacheAge < 10000) {
          console.log('⏱️  [Workout Focus] Using recent cache, clearing loading state');
          setUserProgressData(cache.userProgressData);
          // IMMEDIATELY clear to show completed status
          setUpdatingExerciseId(null);
          // Skip the background refresh - cache is recent enough
          return;
        }
        
        // Only fetch if cache is very stale (>5 seconds old)
        if (cache.userProgressData && cacheAge < 30000) {
          // Use cache but schedule a delayed refresh
          setUserProgressData(cache.userProgressData);
          setUpdatingExerciseId(null);
          
          refreshTimeoutId = setTimeout(() => {
            userProgressService.getByUserId(user.id).then(freshProgress => {
              if (freshProgress) {
                setUserProgressData(freshProgress);
                useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: freshProgress });
              }
            }).catch(err => {
              console.error('❌ Background refresh failed:', err);
            });
          }, 1000); // 1 second delay
          
          return () => {
            if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
          };
        }
        
        // Cache is very stale or missing - fetch immediately
        setUpdatingExerciseId(null);
        userProgressService.getByUserId(user.id).then(freshProgress => {
          if (freshProgress) {
            setUserProgressData(freshProgress);
            useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: freshProgress });
          }
        }).catch(err => {
          console.error('❌ Failed to refresh progress:', err);
        });
      }
      
      return () => {
        if (updateTimeoutId) clearTimeout(updateTimeoutId);
        if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      };
    }, [user?.id]) // Only depend on user.id
  );

  const handleAddCustomExercise = async (exerciseName: string) => {
    if (customExercises.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 3 custom exercises per workout.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const customExercise = {
      id: `custom-${Date.now()}`,
      name: exerciseName,
      sets: 2,
      reps: '10',
      restSeconds: 60,
      targetMuscle: 'Custom',
      isCustom: true,
    };
    
    try {
      if (!user?.id || !userProgressData) return;
      
      setCustomExercises(prev => [...prev, customExercise]);
      
      const freshProgress = await userProgressService.getByUserId(user.id);
      if (!freshProgress) {
        throw new Error('Failed to fetch user progress');
      }
      
      // Handle both array (from JSONB) and string (from JSON) types
      let weeklyWeights: any = {};
      if (freshProgress.weeklyWeights) {
        if (typeof freshProgress.weeklyWeights === 'string') {
          try {
            weeklyWeights = JSON.parse(freshProgress.weeklyWeights);
          } catch {
            weeklyWeights = {};
          }
        } else {
          weeklyWeights = freshProgress.weeklyWeights;
        }
      }
      const today = new Date().toISOString().split('T')[0];
      
      if (!weeklyWeights.customExercises) {
        weeklyWeights.customExercises = {};
      }
      
      if (!weeklyWeights.customExercises[today]) {
        weeklyWeights.customExercises[today] = [];
      }
      
      weeklyWeights.customExercises[today].push(customExercise);
      
      await userProgressService.update(freshProgress.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });
      
      await loadWorkoutData();
      
    } catch (error) {
      console.error('❌ Failed to add custom exercise:', error);
      setCustomExercises(prev => prev.filter(ex => ex.id !== customExercise.id));
      Alert.alert('Error', 'Failed to add custom exercise. Please try again.');
    }
  };

  const handleAddCardio = async (cardio: {
    id: string;
    type: string;
    typeName: string;
    durationMinutes: number;
    hours: number;
    minutes: number;
    calories: number;
  }) => {
    if (cardioEntries.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 3 cardio sessions per workout.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      if (!user?.id || !userProgressData) return;
      
      setCardioEntries(prev => [...prev, cardio]);
      
      const freshProgress = await userProgressService.getByUserId(user.id);
      if (!freshProgress) {
        throw new Error('Failed to fetch user progress');
      }
      
      // Handle both array (from JSONB) and string (from JSON) types
      let weeklyWeights: any = {};
      if (freshProgress.weeklyWeights) {
        if (typeof freshProgress.weeklyWeights === 'string') {
          try {
            weeklyWeights = JSON.parse(freshProgress.weeklyWeights);
          } catch {
            weeklyWeights = {};
          }
        } else {
          weeklyWeights = freshProgress.weeklyWeights;
        }
      }
      const today = new Date().toISOString().split('T')[0];
      
      if (!weeklyWeights.cardioEntries) {
        weeklyWeights.cardioEntries = {};
      }
      
      if (!weeklyWeights.cardioEntries[today]) {
        weeklyWeights.cardioEntries[today] = [];
      }
      
      weeklyWeights.cardioEntries[today].push(cardio);
      
      await userProgressService.update(freshProgress.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });
      
      await loadWorkoutData();
    } catch (error) {
      console.error('❌ Failed to add cardio:', error);
      setCardioEntries(prev => prev.filter(c => c.id !== cardio.id));
      Alert.alert('Error', 'Failed to add cardio. Please try again.');
    }
  };

  const handleBackPress = () => {
    // Don't clear manual workout - keep it in cache so user can return to it
    // Only clear it when workout is completed or explicitly canceled
    router.back();
  };

  const handleResetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the workout timer? This will restart your timer from 00:00.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetTimer(),
        },
      ]
    );
  };



  // Memoize weeklyWeights to avoid re-parsing JSON on every render
  const weeklyWeightsData = useMemo(() => {
    try {
      if (!userProgressData?.weeklyWeights) return {};
      
      // Handle both string (from JSON) and object (from JSONB) types
      if (typeof userProgressData.weeklyWeights === 'string') {
        return JSON.parse(userProgressData.weeklyWeights);
      }
      
      // Already an object (from Supabase JSONB)
      return userProgressData.weeklyWeights;
    } catch (e) {
      console.error('❌ Failed to parse weeklyWeights:', e);
      return {} as any;
    }
  }, [userProgressData?.weeklyWeights]);

  const getExerciseStatus = useCallback((
    exerciseId: string,
    plannedSets: number
  ): 'pending' | 'in-progress' | 'completed' => {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = weeklyWeightsData?.exerciseLogs?.[exerciseId] as
      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
      | undefined;
    
    if (!sessions || sessions.length === 0) {
      return 'pending';
    }
    
    // Simple: Just check today's date
    const todaySession = sessions.find((s) => s.date === today);
    
    if (!todaySession || !todaySession.sets || todaySession.sets.length === 0) {
      return 'pending';
    }
    
    const completedCount = todaySession.sets.filter((s) => !!s.isCompleted).length;
    const touchedSets = todaySession.sets.filter((s) => 
      (s.reps ?? 0) > 0 || (s.weightKg ?? 0) > 0 || s.isCompleted
    );
    
    const required = Math.max(0, plannedSets || 0);
    
    if (required > 0 && completedCount >= required) {
      return 'completed';
    }
    if (touchedSets.length > 0) {
      return 'in-progress';
    }
    
    return 'pending';
  }, [weeklyWeightsData]);

  const calculateWorkoutProgress = () => {
    if (!todaysWorkout?.exercises) return { percentage: 0, completed: 0, total: 0 };
    
    const exercises = todaysWorkout.exercises;
    const regularCompletedCount = exercises.filter((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      return getExerciseStatus(exId, ex.sets) === 'completed';
    }).length;
    
    const customCompletedCount = customExercises.filter((ex: any) => {
      return getExerciseStatus(ex.id, ex.sets) === 'completed';
    }).length;
    
    const completedCount = regularCompletedCount + customCompletedCount;
    const total = exercises.length + customExercises.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    return { percentage, completed: completedCount, total };
  };

  const workoutProgress = calculateWorkoutProgress();
  const allExercisesCompleted = workoutProgress.percentage === 100;

  // Memoize calorie calculations
  const totalWorkoutCalories = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    
    const completedExercises: Array<{ 
      name: string; 
      sets: number;
      setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
    }> = [];
    
    (todaysWorkout?.exercises || []).forEach((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      const sessions = weeklyWeightsData?.exerciseLogs?.[exId] as
        | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
        | undefined;
      
      if (sessions) {
        // Simple: Just check today's date
        const todaySession = sessions.find((s) => s.date === today);
        if (todaySession?.sets) {
          const completedSets = todaySession.sets.filter((s) => !!s.isCompleted).length;
          if (completedSets > 0) {
            completedExercises.push({
              name: ex.name,
              sets: completedSets,
              setsData: todaySession.sets
            });
          }
        }
      }
    });
    
    const estimatedCalories = completedExercises.length > 0 
      ? calculateWorkoutCalories(completedExercises, userWeight)
      : 0;
    
    const todayCardioEntries = weeklyWeightsData?.cardioEntries?.[today] || [];
    const cardioCalories = todayCardioEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.calories || 0);
    }, 0);
    
    return estimatedCalories + cardioCalories;
  }, [todaysWorkout, weeklyWeightsData, userWeight]);

  const hasPRPotential = useCallback((exerciseId: string): boolean => {
    const suggestions = getBeatLastWorkoutSuggestions(exerciseId, exercisePRs);
    return suggestions.length > 0 && !suggestions[0].includes('First time');
  }, [exercisePRs]);

  const handleStartWorkoutPress = () => {
    setShowOptionsModal(true);
  };

  const handleViewOption = () => {
    setShowOptionsModal(false);
    setShowPreviewModal(true);
  };

  const handleLetsGoOption = () => {
    setShowOptionsModal(false);
    handleStartWorkout();
  };

  const handleStartWorkout = () => {
    setShowPreviewModal(false);
    setWorkoutStarted(true);
    startWorkout(
      todaysWorkout?.id || 'today-workout', 
      todaysWorkout?.name || "Today's Workout"
    );
  };

  const handleStopWorkout = () => {
    Alert.alert(
      "Reset Today's Workout",
      "This will reset your progress for today's workout. All completed exercises will be set back to pending state. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset Workout",
          style: "destructive",
          onPress: confirmResetWorkout
        }
      ]
    );
  };

  const confirmResetWorkout = async () => {
    try {
      if (!user?.id || !userProgressData) return;

      completeWorkout();
      
      let weeklyWeights: any = {};
      if (userProgressData.weeklyWeights) {
        try {
          weeklyWeights = JSON.parse(userProgressData.weeklyWeights);
        } catch (error) {
          weeklyWeights = {};
        }
      }

      if (todaysWorkout?.exercises) {
        todaysWorkout.exercises.forEach((exercise: any) => {
          const exerciseId = exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase();
          
          if (weeklyWeights.exerciseLogs && weeklyWeights.exerciseLogs[exerciseId]) {
            weeklyWeights.exerciseLogs[exerciseId] = [];
          }
        });
      }

      const resetProgress = await userProgressService.update(userProgressData.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });

      if (resetProgress) {
        setUserProgressData(resetProgress);
        
        setWorkoutStarted(false);
        setShowOptionsModal(false);
        setShowPreviewModal(false);
        setShowNotStartedModal(false);
      }
    } catch (error) {
      console.error('❌ Failed to reset workout:', error);
      Alert.alert(
        "Reset Failed",
        "Something went wrong while resetting today's workout. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleExercisePress = (exerciseId: string) => {
    if (!workoutStarted) {
      setShowNotStartedModal(true);
      return;
    }
    // Track which exercise we're navigating to (for loading state on return)
    setUpdatingExerciseId(exerciseId);
    router.push(`/workout-exercise-tracker?exerciseId=${exerciseId}`);
  };

  const handleFinishWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    
    setWorkoutCompletionData({ 
      percentage: workoutProgress.percentage, 
      completed: workoutProgress.completed, 
      total: workoutProgress.total 
    });
    setShowWorkoutConfirmModal(true);
  };

  const completeWorkoutWithPercentage = async () => {
    if (!user?.id || !userProgressData) return;
    try {
      const startTimeToSave = workoutStartTime || new Date().toISOString();
      const { duration } = completeWorkout();
      
      const currentWorkout = userProgressData.currentWorkout || 1;
      const currentWorkoutIndex = currentWorkout - 1;
      
      // Calculate workout volume
      const { calculateWorkoutVolume } = await import('@/utils/volume-calculator');
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch FRESH data from database to ensure we have the latest completed exercises
      const freshProgress = await userProgressService.getByUserId(user.id);
      let latestExerciseLogs: any = {};
      if (freshProgress?.weeklyWeights) {
        const weeklyWeights = typeof freshProgress.weeklyWeights === 'string'
          ? JSON.parse(freshProgress.weeklyWeights)
          : freshProgress.weeklyWeights;
        latestExerciseLogs = weeklyWeights?.exerciseLogs || {};
      }
      
      // Build exercises data with completed sets for volume calculation
      const exercisesWithSets = (todaysWorkout?.exercises || []).map((ex: any) => {
        const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
        const sessions = latestExerciseLogs[exId] as Array<{ date: string; unit: string; sets: Array<{ reps: number; weightKg: number; isCompleted: boolean }> }> || [];
        
        // Simple: Just check today's date
        const todaySession = sessions.find((s: any) => s.date === today);
        
        return {
          name: ex.name,
          sets: todaySession?.sets || [],
        };
      });
      
      const volumeData = calculateWorkoutVolume(exercisesWithSets);
      
      // Handle both array (from JSONB) and string (from JSON) types
      let completedArr: any[] = [];
      if (userProgressData.completedWorkouts) {
        if (Array.isArray(userProgressData.completedWorkouts)) {
          // Create a copy to avoid mutating the original state
          completedArr = [...userProgressData.completedWorkouts];
        } else if (typeof userProgressData.completedWorkouts === 'string') {
          try {
            completedArr = JSON.parse(userProgressData.completedWorkouts);
          } catch {
            completedArr = [];
          }
        }
      }
      const finishTime = new Date().toISOString();
      
      // Check if this is a manual workout
      const isManualWorkout = manualWorkout !== null;
      
      completedArr.push({
        date: finishTime,
        workoutIndex: isManualWorkout ? -1 : currentWorkoutIndex, // -1 for manual workouts
        workoutName: todaysWorkout?.name,
        duration: duration,
        percentageSuccess: workoutProgress.percentage,
        startTime: startTimeToSave,
        finishTime: finishTime,
        totalVolume: volumeData.totalVolume, // Store total volume
        exercises: volumeData.exerciseBreakdown, // Store exercise breakdown
      });
      
      let updated;
      
      if (isManualWorkout) {
        // For manual workouts: don't progress to next workout, just save completion
        updated = await userProgressService.update(userProgressData.id, {
          completedWorkouts: JSON.stringify(completedArr),
        });
        
        // Clear manual workout from cache
        const { useWorkoutCacheStore } = await import('@/store/workout-cache-store');
        useWorkoutCacheStore.getState().setManualWorkout(null);
      } else {
        // For PPL workouts: calculate next workout using PPL rotation
        const currentWorkoutType = userProgressData.currentWorkout || 'push-a';
        const nextWorkoutType = updateWorkoutProgression(currentWorkoutType);
        
        console.log('🔄 Workout Progression:', {
          completedWorkout: currentWorkoutType,
          nextWorkout: nextWorkoutType,
        });
        
        updated = await userProgressService.update(userProgressData.id, {
          currentWorkout: nextWorkoutType,
          lastCompletedWorkout: currentWorkoutType,
          lastWorkoutDate: new Date(),
          completedWorkouts: JSON.stringify(completedArr),
        });
      }
      
      // Mark today's workout as completed - REMOVED: Allow multiple workouts per day
      // await markTodayWorkoutCompleted(user.id);
      
      if (updated) {
        setUserProgressData(updated);
        // Update cache to trigger loading state in home screen
        const { useWorkoutCacheStore } = await import('@/store/workout-cache-store');
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
        
        // Navigate to workout overview page with workout data
        router.push({
          pathname: '/workout-overview',
          params: {
            workoutName: todaysWorkout?.name || 'Workout',
            duration: duration.toString(),
            totalVolume: volumeData.totalVolume.toString(),
            exercises: JSON.stringify(volumeData.exerciseBreakdown),
          },
        });
      }
    } catch (e) {
      console.error('❌ Failed to finish workout:', e);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading your workout...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Only show "All Done!" if we've finished loading AND confirmed there's no workout
  // Don't show it if we're still loading or if data hasn't loaded yet
  if (!loading && !todaysWorkout && generatedProgram && userProgressData) {
    // Double-check: maybe the workout index is out of bounds
    const currentWorkout = userProgressData.currentWorkout || 1;
    const currentWorkoutIndex = currentWorkout - 1;
    const hasValidWorkout = generatedProgram.weeklyStructure && 
                            currentWorkoutIndex >= 0 && 
                            currentWorkoutIndex < generatedProgram.weeklyStructure.length;
    
    if (!hasValidWorkout) {
      return (
        <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={1}>
                <Icon name="arrow-left" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Workout Session</Text>
            </View>
            
            <View style={styles.noWorkoutContainer}>
              <Icon name="check-circle" size={64} color={colors.primary} />
              <Text style={styles.noWorkoutTitle}>All Done!</Text>
              <Text style={styles.noWorkoutText}>You've completed all workouts in your program</Text>
                <TouchableOpacity 
                  style={styles.backHomeButton}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={1}
                >
                <Text style={styles.backHomeText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }
  }
  
  // If still loading or data not ready, show loading state
  if (loading || !generatedProgram || !userProgressData) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading your workout...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={1}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.workoutHeader}>
            {/* Workout Name Only (No more week/day indicators) */}
            <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
            
            {/* Workout Timer or Start Button */}
            {workoutStarted ? (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{formattedTime}</Text>
                
                <View style={styles.timerControls}>
                  <TouchableOpacity 
                    style={[styles.timerButton, styles.resetButton]} 
                    onPress={handleResetTimer}
                    activeOpacity={1}
                  >
                    <Icon name="refresh-cw" size={16} color={colors.white} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.timerButton, isRunning ? styles.pauseButton : styles.playButton]} 
                    onPress={isRunning ? pauseTimer : resumeTimer}
                    activeOpacity={1}
                  >
                    <Icon name={isRunning ? "pause" : "play"} size={16} color={colors.black} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.timerButton, styles.stopButton]} 
                    onPress={handleStopWorkout}
                    activeOpacity={1}
                  >
                    <Icon name="x" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.startButtonContainer}>
                <TouchableOpacity 
                  style={styles.startWorkoutButton}
                  onPress={handleStartWorkoutPress}
                  activeOpacity={1}
                >
                  <LinearGradient
                    colors={['#00FF88', '#00CC6A']}
                    style={styles.startWorkoutGradient}
                  >
                    <Icon name="play" size={24} color={colors.black} />
                    <Text style={[styles.startWorkoutText, typography.button]}>
                      Start Workout
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{ensureMinimumDuration(todaysWorkout.estimatedDuration)} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="target" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{todaysWorkout.type}</Text>
              </View>
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                
                // Handle both array (from JSONB) and string (from JSON) types
                let completedWorkouts: any[] = [];
                if (userProgressData?.completedWorkouts) {
                  if (Array.isArray(userProgressData.completedWorkouts)) {
                    completedWorkouts = userProgressData.completedWorkouts;
                  } else if (typeof userProgressData.completedWorkouts === 'string') {
                    try {
                      completedWorkouts = JSON.parse(userProgressData.completedWorkouts);
                    } catch {
                      completedWorkouts = [];
                    }
                  }
                }
                
                // Check if today's workout is already completed (one workout per day restriction)
                const todayWorkoutCompleted = completedWorkouts.some((w: any) => {
                  if (typeof w === 'object' && w.date) {
                    const workoutDate = new Date(w.date).toISOString().split('T')[0];
                    return workoutDate === today;
                  }
                  return false;
                });
                
                const completedExercises: Array<{ 
                  name: string; 
                  sets: number;
                  setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
                }> = [];
                
                if (!workoutStarted && !todayWorkoutCompleted) {
                  return (
                    <View style={styles.metaItem}>
                      <Icon name="zap" size={16} color={colors.primary} />
                      <Text style={styles.metaText}>Approx. {totalWorkoutCalories} calories burned</Text>
                    </View>
                  );
                }
                
                if (todayWorkoutCompleted) {
                  (todaysWorkout.exercises || []).forEach((ex: any) => {
                    const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
                    const sessions = weeklyWeightsData?.exerciseLogs?.[exId] as
                      | Array<{ date: string; weekNum?: number; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    // Simple: Just check today's date
                    const todaySession = sessions?.find((s) => s.date === today);
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    
                    if (todaySession?.sets && todaySession.sets.length > 0) {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets,
                        setsData: todaySession.sets
                      });
                    } else {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets
                      });
                    }
                  });
                  
                  const todayCustomExercises = weeklyWeightsData?.customExercises?.[today] || [];
                  
                  todayCustomExercises.forEach((ex: any) => {
                    const sessions = weeklyWeightsData?.exerciseLogs?.[ex.id] as
                      | Array<{ date: string; weekNum?: number; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    // Simple: Just check today's date
                    const todaySession = sessions?.find((s) => s.date === today);
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    
                    if (todaySession?.sets && todaySession.sets.length > 0) {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets,
                        setsData: todaySession.sets
                      });
                    } else {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets
                      });
                    }
                  });
                } else {
                  (todaysWorkout.exercises || []).forEach((ex: any) => {
                    const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
                    const sessions = weeklyWeightsData?.exerciseLogs?.[exId] as
                      | Array<{ date: string; weekNum?: number; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    if (sessions) {
                      // Simple: Just check today's date (no more week filtering)
                      const todaySession = sessions.find((s) => s.date === today);
                      if (todaySession?.sets) {
                        const completedSets = todaySession.sets.filter((s) => !!s.isCompleted).length;
                        if (completedSets > 0) {
                          completedExercises.push({
                            name: ex.name,
                            sets: completedSets,
                            setsData: todaySession.sets
                          });
                        }
                      }
                    }
                  });
                  
                  const allCustomExercises = customExercises.length > 0 
                    ? customExercises 
                    : (weeklyWeightsData?.customExercises?.[today] || []);
                  
                  allCustomExercises.forEach((ex: any) => {
                    const sessions = weeklyWeightsData?.exerciseLogs?.[ex.id] as
                      | Array<{ date: string; weekNum?: number; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    if (sessions) {
                      // Simple: Just check today's date (no more week filtering)
                      const todaySession = sessions.find((s) => s.date === today);
                      if (todaySession?.sets && todaySession.sets.length > 0) {
                        const completedSets = todaySession.sets.filter((s) => !!s.isCompleted).length;
                        if (completedSets > 0) {
                          completedExercises.push({
                            name: ex.name,
                            sets: completedSets,
                            setsData: todaySession.sets
                          });
                        }
                      }
                    }
                  });
                }
                
                return (
                  <View style={styles.metaItem}>
                    <Icon name="zap" size={16} color={colors.primary} />
                    <Text style={styles.metaText}>Approx. {totalWorkoutCalories} calories burned</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.exercisesSection}>
            <View style={styles.exercisesSectionHeader}>
              <Text style={styles.sectionTitle}>
                Exercises ({(todaysWorkout.exercises?.length || 0) + customExercises.length})
              </Text>
              {workoutStarted && (
                <View style={styles.addButtonsContainer}>
                  {customExercises.length < 3 && (
                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={() => setShowAddExerciseModal(true)}
                      activeOpacity={1}
                    >
                      <Icon name="plus" size={20} color={colors.black} />
                      <Text style={styles.addExerciseButtonText}>Exercise</Text>
                    </TouchableOpacity>
                  )}
                  {(cardioEntries?.length ?? 0) < 3 && (
                    <TouchableOpacity
                      style={styles.addCardioButton}
                      onPress={() => setShowCardioModal(true)}
                      activeOpacity={1}
                    >
                      <Icon name="activity" size={20} color={colors.black} />
                      <Text style={styles.addCardioButtonText}>+ Cardio</Text>
                    </TouchableOpacity>
                  )}
                  {customExercises.length >= 3 && cardioEntries.length >= 3 && (
                    <View style={styles.maxLimitReached}>
                      <Text style={styles.maxLimitText}>Max limits reached</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {todaysWorkout.exercises?.map((exercise: any, index: number) => {
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
                  onPress={() => handleExercisePress(exerciseWithId.id)}
                  status={getExerciseStatus(exerciseWithId.id, exerciseWithId.sets)}
                  prPotential={hasPRPotential(exerciseWithId.id)}
                  isUpdating={updatingExerciseId === exerciseWithId.id}
                />
              );
            }) || (
              <Text style={styles.noExercisesText}>No exercises found for today</Text>
            )}
            
            {/* Custom Exercises */}
            {customExercises.map((exercise: any, index: number) => {
              const exerciseWithId = {
                ...exercise,
                id: exercise.id,
                targetMuscle: exercise.targetMuscle || 'Custom',
                restTime: exercise.restSeconds || 60,
                isCompleted:
                  getExerciseStatus(exercise.id, exercise.sets) === 'completed',
                isCustom: true,
              };
              
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exerciseWithId}
                  index={todaysWorkout.exercises?.length + index}
                  onPress={() => handleExercisePress(exerciseWithId.id)}
                  status={getExerciseStatus(exerciseWithId.id, exerciseWithId.sets)}
                  prPotential={false}
                  isUpdating={updatingExerciseId === exerciseWithId.id}
                />
              );
            })}
            
            {/* Max Custom Exercises Message */}
            {customExercises.length === 3 && (
              <View style={styles.maxCustomExercisesInfo}>
                <Icon name="info" size={16} color={colors.lightGray} />
                <Text style={styles.maxCustomExercisesText}>
                  Maximum of 3 custom exercises reached
                </Text>
              </View>
            )}
            
            {/* Cardio Section */}
            {(() => {
              // Get cardio entries from both state and weeklyWeightsData to ensure we show all entries
              const today = new Date().toISOString().split('T')[0];
              const todayCardioEntries = weeklyWeightsData?.cardioEntries?.[today] || [];
              // Merge state and database entries, preferring state (most recent)
              const allCardioEntries = [...todayCardioEntries];
              cardioEntries.forEach((stateEntry: any) => {
                if (!allCardioEntries.find((e: any) => e.id === stateEntry.id)) {
                  allCardioEntries.push(stateEntry);
                }
              });
              
              if (allCardioEntries.length === 0) return null;
              
              return (
                <View style={styles.cardioSection}>
                  <Text style={styles.cardioSectionTitle}>Cardio</Text>
                  {allCardioEntries.map((cardio: any) => {
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
                              <View style={styles.completedBadge}>
                                <Icon name="check-circle" size={14} color={colors.success} />
                                <Text style={styles.completedBadgeText}>Completed</Text>
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
                  {allCardioEntries.length === 3 && (
                    <View style={styles.maxCardioInfo}>
                      <Icon name="info" size={16} color={colors.lightGray} />
                      <Text style={styles.maxCardioText}>
                        Maximum of 3 cardio sessions reached
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
            
            {workoutStarted && (
              <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout} activeOpacity={1}>
                <Text style={styles.finishButtonText}>
                  Finish Workout ({workoutProgress.percentage}%)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <WorkoutOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onView={handleViewOption}
        onLetsGo={handleLetsGoOption}
        workoutName={todaysWorkout?.name}
      />

      <WorkoutPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onStartWorkout={handleStartWorkout}
        workoutName={todaysWorkout?.name}
        exercises={todaysWorkout?.exercises?.map((exercise: any, index: number) => ({
          id: exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restSeconds ? `${exercise.restSeconds}s` : undefined,
        })) || []}
        estimatedDuration={`${ensureMinimumDuration(todaysWorkout?.estimatedDuration)} min`}
      />

      <WorkoutNotStartedModal
        visible={showNotStartedModal}
        onClose={() => setShowNotStartedModal(false)}
        onStartWorkout={() => {
          setShowNotStartedModal(false);
          handleStartWorkout();
        }}
      />

      {/* Add Custom Exercise Modal */}
      <AddCustomExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAdd={handleAddCustomExercise}
      />
      
      <CardioEntryModal
        visible={showCardioModal}
        onClose={() => setShowCardioModal(false)}
        onSave={handleAddCardio}
        userWeight={userWeight}
      />

      {/* Workout Completion Modal */}
      {workoutCompletionData && (
        <Modal
          visible={showWorkoutConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWorkoutConfirmModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWorkoutConfirmModal(false)}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                {workoutCompletionData.percentage === 100 ? (
                  <>
                    <Text style={styles.modalTitle}>🎉 Amazing Work!</Text>
                    <Text style={styles.modalDescription}>
                      Outstanding! You've completed all {workoutCompletionData.total} exercises. You're crushing your fitness goals!
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.singleButton]}
                        onPress={() => {
                          setShowWorkoutConfirmModal(false);
                          completeWorkoutWithPercentage();
                        }}
                        activeOpacity={1}
                      >
                        <Text style={styles.confirmButtonText}>Finish Workout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Complete Workout?</Text>
                    <Text style={styles.modalDescription}>
                      You're at {workoutCompletionData.percentage}% completion ({workoutCompletionData.completed}/{workoutCompletionData.total} exercises). For better results do 100% next time!
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, styles.dualButton]}
                        onPress={() => {
                          setShowWorkoutConfirmModal(false);
                          completeWorkoutWithPercentage();
                        }}
                        activeOpacity={1}
                      >
                        <Text style={styles.cancelButtonText}>Yes, Finish</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.dualButton]}
                        onPress={() => setShowWorkoutConfirmModal(false)}
                        activeOpacity={1}
                      >
                        <Text style={styles.confirmButtonText}>Continue Workout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
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
  weekIndicator: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  workoutName: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  timerText: {
    ...typography.workoutTimer,
    color: colors.primary,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 52,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: colors.primary,
  },
  pauseButton: {
    backgroundColor: colors.primary,
  },
  resetButton: {
    backgroundColor: colors.mediumGray,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  startButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  startWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  startWorkoutText: {
    color: colors.black,
    fontSize: 18,
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
    ...typography.bodySmall,
    color: colors.primary,
  },
  exercisesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },

  noExercisesText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 32,
  },
  exercisesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseButtonText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  maxCustomExercisesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    gap: 8,
  },
  maxCustomExercisesText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  maxLimitReached: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  maxLimitText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  addCardioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addCardioButtonText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  cardioSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  cardioSectionTitle: {
    ...typography.h3,
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
  cardioCardName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardioCardDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  cardioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  completedBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  maxCardioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    gap: 8,
  },
  maxCardioText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  finishButton: {
    marginTop: 16,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    ...typography.button,
    color: colors.black,
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    display: 'flex',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.mediumGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 200,
  },
  dualButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 140,
  },
});
