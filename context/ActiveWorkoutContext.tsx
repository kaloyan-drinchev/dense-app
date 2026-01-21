import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { workoutSessionService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import type { WorkoutSession, SessionExerciseWithSets, SessionSet } from '@/types/workout-session';

interface ActiveWorkoutState {
  sessionId: string | null;
  session: WorkoutSession | null;
  exercises: SessionExerciseWithSets[];
  isLoading: boolean;
  isInitialized: boolean;
}

interface ActiveWorkoutContextValue extends ActiveWorkoutState {
  // Actions
  startWorkout: (templateId: string) => Promise<void>;
  cancelWorkout: () => Promise<void>;
  completeWorkout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Optimistic updates
  updateExerciseStatus: (exerciseId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
  updateSetCompletion: (setId: string, isCompleted: boolean, weight?: number, reps?: number) => void;
  
  // Helpers
  getExerciseById: (exerciseId: string) => SessionExerciseWithSets | undefined;
  getExerciseStatus: (exerciseId: string) => 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [state, setState] = useState<ActiveWorkoutState>({
    sessionId: null,
    session: null,
    exercises: [],
    isLoading: false,
    isInitialized: false,
  });

  // Load active session on mount (once)
  useEffect(() => {
    if (user?.id && !state.isInitialized) {
      loadActiveSession();
    }
  }, [user?.id, state.isInitialized]);

  const loadActiveSession = async () => {
    if (!user?.id) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const activeSession = await workoutSessionService.getActiveSession(user.id);
      
      if (activeSession) {
        // Check if session is stale (started more than 24 hours ago)
        const sessionStartTime = new Date(activeSession.started_at).getTime();
        const now = Date.now();
        const hoursSinceStart = (now - sessionStartTime) / (1000 * 60 * 60);
        
        if (hoursSinceStart > 24) {
          // Session is stale - automatically cancel it
          console.log('🧹 [ActiveWorkoutContext] Found stale session from', new Date(activeSession.started_at).toLocaleString(), '- canceling it');
          await workoutSessionService.cancelSession(activeSession.id);
          
          setState({
            sessionId: null,
            session: null,
            exercises: [],
            isLoading: false,
            isInitialized: true,
          });
          
          return;
        }
        
        // Session is recent - load it
        const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
        
        setState({
          sessionId: activeSession.id,
          session: activeSession,
          exercises: sessionData?.exercises || [],
          isLoading: false,
          isInitialized: true,
        });
      } else {
        setState({
          sessionId: null,
          session: null,
          exercises: [],
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('❌ Failed to load active session:', error);
      setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
    }
  };

  const startWorkout = async (templateId: string) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }

    try {
      console.log('🏋️ [ActiveWorkoutContext] Starting workout from template:', templateId);
      console.log('🏋️ [ActiveWorkoutContext] Current session before start:', state.sessionId);
      
      // CRITICAL FIX: Clear any stale data FIRST to prevent showing old exercises from previous workouts
      setState({
        sessionId: null,
        session: null,
        exercises: [],
        isLoading: true,
        isInitialized: false,
      });
      
      console.log('🧹 [ActiveWorkoutContext] Cleared stale data - starting fresh');
      
      // Start workout session (FIX: correct parameter order - userId FIRST!)
      const sessionId = await workoutSessionService.startWorkoutSession(user.id, templateId);
      
      if (!sessionId) {
        throw new Error('Failed to create session');
      }
      
      console.log('✅ [ActiveWorkoutContext] New session created:', sessionId);
      
      // Load full session data with exercises
      const sessionData = await workoutSessionService.getSessionWithExercises(sessionId);
      
      console.log('📊 [ActiveWorkoutContext] Session data loaded:', {
        exercisesCount: sessionData?.exercises?.length,
        allStatuses: sessionData?.exercises?.map((e: any) => e.status)
      });
      
      setState({
        sessionId: sessionId,
        session: sessionData?.session || null,
        exercises: sessionData?.exercises || [],
        isLoading: false,
        isInitialized: true,
      });
      
      console.log('✅ [ActiveWorkoutContext] Context updated with new session');
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const cancelWorkout = async () => {
    if (!state.sessionId) return;

    try {
      // Optimistically clear state IMMEDIATELY
      setState({
        sessionId: null,
        session: null,
        exercises: [],
        isLoading: false,
        isInitialized: true,
      });
      
      // Cancel in background
      await workoutSessionService.cancelSession(state.sessionId);
    } catch (error) {
      console.error('❌ Failed to cancel workout:', error);
      // Re-load to get actual state
      await loadActiveSession();
    }
  };

  const completeWorkout = async () => {
    if (!state.sessionId) {
      console.log('⚠️ [ActiveWorkoutContext] No session to complete');
      return;
    }

    try {
      console.log('🏁 [ActiveWorkoutContext] Completing workout session:', state.sessionId);
      
      const duration = state.session?.started_at 
        ? Math.floor((Date.now() - new Date(state.session.started_at).getTime()) / 1000)
        : 0;
      
      // Calculate total volume
      const totalVolume = state.exercises.reduce((sum, exercise) => {
        return sum + (exercise.sets || []).reduce((setSum, set) => {
          return setSum + (set.is_completed ? (set.weight_kg || 0) * (set.reps || 0) : 0);
        }, 0);
      }, 0);
      
      console.log('📊 [ActiveWorkoutContext] Workout stats:', { duration, totalVolume });
      
      // Optimistically clear state IMMEDIATELY
      setState({
        sessionId: null,
        session: null,
        exercises: [],
        isLoading: false,
        isInitialized: true,
      });
      
      console.log('✅ [ActiveWorkoutContext] Context cleared');
      
      // Complete in background
      await workoutSessionService.completeSession(state.sessionId, duration, totalVolume);
      
      console.log('✅ [ActiveWorkoutContext] Session completed in database');
    } catch (error) {
      console.error('❌ Failed to complete workout:', error);
      // Re-load to get actual state
      await loadActiveSession();
    }
  };

  const refreshSession = async () => {
    if (!state.sessionId || !user?.id) {
      // No active session, try to load one
      await loadActiveSession();
      return;
    }

    try {
      const sessionData = await workoutSessionService.getSessionWithExercises(state.sessionId);
      
      if (sessionData) {
        setState(prev => ({
          ...prev,
          exercises: sessionData.exercises || [],
        }));
      }
    } catch (error) {
      console.error('❌ Failed to refresh session:', error);
    }
  };

  // OPTIMISTIC UPDATE: Update exercise status immediately in memory AND database
  const updateExerciseStatus = useCallback(async (exerciseId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!state.sessionId) return;

    // Update local state IMMEDIATELY (ZERO latency)
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.exercise_id === exerciseId
          ? { ...ex, status }
          : ex
      ),
    }));

    // Update database in background
    try {
      await workoutSessionService.updateExerciseStatus(state.sessionId, exerciseId, status);
    } catch (error) {
      console.error('❌ Failed to update exercise status in DB:', error);
    }
  }, [state.sessionId]);

  // OPTIMISTIC UPDATE: Update set completion immediately
  const updateSetCompletion = useCallback((setId: string, isCompleted: boolean, weight?: number, reps?: number) => {
    // Step A: Update local state IMMEDIATELY
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ({
        ...ex,
        sets: (ex.sets || []).map(set =>
          set.id === setId
            ? {
                ...set,
                is_completed: isCompleted,
                weight_kg: weight !== undefined ? weight : set.weight_kg,
                reps: reps !== undefined ? reps : set.reps,
              }
            : set
        ),
      })),
    }));

    // Step B: Update database in background
    const updateData: any = { is_completed: isCompleted };
    if (weight !== undefined) updateData.weight_kg = weight;
    if (reps !== undefined) updateData.reps = reps;

    workoutSessionService.updateSet(setId, updateData)
      .catch(err => {
        console.error('⚠️ Failed to sync set to DB:', err);
        // Optionally: Revert state or retry
      });
  }, []);

  const getExerciseById = useCallback((exerciseId: string) => {
    return state.exercises.find(ex => ex.exercise_id === exerciseId);
  }, [state.exercises]);

  const getExerciseStatus = useCallback((exerciseId: string): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' => {
    const exercise = getExerciseById(exerciseId);
    return exercise?.status || 'NOT_STARTED';
  }, [getExerciseById]);

  const value: ActiveWorkoutContextValue = {
    ...state,
    startWorkout,
    cancelWorkout,
    completeWorkout,
    refreshSession,
    updateExerciseStatus,
    updateSetCompletion,
    getExerciseById,
    getExerciseStatus,
  };

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider');
  }
  return context;
}
