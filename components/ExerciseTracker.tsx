import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Exercise, ExerciseSet } from '@/types/workout';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { userProgressService, activeWorkoutSessionService } from '@/db/services';
import { generateId } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';
import { typography } from '@/constants/typography';
import { 
  analyzeExercisePRs, 
  checkForNewPRs, 
  getBeatLastWorkoutSuggestions,
  type ExerciseLogs,
  type ExercisePRs,
  type PersonalRecord
} from '@/utils/pr-tracking';
import { PRCelebrationModal } from '@/components/PRCelebrationModal';

interface ExerciseTrackerProps {
  exercise: Exercise;
  exerciseKey: string;
  registerSave?: (fn: () => Promise<void>) => void;
  readOnly?: boolean;
  presetSession?: {
    unit: 'kg' | 'lb';
    sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>;
  };
  userProgressData?: any; // Pass cached progress to avoid expensive DB fetch
  hideCompleteButton?: boolean; // Hide internal button (parent will render floating button)
  onCompleteStateChange?: (state: { allCompleted: boolean; isCompleting: boolean; isLoading: boolean; onComplete: () => void }) => void;
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exercise,
  exerciseKey,
  registerSave,
  readOnly = false,
  presetSession,
  userProgressData: propUserProgressData,
  hideCompleteButton = false,
  onCompleteStateChange,
}) => {
  const router = useRouter();
  const MAX_SETS = 8;
  const MIN_SETS = 1;
  const MAX_WEIGHT_KG = 300; // Maximum weight in kg
  const MAX_REPS = 50; // Maximum reps per set
  const { updateExerciseSet } = useWorkoutStore();
  const { user } = useAuthStore();

  // Unit handling
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  // Local sets state (weight stored internally as kg)
  const initialCount = Math.min(
    Math.max(typeof exercise.sets === 'number' ? exercise.sets : MIN_SETS, MIN_SETS),
    MAX_SETS
  );
  const [sets, setSets] = useState<ExerciseSet[]>(
    exercise.userSets ||
      Array.from({ length: initialCount }, () => ({
        id: generateId(),
        reps: 10, // Default 10 reps
        weight: 10, // Default 10kg
        isCompleted: false,
      }))
  );
  
  // Minimal loading state to prevent flash of default values
  const [isLoadingSets, setIsLoadingSets] = useState(!presetSession);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completionData, setCompletionData] = useState<{percentage: number, completed: number, total: number} | null>(null);
  const [isCompletingExercise, setIsCompletingExercise] = useState(false);
  const hasUserEditedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // PR tracking state
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [beatLastSuggestions, setBeatLastSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isPRDataLoaded, setIsPRDataLoaded] = useState(false);
  
  // PR Celebration Modal state
  const [showPRModal, setShowPRModal] = useState(false);
  const [achievedPRs, setAchievedPRs] = useState<PersonalRecord[]>([]);

  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(90); // 1:30 in seconds
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Exercise finalization state (tracks if user clicked "Complete Exercise" button)
  const [isExerciseFinalized, setIsExerciseFinalized] = useState(false);

  // Start rest timer when a set is checked
  const startRestTimer = () => {
    // Clear any existing timer
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    
    setRestTimeRemaining(90); // Reset to 1:30
    setRestTimerActive(true);
    
    restTimerRef.current = setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
          }
          setRestTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, []);

  // Format rest time as MM:SS
  const formatRestTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  // Load PR data function (moved outside useEffect for reuse)
  const loadPRData = async () => {
    if (!user?.id) return;
    
    // OPTIMIZATION: Skip PR data for manual workout exercises (they have unique session IDs)
    if (exerciseKey.startsWith('manual-')) {
      setExerciseLogs({});
      setExercisePRs({});
      setBeatLastSuggestions([]);
      setIsPRDataLoaded(true);
      return;
    }
    
    const prStart = performance.now();

    try {
      // OPTIMIZATION: Try cache first to avoid database fetch
      const cache = useWorkoutCacheStore.getState();
      let progress = cache.userProgressData;
      
      // Only fetch from DB if cache is invalid or missing
      if (!progress || !cache.isCacheValid()) {
        const fetchStart = performance.now();
        progress = await userProgressService.getByUserId(user.id);
      } else {
        // Using cached PR data
      }
      
      if (progress?.weeklyWeights) {
        // Handle both string (from JSON) and object (from JSONB) types
        const weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;
        const logs = weeklyWeights?.exerciseLogs || {};
        
        setExerciseLogs(logs);
        
        // OPTIMIZATION: Only analyze PRs for the current exercise, not all exercises
        const currentExerciseLogs = logs[exerciseKey] || [];
        const singleExerciseLog: ExerciseLogs = { [exerciseKey]: currentExerciseLogs };
        const currentExercisePRs = analyzeExercisePRs(singleExerciseLog);
        setExercisePRs(currentExercisePRs);
        
        // Generate beat last workout suggestions
        const suggestions = getBeatLastWorkoutSuggestions(exerciseKey, currentExercisePRs);
        setBeatLastSuggestions(suggestions);
      }
      setIsPRDataLoaded(true);
    } catch (error) {
      console.error('Failed to load PR data:', error);
      setIsPRDataLoaded(true); // Set to true even on error to prevent infinite loading
    }
  };

  // Load session data function (reusable)
  const loadSessionData = async () => {
    const loadStart = performance.now();

    if (presetSession) {
      const limitedSets = presetSession.sets.slice(0, MAX_SETS);
      const hydrated: ExerciseSet[] = (limitedSets.length > 0
        ? limitedSets
        : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
      ).map((s) => ({ id: generateId(), reps: s.reps, weight: s.weightKg, isCompleted: !!s.isCompleted }));
      setUnit(presetSession.unit || 'kg');
      setSets(hydrated);
      setIsLoadingSets(false);
      return;
    }
    
    // OPTIMIZATION: Skip session loading for manual exercises (they always start fresh)
    if (exerciseKey.startsWith('manual-')) {
      setIsLoadingSets(false);
      return;
    }
    
    // Load current session data if not read-only
    if (!user?.id || !exerciseKey) {
      setIsLoadingSets(false);
      return;
    }
    try {
      // CRITICAL: Check active session FIRST (in-progress workout data)
      const activeSession = await activeWorkoutSessionService.getActive(user.id);

      if (activeSession?.session_data?.exercises?.[exerciseKey]) {
        const exerciseData = activeSession.session_data.exercises[exerciseKey];
        const activeSets = exerciseData.sets || [];
        
        if (activeSets.length > 0) {
          setUnit('kg'); // All weights stored in kg
          
          const limitedSets = activeSets.slice(0, MAX_SETS);
          const hydrated: ExerciseSet[] = limitedSets.map((s: any) => ({ 
            id: generateId(), 
            reps: s.reps || 0, 
            weight: s.weightKg || 0, 
            isCompleted: !!s.isCompleted 
          }));
          setSets(hydrated);
          setIsLoadingSets(false);
          return;
        }
      }

      // No active session = fresh workout = start with empty sets (don't load old data)
      setIsLoadingSets(false);
    } catch (e) {
      // If no previous session found, start with empty sets
      console.error('❌ Error loading session, starting fresh:', e);
      setIsLoadingSets(false);
    }
  };

  useEffect(() => {
    loadSessionData();
    loadPRData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, exerciseKey, presetSession?.unit, JSON.stringify(presetSession?.sets)]);

  // Reload data when screen is focused (user navigates back to exercise)
  useFocusEffect(
    React.useCallback(() => {
      if (!readOnly) {
        setIsLoadingSets(true); // Show loading skeleton while refetching
        loadSessionData();
      }
    }, [user?.id, exerciseKey, readOnly])
  );

  // Expose immediate save to parent (e.g., on back press)
  useEffect(() => {
    if (!registerSave) return;
    registerSave(async () => {
      // Flush any pending debounce and force save now
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (!readOnly) {
        await handleSaveSession();
      }
    });
  }, [registerSave, unit, sets, readOnly]);

  // Flush save when screen loses focus (navigate back)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (hasUserEditedRef.current) {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          // fire and forget
          handleSaveSession();
        }
      };
    }, [unit, sets])
  );

  // Removed auto-save on unmount to avoid dev double-mount overwriting saved state

  const toDisplayWeight = (weightKg: number): string => {
    if (unit === 'kg') return (Math.round(weightKg * 10) / 10).toString();
    const lb = weightKg * 2.2046226218;
    return (Math.round(lb * 10) / 10).toString();
  };

  const fromDisplayWeightToKg = (value: string): number => {
    const n = parseFloat(value);
    if (!isFinite(n)) return 0;
    if (unit === 'kg') return n;
    return n / 2.2046226218;
  };

  const handleWeightChange = (setId: string, weight: string) => {
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = true; // Allow editing any set regardless of order
    if (!isEditable) return;
    const rawWeight = fromDisplayWeightToKg(weight);
    const numWeight = Math.max(0, Math.min(MAX_WEIGHT_KG, rawWeight));
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, weight: numWeight } : set
    );
    
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { weight: numWeight });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleRepsChange = (setId: string, reps: string) => {
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = true; // Allow editing any set regardless of order
    if (!isEditable) return;
    const rawReps = parseInt(reps) || 0;
    const numReps = Math.max(0, Math.min(MAX_REPS, rawReps));
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, reps: numReps } : set
    );

    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { reps: numReps });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleToggleSetComplete = (setId: string) => {
    if (readOnly || isExerciseFinalized) return;
    hasUserEditedRef.current = true;
    
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    
    // Toggle completion
    const newCompleted = !set.isCompleted;
    const updatedSets = sets.map((s) =>
      s.id === setId ? { ...s, isCompleted: newCompleted } : s
    );
    
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { isCompleted: newCompleted });
    
    // Start rest timer when checking a set (if it has weight and reps)
    if (newCompleted && set.weight > 0 && set.reps > 0) {
      startRestTimer();
    } else if (!newCompleted) {
      // Stop timer when unchecking
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      setRestTimerActive(false);
    }
    
    scheduleAutoSave();
  };

  const handleAdjustWeight = (setId: string, deltaDisplayUnits: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const currentDisplay = parseFloat(toDisplayWeight(set.weight)) || 0;
    const nextDisplay = Math.max(0, Math.min(MAX_WEIGHT_KG, currentDisplay + deltaDisplayUnits));
    handleWeightChange(setId, nextDisplay.toString());
  };

  const handleAdjustReps = (setId: string, delta: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const next = Math.max(0, Math.min(MAX_REPS, (set.reps || 0) + delta));
    handleRepsChange(setId, next.toString());
  };

  const handleAddSet = () => {
    if (readOnly) return;
    setSets((prev) => {
      if (prev.length >= MAX_SETS) return prev;
      const next = [
        ...prev,
        { id: generateId(), reps: 10, weight: 10, isCompleted: false },
      ];
      hasUserEditedRef.current = true;
      scheduleAutoSave();
      return next;
    });
  };

  const handleRemoveSet = (setId?: string) => {
    if (readOnly) return;
    setSets((prev) => {
      if (prev.length <= MIN_SETS) return prev;
      let next: ExerciseSet[];
      if (setId) {
        const filtered = prev.filter((s) => s.id !== setId);
        next = filtered.length >= MIN_SETS ? filtered : prev;
      } else {
        next = prev.slice(0, -1);
      }
      if (next !== prev) {
        hasUserEditedRef.current = true;
        scheduleAutoSave();
      }
      return next;
    });
  };

  const handleSaveSession = async () => {
    if (readOnly) return;
    if (!user?.id) return;
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    isSavingRef.current = true;
    setSaveStatus('saving');
    const payload = {
      unit,
      sets: sets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.weight ?? 0,
        reps: s.reps ?? 0,
        isCompleted: !!s.isCompleted,
      })),
    };
    try {
      await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);
      setSaveStatus('saved');

      // Don't update cache on auto-save - only update when exercise is completed
      // Auto-save happens on every weight/reps change, which would mark as "in-progress"
      // Only update cache in completeExercise() to avoid incorrect status

      // Don't reload session data after save - it creates an infinite loop
      // The data is already correct in memory
      // await loadSessionData();

      // OPTIMIZATION: Don't reload PR data on auto-save - PRs only change on exercise completion
      // This was causing performance issues as it refetched and reanalyzed data on every edit
      // PR data is loaded on mount and after exercise completion, which is sufficient
    } catch (e) {
      console.error(`❌ Failed to save ${exerciseKey}:`, e);
      setSaveStatus('error');
      // On error, try to reload to see what was actually saved
      await loadSessionData().catch(() => {});
      // Skip PR reload on error - not necessary
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        // schedule immediate follow-up save
        handleSaveSession();
      }
    }
  };

  const scheduleAutoSave = () => {
    if (!hasUserEditedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSaveSession();
    }, 250);
  };

  // Check if at least one set is completed (ready to complete, but not finalized yet)
  const allSetsChecked = sets.some(s => s.isCompleted && s.weight > 0 && s.reps > 0);

  // Notify parent of completion state changes
  useEffect(() => {
    if (onCompleteStateChange) {
      onCompleteStateChange({
        allCompleted: isExerciseFinalized,
        isCompleting: isCompletingExercise,
        isLoading: isLoadingSets,
        onComplete: handleCompleteExercise
      });
    }
  }, [isExerciseFinalized, isCompletingExercise, isLoadingSets, onCompleteStateChange]);

  const handleCompleteExercise = async () => {
    if (readOnly || isExerciseFinalized || !allSetsChecked) return;

    // Calculate completion data for modal
    const completedSets = sets.filter(s => s.isCompleted).length;
    const totalSets = sets.length;
    const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    // Simple confirmation modal - no PR tracking
    setCompletionData({ percentage: completionPercentage, completed: completedSets, total: totalSets });
    setShowConfirmModal(true);
  };

  const completeExercise = async () => {
    if (!user?.id) {
      console.error('❌ No user ID available');
      return;
    }
    
    // IMMEDIATELY set completing flag to hide buttons
    setIsCompletingExercise(true);

    // Prepare the completed session data (keep user's checked state)
    const updatedSets = sets.map((set) => {
      const reps = set.reps > 0 ? set.reps : 1;
      const weight = set.weight > 0 ? set.weight : 0;
      return {
        ...set,
        reps,
        weight,
        // Keep the user's checked state - don't force all to true
      };
    });

    // IMMEDIATELY update local state to show completed status
    setSets(updatedSets);

    const payload = {
      unit,
      sets: updatedSets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.weight ?? 0,
        reps: s.reps ?? 0,
        isCompleted: s.isCompleted, // Use actual checked state
      })),
    };
    
    const today = new Date().toISOString().slice(0, 10);
    
    // OPTIMIZATION: For manual exercises, use simplified flow
    const isManualExercise = exerciseKey.startsWith('manual-');
    
    if (isManualExercise) {
      try {
        // Save to database (still needed for history tracking)
        await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);

        // Update cache so workout-session shows completed badge
        const freshProgress = await userProgressService.getByUserId(user.id);
        if (freshProgress) {
          useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: freshProgress });
        }
        
        // NEW: Update new database system (mark ONLY checked sets as completed)
        try {
          const { workoutSessionService } = await import('@/db/services');
          const activeSession = await workoutSessionService.getActiveSession(user.id);
          if (activeSession) {
            const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
            const exerciseData = sessionData?.exercises.find((ex: any) => ex.exercise_id === exerciseKey);
            if (exerciseData) {
              // Only mark the sets that were actually checked by the user
              for (const dbSet of exerciseData.sets || []) {
                // Find the corresponding local set
                const localSet = sets.find((s) => s.id === dbSet.id);
                if (localSet && localSet.isCompleted) {
                  // Only update if the set was checked
                  await workoutSessionService.updateSet(dbSet.id, {
                    is_completed: true,
                    weight_kg: localSet.weight || 0,
                    reps: localSet.reps || 0,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Failed to update new database system:', err);
          // Don't fail the whole operation if new system fails
        }
        
        // Mark as finalized
        setIsExerciseFinalized(true);
        
        // OPTIMISTIC UPDATE: Update active session state immediately (don't wait for DB)
        try {
          const { workoutSessionService } = await import('@/db/services');
          const activeSession = await workoutSessionService.getActiveSession(user.id);
          if (activeSession) {
            const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
            // Update the exercise status in memory immediately
            if (sessionData?.exercises) {
              const exerciseIndex = sessionData.exercises.findIndex((ex: any) => ex.exercise_id === exerciseKey);
              if (exerciseIndex !== -1) {
                // Mark exercise as completed in cached state
                sessionData.exercises[exerciseIndex].status = 'COMPLETED';
                // Store in a temporary cache that workout screen can read
                if (typeof window !== 'undefined') {
                  (window as any).__optimisticSessionUpdate = sessionData;
                }
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Failed to create optimistic update:', err);
        }
        
        // Navigate back immediately (no delay!)
        router.back();
        return; // Exit early
      } catch (error) {
        console.error('❌ [ExerciseTracker] Failed to save manual exercise:', error);
        Alert.alert('Error', 'Failed to save exercise progress');
        setIsCompletingExercise(false);
        return;
      }
    }
    
    // STEP 1: OPTIMISTIC UPDATE - Update cache IMMEDIATELY (before database)
    const currentProgress = useWorkoutCacheStore.getState().userProgressData;
    let originalProgress: any = null; // Store original state for rollback
    
    if (currentProgress) {
      // Deep clone original state for potential rollback (including nested objects)
      originalProgress = JSON.parse(JSON.stringify(currentProgress));
      
      // Parse weeklyWeights
      let weeklyWeights = currentProgress.weeklyWeights;
      if (typeof weeklyWeights === 'string') {
        weeklyWeights = JSON.parse(weeklyWeights);
      }
      // Deep clone weeklyWeights to avoid mutating the original
      weeklyWeights = JSON.parse(JSON.stringify(weeklyWeights || {}));
      
      // Ensure exerciseLogs exists
      if (!weeklyWeights.exerciseLogs) {
        weeklyWeights.exerciseLogs = {};
      }
      if (!weeklyWeights.exerciseLogs[exerciseKey]) {
        weeklyWeights.exerciseLogs[exerciseKey] = [];
      }
      
      // Update or add today's session with completed data
      const sessions = weeklyWeights.exerciseLogs[exerciseKey];
      
      // Simple: Find session by date only
      const todaySessionIndex = sessions.findIndex((s: any) => s.date === today);
      
      const completedSession = {
        date: today,
        unit: payload.unit,
        sets: payload.sets
      };
      
      if (todaySessionIndex >= 0) {
        sessions[todaySessionIndex] = completedSession;
      } else {
        sessions.push(completedSession);
      }
      
      // Create optimistically updated progress object
      const optimisticProgress = {
        ...currentProgress,
        weeklyWeights: weeklyWeights
      };
      
      // Update cache with optimistic data
      useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: optimisticProgress });
    }
    
    try {
      // STEP 2: Save to ACTIVE SESSION (not permanent storage)
      // Get or create active session
      let session = await activeWorkoutSessionService.getActive(user.id);
      if (!session) {
        // Create new session if none exists
        const isManualExercise = exerciseKey.startsWith('manual-');
        const workoutType = isManualExercise ? 'manual' : (currentProgress?.currentWorkout || 'push-a');
        session = await activeWorkoutSessionService.create(user.id, workoutType, exercise.name);
      }

      // Update session with exercise completion
      const sessionData = session.session_data || { exercises: {}, startTime: new Date().toISOString(), lastUpdated: new Date().toISOString() };
      if (!sessionData.exercises) sessionData.exercises = {};

      sessionData.exercises[exerciseKey] = {
        completed: true,
        sets: payload.sets
      };

      await activeWorkoutSessionService.updateSessionData(session.id, sessionData);
      
      // NEW: Update new database system (mark ONLY checked sets as completed)
      try {
        const { workoutSessionService } = await import('@/db/services');
        const activeSession = await workoutSessionService.getActiveSession(user.id);
        if (activeSession) {
          const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
          const exerciseData = sessionData?.exercises.find((ex: any) => ex.exercise_id === exerciseKey);
          if (exerciseData) {
            // Only mark the sets that were actually checked by the user
            for (const dbSet of exerciseData.sets || []) {
              // Find the corresponding local set
              const localSet = sets.find((s) => s.id === dbSet.id);
              if (localSet && localSet.isCompleted) {
                // Only update if the set was checked
                await workoutSessionService.updateSet(dbSet.id, {
                  is_completed: true,
                  weight_kg: localSet.weight || 0,
                  reps: localSet.reps || 0,
                });
              }
            }
            console.log(`✅ Exercise "${exerciseKey}" - completed sets saved to new database`);
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to update new database system:', err);
        // Don't fail the whole operation if new system fails
      }
      
      // Show success feedback - DISABLED
      // if (Platform.OS !== 'web') {
      //   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // }
      
      // Mark as finalized
      setIsExerciseFinalized(true);
      
      // OPTIMISTIC UPDATE: Update active session state immediately (don't wait for DB)
      try {
        const { workoutSessionService } = await import('@/db/services');
        const activeSession = await workoutSessionService.getActiveSession(user.id);
        if (activeSession) {
          const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
          // Update the exercise status in memory immediately
          if (sessionData?.exercises) {
            const exerciseIndex = sessionData.exercises.findIndex((ex: any) => ex.exercise_id === exerciseKey);
            if (exerciseIndex !== -1) {
              // Mark exercise as completed in cached state
              sessionData.exercises[exerciseIndex].status = 'COMPLETED';
              // Store in a temporary cache that workout screen can read
              if (typeof window !== 'undefined') {
                (window as any).__optimisticSessionUpdate = sessionData;
              }
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to create optimistic update:', err);
      }
      
      // Navigate back immediately (no delay!)
      router.back();
      
    } catch (e) {
      console.error('❌ Failed to complete exercise:', e);
      
      // STEP 4: ROLLBACK - Revert optimistic update if database save failed
      if (originalProgress) {
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: originalProgress });
      }
      
      // Revert local state (sets back to incomplete)
      const revertedSets = sets.map((set) => ({
        ...set,
        isCompleted: false,
      }));
      setSets(revertedSets);
      
      // Reset completing flag so buttons can appear again
      setIsCompletingExercise(false);
      
      // Alert user about the failure
      Alert.alert(
        'Failed to Save',
        'Your exercise completion could not be saved. Please check your connection and try again.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
      
      // Don't navigate back - keep user on exercise screen so they can retry
    }
  };

  const handleResetToPending = async () => {
    if (readOnly) return;
    
    // Mark all sets as incomplete (pending)
    setSets((prev) => prev.map((s) => ({ ...s, isCompleted: false })));
    hasUserEditedRef.current = true;
    
    // Save the session immediately
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await handleSaveSession();
    
    // Update the workout cache to reflect "in-progress" status (not completed)
    try {
      if (!user?.id) {
        console.error('❌ No user ID available');
        return;
      }
      
      const { userProgressService } = await import('@/db/services');
      const freshProgress = await userProgressService.getByUserId(user.id);
      
      if (freshProgress) {
        const { useWorkoutCacheStore } = await import('@/store/workout-cache-store');
        useWorkoutCacheStore.getState().setWorkoutData({ 
          userProgressData: freshProgress 
        });
      }
    } catch (error) {
      console.error('❌ Failed to update cache after reset:', error);
    }
  };

  const handleClearAll = async () => {
    if (readOnly) return;
    setSets((prev) => prev.map((s) => ({ ...s, reps: 0, weight: 0, isCompleted: false })));
    hasUserEditedRef.current = true;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await handleSaveSession();
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
        </View>
        {!isExerciseFinalized && (
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push(`/exercise-history?exerciseId=${exerciseKey}&exerciseName=${encodeURIComponent(exercise.name)}`)}
        >
          <Icon name="bar-chart-2" size={20} color={colors.primary} />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
        )}
      </View> */}
      
      {/* Completed Badge - Simple and Clean */}
      {isExerciseFinalized && (
        <View style={styles.completedBanner}>
          <Icon name="check-circle" size={20} color={colors.success} />
          <Text style={styles.completedBannerText}>Completed</Text>
        </View>
      )}
      
      {/* Beat Last Workout Suggestions - Hidden when completed */}
      {!isExerciseFinalized && false && !readOnly && beatLastSuggestions.length > 0 && showSuggestions && isPRDataLoaded && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Icon name="target" size={16} color={colors.primary} />
            <Text style={styles.suggestionsTitle}>Beat Last Workout</Text>
            <TouchableOpacity onPress={() => setShowSuggestions(false)}>
              <Icon name="x" size={16} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
            {beatLastSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionChip}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {readOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>Finished workout • Read-only</Text>
        </View>
      )}
      <View style={styles.unitToggleRow}>
        {/* Exercise Info - Left Side */}
        <View style={styles.exerciseInfoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Sets</Text>
            <Text style={styles.infoValue}>{exercise.sets}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Reps</Text>
            <Text style={styles.infoValue}>{exercise.reps}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Rest</Text>
            <Text style={styles.infoValue}>{exercise.restTime}s</Text>
          </View>
        </View>
        
        {/* Unit Toggle - Right Side */}
        <View style={styles.unitToggle}>
          <TouchableOpacity
            onPress={() => setUnit('kg')}
            style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
            activeOpacity={1}
          >
            <Text style={styles.unitButtonText}>kg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUnit('lb')}
            style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
            activeOpacity={1}
          >
            <Text style={styles.unitButtonText}>lb</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.setColumn]}>SET</Text>
        <Text style={[styles.headerText, styles.weightColumn]}>WEIGHT ({unit})</Text>
        <Text style={[styles.headerText, styles.repsColumn]}>REPS</Text>
      </View>

      {isLoadingSets ? (
        <View style={styles.loadingSetsSkeleton}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        sets.map((set, index) => {
        const editable = true; // Allow editing any set regardless of order
        const readyToComplete = editable && (set.weight ?? 0) > 0 && (set.reps ?? 0) > 0;
        return (
          <View key={set.id} style={styles.setRow}>
            <View style={styles.setColumn}>
              <Text style={styles.setNumber}>{index + 1}</Text>
            </View>

            <View style={styles.weightColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? -2.5 : -5)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, (!editable || isExerciseFinalized) && styles.inputDisabled]}
                  value={toDisplayWeight(set.weight)}
                  onChangeText={(text) => handleWeightChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_WEIGHT_KG}${unit})`}
                  editable={editable && !readOnly && !isExerciseFinalized}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? 2.5 : 5)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.repsColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || set.reps <= 0 || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, -1)}
                  disabled={!editable || set.reps <= 0 || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, (!editable || isExerciseFinalized) && styles.inputDisabled]}
                  value={set.reps.toString()}
                  onChangeText={(text) => handleRepsChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_REPS})`}
                  editable={editable && !readOnly && !isExerciseFinalized}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, 1)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox Column */}
            {!readOnly && (
              <View style={styles.checkboxColumn}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    set.isCompleted && styles.checkboxChecked,
                    isExerciseFinalized && styles.disabledButton
                  ]}
                  onPress={() => handleToggleSetComplete(set.id)}
                  disabled={isExerciseFinalized}
                  activeOpacity={0.7}
                >
                  {set.isCompleted && (
                    <Icon name="check" size={16} color={colors.black} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
        })
      )}

      {/* Rest Timer Banner */}
      {restTimerActive && !readOnly && (
        <View style={styles.restTimerBanner}>
          <LinearGradient
            colors={[
              'rgba(132, 204, 22, 0.15)',
              'rgba(34, 197, 94, 0.1)',
              'rgba(20, 25, 35, 0.8)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.restTimerGradient}
          >
            <View style={styles.restTimerContent}>
              <View style={styles.restTimerLeft}>
                <Text style={styles.restTimerTitle}>REST TIME</Text>
                <Text style={styles.restTimerSubtext}>Recover before next set</Text>
              </View>
              <View style={styles.restTimerRight}>
                <Text style={styles.restTimerTime}>{formatRestTime(restTimeRemaining)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (restTimerRef.current) {
                      clearInterval(restTimerRef.current);
                      restTimerRef.current = null;
                    }
                    setRestTimerActive(false);
                  }}
                  style={styles.restTimerSkip}
                >
                  <Text style={styles.restTimerSkipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, (sets.length <= MIN_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={() => handleRemoveSet()}
            disabled={sets.length <= MIN_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Icon name="minus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Remove last</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, (sets.length >= MAX_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={handleAddSet}
            disabled={sets.length >= MAX_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Icon name="plus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Add set</Text>
          </TouchableOpacity>
        </View>
      )}

      {!readOnly && !hideCompleteButton && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.completeButton, (!allSetsChecked || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={handleCompleteExercise}
            disabled={!allSetsChecked || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Text style={styles.completeButtonText}>
              {isExerciseFinalized ? 'Completed' : 'Complete Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal - Simple and Clean */}
      {completionData && (
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowConfirmModal(false);
            setAchievedPRs([]); // Clear PRs when modal closes
          }}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowConfirmModal(false);
              setAchievedPRs([]); // Clear PRs when modal closes
            }}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>Complete Exercise?</Text>
                    <Text style={styles.modalDescription}>
                  Mark this exercise as completed and move to the next one?
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.dualButton]}
                        onPress={() => {
                          setShowConfirmModal(false);
                          setAchievedPRs([]); // Clear PRs
                          completeExercise();
                        }}
                      >
                    <Text style={styles.confirmButtonText}>Complete</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, styles.dualButton]}
                        onPress={() => {
                          setShowConfirmModal(false);
                          setAchievedPRs([]); // Clear PRs
                        }}
                      >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* PR Celebration Modal - COMMENTED OUT FOR NOW */}
      {/* <PRCelebrationModal
        visible={showPRModal}
        exerciseName={exercise.name}
        prs={achievedPRs}
        onClose={() => {
          setShowPRModal(false);
          router.back();
        }}
        onShare={() => {
          // TODO: Implement share functionality
          // Could use expo-sharing here
        }}
      /> */}

      {/* Completing Exercise Loader */}
      {isCompletingExercise && (
        <View style={styles.completingOverlay}>
          <View style={styles.completingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.completingText}>Completing exercise...</Text>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  loadingSetsSkeleton: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 30,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    ...typography.h5,
    color: colors.white,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    marginTop: 2,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitToggleRow: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.mediumGray,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
  },
  unitButtonText: {
    ...typography.caption,
    color: colors.black,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
    marginBottom: 8,
  },
  // removed saved banner styles
  headerText: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  setColumn: {
    width: '12%',
    alignItems: 'center',
  },
  weightColumn: {
    width: '37%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  repsColumn: {
    width: '37%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  checkboxColumn: {
    width: '14%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  setNumber: {
    ...typography.timerSmall,
    color: colors.white,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 36,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    ...typography.timerSmall,
    flex: 1,
    textAlign: 'center',
    color: colors.white,
  },
  inputDisabled: {
    opacity: 0.5,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mediumGray,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledField: {
    opacity: 0.5,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.black,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.button,
    color: colors.black,
  },
  completedButton: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
    
  },
  completedButtonText: {
    color: colors.lightGray,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    ...typography.button,
    color: colors.white,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  clearButtonText: {
    color: colors.lighterGray,
    fontWeight: 'bold',
  },

  readOnlyBanner: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  readOnlyText: {
    ...typography.caption,
    color: colors.lighterGray,
    textAlign: 'center',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completedBannerText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    fontSize: 16,
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
  
  // PR Display Section styles
  prSection: {
    width: '100%',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  prSectionTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  prItemContent: {
    flex: 1,
  },
  prItemLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    marginBottom: 4,
  },
  prItemValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  prItemPrevious: {
    ...typography.caption,
    color: colors.lighterGray,
    fontSize: 12,
    fontWeight: '400',
  },
  
  // New PR tracking styles
  titleContainer: {
    flex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  historyButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Beat Last Workout Suggestions
  suggestionsContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  suggestionsTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionChip: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 12,
  },
  completingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  completingContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  completingText: {
    ...typography.body,
    color: colors.primary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  restTimerBanner: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  restTimerGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.3)',
    overflow: 'hidden',
  },
  restTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15, 20, 30, 0.85)',
  },
  restTimerLeft: {
    flex: 1,
  },
  restTimerTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  restTimerSubtext: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
  },
  restTimerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  restTimerTime: {
    ...typography.h2,
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  restTimerSkip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  restTimerSkipText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
