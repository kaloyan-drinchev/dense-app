export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const calculateBMI = (weight: number, height: number): number => {
  // Weight in kg, height in cm
  if (weight <= 0 || height <= 0) return 0;
  return weight / Math.pow(height / 100, 2);
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const calculateCalories = (
  weight: number, 
  height: number, 
  age: number, 
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  goal: 'bulking' | 'cutting' | 'maintenance'
): number => {
  // Harris-Benedict equation (metric)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  
  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise & physical job
  };
  
  const tdee = bmr * activityMultipliers[activityLevel];
  
  // Adjust based on goal
  const goalMultipliers = {
    cutting: 0.8,        // 20% deficit
    maintenance: 1,      // Maintain
    bulking: 1.1         // 10% surplus
  };
  
  return Math.round(tdee * goalMultipliers[goal]);
};

export const getProgressPercentage = (completedWorkouts: string[], totalWorkouts: number): number => {
  if (totalWorkouts === 0) return 0;
  return Math.round((completedWorkouts.length / totalWorkouts) * 100);
};