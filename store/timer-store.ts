import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkoutTimerState {
  // Timer state
  isWorkoutActive: boolean;
  timeElapsed: number; // in seconds
  isRunning: boolean;
  workoutStartTime: string | null; // ISO string
  lastPauseTime: string | null; // ISO string
  
  // Workout context
  currentWorkoutId: string | null;
  workoutName: string | null;
  
  // Actions
  startWorkout: (workoutId: string, workoutName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  completeWorkout: () => { duration: number };
  updateTimeElapsed: () => void;
  setTimeElapsed: (seconds: number) => void;
  // 🚨 TESTING ONLY - Remove before production
  clearAllTimerData: () => Promise<void>;
}

export const useTimerStore = create<WorkoutTimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isWorkoutActive: false,
      timeElapsed: 0,
      isRunning: false,
      workoutStartTime: null,
      lastPauseTime: null,
      currentWorkoutId: null,
      workoutName: null,

      startWorkout: (workoutId: string, workoutName: string) => {
        const now = new Date().toISOString();
        set({
          isWorkoutActive: true,
          isRunning: true,
          timeElapsed: 0,
          workoutStartTime: now,
          lastPauseTime: null,
          currentWorkoutId: workoutId,
          workoutName,
        });
      },

      pauseTimer: () => {
        const state = get();
        if (state.isRunning && state.workoutStartTime) {
          // Calculate and save current elapsed time before pausing
          const now = new Date();
          const startTime = new Date(state.workoutStartTime);
          const currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          
          set({
            isRunning: false,
            timeElapsed: currentElapsed,
            lastPauseTime: new Date().toISOString(),
          });
        }
      },

      resumeTimer: () => {
        const state = get();
        if (!state.isRunning) {
          // Update start time to account for the pause duration
          const now = new Date();
          const pauseTime = state.lastPauseTime ? new Date(state.lastPauseTime) : now;
          const pauseDuration = now.getTime() - pauseTime.getTime();
          const originalStart = state.workoutStartTime ? new Date(state.workoutStartTime) : now;
          const newStartTime = new Date(originalStart.getTime() + pauseDuration);
          
          set({
            isRunning: true,
            workoutStartTime: newStartTime.toISOString(),
            lastPauseTime: null,
          });
        }
      },

      resetTimer: () => {
        const state = get();
        set({
          timeElapsed: 0,
          isRunning: true,
          workoutStartTime: new Date().toISOString(),
          lastPauseTime: null,
        });
      },

      completeWorkout: () => {
        const state = get();
        let finalDuration = state.timeElapsed;
        
        // If timer is still running, calculate final elapsed time
        if (state.isRunning && state.workoutStartTime) {
          const now = new Date();
          const startTime = new Date(state.workoutStartTime);
          finalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        }
        
        // Reset timer state
        set({
          isWorkoutActive: false,
          isRunning: false,
          timeElapsed: 0,
          workoutStartTime: null,
          lastPauseTime: null,
          currentWorkoutId: null,
          workoutName: null,
        });

        return { duration: finalDuration };
      },

      updateTimeElapsed: () => {
        const state = get();
        if (!state.workoutStartTime || !state.isRunning) return;

        const startTime = new Date(state.workoutStartTime);
        const now = new Date();
        
        // Only update when running - calculate elapsed time from adjusted start time
        const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        set({ timeElapsed: totalElapsed });
      },

      setTimeElapsed: (seconds: number) => {
        set({ timeElapsed: seconds });
      },

      // 🚨 TESTING ONLY - Remove before production
      clearAllTimerData: async () => {
        // Clear in-memory state
        set({
          isWorkoutActive: false,
          timeElapsed: 0,
          isRunning: false,
          workoutStartTime: null,
          lastPauseTime: null,
          currentWorkoutId: null,
          workoutName: null,
        });
        
        // Also clear the persisted data from AsyncStorage
        try {
          await AsyncStorage.removeItem('workout-timer-storage');
          console.log('🗑️ Timer AsyncStorage cleared');
        } catch (error) {
          console.error('❌ Failed to clear timer AsyncStorage:', error);
        }
      },
    }),
    {
      name: 'workout-timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
