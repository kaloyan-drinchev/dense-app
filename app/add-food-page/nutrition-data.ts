import { MealType } from '@/types/nutrition';
import { mealRecipeCategories } from '@/constants/allowed-foods';

// Comprehensive nutrition database for all recipes
export const recipeNutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  // Breakfast Options
  'egg-bell-pepper': { calories: 190, protein: 15, carbs: 8, fat: 12 },
  'egg-white-omelette': { calories: 160, protein: 24, carbs: 3, fat: 5 },
  'protein-yogurt-bowl': { calories: 240, protein: 22, carbs: 35, fat: 2 },
  'oats-banana-fuel': { calories: 260, protein: 8, carbs: 58, fat: 3 },
  'avocado-eggs-toast': { calories: 420, protein: 20, carbs: 25, fat: 28 },

  // Chicken Meals
  'classic-chicken-rice': { calories: 540, protein: 50, carbs: 48, fat: 8 },
  'soy-garlic-chicken': { calories: 520, protein: 48, carbs: 45, fat: 9 },
  'chicken-potato-salad': { calories: 480, protein: 46, carbs: 38, fat: 7 },
  'mediterranean-chicken': { calories: 420, protein: 45, carbs: 12, fat: 18 },
  'spicy-chicken-bowl': { calories: 520, protein: 48, carbs: 44, fat: 8 },
  'chicken-salad-bowl': { calories: 380, protein: 46, carbs: 8, fat: 15 },
  'chicken-popcorn-combo': { calories: 460, protein: 45, carbs: 22, fat: 6 },
  'buffalo-chicken-salad': { calories: 360, protein: 46, carbs: 10, fat: 14 },

  // Beef Meals
  'steak-potato-plate': { calories: 550, protein: 42, carbs: 35, fat: 20 },
  'beef-chili-bowl': { calories: 520, protein: 40, carbs: 44, fat: 16 },
  'asian-beef-stir-fry': { calories: 480, protein: 38, carbs: 42, fat: 14 },
  'steakhouse-beef-bowl': { calories: 500, protein: 40, carbs: 40, fat: 16 },
  'beef-avocado-salad': { calories: 450, protein: 38, carbs: 15, fat: 26 },
  'beef-pickle-plate': { calories: 520, protein: 42, carbs: 32, fat: 20 },
  'beef-burger-bowl': { calories: 380, protein: 40, carbs: 12, fat: 18 },
  'beef-broccoli-bowl': { calories: 480, protein: 38, carbs: 42, fat: 14 },

  // Egg-Based Meals
  'egg-steak-breakfast': { calories: 380, protein: 32, carbs: 4, fat: 24 },
  'scrambled-eggs-veggies': { calories: 250, protein: 20, carbs: 8, fat: 15 },
  'egg-white-wrap': { calories: 320, protein: 38, carbs: 8, fat: 12 },
  'egg-salad-mix': { calories: 230, protein: 20, carbs: 6, fat: 15 },
  'egg-white-protein-wrap': { calories: 300, protein: 36, carbs: 6, fat: 10 },

  // Snack Options
  'protein-shake-rice-cakes': { calories: 380, protein: 28, carbs: 42, fat: 12 },
  'yogurt-almonds-bowl': { calories: 320, protein: 22, carbs: 18, fat: 18 },
  'cottage-cheese-cucumber': { calories: 180, protein: 25, carbs: 8, fat: 4 },
  'banana-peanut-butter': { calories: 250, protein: 6, carbs: 30, fat: 12 },
  'peanut-butter-rice-cakes': { calories: 290, protein: 10, carbs: 32, fat: 14 },
  'bagel-protein-sandwich': { calories: 420, protein: 35, carbs: 45, fat: 8 },
  'rice-cakes-skyr': { calories: 220, protein: 18, carbs: 32, fat: 2 },

  // Sweet Options
  'blueberry-protein-cream': { calories: 200, protein: 20, carbs: 22, fat: 3 },
  'frozen-berry-yogurt': { calories: 180, protein: 18, carbs: 20, fat: 3 },
  'strawberry-skyr-mix': { calories: 160, protein: 16, carbs: 18, fat: 2 },
};

export const getRecipeNutrition = (recipeId: string) => {
  return recipeNutritionDatabase[recipeId] || { calories: 400, protein: 25, carbs: 35, fat: 10 };
};

export const mealTypes: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', icon: '🍽️' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🥜' },
];

export const getMealRecipes = (mealType: MealType) => {
  switch (mealType) {
    case 'breakfast':
      return mealRecipeCategories.filter(cat => cat.id === 'breakfast');
    case 'lunch':
      return mealRecipeCategories.filter(cat => 
        ['chicken', 'beef', 'egg-based'].includes(cat.id)
      );
    case 'dinner':
      return mealRecipeCategories.filter(cat => 
        ['chicken', 'beef', 'egg-based'].includes(cat.id)
      );
    case 'snack':
      return mealRecipeCategories.filter(cat => 
        ['snacks', 'sweet-options'].includes(cat.id)
      );
    default:
      return [];
  }
};