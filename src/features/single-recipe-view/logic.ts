import { Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useNutritionStore } from '@/store/nutrition-store';
import { MealType } from '@/types/nutrition';
import { colors } from '@/constants/colors';
import { getRecipeDetails } from './recipe-data';

export const useRecipeDetailLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addFoodEntry } = useNutritionStore();
  
  const recipeId = params.recipeId as string;
  const mealType = params.mealType as MealType;
  
  const recipe = getRecipeDetails(recipeId);

  const handleAddToMeal = async () => {
    try {
      // Create nutrition entry
      const nutritionEntry = {
        id: `entry_${Date.now()}`,
        foodId: `recipe_${recipe.id}`,
        name: recipe.name,
        amount: 1, // 1 serving
        unit: '1 meal',
        mealType: mealType,
        timestamp: new Date().toISOString(),
        nutrition: {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fat: recipe.nutrition.fat,
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
        `${recipe.name} has been added to your ${mealType} log.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to nutrition tab
              router.push('/(tabs)/Nutrition');
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
    recipe,
    mealType,
    handleAddToMeal,
    getDifficultyColor,
  };
};