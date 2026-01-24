import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '@/store/nutrition-store';
import { getRecipeNutrition } from '@/src/features/add-food-page/nutrition-data';

export type NutritionEntry = {
  id: string;
  date: string;
  timestamp: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entryCount: number;
  calorieGoal: number;
};

export const useNutritionHistoryLogic = () => {
  const router = useRouter();
  const { loggedMealSessions } = useNutritionStore();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNutritionHistory = () => {
      try {
        // Convert logged meal sessions to sorted array of entries
        const nutritionEntries: NutritionEntry[] = loggedMealSessions
          .map((session) => {
            // Recalculate nutrition totals with correct recipe values
            const correctedTotals = session.entries.reduce(
              (totals, entry) => {
                let nutrition = entry.nutrition;
                
                // If this is a recipe entry, get correct nutrition values
                if (entry.foodId.startsWith('recipe_')) {
                  const recipeId = entry.foodId.replace('recipe_', '');
                  nutrition = getRecipeNutrition(recipeId);
                }
                
                return {
                  calories: totals.calories + nutrition.calories,
                  protein: totals.protein + nutrition.protein,
                  carbs: totals.carbs + nutrition.carbs,
                  fat: totals.fat + nutrition.fat,
                };
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return {
              id: session.id,
              date: session.date,
              timestamp: session.timestamp,
              totalCalories: correctedTotals.calories,
              totalProtein: correctedTotals.protein,
              totalCarbs: correctedTotals.carbs,
              totalFat: correctedTotals.fat,
              entryCount: session.entries.length,
              calorieGoal: session.calorieGoal,
            };
          })
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // Sort by timestamp (newest first)

        setEntries(nutritionEntries);
      } catch (error) {
        console.error('Error loading nutrition history:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadNutritionHistory();
  }, [loggedMealSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const getCaloriePercentage = (consumed: number, goal: number) => {
    return Math.round((consumed / goal) * 100);
  };

  const handleBack = () => {
    router.back();
  };

  const handleEntryPress = (entryId: string) => {
    router.push(`/nutrition-detail?sessionId=${encodeURIComponent(entryId)}` as any);
  };

  return {
    entries,
    loading,
    handleBack,
    handleEntryPress,
    formatDate,
    formatTime,
    getCaloriePercentage,
  };
};