import { activityLevelOptions, goalOptions } from '@/constants/wizard.constants';
import { TDEECalculation } from '@/components/SetupWizard/types';

export interface TDEEInputs {
  age: number;
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  activityLevel: string;
  goal: string;
}

/**
 * Calculate BMR using the Mifflin-St Jeor equation
 * Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(age: number, gender: 'male' | 'female', weight: number, height: number): number {
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    return baseBMR + 5;
  } else {
    return baseBMR - 161;
  }
}

/**
 * Calculate TDEE by multiplying BMR with activity level multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityOption = activityLevelOptions.find(option => option.id === activityLevel);
  if (!activityOption) {
    throw new Error(`Invalid activity level: ${activityLevel}`);
  }
  
  return bmr * activityOption.multiplier;
}

/**
 * Adjust calories based on goal (lose/maintain/gain weight)
 */
export function adjustCaloriesForGoal(tdee: number, goal: string): number {
  const goalOption = goalOptions.find(option => option.id === goal);
  if (!goalOption) {
    throw new Error(`Invalid goal: ${goal}`);
  }
  
  return tdee * (1 + goalOption.calorieAdjustment);
}

/**
 * Calculate macronutrient distribution
 * Protein: Based on goal (1.6-2.0g per kg body weight)
 * Fat: 25-30% of total calories
 * Carbs: Remaining calories
 */
export function calculateMacronutrients(
  adjustedCalories: number, 
  weight: number, 
  goal: string
): { protein: number; fat: number; carbs: number } {
  const goalOption = goalOptions.find(option => option.id === goal);
  if (!goalOption) {
    throw new Error(`Invalid goal: ${goal}`);
  }
  
  // Calculate protein (in grams)
  const proteinGrams = weight * goalOption.proteinMultiplier;
  const proteinCalories = proteinGrams * 4; // 4 calories per gram
  
  // Calculate fat (25% of total calories)
  const fatCalories = adjustedCalories * 0.25;
  const fatGrams = fatCalories / 9; // 9 calories per gram
  
  // Calculate carbs (remaining calories)
  const carbCalories = adjustedCalories - proteinCalories - fatCalories;
  const carbGrams = carbCalories / 4; // 4 calories per gram
  
  return {
    protein: Math.round(proteinGrams),
    fat: Math.round(fatGrams),
    carbs: Math.round(carbGrams)
  };
}

/**
 * Calculate complete TDEE and macronutrient breakdown
 */
export function calculateTDEEAndMacros(inputs: TDEEInputs): TDEECalculation {
  const bmr = calculateBMR(inputs.age, inputs.gender, inputs.weight, inputs.height);
  const tdee = calculateTDEE(bmr, inputs.activityLevel);
  const adjustedCalories = adjustCaloriesForGoal(tdee, inputs.goal);
  const macros = calculateMacronutrients(adjustedCalories, inputs.weight, inputs.goal);
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    adjustedCalories: Math.round(adjustedCalories),
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat
  };
}

/**
 * Validate TDEE calculation inputs
 */
export function validateTDEEInputs(inputs: Partial<TDEEInputs>): string[] {
  const errors: string[] = [];
  
  if (!inputs.age || inputs.age < 16 || inputs.age > 100) {
    errors.push('Age must be between 16 and 100 years');
  }
  
  if (!inputs.gender || !['male', 'female'].includes(inputs.gender)) {
    errors.push('Please select your gender');
  }
  
  if (!inputs.weight || inputs.weight < 30 || inputs.weight > 300) {
    errors.push('Weight must be between 30 and 300 kg');
  }
  
  if (!inputs.height || inputs.height < 120 || inputs.height > 250) {
    errors.push('Height must be between 120 and 250 cm');
  }
  
  if (!inputs.activityLevel) {
    errors.push('Please select your activity level');
  }
  
  if (!inputs.goal) {
    errors.push('Please select your goal');
  }
  
  return errors;
}
