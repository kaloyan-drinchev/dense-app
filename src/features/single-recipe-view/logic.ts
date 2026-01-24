import { Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useNutritionStore } from '@/store/nutrition-store';
import { MealType } from '@/types/nutrition';
import { colors } from '@/constants/colors';
import { getRecipeDetails } from './recipe-data';
import { getRecipeNutrition } from '../add-food-page/nutrition-data';

export const useRecipeDetailLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addFoodEntry } = useNutritionStore();

  const recipeId = params.recipeId as string;
  const mealType = params.mealType as MealType;
  const recipeName = params.recipeName as string;

  const recipe = getRecipeDetails(recipeId);
  const correctNutrition = getRecipeNutrition(recipeId);

  // Override recipe nutrition with correct values from nutrition database
  const recipeWithCorrectNutrition = {
    ...recipe,
    nutrition: correctNutrition
  };

  const handleAddToMeal = async () => {
    try {
      // Create nutrition entry
      const nutritionEntry = {
        id: `entry_${Date.now()}`,
        foodId: `recipe_${recipe.id}`,
        name: recipeName || recipe.name,
        amount: 1, // 1 serving
        unit: 'serving',
        mealType: mealType,
        timestamp: new Date().toISOString(),
        nutrition: {
          calories: correctNutrition.calories,
          protein: correctNutrition.protein,
          carbs: correctNutrition.carbs,
          fat: correctNutrition.fat,
          fiber: 0,
          sugar: 0,
        },
      };

      // Get today's date
      const selectedDate = new Date().toISOString().split('T')[0];

      // Add to daily log
      await addFoodEntry(selectedDate, nutritionEntry);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show success message
      Alert.alert(
        '✅ Meal Added!',
        `${recipeName || recipe.name} has been added to your ${mealType} log.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to nutrition tab
              router.push('/(tabs)/nutrition');
            },
          },
        ]
      );

    } catch (error) {
      console.error('Failed to add meal:', error);
      Alert.alert('Error', 'Failed to add meal to your log.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success || '#4CAF50';
      case 'Medium': return colors.warning || '#FF9800';
      case 'Hard': return colors.error || '#F44336';
      default: return colors.primary;
    }
  };

  return {
    router,
    recipe: recipeWithCorrectNutrition,
    mealType,
    handleAddToMeal,
    getDifficultyColor,
  };
};