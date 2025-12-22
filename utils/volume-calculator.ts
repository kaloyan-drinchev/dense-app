/**
 * Calculate volume for a single set (reps × weight)
 */
export const calculateSetVolume = (reps: number, weightKg: number): number => {
  return reps * weightKg;
};

/**
 * Calculate total volume for an exercise (sum of all completed sets)
 */
export const calculateExerciseVolume = (
  sets: Array<{ reps: number; weightKg: number; isCompleted: boolean }>
): number => {
  return sets
    .filter(set => set.isCompleted)
    .reduce((total, set) => total + calculateSetVolume(set.reps, set.weightKg), 0);
};

/**
 * Calculate volume breakdown for all exercises in a workout
 */
export const calculateWorkoutVolume = (
  exercises: Array<{
    name: string;
    sets: Array<{ reps: number; weightKg: number; isCompleted: boolean }>;
  }>
): {
  totalVolume: number;
  exerciseBreakdown: Array<{
    name: string;
    sets: number;
    completedSets: number;
    totalReps: number;
    totalVolume: number;
  }>;
} => {
  let totalVolume = 0;
  const exerciseBreakdown = exercises.map(exercise => {
    const completedSets = exercise.sets.filter(s => s.isCompleted);
    const exerciseVolume = calculateExerciseVolume(exercise.sets);
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
    
    totalVolume += exerciseVolume;
    
    return {
      name: exercise.name,
      sets: exercise.sets.length,
      completedSets: completedSets.length,
      totalReps,
      totalVolume: exerciseVolume,
    };
  });

  return {
    totalVolume,
    exerciseBreakdown,
  };
};

/**
 * Calculate total volume lifted all time from workout history
 */
export const calculateTotalVolumeLifted = (
  completedWorkouts: Array<{
    exercises?: Array<{
      setsData?: Array<{ reps: number; weightKg: number; isCompleted: boolean }>;
    }>;
  }>
): number => {
  let totalVolume = 0;

  completedWorkouts.forEach(workout => {
    if (workout.exercises) {
      workout.exercises.forEach(exercise => {
        if (exercise.setsData) {
          totalVolume += calculateExerciseVolume(exercise.setsData);
        }
      });
    }
  });

  return totalVolume;
};

/**
 * Format volume for display
 */
export const formatVolume = (kg: number): string => {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`; // tons
  }
  return `${Math.round(kg)}kg`;
};

/**
 * Format large numbers with commas
 */
export const formatVolumeDetailed = (kg: number): string => {
  return `${Math.round(kg).toLocaleString()}kg`;
};
