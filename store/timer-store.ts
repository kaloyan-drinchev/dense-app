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
  stopWorkoutOnExpiration: () => void;
  cleanupStaleTimerData: () => void;
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
        const state = get();
        const now = new Date().toISOString();
        
        // SAFETY CHECK: If there's an old workout that was started more than 1 hour ago,
        // it's stale data - log a warning
        if (state.workoutStartTime) {
          const oldStartTime = new Date(state.workoutStartTime);
          const nowDate = new Date(now);
          const hoursSinceOldStart = (nowDate.getTime() - oldStartTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceOldStart > 1) {
            console.warn('⚠️ [Timer] Starting new workout - clearing stale timer from', oldStartTime.toLocaleString());
          }
        }
        
        // Always set fresh start time
        set({
          isWorkoutActive: true,
          isRunning: true,
          timeElapsed: 0,
          workoutStartTime: now,
          lastPauseTime: null,
          currentWorkoutId: workoutId,
          workoutName,
        });
        
        console.log('✅ [Timer] Started fresh timer at', now);
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
        
        console.log('🏁 [Timer] Completing workout:', {
          isRunning: state.isRunning,
          timeElapsed: state.timeElapsed,
          workoutStartTime: state.workoutStartTime,
          workoutName: state.workoutName
        });
        
        // If timer is still running, calculate final elapsed time
        if (state.isRunning && state.workoutStartTime) {
          const now = new Date();
          const startTime = new Date(state.workoutStartTime);
          const calculatedDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          
          console.log('⏱️ [Timer] Calculated duration:', {
            startTime: startTime.toISOString(),
            now: now.toISOString(),
            calculatedSeconds: calculatedDuration,
            calculatedMinutes: Math.floor(calculatedDuration / 60)
          });
          
          // SAFETY CHECK: Prevent crazy durations from stale persisted data
          // If duration > 24 hours (86400 seconds), it's likely stale data
          const MAX_REASONABLE_DURATION = 86400; // 24 hours
          if (calculatedDuration > MAX_REASONABLE_DURATION) {
            console.warn('⚠️ [Timer] Detected stale timer data (duration > 24h). Resetting to 0.');
            finalDuration = 0;
          } else {
            finalDuration = calculatedDuration;
          }
        }
        
        console.log('✅ [Timer] Final duration:', finalDuration, 'seconds (', Math.floor(finalDuration / 60), 'minutes)');
        
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

      // Stop workout when subscription expires
      stopWorkoutOnExpiration: () => {
        const state = get();
        if (state.isWorkoutActive) {
          console.log('🚫 Stopping workout due to subscription expiration');
          
          // Stop and reset the timer completely
          set({
            isWorkoutActive: false,
            isRunning: false,
            timeElapsed: 0,
            workoutStartTime: null,
            lastPauseTime: null,
            currentWorkoutId: null,
            workoutName: null,
          });
        }
      },

      // Clean up stale timer data on app initialization
      cleanupStaleTimerData: () => {
        const state = get();
        if (state.workoutStartTime) {
          const now = new Date();
          const startTime = new Date(state.workoutStartTime);
          const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          
          // If workout started more than 24 hours ago, clear it
          if (hoursSinceStart > 24) {
            console.log('🧹 [Timer] Cleaning up stale timer data from', startTime.toLocaleString());
            set({
              isWorkoutActive: false,
              isRunning: false,
              timeElapsed: 0,
              workoutStartTime: null,
              lastPauseTime: null,
              currentWorkoutId: null,
              workoutName: null,
            });
          }
        }
      },

    }),
    {
      name: 'workout-timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
