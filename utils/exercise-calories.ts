// Exercise Calorie Burn Estimator
// Based on MET (Metabolic Equivalent of Task) values and exercise characteristics
// Estimates calories burned per set/exercise for a 70kg (154lb) person
// Values are approximate and vary based on intensity, weight lifted, rest periods, and individual metabolism

export interface ExerciseCalorieData {
  name: string;
  caloriesPerSet: number;
  caloriesPerMinute: number;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  notes?: string;
}

// Calorie burn estimates per set (including rest time and metabolic cost)
// Based on MET values and typical workout patterns
// Updated to reflect realistic calorie burn: 150-300 cal for 30-min chest workout
// Assumes: 70kg person, moderate-high intensity, 60-90s rest between sets
// Includes: Active work + rest periods + EPOC (post-exercise calorie burn)
export const EXERCISE_CALORIES: Record<string, ExerciseCalorieData> = {
  // PUSH EXERCISES - Chest Compound (High intensity, multiple muscle groups)
  'Barbell Bench Press': {
    name: 'Barbell Bench Press',
    caloriesPerSet: 18,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Heavy compound movement, engages chest, shoulders, triceps'
  },
  'Dumbbell Bench Press': {
    name: 'Dumbbell Bench Press',
    caloriesPerSet: 17,
    caloriesPerMinute: 5.5,
    intensity: 'high',
    notes: 'Slightly less stable than barbell, requires more stabilization'
  },
  'Incline Barbell Press': {
    name: 'Incline Barbell Press',
    caloriesPerSet: 17,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Targets upper chest, similar intensity to flat bench'
  },
  'Incline Dumbbell Press': {
    name: 'Incline Dumbbell Press',
    caloriesPerSet: 16, // Increased
    caloriesPerMinute: 5.5,
    intensity: 'high',
    notes: 'Upper chest focus, moderate intensity'
  },
  
  // Chest Isolation (Lower intensity, single muscle group)
  'Dumbbell Flyes': {
    name: 'Dumbbell Flyes',
    caloriesPerSet: 10,
    caloriesPerMinute: 4,
    intensity: 'moderate',
    notes: 'Isolation exercise, lower calorie burn'
  },
  'Cable Flyes': {
    name: 'Cable Flyes',
    caloriesPerSet: 11,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'Constant tension, slightly higher than dumbbell flyes'
  },
  'Pec Deck': {
    name: 'Pec Deck',
    caloriesPerSet: 9,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Machine isolation, lowest calorie burn'
  },
  
  // Shoulder Compound
  'Overhead Barbell Press': {
    name: 'Overhead Barbell Press',
    caloriesPerSet: 13,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Full body stabilization, high calorie burn'
  },
  'Seated Dumbbell Press': {
    name: 'Seated Dumbbell Press',
    caloriesPerSet: 12, // Increased from 6
    caloriesPerMinute: 5.5,
    intensity: 'moderate',
    notes: 'Less stabilization than standing, moderate intensity'
  },
  'Machine Shoulder Press': {
    name: 'Machine Shoulder Press',
    caloriesPerSet: 9, // Increased from 4.5
    caloriesPerMinute: 4,
    intensity: 'low',
    notes: 'Machine-assisted, lower calorie burn'
  },
  
  // Shoulder Isolation
  'Lateral Raises': {
    name: 'Lateral Raises',
    caloriesPerSet: 6,
    caloriesPerMinute: 3,
    intensity: 'low',
    notes: 'Light isolation work'
  },
  'Rear Delt Flyes': {
    name: 'Rear Delt Flyes',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Posterior deltoid isolation'
  },
  'Face Pulls': {
    name: 'Face Pulls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Rear delt and upper back isolation'
  },
  
  // Triceps
  'Close-Grip Bench Press': {
    name: 'Close-Grip Bench Press',
    caloriesPerSet: 12,
    caloriesPerMinute: 5.5,
    intensity: 'high',
    notes: 'Compound triceps movement'
  },
  'Tricep Dips': {
    name: 'Tricep Dips',
    caloriesPerSet: 5,
    caloriesPerMinute: 5,
    intensity: 'moderate',
    notes: 'Bodyweight compound movement'
  },
  'Overhead Tricep Extension': {
    name: 'Overhead Tricep Extension',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Isolation exercise'
  },
  'Tricep Pushdowns': {
    name: 'Tricep Pushdowns',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Cable isolation exercise'
  },
  
  // PULL EXERCISES - Back Compound (Very high intensity)
  'Conventional Deadlift': {
    name: 'Conventional Deadlift',
    caloriesPerSet: 12,
    caloriesPerMinute: 8,
    intensity: 'very_high',
    notes: 'Highest calorie burn - full body compound movement'
  },
  'Barbell Rows': {
    name: 'Barbell Rows',
    caloriesPerSet: 7.5,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Heavy pulling movement, engages entire posterior chain'
  },
  'Dumbbell Rows': {
    name: 'Dumbbell Rows',
    caloriesPerSet: 6.5,
    caloriesPerMinute: 5.5,
    intensity: 'moderate',
    notes: 'Unilateral movement, requires stabilization'
  },
  'Pull-ups': {
    name: 'Pull-ups',
    caloriesPerSet: 8,
    caloriesPerMinute: 7,
    intensity: 'high',
    notes: 'Bodyweight compound, high intensity'
  },
  'Lat Pulldowns': {
    name: 'Lat Pulldowns',
    caloriesPerSet: 5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'Machine-assisted pulling movement'
  },
  'Cable Rows': {
    name: 'Cable Rows',
    caloriesPerSet: 5.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'Constant tension cable movement'
  },
  
  // Back Isolation
  'Cable Pullovers': {
    name: 'Cable Pullovers',
    caloriesPerSet: 3,
    caloriesPerMinute: 4,
    intensity: 'low',
    notes: 'Lat isolation exercise'
  },
  'Shrugs': {
    name: 'Shrugs',
    caloriesPerSet: 2,
    caloriesPerMinute: 3,
    intensity: 'low',
    notes: 'Trap isolation, minimal movement'
  },
  'Reverse Flyes': {
    name: 'Reverse Flyes',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Rear delt isolation'
  },
  
  // Biceps
  'Barbell Bicep Curls': {
    name: 'Barbell Bicep Curls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Isolation exercise'
  },
  'Dumbbell Bicep Curls': {
    name: 'Dumbbell Bicep Curls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Unilateral isolation'
  },
  'Hammer Curls': {
    name: 'Hammer Curls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Bicep and forearm isolation'
  },
  'Cable Bicep Curls': {
    name: 'Cable Bicep Curls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Constant tension isolation'
  },
  
  // LEG EXERCISES - Quad Compound (Very high intensity)
  'Back Squat': {
    name: 'Back Squat',
    caloriesPerSet: 10,
    caloriesPerMinute: 7,
    intensity: 'very_high',
    notes: 'King of leg exercises, highest calorie burn'
  },
  'Goblet Squat': {
    name: 'Goblet Squat',
    caloriesPerSet: 6,
    caloriesPerMinute: 5.5,
    intensity: 'moderate',
    notes: 'Front-loaded, less weight than back squat'
  },
  'Leg Press': {
    name: 'Leg Press',
    caloriesPerSet: 5.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'Machine-assisted, lower than free weights'
  },
  'Bulgarian Split Squats': {
    name: 'Bulgarian Split Squats',
    caloriesPerSet: 7,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Unilateral, requires balance and stabilization'
  },
  
  // Hamstring Compound
  'Romanian Deadlift': {
    name: 'Romanian Deadlift',
    caloriesPerSet: 8,
    caloriesPerMinute: 6.5,
    intensity: 'high',
    notes: 'Posterior chain compound movement'
  },
  'Hip Thrusts': {
    name: 'Hip Thrusts',
    caloriesPerSet: 6,
    caloriesPerMinute: 5.5,
    intensity: 'moderate',
    notes: 'Glute-focused compound movement'
  },
  'Stiff Leg Deadlift': {
    name: 'Stiff Leg Deadlift',
    caloriesPerSet: 7.5,
    caloriesPerMinute: 6,
    intensity: 'high',
    notes: 'Hamstring-focused deadlift variation'
  },
  
  // Leg Isolation
  'Leg Curls': {
    name: 'Leg Curls',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Hamstring isolation'
  },
  'Leg Extensions': {
    name: 'Leg Extensions',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Quad isolation'
  },
  'Calf Raises': {
    name: 'Calf Raises',
    caloriesPerSet: 1.5,
    caloriesPerMinute: 2.5,
    intensity: 'low',
    notes: 'Calf isolation, minimal calorie burn'
  },
  'Walking Lunges': {
    name: 'Walking Lunges',
    caloriesPerSet: 6,
    caloriesPerMinute: 6,
    intensity: 'moderate',
    notes: 'Dynamic movement, higher than static lunges'
  },
  
  // PUMP WORK (Higher reps, shorter rest, moderate intensity)
  'Cable Flyes Drop Set': {
    name: 'Cable Flyes Drop Set',
    caloriesPerSet: 4,
    caloriesPerMinute: 5,
    intensity: 'moderate',
    notes: 'High volume pump work'
  },
  'Push-up to Failure': {
    name: 'Push-up to Failure',
    caloriesPerSet: 5,
    caloriesPerMinute: 6,
    intensity: 'moderate',
    notes: 'Bodyweight pump work, high reps'
  },
  'Lateral Raise Drop Set': {
    name: 'Lateral Raise Drop Set',
    caloriesPerSet: 3.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'High volume shoulder pump'
  },
  'Rear Delt Flye Burnout': {
    name: 'Rear Delt Flye Burnout',
    caloriesPerSet: 3.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'High rep burnout set'
  },
  'Cable Pullover Burnout': {
    name: 'Cable Pullover Burnout',
    caloriesPerSet: 4,
    caloriesPerMinute: 5,
    intensity: 'moderate',
    notes: 'High volume lat pump'
  },
  'Band Pull-Aparts': {
    name: 'Band Pull-Aparts',
    caloriesPerSet: 2,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'Light resistance band work'
  },
  'Bicep Curl 21s': {
    name: 'Bicep Curl 21s',
    caloriesPerSet: 4,
    caloriesPerMinute: 5,
    intensity: 'moderate',
    notes: 'High volume bicep pump (21 reps)'
  },
  'Tricep Pushdown Drop Set': {
    name: 'Tricep Pushdown Drop Set',
    caloriesPerSet: 3.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'High volume tricep pump'
  },
  'Leg Extension Burnout': {
    name: 'Leg Extension Burnout',
    caloriesPerSet: 3.5,
    caloriesPerMinute: 4.5,
    intensity: 'moderate',
    notes: 'High rep quad pump'
  },
  'Calf Raise Drop Set': {
    name: 'Calf Raise Drop Set',
    caloriesPerSet: 2.5,
    caloriesPerMinute: 3.5,
    intensity: 'low',
    notes: 'High volume calf pump'
  }
};

/**
 * Calculate approximate calories burned for an exercise
 * @param exerciseName - Name of the exercise
 * @param sets - Number of sets performed
 * @param userWeightKg - User's body weight in kg (default: 70kg)
 * @param setsData - Optional: Array of sets with weight and reps for more accurate calculation
 * @returns Approximate calories burned
 */
export function calculateExerciseCalories(
  exerciseName: string,
  sets: number = 3,
  userWeightKg: number = 70,
  setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>
): number {
  let exercise = EXERCISE_CALORIES[exerciseName];
  
  if (!exercise) {
    const exerciseKey = Object.keys(EXERCISE_CALORIES).find(
      key => key.toLowerCase() === exerciseName.toLowerCase()
    );
    if (exerciseKey) {
      exercise = EXERCISE_CALORIES[exerciseKey];
    }
  }
  
  if (!exercise) {
    const exerciseKey = Object.keys(EXERCISE_CALORIES).find(
      key => key.toLowerCase().includes(exerciseName.toLowerCase()) || 
             exerciseName.toLowerCase().includes(key.toLowerCase())
    );
    if (exerciseKey) {
      exercise = EXERCISE_CALORIES[exerciseKey];
      console.log(`🔥 Exercise name fuzzy match: "${exerciseName}" → "${exerciseKey}"`);
    } else {
      console.log(`⚠️ Exercise not found in database: "${exerciseName}" - using default 8 cal/set`);
    }
  }
  
  if (setsData && setsData.length > 0) {
    const completedSets = setsData.filter(s => s.isCompleted && s.weightKg > 0 && s.reps > 0);
    
    if (completedSets.length > 0) {
      const totalVolume = completedSets.reduce((sum, set) => {
        return sum + (set.weightKg * set.reps);
      }, 0);
      
      const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
      const avgWeightPerRep = totalReps > 0 ? totalVolume / totalReps : 0;
      
      const baseCaloriesPerSet = exercise?.caloriesPerSet || 8;
      
      const volumeFactor = Math.min(avgWeightPerRep / userWeightKg * 0.5, 1.0);
      const intensityMultiplier = 1 + volumeFactor;
      const bodyWeightMultiplier = userWeightKg / 70;
      
      const totalCalories = baseCaloriesPerSet * completedSets.length * intensityMultiplier * bodyWeightMultiplier;
      
      return Math.round(totalCalories);
    }
  }
  
  if (!exercise) {
    return Math.round(sets * 8 * (userWeightKg / 70));
  }
  
  const weightMultiplier = userWeightKg / 70;
  
  const intensityBonus = exercise.intensity === 'high' || exercise.intensity === 'very_high' ? 1.15 : 
                         exercise.intensity === 'moderate' ? 1.1 : 1.0;
  
  const workoutOverhead = sets > 0 ? Math.max(8, sets * 3) : 0;
  
  const baseCalories = exercise.caloriesPerSet * sets * weightMultiplier * intensityBonus;
  const totalCalories = baseCalories + workoutOverhead;
  
  return Math.round(totalCalories);
}

/**
 * Calculate calories burned for an entire workout
 * @param exercises - Array of exercises with sets (and optionally setsData with weight/reps)
 * @param userWeightKg - User's body weight in kg
 * @returns Total calories burned
 */
export function calculateWorkoutCalories(
  exercises: Array<{ 
    name: string; 
    sets: number;
    setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
  }>,
  userWeightKg: number = 70
): number {
  return exercises.reduce((total, exercise) => {
    const calories = calculateExerciseCalories(
      exercise.name,
      exercise.sets,
      userWeightKg,
      exercise.setsData
    );
    return total + calories;
  }, 0);
}

/**
 * Get calorie data for an exercise
 * @param exerciseName - Name of the exercise
 * @returns Exercise calorie data or null if not found
 */
export function getExerciseCalorieData(exerciseName: string): ExerciseCalorieData | null {
  return EXERCISE_CALORIES[exerciseName] || null;
}

/**
 * Get all exercises with their calorie estimates
 * @returns Array of all exercise calorie data
 */
export function getAllExerciseCalories(): ExerciseCalorieData[] {
  return Object.values(EXERCISE_CALORIES);
}

