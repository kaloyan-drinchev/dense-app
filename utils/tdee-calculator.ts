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
 * Optimized for insulin-resistant population (75% of Americans are overweight/obese, 40% insulin resistant)
 * Fat: 30% of total calories (increased for satiety and blood sugar control)
 * Carbs: Max 45% of total calories (reduced to manage insulin response)
 * Protein: Remaining calories (typically 25-30%)
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
  
  // Calculate fat (30% of total calories - increased for insulin-resistant population)
  const fatCalories = adjustedCalories * 0.30;
  const fatGrams = fatCalories / 9; // 9 calories per gram
  
  // Calculate carbs (max 45% of total calories - reduced for better insulin management)
  const maxCarbCalories = adjustedCalories * 0.45;
  const maxCarbGrams = maxCarbCalories / 4; // 4 calories per gram
  
  // Calculate protein (remaining calories, minimum from goal multiplier)
  const minProteinGrams = weight * goalOption.proteinMultiplier;
  const minProteinCalories = minProteinGrams * 4; // 4 calories per gram
  
  // Remaining calories go to protein (ensuring we meet minimum protein needs)
  const remainingCalories = adjustedCalories - fatCalories - maxCarbCalories;
  const proteinCalories = Math.max(remainingCalories, minProteinCalories);
  const proteinGrams = proteinCalories / 4;
  
  // Adjust carbs if we needed more protein than initially allocated
  const finalCarbCalories = adjustedCalories - proteinCalories - fatCalories;
  const finalCarbGrams = Math.max(0, finalCarbCalories / 4);
  
  return {
    protein: Math.round(proteinGrams),
    fat: Math.round(fatGrams),
    carbs: Math.round(finalCarbGrams)
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
