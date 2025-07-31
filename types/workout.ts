export type ExerciseSet = {
  id: string;
  reps: number;
  weight: number;
  isCompleted: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be a range like "8-12" or a number
  restTime: number; // in seconds
  notes?: string;
  imageUrl?: string;
  targetMuscle: string;
  isCompleted?: boolean;
  userSets?: ExerciseSet[];
};

export type Workout = {
  id: string;
  day: number;
  name: string;
  focusArea: string;
  exercises: Exercise[];
  cardio?: {
    type: string;
    duration: number; // in minutes
    intensity: string;
  };
  isCompleted?: boolean;
};

export type Week = {
  id: string;
  weekNumber: number;
  workouts: Workout[];
  isCompleted?: boolean;
  isLocked?: boolean;
};

export type Program = {
  id: string;
  name: string;
  description: string;
  type: 'bulking' | 'cutting';
  duration: number; // in weeks
  imageUrl: string;
  weeks: Week[];
};

export type UserProgress = {
  programId: string;
  currentWeek: number;
  completedWorkouts: string[]; // workout IDs
  startDate?: string;
  lastWorkoutDate?: string;
  weightLog: {
    date: string;
    weight: number;
  }[];
  exerciseProgress: {
    [exerciseId: string]: {
      date: string;
      weight: number;
      reps: number;
    }[];
  };
};

export type UserProfile = {
  name: string;
  weight: number;
  height: number;
  age: number;
  goal: 'bulking' | 'cutting' | 'maintenance';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  profileImage?: string;
};