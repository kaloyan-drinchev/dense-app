export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
}

export interface WizardPreferences {
  // Step 2: Current Strength
  squatKg: string;
  benchKg: string;
  deadliftKg: string;

  // Step 3: Training Experience
  trainingExperience: string;

  // Step 4: Body Fat
  bodyFatLevel: string;

  // Step 5: Weekly Schedule
  trainingDaysPerWeek: number;
  preferredTrainingDays: string[];

  // Step 6: Muscle Priorities
  musclePriorities: string[];

  // Step 7: Pump Work
  pumpWorkPreference: string;

  // Step 8: Recovery
  recoveryProfile: string;

  // Step 9: Duration
  programDurationWeeks: number;
}