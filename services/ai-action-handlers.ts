import { useAuthStore } from '@/store/auth-store';
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

      if (!user) {
        return {
          success: false,
          message: 'No active user found'
        };
      }

      console.log('🔄 Modifying program with:', modifications);

      // Get current wizard results
      const { wizardResultsService, userProgressService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);

      if (!wizardResults || !wizardResults.generatedSplit) {
        return {
          success: false,
          message: 'No program found to modify'
        };
      }

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

      // Update wizard results with modified program
      await wizardResultsService.updateByUserId(user.id, {
        generatedSplit: JSON.stringify(modifiedProgram)
      });

      // Reset user progress for modified program
      const existingProgress = await userProgressService.getByUserId(user.id);
      if (existingProgress) {
        await userProgressService.update(existingProgress.id, {
          currentWeek: 1,
          currentWorkout: 1,
          startDate: new Date(),
          completedWorkouts: [],
          weeklyWeights: {}
        });
      }

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

      // Save to database using proper services
      const { wizardResultsService, userProgressService } = await import('@/db/services');
      
      // Update wizard results with new program
      await wizardResultsService.updateByUserId(user.id, {
        generatedSplit: JSON.stringify(newProgram),
        musclePriorities: JSON.stringify(parameters.focusMuscleGroups || [])
      });

            // Reset user progress for new program - delete old progress and create new
      const existingProgress = await userProgressService.getByUserId(user.id);
      if (existingProgress) {
        await userProgressService.delete(existingProgress.id);
      }

      // Create new progress entry
      await userProgressService.create({
        userId: user.id,
        programId: null, // Program is stored in generatedSplit, not as a separate program entry
        currentWeek: 1,
        currentWorkout: 1,
        startDate: new Date(),
        completedWorkouts: [],
        weeklyWeights: {}
      });

      console.log('✅ New program successfully generated');

      return {
        success: true,
        message: `✅ New program created! Check Programs tab.`,
        data: newProgram
      };

    } catch (error) {
      console.error('❌ Failed to generate new program:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '❌ Failed to create program. Try again.'
      };
    }
  }

  /**
   * Rename the current program (simple test)
   */
  static async renameProgram(newName: string): Promise<AIActionResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Program renaming not available on web platform'
        };
      }

      const { user } = useAuthStore.getState();
      
      if (!user) {
        return {
          success: false,
          message: 'No active user found'
        };
      }

      console.log('🏷️ Renaming program to:', newName);

      // Get current wizard results
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (!wizardResults || !wizardResults.generatedSplit) {
        return {
          success: false,
          message: 'No program found to rename'
        };
      }

      // Update the program name in the generated program
      const generatedSplit = typeof wizardResults.generatedSplit === 'string' 
        ? JSON.parse(wizardResults.generatedSplit)
        : wizardResults.generatedSplit;
      
      const currentProgram = generatedSplit;
      currentProgram.programName = newName;
      currentProgram.displayTitle = newName;

      // Save back to database
      await wizardResultsService.updateByUserId(user.id, {
        generatedSplit: JSON.stringify(currentProgram)
      });

      console.log('✅ Program successfully renamed');

      return {
        success: true,
        message: `✅ Program renamed to "${newName}"! Check Programs tab.`,
        data: { newName }
      };

    } catch (error) {
      console.error('❌ Failed to rename program:', error);
      console.error('Rename error details:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '❌ Failed to rename program. Try again.'
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

      // Update user settings using proper services
      const { userProfileService } = await import('@/db/services');
      
      // Get current profile by userId (not by id)
      let currentProfile;
      try {
        // Get user profile by ID
        currentProfile = await userProfileService.getById(user.id);
      } catch (error) {
        console.log('No existing profile found, will create new one');
      }

      if (!currentProfile) {
        // Create new profile with only valid fields
        currentProfile = await userProfileService.create({
          name: user.name,
          goal: settings.fitnessGoals || 'muscle_gain'
        });
      } else {
        // Update existing profile using the profile's id
        // Only update valid UserProfile fields
        const validUpdates: Partial<typeof currentProfile> = {};
        if (settings.fitnessGoals) validUpdates.goal = settings.fitnessGoals;
        if (settings.availableDays !== undefined) {
          // availableDays is not a UserProfile field, store in wizard results instead
          const { wizardResultsService } = await import('@/db/services');
          const wizardResults = await wizardResultsService.getByUserId(user.id);
          if (wizardResults) {
            await wizardResultsService.updateByUserId(user.id, {
              trainingDaysPerWeek: settings.availableDays
            });
          }
        }
        if (Object.keys(validUpdates).length > 0) {
          await userProfileService.update(currentProfile.id, validUpdates);
        }
      }

      console.log('✅ Settings successfully updated');

      return {
        success: true,
        message: '✅ Settings updated!',
        data: settings
      };

    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      console.error('Settings error details:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '❌ Failed to update settings. Try again.'
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
