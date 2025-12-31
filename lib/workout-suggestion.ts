/**
 * Workout Suggestion Service
 * 
 * Handles PPL (Push/Pull/Legs) workout rotation logic
 * Suggests next workout based on what was completed last
 */

import { 
  ALL_WORKOUT_TEMPLATES, 
  getWorkoutTemplate,
  type WorkoutTemplate 
} from './workout-templates';

export type WorkoutType = 'push-a' | 'push-b' | 'pull-a' | 'pull-b' | 'leg-a' | 'leg-b';

/**
 * Get the next suggested workout based on the last completed workout
 * 
 * Rotation logic:
 * - After Push (A or B) → Pull (alternate A/B)
 * - After Pull (A or B) → Legs (alternate A/B)
 * - After Legs (A or B) → Push (alternate A/B)
 * - If no last workout or unknown → Start with Push A
 * 
 * @param lastWorkout - The last completed workout type
 * @returns Next suggested workout template
 */
export function getNextSuggestedWorkout(lastWorkout: string | null | undefined): WorkoutTemplate {
  // If no last workout, start with Push A
  if (!lastWorkout) {
    return getWorkoutTemplate('push-a')!;
  }

  // Determine next workout type based on rotation
  let nextWorkoutType: WorkoutType;

  switch (lastWorkout) {
    // PUSH → PULL
    case 'push-a':
      nextWorkoutType = 'pull-a';
      break;
    case 'push-b':
      nextWorkoutType = 'pull-b';
      break;

    // PULL → LEGS
    case 'pull-a':
      nextWorkoutType = 'leg-a';
      break;
    case 'pull-b':
      nextWorkoutType = 'leg-b';
      break;

    // LEGS → PUSH
    case 'leg-a':
      nextWorkoutType = 'push-a';
      break;
    case 'leg-b':
      nextWorkoutType = 'push-b';
      break;

    // Unknown workout type, default to Push A
    default:
      console.warn(`⚠️ Unknown workout type: ${lastWorkout}, defaulting to push-a`);
      nextWorkoutType = 'push-a';
  }

  const nextWorkout = getWorkoutTemplate(nextWorkoutType);
  
  if (!nextWorkout) {
    console.error(`❌ Failed to find workout template for ${nextWorkoutType}`);
    // Fallback to Push A
    return getWorkoutTemplate('push-a')!;
  }

  return nextWorkout;
}

/**
 * Get the alternate variation of the current workout
 * Used for "Regenerate" button functionality
 * 
 * @param currentWorkout - Current workout type
 * @returns Alternate variation (A ↔ B)
 */
export function getAlternateWorkout(currentWorkout: string | null | undefined): WorkoutTemplate {
  if (!currentWorkout) {
    return getWorkoutTemplate('push-a')!;
  }

  let alternateType: WorkoutType;

  switch (currentWorkout) {
    case 'push-a':
      alternateType = 'push-b';
      break;
    case 'push-b':
      alternateType = 'push-a';
      break;
    case 'pull-a':
      alternateType = 'pull-b';
      break;
    case 'pull-b':
      alternateType = 'pull-a';
      break;
    case 'leg-a':
      alternateType = 'leg-b';
      break;
    case 'leg-b':
      alternateType = 'leg-a';
      break;
    default:
      console.warn(`⚠️ Unknown workout type: ${currentWorkout}, defaulting to push-b`);
      alternateType = 'push-b';
  }

  return getWorkoutTemplate(alternateType)!;
}

/**
 * Update workout progression after completing a workout
 * Returns the next workout type to be set in the database
 * 
 * @param completedWorkout - The workout that was just completed
 * @returns Next workout type string
 */
export function updateWorkoutProgression(completedWorkout: string): string {
  const nextWorkout = getNextSuggestedWorkout(completedWorkout);
  return nextWorkout.type;
}

/**
 * Get workout category (push/pull/legs) from workout type
 * 
 * @param workoutType - Workout type
 * @returns Category string
 */
export function getWorkoutCategory(workoutType: string | null | undefined): 'push' | 'pull' | 'legs' {
  if (!workoutType) return 'push';
  
  if (workoutType.startsWith('push')) return 'push';
  if (workoutType.startsWith('pull')) return 'pull';
  if (workoutType.startsWith('leg')) return 'legs';
  
  return 'push'; // Default fallback
}

/**
 * Get a user-friendly display name for the workout
 * 
 * @param workoutType - Workout type
 * @returns Display name
 */
export function getWorkoutDisplayName(workoutType: string | null | undefined): string {
  if (!workoutType) return 'Push Day A';
  
  const workout = getWorkoutTemplate(workoutType);
  return workout?.name || 'Push Day A';
}

/**
 * Check if user can do a specific workout based on last workout date
 * (Currently no restrictions, but kept for future use)
 * 
 * @param workoutType - Workout to check
 * @param lastWorkoutType - Last completed workout type
 * @param lastWorkoutDate - Date of last workout
 * @returns Whether workout is available
 */
export function isWorkoutAvailable(
  workoutType: string,
  lastWorkoutType: string | null,
  lastWorkoutDate: Date | null
): boolean {
  // No restrictions in current implementation
  // User requested: "No blocking at all"
  return true;
}

/**
 * Get all available workout options (for manual selection)
 * 
 * @returns Array of all workout templates
 */
export function getAllWorkouts(): WorkoutTemplate[] {
  return ALL_WORKOUT_TEMPLATES;
}

/**
 * Get workouts by category (for "Feeling like something different?" section)
 * 
 * @param category - Workout category
 * @returns Array of workouts in that category
 */
export function getWorkoutsByCategory(category: 'push' | 'pull' | 'legs'): WorkoutTemplate[] {
  return ALL_WORKOUT_TEMPLATES.filter(w => w.category === category);
}
