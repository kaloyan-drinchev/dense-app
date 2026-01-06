import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkoutCacheState {
  generatedProgram: any | null;
  userProgressData: any | null;
  userWeight: number | null;
  manualWorkout: any | null; // For manual workout creation
  lastUpdated: number | null; // timestamp
  
  // Actions
  setWorkoutData: (data: {
    generatedProgram?: any | null;
    userProgressData?: any | null;
    userWeight?: number | null;
  }) => void;
  setManualWorkout: (workout: any | null) => void;
  clearCache: () => void;
  isCacheValid: () => boolean; // Check if cache is less than 5 minutes old
}

export const useWorkoutCacheStore = create<WorkoutCacheState>()(
  persist(
    (set, get) => ({
      generatedProgram: null,
      userProgressData: null,
      userWeight: null,
      manualWorkout: null,
      lastUpdated: null,

      setWorkoutData: (data) => {
        set({
          generatedProgram: data.generatedProgram ?? get().generatedProgram,
          userProgressData: data.userProgressData ?? get().userProgressData,
          userWeight: data.userWeight ?? get().userWeight,
          lastUpdated: Date.now(),
        });
      },

      setManualWorkout: (workout) => {
        set({
          manualWorkout: workout,
          lastUpdated: Date.now(),
        });
      },

      clearCache: () => {
        set({
          generatedProgram: null,
          userProgressData: null,
          userWeight: null,
          manualWorkout: null,
          lastUpdated: null,
        });
      },

      isCacheValid: () => {
        const { lastUpdated } = get();
        if (!lastUpdated) return false;
        // Cache is valid for 5 minutes
        return Date.now() - lastUpdated < 5 * 60 * 1000;
      },
    }),
    {
      name: 'workout-cache-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

