import { GeneratedProgram } from './program-generator';

export interface ProgressData {
  currentWeek: number;
  currentDay: number;
  totalWeeks: number;
  daysPerWeek: number;
  currentWeekProgress: number;
  overallProgress: number;
  completedWorkouts: number;
  totalWorkouts: number;
}

export const calculateWorkoutProgress = (
  generatedProgram: GeneratedProgram | null,
  userProgressData: { currentWorkout: number } | null
): ProgressData => {
  // Default values if no data
  if (!generatedProgram || !userProgressData) {
    return {
      currentWeek: 1,
      currentDay: 1,
      totalWeeks: 12,
      daysPerWeek: 6,
      currentWeekProgress: 0,
      overallProgress: 0,
      completedWorkouts: 0,
      totalWorkouts: 72,
    };
  }

  const totalWeeks = generatedProgram.totalWeeks;
  const weeklyStructure = generatedProgram.weeklyStructure || [];
  
  // Calculate days per week based on non-rest days
  const workoutDaysPerWeek = weeklyStructure.filter(day => day.type !== 'rest').length;
  const daysPerWeek = weeklyStructure.length; // Total days including rest
  
  // Current workout is 1-indexed
  const currentWorkoutNumber = userProgressData.currentWorkout;
  
  // Calculate which week and day we're on
  const currentWeek = Math.ceil(currentWorkoutNumber / workoutDaysPerWeek);
  const currentDay = ((currentWorkoutNumber - 1) % workoutDaysPerWeek) + 1;
  
  // Calculate total workouts in the program
  const totalWorkouts = totalWeeks * workoutDaysPerWeek;
  const completedWorkouts = Math.max(0, currentWorkoutNumber - 1);
  
  // Calculate progress percentages
  const currentWeekProgress = Math.min(100, Math.round((currentDay / workoutDaysPerWeek) * 100));
  const overallProgress = Math.min(100, Math.round((completedWorkouts / totalWorkouts) * 100));

  return {
    currentWeek: Math.max(1, Math.min(currentWeek, totalWeeks)),
    currentDay: Math.max(1, currentDay),
    totalWeeks,
    daysPerWeek: workoutDaysPerWeek,
    currentWeekProgress,
    overallProgress,
    completedWorkouts,
    totalWorkouts,
  };
};

export const getProgressStats = (progressData: ProgressData) => {
  const { currentWeek, currentDay, totalWeeks, daysPerWeek, completedWorkouts, totalWorkouts } = progressData;
  
  return {
    weekStatus: `Week ${currentWeek} of ${totalWeeks}`,
    dayStatus: `Day ${currentDay} of ${daysPerWeek}`,
    workoutStatus: `${completedWorkouts} of ${totalWorkouts} workouts completed`,
    remainingWeeks: Math.max(0, totalWeeks - currentWeek),
    remainingWorkouts: Math.max(0, totalWorkouts - completedWorkouts),
  };
};
