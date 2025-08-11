import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { expo_sqlite } from '@/db/client';
import { ProgramGenerator, WizardResponses } from '@/utils/program-generator';
import { Platform } from 'react-native';

export interface AIActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class AIActionHandlers {
  /**
   * Modify the user's current workout program
   */
  static async modifyProgram(modifications: {
    focusMuscleGroups?: string[];
    exerciseChanges?: { [key: string]: string };
    setRepsChanges?: { [key: string]: { sets: number; reps: string } };
    intensityAdjustment?: 'increase' | 'decrease';
    additionalNotes?: string;
  }): Promise<AIActionResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Program modifications are not available on web platform'
        };
      }

      const { user } = useAuthStore.getState();
      const { generatedProgram, userProgress } = useWorkoutStore.getState();

      if (!user || !generatedProgram) {
        return {
          success: false,
          message: 'No active user or program found to modify'
        };
      }

      console.log('🔄 Modifying program with:', modifications);

      // Create wizard responses based on current user data and modifications
      const wizardResponses = this.buildWizardResponsesFromUser(user, modifications);

      // Generate the modified program using static method
      const modifiedProgram = ProgramGenerator.generateProgram(wizardResponses);
      
      // Apply specific exercise changes if provided
      if (modifications.exerciseChanges) {
        this.applyExerciseChanges(modifiedProgram, modifications.exerciseChanges);
      }

      // Apply sets/reps changes if provided
      if (modifications.setRepsChanges) {
        this.applySetRepsChanges(modifiedProgram, modifications.setRepsChanges);
      }

      // Update the program in database
      await expo_sqlite.insertProgram({
        ...modifiedProgram,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });

      // Mark old program as inactive
      if (generatedProgram.id) {
        await expo_sqlite.updateProgram(generatedProgram.id, { isActive: false });
      }

      // Update Zustand store
      useWorkoutStore.getState().setGeneratedProgram(modifiedProgram);
      
      // Reset progress for new program
      useWorkoutStore.getState().resetProgress();

      console.log('✅ Program successfully modified');

      return {
        success: true,
        message: `Successfully modified your program! ${modifications.additionalNotes || 'Changes have been applied.'}`,
        data: modifiedProgram
      };

    } catch (error) {
      console.error('❌ Failed to modify program:', error);
      return {
        success: false,
        message: 'Failed to modify program. Please try again.'
      };
    }
  }

  /**
   * Generate a completely new workout program
   */
  static async generateNewProgram(parameters: {
    goal?: 'muscle_gain' | 'strength' | 'endurance' | 'fat_loss';
    experience?: 'beginner' | 'intermediate' | 'advanced';
    daysPerWeek?: number;
    split?: 'push_pull_legs' | 'upper_lower' | 'full_body';
    focusMuscleGroups?: string[];
    additionalRequests?: string;
  }): Promise<AIActionResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Program generation is not available on web platform'
        };
      }

      const { user } = useAuthStore.getState();
      
      if (!user) {
        return {
          success: false,
          message: 'No active user found'
        };
      }

      console.log('🚀 Generating new program with parameters:', parameters);

      // Create wizard responses based on user data and parameters
      const wizardResponses = this.buildWizardResponsesFromUser(user, parameters);

      // Generate the new program using static method
      const newProgram = ProgramGenerator.generateProgram(wizardResponses);

      // Save to database
      await expo_sqlite.insertProgram({
        ...newProgram,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });

      // Deactivate old program
      const { generatedProgram } = useWorkoutStore.getState();
      if (generatedProgram?.id) {
        await expo_sqlite.updateProgram(generatedProgram.id, { isActive: false });
      }

      // Update Zustand store
      useWorkoutStore.getState().setGeneratedProgram(newProgram);
      useWorkoutStore.getState().resetProgress();

      console.log('✅ New program successfully generated');

      return {
        success: true,
        message: `Successfully generated your new ${goal.replace('_', ' ')} program! ${parameters.additionalRequests || 'Ready to start training!'}`,
        data: newProgram
      };

    } catch (error) {
      console.error('❌ Failed to generate new program:', error);
      return {
        success: false,
        message: 'Failed to generate new program. Please try again.'
      };
    }
  }

  /**
   * Update user workout settings/preferences
   */
  static async updateSettings(settings: {
    fitnessGoals?: string;
    experienceLevel?: string;
    availableDays?: number;
    preferredSplit?: string;
    [key: string]: any;
  }): Promise<AIActionResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Settings updates are not available on web platform'
        };
      }

      const { user } = useAuthStore.getState();
      
      if (!user) {
        return {
          success: false,
          message: 'No active user found'
        };
      }

      console.log('⚙️ Updating user settings:', settings);

      // Update user settings in database
      await expo_sqlite.updateUser(user.id, settings);

      // Update auth store
      useAuthStore.getState().updateUser({ ...user, ...settings });

      console.log('✅ Settings successfully updated');

      return {
        success: true,
        message: 'Successfully updated your preferences! These changes will be applied to future programs.',
        data: settings
      };

    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      return {
        success: false,
        message: 'Failed to update settings. Please try again.'
      };
    }
  }

  /**
   * Apply specific exercise changes to a program
   */
  private static applyExerciseChanges(program: any, changes: { [key: string]: string }) {
    if (!program.weeklyStructure) return;

    Object.keys(changes).forEach(oldExercise => {
      const newExercise = changes[oldExercise];
      
      program.weeklyStructure.forEach((week: any) => {
        week.workouts.forEach((workout: any) => {
          workout.exercises = workout.exercises.map((exercise: any) => {
            if (exercise.name.toLowerCase().includes(oldExercise.toLowerCase())) {
              return { ...exercise, name: newExercise };
            }
            return exercise;
          });
        });
      });
    });
  }

  /**
   * Apply sets/reps changes to a program
   */
  private static applySetRepsChanges(program: any, changes: { [key: string]: { sets: number; reps: string } }) {
    if (!program.weeklyStructure) return;

    Object.keys(changes).forEach(exerciseName => {
      const { sets, reps } = changes[exerciseName];
      
      program.weeklyStructure.forEach((week: any) => {
        week.workouts.forEach((workout: any) => {
          workout.exercises = workout.exercises.map((exercise: any) => {
            if (exercise.name.toLowerCase().includes(exerciseName.toLowerCase())) {
              return { ...exercise, sets, reps };
            }
            return exercise;
          });
        });
      });
    });
  }

  /**
   * Build wizard responses from user data and modifications/parameters
   */
  private static buildWizardResponsesFromUser(user: any, modifications: any = {}): WizardResponses {
    // Map user goals to training experience
    const experienceMapping = {
      'beginner': 'new',
      'intermediate': '6_18_months', 
      'advanced': '2_plus_years'
    };

    // Use modifications/parameters to override user data
    const trainingDaysPerWeek = modifications.daysPerWeek || user.availableDays || 6;
    const trainingExperience = experienceMapping[modifications.experience || user.experienceLevel || 'intermediate'];
    const musclePriorities = modifications.focusMuscleGroups || user.musclePriorities || ['chest', 'shoulders', 'arms'];

    return {
      trainingExperience: trainingExperience as 'new' | '6_18_months' | '2_plus_years',
      bodyFatLevel: 'athletic_15_18', // Default value
      trainingDaysPerWeek,
      preferredTrainingDays: [], // Will be calculated by the generator
      musclePriorities: musclePriorities.slice(0, 3), // Max 3 priorities
      pumpWorkPreference: 'maybe_sometimes', // Default value
      recoveryProfile: 'need_more_rest', // Default value, can be enhanced later
      programDurationWeeks: 8, // Default program duration
      // Optional strength data
      squatKg: user.squatKg,
      benchKg: user.benchKg,
      deadliftKg: user.deadliftKg,
    };
  }
}
