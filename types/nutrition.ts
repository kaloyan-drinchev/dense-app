export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
};

export type FoodItem = {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  servingUnit: string;
  nutritionPer100g: NutritionInfo;
  image?: string;
};

export type MealType = 
  | 'breakfast' 
  | 'brunch' 
  | 'lunch' 
  | 'pre-workout' 
  | 'post-workout' 
  | 'dinner' 
  | 'snack';

export type FoodEntry = {
  id: string;
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  mealType: MealType;
  timestamp: string;
  nutrition: NutritionInfo;
};

export type DailyLog = {
  date: string;
  entries: FoodEntry[];
  totalNutrition: NutritionInfo;
  calorieGoal: number;
};

export type LoggedMealSession = {
  id: string;
  date: string;
  timestamp: string;
  entries: FoodEntry[];
  totalNutrition: NutritionInfo;
  calorieGoal: number;
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
};

export type NutritionPreferences = {
  dietType: 'standard' | 'keto' | 'vegetarian' | 'vegan' | 'paleo';
  allergies: string[];
  excludedFoods: string[];
  favoriteItems: string[];
};

export type CustomMeal = {
  id: string;
  name: string;
  description?: string;
  mealType: MealType;
  foods: Array<{
    foodId: string;
    amount: number;
  }>;
  totalNutrition: NutritionInfo;
  image?: string;
  createdAt: string;
  updatedAt: string;
};