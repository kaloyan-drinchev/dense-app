// L Twins Exercise Data
// The Lazarov Twins' actual stats for each exercise in DENSE
// This data represents their current training numbers

export interface LTwinsExerciseData {
  sets: number;
  reps: number;
  weight: number; // in kg
}

export const LTWINS_EXERCISE_DATA: Record<string, LTwinsExerciseData> = {
  // PUSH EXERCISES
  // Chest Compound
  'Barbell Bench Press': { sets: 3, reps: 10, weight: 120 },
  'Dumbbell Bench Press': { sets: 3, reps: 10, weight: 120 },
  'Incline Barbell Press': { sets: 3, reps: 10, weight: 120 },
  'Incline Dumbbell Press': { sets: 3, reps: 10, weight: 120 },
  
  // Chest Isolation
  'Dumbbell Flyes': { sets: 3, reps: 10, weight: 120 },
  'Cable Flyes': { sets: 3, reps: 10, weight: 120 },
  'Pec Deck': { sets: 3, reps: 10, weight: 120 },
  
  // Shoulder Compound
  'Overhead Barbell Press': { sets: 3, reps: 10, weight: 120 },
  'Seated Dumbbell Press': { sets: 3, reps: 10, weight: 120 },
  'Machine Shoulder Press': { sets: 3, reps: 10, weight: 120 },
  
  // Shoulder Isolation
  'Lateral Raises': { sets: 3, reps: 10, weight: 120 },
  'Rear Delt Flyes': { sets: 3, reps: 10, weight: 120 },
  'Face Pulls': { sets: 3, reps: 10, weight: 120 },
  
  // Triceps
  'Close-Grip Bench Press': { sets: 3, reps: 10, weight: 120 },
  'Tricep Dips': { sets: 3, reps: 10, weight: 120 },
  'Overhead Tricep Extension': { sets: 3, reps: 10, weight: 120 },
  'Tricep Pushdowns': { sets: 3, reps: 10, weight: 120 },
  
  // PULL EXERCISES
  // Back Compound
  'Conventional Deadlift': { sets: 3, reps: 10, weight: 120 },
  'Barbell Rows': { sets: 3, reps: 10, weight: 120 },
  'Dumbbell Rows': { sets: 3, reps: 10, weight: 120 },
  'Pull-ups': { sets: 3, reps: 10, weight: 120 },
  'Lat Pulldowns': { sets: 3, reps: 10, weight: 120 },
  'Cable Rows': { sets: 3, reps: 10, weight: 120 },
  
  // Back Isolation
  'Cable Pullovers': { sets: 3, reps: 10, weight: 120 },
  'Shrugs': { sets: 3, reps: 10, weight: 120 },
  'Reverse Flyes': { sets: 3, reps: 10, weight: 120 },
  
  // Biceps
  'Barbell Bicep Curls': { sets: 3, reps: 10, weight: 120 },
  'Dumbbell Bicep Curls': { sets: 3, reps: 10, weight: 120 },
  'Hammer Curls': { sets: 3, reps: 10, weight: 120 },
  'Cable Bicep Curls': { sets: 3, reps: 10, weight: 120 },
  
  // LEG EXERCISES
  // Quad Compound
  'Back Squat': { sets: 3, reps: 10, weight: 120 },
  'Goblet Squat': { sets: 3, reps: 10, weight: 120 },
  'Leg Press': { sets: 3, reps: 10, weight: 120 },
  'Bulgarian Split Squats': { sets: 3, reps: 10, weight: 120 },
  
  // Hamstring Compound
  'Romanian Deadlift': { sets: 3, reps: 10, weight: 120 },
  'Hip Thrusts': { sets: 3, reps: 10, weight: 120 },
  'Stiff Leg Deadlift': { sets: 3, reps: 10, weight: 120 },
  
  // Leg Isolation
  'Leg Curls': { sets: 3, reps: 10, weight: 120 },
  'Leg Extensions': { sets: 3, reps: 10, weight: 120 },
  'Calf Raises': { sets: 3, reps: 10, weight: 120 },
  'Walking Lunges': { sets: 3, reps: 10, weight: 120 },
  
  // PUMP WORK EXERCISES
  // Chest Pump
  'Cable Flyes Drop Set': { sets: 3, reps: 10, weight: 120 },
  'Push-up to Failure': { sets: 3, reps: 10, weight: 120 },
  
  // Shoulder Pump
  'Lateral Raise Drop Set': { sets: 3, reps: 10, weight: 120 },
  'Rear Delt Flye Burnout': { sets: 3, reps: 10, weight: 120 },
  
  // Back Pump
  'Cable Pullover Burnout': { sets: 3, reps: 10, weight: 120 },
  'Band Pull-Aparts': { sets: 3, reps: 10, weight: 120 },
  
  // Arm Pump
  'Bicep Curl 21s': { sets: 3, reps: 10, weight: 120 },
  'Tricep Pushdown Drop Set': { sets: 3, reps: 10, weight: 120 },
  
  // Leg Pump
  'Leg Extension Burnout': { sets: 3, reps: 10, weight: 120 },
  'Calf Raise Drop Set': { sets: 3, reps: 10, weight: 120 },
};

// Helper function to get L Twins data for an exercise
export const getLTwinsData = (exerciseName: string): LTwinsExerciseData => {
  return LTWINS_EXERCISE_DATA[exerciseName] || { sets: 3, reps: 10, weight: 120 };
};

// Helper function to check if exercise exists in L Twins data
export const hasLTwinsData = (exerciseName: string): boolean => {
  return exerciseName in LTWINS_EXERCISE_DATA;
};

