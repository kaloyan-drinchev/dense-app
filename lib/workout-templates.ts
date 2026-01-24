/**
 * Workout Templates Database
 * 
 * Push/Pull/Legs program with A/B variations
 * Each workout has 5-6 exercises optimized for hypertrophy
 * RIR = Reps in Reserve (0 = failure, 1 = one rep left, etc.)
 */

import { getExerciseMedia } from './exercise-media-map';

export interface WorkoutExercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  rir: string; // Reps in Reserve (e.g., "0-1", "1", "1-2")
  restTime: number; // seconds (max 120)
  notes?: string;
  thumbnail_url?: string; // Exercise thumbnail image URL
  video_url?: string; // Exercise video URL
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: 'push-a' | 'push-b' | 'pull-a' | 'pull-b' | 'leg-a' | 'leg-b';
  category: 'push' | 'pull' | 'legs';
  estimatedDuration: number; // minutes
  exercises: WorkoutExercise[];
}

// PUSH DAY A - Chest Priority
export const PUSH_DAY_A: WorkoutTemplate = {
  id: 'push-a',
  name: 'Push - Chest Priority',
  type: 'push-a',
  category: 'push',
  estimatedDuration: 30,
  exercises: [
    {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      targetMuscle: 'Chest',
      sets: 2,
      reps: '5-8',
      rir: '0-1',
      restTime: 120,
      notes: 'Compound movement. Focus on controlled descent and explosive push.',
    },
    {
      id: 'incline-dumbbell-press',
      name: 'DB Incline Chest Press',
      targetMuscle: 'Upper Chest',
      sets: 2,
      reps: '8-10',
      rir: '1',
      restTime: 90,
      notes: 'Set bench to 30-45 degrees. Full range of motion.',
    },
    {
      id: 'cable-flyes',
      name: 'Cable Chest Fly',
      targetMuscle: 'Chest',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Maintain tension throughout. Squeeze chest at peak contraction.',
    },
    {
      id: 'dumbbell-shoulder-press',
      name: 'DB Shoulder Press',
      targetMuscle: 'Shoulders',
      sets: 2,
      reps: '8-10',
      rir: '1',
      restTime: 90,
      notes: 'Press dumbbells together at top. Full range of motion.',
    },
    {
      id: 'lateral-raises',
      name: 'Lateral Raises Machine',
      targetMuscle: 'Shoulders',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Control the weight. Lead with elbows, not hands.',
    },
    {
      id: 'tricep-pushdowns',
      name: 'Cable Triceps Pushdown',
      targetMuscle: 'Triceps',
      sets: 2,
      reps: '10-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Keep elbows tucked. Full extension at bottom.',
    },
  ],
};

// PUSH DAY B - Shoulder Priority
export const PUSH_DAY_B: WorkoutTemplate = {
  id: 'push-b',
  name: 'Push - Shoulder Priority',
  type: 'push-b',
  category: 'push',
  estimatedDuration: 30,
  exercises: [
    {
      id: 'dumbbell-shoulder-press',
      name: 'DB Shoulder Press',
      targetMuscle: 'Shoulders',
      sets: 2,
      reps: '6-9',
      rir: '0-1',
      restTime: 120,
      notes: 'Press dumbbells together at top. Full range of motion.',
    },
    {
      id: 'arnold-press',
      name: 'Arnold Press',
      targetMuscle: 'Shoulders',
      sets: 2,
      reps: '8-10',
      rir: '1',
      restTime: 90,
      notes: 'Rotate palms as you press. Slow and controlled.',
    },
    {
      id: 'cable-lateral-raises',
      name: 'Cable Lateral Raise',
      targetMuscle: 'Side Delts',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Control the weight. Lead with elbows, not hands.',
    },
    {
      id: 'dumbbell-bench-press',
      name: 'DB Bench Press',
      targetMuscle: 'Chest',
      sets: 2,
      reps: '8-10',
      rir: '1',
      restTime: 90,
      notes: 'Press dumbbells together at top. Full range of motion.',
    },
    {
      id: 'cable-flyes',
      name: 'Cable Chest Fly',
      targetMuscle: 'Chest',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Maintain tension throughout. Squeeze chest at peak contraction.',
    },
    {
      id: 'overhead-tricep-extension',
      name: 'Cable Triceps Overhead Extension',
      targetMuscle: 'Triceps',
      sets: 2,
      reps: '10-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Keep elbows pointing forward. Full stretch at bottom.',
    },
  ],
};

// PULL DAY A - Back Priority
export const PULL_DAY_A: WorkoutTemplate = {
  id: 'pull-a',
  name: 'Pull - Back Priority',
  type: 'pull-a',
  category: 'pull',
  estimatedDuration: 25,
  exercises: [
    {
      id: 'deadlift',
      name: 'Deadlift BB',
      targetMuscle: 'Back',
      sets: 2,
      reps: '4-6',
      rir: '0-1',
      restTime: 120,
      notes: 'King of back exercises. Keep back neutral, drive through heels.',
    },
    {
      id: 'face-pulls',
      name: 'Cable Face Pulls',
      targetMuscle: 'Rear Delts',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Pull rope to face. External rotation at end.',
    },
    {
      id: 'rear-delt-flyes',
      name: 'DB Rear Delt Fly Prone',
      targetMuscle: 'Rear Delts',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Bent over or on incline bench. Lead with elbows.',
    },
    {
      id: 'z-bar-curls',
      name: 'Z Bar Bicep Curls',
      targetMuscle: 'Biceps',
      sets: 2,
      reps: '8-12',
      rir: '1',
      restTime: 90,
      notes: 'Keep elbows stable. Full contraction at top.',
    },
    {
      id: 'dumbbell-curls',
      name: 'DB Bicep Curls',
      targetMuscle: 'Biceps',
      sets: 2,
      reps: '10-12',
      rir: '1-2',
      restTime: 60,
      notes: 'Supinate wrists at top. Control the negative.',
    },
  ],
};

// PULL DAY B - Biceps Emphasis
export const PULL_DAY_B: WorkoutTemplate = {
  id: 'pull-b',
  name: 'Pull - Biceps Emphasis',
  type: 'pull-b',
  category: 'pull',
  estimatedDuration: 25,
  exercises: [
    {
      id: 'deadlift',
      name: 'Deadlift BB',
      targetMuscle: 'Back',
      sets: 2,
      reps: '5-7',
      rir: '1',
      restTime: 120,
      notes: 'King of back exercises. Keep back neutral, drive through heels.',
    },
    {
      id: 'face-pulls',
      name: 'Cable Face Pulls',
      targetMuscle: 'Rear Delts',
      sets: 2,
      reps: '10-12',
      rir: '1-2',
      restTime: 60,
      notes: 'Pull rope to face. External rotation at end.',
    },
    {
      id: 'rear-delt-flyes',
      name: 'DB Rear Delt Fly Prone',
      targetMuscle: 'Rear Delts',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Bent over or on incline bench. Lead with elbows.',
    },
    {
      id: 'preacher-curls',
      name: 'Preacher Curls Z Bar',
      targetMuscle: 'Biceps',
      sets: 2,
      reps: '8-12',
      rir: '0-1',
      restTime: 90,
      notes: 'Strict form. Full stretch at bottom.',
    },
    {
      id: 'hammer-curls',
      name: 'Hammer Curls',
      targetMuscle: 'Biceps',
      sets: 2,
      reps: '10-12',
      rir: '1',
      restTime: 60,
      notes: 'Neutral grip. Hits brachialis and brachioradialis.',
    },
  ],
};

// LEG DAY A - Quad Priority
export const LEG_DAY_A: WorkoutTemplate = {
  id: 'leg-a',
  name: 'Legs - Quad Priority',
  type: 'leg-a',
  category: 'legs',
  estimatedDuration: 30,
  exercises: [
    {
      id: 'bulgarian-split-squats',
      name: 'Bulgarian Split Squat Smith Machine',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '6-10',
      rir: '0-1',
      restTime: 120,
      notes: 'Rear foot elevated. Balance and control. Count per leg.',
    },
    {
      id: 'leg-extension',
      name: 'Leg Extension Machine',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '10-15',
      rir: '1',
      restTime: 90,
      notes: 'Full extension at top. Squeeze quads.',
    },
    {
      id: 'leg-curls',
      name: 'Hamstring Curls Machine',
      targetMuscle: 'Hamstrings',
      sets: 2,
      reps: '10-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Lying or seated. Full contraction at top.',
    },
    {
      id: 'walking-lunges',
      name: 'Legs DB Walking Lunges',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '10-12',
      rir: '1-2',
      restTime: 60,
      notes: 'Step far enough forward. Keep torso upright. Count per leg.',
    },
    {
      id: 'calf-raises',
      name: 'Calve Raises Smith Machine',
      targetMuscle: 'Calves',
      sets: 2,
      reps: '10-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Full stretch at bottom, squeeze at top. Pause at peak.',
    },
  ],
};

// LEG DAY B - Hamstring/Glute Priority
export const LEG_DAY_B: WorkoutTemplate = {
  id: 'leg-b',
  name: 'Legs - Hamstring/Glute Priority',
  type: 'leg-b',
  category: 'legs',
  estimatedDuration: 30,
  exercises: [
    {
      id: 'leg-curls',
      name: 'Hamstring Curls Machine',
      targetMuscle: 'Hamstrings',
      sets: 2,
      reps: '8-12',
      rir: '0-1',
      restTime: 120,
      notes: 'Lying or seated. Full contraction at top.',
    },
    {
      id: 'walking-lunges',
      name: 'Legs DB Walking Lunges',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '10-12',
      rir: '1',
      restTime: 90,
      notes: 'Step far enough forward. Keep torso upright. Count per leg.',
    },
    {
      id: 'bulgarian-split-squats',
      name: 'Bulgarian Split Squat Smith Machine',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '8-10',
      rir: '1',
      restTime: 90,
      notes: 'Rear foot elevated. Balance and control. Count per leg.',
    },
    {
      id: 'leg-extension',
      name: 'Leg Extension Machine',
      targetMuscle: 'Quads',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Full extension at top. Squeeze quads.',
    },
    {
      id: 'calf-raises',
      name: 'Calve Raises Smith Machine',
      targetMuscle: 'Calves',
      sets: 2,
      reps: '12-15',
      rir: '1-2',
      restTime: 60,
      notes: 'Full stretch at bottom, squeeze at top. Pause at peak.',
    },
  ],
};

// Export all templates as an array
export const ALL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  PUSH_DAY_A,
  PUSH_DAY_B,
  PULL_DAY_A,
  PULL_DAY_B,
  LEG_DAY_A,
  LEG_DAY_B,
];

/**
 * Enriches a workout template's exercises with media URLs (thumbnails and videos)
 */
function enrichWorkoutWithMedia(template: WorkoutTemplate): WorkoutTemplate {
  return {
    ...template,
    exercises: template.exercises.map(exercise => {
      const media = getExerciseMedia(exercise.name);
      return {
        ...exercise,
        thumbnail_url: media.thumbnail,
        video_url: media.video
      };
    })
  };
}

// Helper function to get template by ID
export function getWorkoutTemplate(id: string): WorkoutTemplate | undefined {
  const template = ALL_WORKOUT_TEMPLATES.find((template) => template.id === id);
  return template ? enrichWorkoutWithMedia(template) : undefined;
}

// Helper function to get all templates by category
export function getWorkoutsByCategory(category: 'push' | 'pull' | 'legs'): WorkoutTemplate[] {
  return ALL_WORKOUT_TEMPLATES
    .filter((template) => template.category === category)
    .map(enrichWorkoutWithMedia);
}
