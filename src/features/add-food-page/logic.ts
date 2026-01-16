import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MealType } from '@/types/nutrition';
import { getMealRecipes, getRecipeNutrition } from './nutrition-data';

export const useAddFoodLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get initial meal type from params or default to breakfast
  const initialMealType = (params.mealType as MealType) || 'breakfast';
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleBack = () => {
    router.back();
  };

  const handleRecipePress = (recipe: any) => {
    router.push({
      pathname: '/single-recipe-view',
      params: {
        recipeId: recipe.id,
        mealType: selectedMealType,
        recipeName: recipe.name,
        recipeDescription: recipe.description,
      }
    });
  };

  const currentMealRecipes = getMealRecipes(selectedMealType);

  return {
    selectedMealType,
    setSelectedMealType,
    expandedCategory,
    toggleCategory,
    handleBack,
    handleRecipePress,
    currentMealRecipes,
    getRecipeNutrition,
  };
};