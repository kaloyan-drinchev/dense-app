import { exerciseDatabase } from '@/constants/exercise-database';

// Only allow these 36 exercises from the workout program
export const ALLOWED_EXERCISE_NAMES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Dumbbell Flyes',
  'Overhead Press',
  'Lateral Raises',
  'Tricep Pushdowns',
  'Incline Barbell Bench Press',
  'Seated Dumbbell Press',
  'Cable Flyes',
  'Arnold Press',
  'Front Raises',
  'Overhead Tricep Extension',
  'Deadlift',
  'Pull-ups',
  'Barbell Row',
  'Lat Pulldown',
  'Face Pulls',
  'Barbell Curl',
  'Rack Pulls',
  'Chin-ups',
  'Dumbbell Row',
  'Cable Row',
  'Rear Delt Flyes',
  'Hammer Curl',
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Romanian Deadlift',
  'Leg Curl',
  'Calf Raise',
  'Front Squat',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Stiff Leg Deadlift',
  'Seated Leg Curl',
  'Seated Calf Raise',
];

// Filter to only include the 36 allowed exercises
export const AVAILABLE_EXERCISES = exerciseDatabase.filter(ex =>
  ALLOWED_EXERCISE_NAMES.some(name =>
    ex.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(ex.name.toLowerCase())
  )
);

// Get unique categories for filter chips
export const CATEGORIES = ['All', ...Array.from(new Set(AVAILABLE_EXERCISES.map(ex => ex.category)))];