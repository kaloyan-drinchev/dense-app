export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
}

export interface WizardPreferences {
  // Step 1: Motivation (multiple selections)
  motivation: string[];
  
  // Step 2: Name
  name: string;

  // Step 3: Current Strength (Big 3 lifts)
  squatKg: string;
  benchKg: string;
  deadliftKg: string;

  // Step 4: Training Experience
  trainingExperience: string;

  // Step 4: TDEE Calculation
  age: string;
  gender: string;
  weight: string;
  height: string;
  activityLevel: string;
  goal: string;

  // Step 6: Weekly Schedule
  trainingDaysPerWeek: number;
  preferredTrainingDays: string[];

  // Step 7: Muscle Priorities
  musclePriorities: string[];

  // Step 8: Pump Work
  pumpWorkPreference: string;

  // Step 9: Recovery
  recoveryProfile: string;

  // Step 10: Duration
  programDurationWeeks: number;
}

export interface TDEECalculation {
  bmr: number;
  tdee: number;
  adjustedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}