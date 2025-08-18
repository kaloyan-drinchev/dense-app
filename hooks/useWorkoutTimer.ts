import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/store/timer-store';

interface UseWorkoutTimerReturn {
  timeElapsed: number;
  formattedTime: string;
  isRunning: boolean;
  isWorkoutActive: boolean;
  startWorkout: (workoutId: string, workoutName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  completeWorkout: () => { duration: number };
}

export const useWorkoutTimer = (): UseWorkoutTimerReturn => {
  const {
    timeElapsed,
    isRunning,
    isWorkoutActive,
    startWorkout,
    pauseTimer,
    resumeTimer,
    resetTimer: storeResetTimer,
    completeWorkout,
    updateTimeElapsed,
  } = useTimerStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer every second when running
  useEffect(() => {
    if (isRunning && isWorkoutActive) {
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isWorkoutActive, updateTimeElapsed]);

  const resetTimer = () => {
    storeResetTimer();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return {
    timeElapsed,
    formattedTime: formatTime(timeElapsed),
    isRunning,
    isWorkoutActive,
    startWorkout,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeWorkout,
  };
};
