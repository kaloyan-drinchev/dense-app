/**
 * Workout Templates Database
 * 
 * Push/Pull/Legs program with A/B variations
 * Each workout has 6 exercises optimized for hypertrophy
 */

export interface WorkoutExercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  restTime: number; // seconds (max 120)
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: 'push-a' | 'push-b' | 'pull-a' | 'pull-b' | 'leg-a' | 'leg-b';
  category: 'push' | 'pull' | 'legs';
  estimatedDuration: number; // minutes
  exercises: WorkoutExercise[];
}

// PUSH DAY A - Chest Focus
export const PUSH_DAY_A: WorkoutTemplate = {
  id: 'push-a',
  name: 'Push Day - Chest Focus',
  type: 'push-a',
  category: 'push',
  estimatedDuration: 60,
  exercises: [
    {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      targetMuscle: 'Chest',
      sets: 4,
      reps: '6-8',
      restTime: 120,
      notes: 'Compound movement. Focus on controlled descent and explosive push.',
    },
    {
      id: 'incline-dumbbell-press',
      name: 'Incline Dumbbell Press',
      targetMuscle: 'Upper Chest',
      sets: 3,
      reps: '8-10',
      restTime: 90,
      notes: 'Set bench to 30-45 degrees. Full range of motion.',
    },
    {
      id: 'dumbbell-flyes',
      name: 'Dumbbell Flyes',
      targetMuscle: 'Chest',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Slight bend in elbows. Stretch at bottom, squeeze at top.',
    },
    {
      id: 'overhead-press',
      name: 'Overhead Press',
      targetMuscle: 'Shoulders',
      sets: 4,
      reps: '6-8',
      restTime: 90,
      notes: 'Standing or seated. Keep core tight.',
    },
    {
      id: 'lateral-raises',
      name: 'Lateral Raises',
      targetMuscle: 'Shoulders',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      notes: 'Control the weight. Lead with elbows, not hands.',
    },
    {
      id: 'tricep-pushdowns',
      name: 'Tricep Pushdowns',
      targetMuscle: 'Triceps',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Keep elbows tucked. Full extension at bottom.',
    },
  ],
};

// PUSH DAY B - Shoulder Focus
export const PUSH_DAY_B: WorkoutTemplate = {
  id: 'push-b',
  name: 'Push Day - Shoulder Focus',
  type: 'push-b',
  category: 'push',
  estimatedDuration: 60,
  exercises: [
    {
      id: 'incline-barbell-bench-press',
      name: 'Incline Barbell Bench Press',
      targetMuscle: 'Upper Chest',
      sets: 4,
      reps: '6-8',
      restTime: 120,
      notes: 'Set bench to 30 degrees. Drive through upper chest.',
    },
    {
      id: 'dumbbell-shoulder-press',
      name: 'Dumbbell Shoulder Press',
      targetMuscle: 'Shoulders',
      sets: 4,
      reps: '8-10',
      restTime: 90,
      notes: 'Press dumbbells together at top. Full range of motion.',
    },
    {
      id: 'cable-flyes',
      name: 'Cable Flyes',
      targetMuscle: 'Chest',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Maintain tension throughout. Squeeze chest at peak contraction.',
    },
    {
      id: 'arnold-press',
      name: 'Arnold Press',
      targetMuscle: 'Shoulders',
      sets: 3,
      reps: '8-10',
      restTime: 90,
      notes: 'Rotate palms as you press. Slow and controlled.',
    },
    {
      id: 'front-raises',
      name: 'Front Raises',
      targetMuscle: 'Front Delts',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      notes: 'Raise to shoulder height. Control the descent.',
    },
    {
      id: 'overhead-tricep-extension',
      name: 'Overhead Tricep Extension',
      targetMuscle: 'Triceps',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Keep elbows pointing forward. Full stretch at bottom.',
    },
  ],
};

// PULL DAY A - Back Width Focus
export const PULL_DAY_A: WorkoutTemplate = {
  id: 'pull-a',
  name: 'Pull Day - Back Width Focus',
  type: 'pull-a',
  category: 'pull',
  estimatedDuration: 60,
  exercises: [
    {
      id: 'deadlift',
      name: 'Deadlift',
      targetMuscle: 'Back',
      sets: 4,
      reps: '5-6',
      restTime: 120,
      notes: 'King of back exercises. Keep back neutral, drive through heels.',
    },
    {
      id: 'pull-ups',
      name: 'Pull-Ups',
      targetMuscle: 'Lats',
      sets: 3,
      reps: '8-10',
      restTime: 90,
      notes: 'Full range of motion. Chin over bar at top.',
    },
    {
      id: 'barbell-rows',
      name: 'Barbell Rows',
      targetMuscle: 'Mid Back',
      sets: 4,
      reps: '8-10',
      restTime: 90,
      notes: 'Pull to lower chest. Squeeze shoulder blades together.',
    },
    {
      id: 'lat-pulldowns',
      name: 'Lat Pulldowns',
      targetMuscle: 'Lats',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Pull bar to upper chest. Control the negative.',
    },
    {
      id: 'face-pulls',
      name: 'Face Pulls',
      targetMuscle: 'Rear Delts',
      sets: 3,
      reps: '15-20',
      restTime: 60,
      notes: 'Pull rope to face. External rotation at end.',
    },
    {
      id: 'barbell-curls',
      name: 'Barbell Curls',
      targetMuscle: 'Biceps',
      sets: 3,
      reps: '8-10',
      restTime: 60,
      notes: 'No momentum. Control the weight.',
    },
  ],
};

// PULL DAY B - Back Thickness Focus
export const PULL_DAY_B: WorkoutTemplate = {
  id: 'pull-b',
  name: 'Pull Day - Back Thickness Focus',
  type: 'pull-b',
  category: 'pull',
  estimatedDuration: 60,
  exercises: [
    {
      id: 'rack-pulls',
      name: 'Rack Pulls',
      targetMuscle: 'Back',
      sets: 4,
      reps: '6-8',
      restTime: 120,
      notes: 'Set pins just below knees. Focus on upper back and traps.',
    },
    {
      id: 'weighted-chin-ups',
      name: 'Weighted Chin-Ups',
      targetMuscle: 'Lats',
      sets: 3,
      reps: '6-8',
      restTime: 90,
      notes: 'Underhand grip. Add weight if possible.',
    },
    {
      id: 'dumbbell-rows',
      name: 'Dumbbell Rows',
      targetMuscle: 'Mid Back',
      sets: 4,
      reps: '8-10',
      restTime: 90,
      notes: 'One arm at a time. Pull elbow back, not up.',
    },
    {
      id: 'seated-cable-rows',
      name: 'Seated Cable Rows',
      targetMuscle: 'Mid Back',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Squeeze shoulder blades. Keep torso stable.',
    },
    {
      id: 'rear-delt-flyes',
      name: 'Rear Delt Flyes',
      targetMuscle: 'Rear Delts',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      notes: 'Bent over or on incline bench. Lead with elbows.',
    },
    {
      id: 'hammer-curls',
      name: 'Hammer Curls',
      targetMuscle: 'Biceps',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Neutral grip. Targets brachialis and brachioradialis.',
    },
  ],
};

// LEG DAY A - Quad Focus
export const LEG_DAY_A: WorkoutTemplate = {
  id: 'leg-a',
  name: 'Leg Day - Quad Focus',
  type: 'leg-a',
  category: 'legs',
  estimatedDuration: 65,
  exercises: [
    {
      id: 'barbell-squats',
      name: 'Barbell Squats',
      targetMuscle: 'Quads',
      sets: 4,
      reps: '6-8',
      restTime: 120,
      notes: 'King of leg exercises. Depth to at least parallel.',
    },
    {
      id: 'leg-press',
      name: 'Leg Press',
      targetMuscle: 'Quads',
      sets: 3,
      reps: '10-12',
      restTime: 90,
      notes: 'Full range of motion. Controlled descent.',
    },
    {
      id: 'walking-lunges',
      name: 'Walking Lunges',
      targetMuscle: 'Quads',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      notes: 'Step far enough forward. Keep torso upright.',
    },
    {
      id: 'romanian-deadlift',
      name: 'Romanian Deadlift',
      targetMuscle: 'Hamstrings',
      sets: 3,
      reps: '8-10',
      restTime: 90,
      notes: 'Feel stretch in hamstrings. Slight knee bend.',
    },
    {
      id: 'leg-curls',
      name: 'Leg Curls',
      targetMuscle: 'Hamstrings',
      sets: 3,
      reps: '10-12',
      restTime: 60,
      notes: 'Lying or seated. Full contraction at top.',
    },
    {
      id: 'calf-raises',
      name: 'Calf Raises',
      targetMuscle: 'Calves',
      sets: 4,
      reps: '15-20',
      restTime: 60,
      notes: 'Full stretch at bottom, squeeze at top. Pause at peak.',
    },
  ],
};

// LEG DAY B - Hamstring Focus
export const LEG_DAY_B: WorkoutTemplate = {
  id: 'leg-b',
  name: 'Leg Day - Hamstring Focus',
  type: 'leg-b',
  category: 'legs',
  estimatedDuration: 65,
  exercises: [
    {
      id: 'front-squats',
      name: 'Front Squats',
      targetMuscle: 'Quads',
      sets: 4,
      reps: '6-8',
      restTime: 120,
      notes: 'Elbows high, chest up. More quad emphasis than back squat.',
    },
    {
      id: 'bulgarian-split-squats',
      name: 'Bulgarian Split Squats',
      targetMuscle: 'Quads',
      sets: 3,
      reps: '10-12',
      restTime: 90,
      notes: 'Rear foot elevated. Balance and control.',
    },
    {
      id: 'hack-squats',
      name: 'Hack Squats',
      targetMuscle: 'Quads',
      sets: 3,
      reps: '10-12',
      restTime: 90,
      notes: 'Machine exercise. Deep squat, push through heels.',
    },
    {
      id: 'stiff-leg-deadlift',
      name: 'Stiff-Leg Deadlift',
      targetMuscle: 'Hamstrings',
      sets: 4,
      reps: '8-10',
      restTime: 90,
      notes: 'Less knee bend than RDL. Feel deep hamstring stretch.',
    },
    {
      id: 'seated-leg-curls',
      name: 'Seated Leg Curls',
      targetMuscle: 'Hamstrings',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      notes: 'Squeeze at contraction. Slow negative.',
    },
    {
      id: 'seated-calf-raises',
      name: 'Seated Calf Raises',
      targetMuscle: 'Calves',
      sets: 4,
      reps: '15-20',
      restTime: 60,
      notes: 'Targets soleus. Full range of motion.',
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

// Helper function to get template by ID
export function getWorkoutTemplate(id: string): WorkoutTemplate | undefined {
  return ALL_WORKOUT_TEMPLATES.find((template) => template.id === id);
}

// Helper function to get all templates by category
export function getWorkoutsByCategory(category: 'push' | 'pull' | 'legs'): WorkoutTemplate[] {
  return ALL_WORKOUT_TEMPLATES.filter((template) => template.category === category);
}
