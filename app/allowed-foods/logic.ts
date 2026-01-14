import { useState } from 'react';
import { useRouter } from 'expo-router';
import { allowedFoodCategories, mealRecipeCategories } from '@/constants/allowed-foods';

export type TabType = 'foods' | 'recipes';

export const useAllowedFoodsLogic = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('foods');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddFood = () => {
    router.push('/add-food-page');
  };

  return {
    activeTab,
    setActiveTab,
    expandedCategory,
    toggleCategory,
    handleBack,
    handleAddFood,
    allowedFoodCategories,
    mealRecipeCategories,
  };
};