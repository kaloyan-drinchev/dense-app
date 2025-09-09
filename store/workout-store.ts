import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Program,
  UserProgress,
  UserProfile,
  ExerciseSet,
  Exercise,
} from '@/types/workout';
import { PROGRAMS } from '@/mocks/programs';
import { generateId } from '@/utils/helpers';
import { ApiService } from '@/utils/api';

interface WorkoutState {
  programs: Program[];
  activeProgram: Program | null;
  userProgress: UserProgress | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  currentUserId: string | null;

  // Actions
  setCurrentUser: (userId: string) => void;
  loadPrograms: () => Promise<void>;
  setActiveProgram: (programId: string) => void;
  startProgram: (programId: string) => void;
  completeWorkout: (workoutId: string) => Promise<void>;
  unlockNextWeek: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  logWeight: (weight: number) => void;
  logExerciseSet: (exerciseId: string, newSet: ExerciseSet) => void;
  updateExerciseSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<ExerciseSet>
  ) => void;
  loadUserProgress: () => Promise<void>;
  clearUserProfile: () => void;
  testConnection: () => Promise<boolean>;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      programs: [], // No mock programs - only generated programs
      activeProgram: null,
      userProgress: null,
      userProfile: null,
      isLoading: false,
      error: null,
      isConnected: false,
      currentUserId: null,

      // User management
      setCurrentUser: (userId: string) => {
        set({ currentUserId: userId });
      },

      // Test backend connection
      testConnection: async (): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });
          const isConnected = await ApiService.testConnection();
          set({ isConnected, isLoading: false });
          return isConnected;
        } catch (error) {
          set({
            isConnected: false,
            isLoading: false,
            error: 'Failed to connect to backend',
          });
          return false;
        }
      },

      // Load programs from backend
      loadPrograms: async () => {
        try {
          set({ isLoading: true, error: null });
          const programs = await ApiService.getPrograms();

          // Transform backend programs to match mobile app format
          const transformedPrograms = programs.map((p: any) => ({
            id: p.id,
            name: p.title,
            description: p.body,
            type: p.goal === 'muscle_building' ? 'bulking' : 'cutting',
            duration: 12, // Default duration
            imageUrl: p.image || '',
            weeks: [], // Will be populated from detailed program data
          }));

          set({
            programs: transformedPrograms,
            isLoading: false,
            isConnected: true,
          });
        } catch (error) {
          console.error('Failed to load programs:', error);
          set({
            error: 'Failed to load programs from server',
            isLoading: false,
            isConnected: false,
            programs: PROGRAMS, // Fallback to local programs
          });
        }
      },

      // Load user progress from backend
      loadUserProgress: async () => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        try {
          set({ isLoading: true, error: null });
          const workoutHistory = await ApiService.getWorkoutHistory(
            currentUserId
          );

          // Transform backend data to userProgress format if needed
          // For now, keep existing local progress system
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to load user progress:', error);
          set({
            error: 'Failed to load workout history',
            isLoading: false,
          });
        }
      },

      setActiveProgram: (programId: string) => {
        const program = get().programs.find((p) => p.id === programId) || null;
        set({ activeProgram: program });
      },

      startProgram: (programId: string) => {
        const program = get().programs.find((p) => p.id === programId);
        if (!program) return;

        set({
          activeProgram: program,
          userProgress: {
            programId,
            currentWeek: 1,
            completedWorkouts: [],
            startDate: new Date().toISOString(),
            weightLog: [],
            exerciseProgress: {},
          },
        });
      },

      completeWorkout: async (workoutId: string) => {
        const { activeProgram, userProgress } = get();
        if (!activeProgram || !userProgress) return;

        // Mark workout as completed
        const updatedProgram = { ...activeProgram };
        const weekIndex = userProgress.currentWeek - 1;

        if (weekIndex >= updatedProgram.weeks.length) return;

        const workoutIndex = updatedProgram.weeks[weekIndex].workouts.findIndex(
          (w) => w.id === workoutId
        );
        if (workoutIndex === -1) return;

        updatedProgram.weeks[weekIndex].workouts[workoutIndex].isCompleted =
          true;

        // Update user progress
        const updatedProgress = {
          ...userProgress,
          completedWorkouts: [...userProgress.completedWorkouts, workoutId],
          lastWorkoutDate: new Date().toISOString(),
        };

        // Check if all workouts in the week are completed
        const allWorkoutsCompleted = updatedProgram.weeks[
          weekIndex
        ].workouts.every((w) => w.isCompleted);
        if (allWorkoutsCompleted) {
          updatedProgram.weeks[weekIndex].isCompleted = true;

          // Unlock next week if available
          if (weekIndex + 1 < updatedProgram.weeks.length) {
            updatedProgram.weeks[weekIndex + 1].isLocked = false;
          }
        }

        set({
          activeProgram: updatedProgram,
          userProgress: updatedProgress,
        });

        // Sync with backend
        const { currentUserId, isConnected } = get();
        if (currentUserId && isConnected) {
          try {
            await ApiService.logWorkout(currentUserId, {
              programId: activeProgram.id,
              workoutId: workoutId,
              exercises:
                updatedProgram.weeks[weekIndex].workouts[workoutIndex]
                  .exercises,
              notes: '',
              duration: 0, // Could be tracked in the future
            });
          } catch (error) {
            console.error('Failed to sync workout with backend:', error);
            // Don't revert local changes, just log the error
          }
        }
      },

      unlockNextWeek: () => {
        const { activeProgram, userProgress } = get();
        if (!activeProgram || !userProgress) return;

        const currentWeekIndex = userProgress.currentWeek - 1;
        if (currentWeekIndex + 1 >= activeProgram.weeks.length) return;

        const updatedProgram = { ...activeProgram };
        updatedProgram.weeks[currentWeekIndex + 1].isLocked = false;

        const updatedProgress = {
          ...userProgress,
          currentWeek: userProgress.currentWeek + 1,
        };

        set({
          activeProgram: updatedProgram,
          userProgress: updatedProgress,
        });
      },

      updateUserProfile: async (profile: Partial<UserProfile>) => {
        const currentProfile = get().userProfile || {
          name: '',
          weight: 0,
          height: 0,
          age: 0,
          goal: 'maintenance',
          fitnessLevel: 'beginner',
        };

        const updatedProfile = { ...currentProfile, ...profile };
        set({ userProfile: updatedProfile });

        // Sync with backend
        const { currentUserId, isConnected } = get();
        if (currentUserId && isConnected) {
          try {
            await ApiService.updateUserProfile(currentUserId, {
              weight: updatedProfile.weight,
              height: updatedProfile.height,
              age: updatedProfile.age,
              goal: updatedProfile.goal,
              fitnessLevel: updatedProfile.fitnessLevel,
            });
          } catch (error) {
            console.error('Failed to sync profile with backend:', error);
            // Don't revert local changes, just log the error
          }
        }
      },

      logWeight: (weight: number) => {
        const { userProgress } = get();
        if (!userProgress) return;

        const updatedProgress = {
          ...userProgress,
          weightLog: [
            ...userProgress.weightLog,
            { date: new Date().toISOString(), weight },
          ],
        };

        set({ userProgress: updatedProgress });
      },

      logExerciseSet: (exerciseId: string, newSet: ExerciseSet) => {
        const { activeProgram, userProgress } = get();
        if (!activeProgram || !userProgress) return;

        // Find the exercise in the current week
        const weekIndex = userProgress.currentWeek - 1;
        if (weekIndex >= activeProgram.weeks.length) return;

        const week = activeProgram.weeks[weekIndex];
        let foundExercise: Exercise | null = null;

        for (const workout of week.workouts) {
          const exercise = workout.exercises.find((e) => e.id === exerciseId);
          if (exercise) {
            foundExercise = exercise;
            break;
          }
        }

        if (!foundExercise) return;

        // Update the exercise progress
        const updatedProgram = { ...activeProgram };
        const updatedProgress = { ...userProgress };

        // Initialize exercise progress if it doesn't exist
        if (!updatedProgress.exerciseProgress[exerciseId]) {
          updatedProgress.exerciseProgress[exerciseId] = [];
        }

        // Add the set to the exercise progress
        updatedProgress.exerciseProgress[exerciseId].push({
          date: new Date().toISOString(),
          weight: newSet.weight,
          reps: newSet.reps,
        });

        set({
          activeProgram: updatedProgram,
          userProgress: updatedProgress,
        });
      },

      updateExerciseSet: (
        exerciseId: string,
        setId: string,
        updates: Partial<ExerciseSet>
      ) => {
        const { activeProgram } = get();
        if (!activeProgram) return;

        const updatedProgram = { ...activeProgram };
        let updated = false;

        // Find and update the exercise set
        for (const week of updatedProgram.weeks) {
          for (const workout of week.workouts) {
            const exerciseIndex = workout.exercises.findIndex(
              (e) => e.id === exerciseId
            );
            if (exerciseIndex !== -1) {
              const exercise = workout.exercises[exerciseIndex];
              if (!exercise.userSets) {
                exercise.userSets = [];
              }

              const setIndex = exercise.userSets.findIndex(
                (s) => s.id === setId
              );
              if (setIndex !== -1) {
                exercise.userSets[setIndex] = {
                  ...exercise.userSets[setIndex],
                  ...updates,
                };
                updated = true;
                break;
              } else {
                // If set doesn't exist, create it
                const newSet: ExerciseSet = {
                  id: setId,
                  reps: updates.reps || 0,
                  weight: updates.weight || 0,
                  isCompleted: updates.isCompleted || false,
                };
                exercise.userSets.push(newSet);
                updated = true;
                break;
              }
            }
          }
          if (updated) break;
        }

        if (updated) {
          set({ activeProgram: updatedProgram });
        }
      },


      clearUserProfile: () => {
        set({
          userProfile: null,
        });
        console.log('🧹 User profile cleared from workout store');
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeProgram: state.activeProgram,
        userProgress: state.userProgress,
        userProfile: state.userProfile,
        currentUserId: state.currentUserId,
        isConnected: state.isConnected,
      }),
    }
  )
);
