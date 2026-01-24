import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNutritionStore } from "@/store/nutrition-store";
import { MealType, FoodEntry } from "@/types/nutrition";
import { getRecipeNutrition } from "@/src/features/add-food-page/nutrition-data";

export const useNutritionDetailLogic = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { loggedMealSessions, nutritionGoals } = useNutritionStore();
  const [loading, setLoading] = useState(true);

  const mealSession = loggedMealSessions.find(
    (session) => session.id === sessionId
  );

  // Fix nutrition values for recipe entries
  const fixedEntries = (mealSession?.entries || []).map(entry => {
    // Check if this is a recipe entry
    if (entry.foodId.startsWith('recipe_')) {
      const recipeId = entry.foodId.replace('recipe_', '');
      const correctNutrition = getRecipeNutrition(recipeId);
      return {
        ...entry,
        nutrition: {
          ...entry.nutrition,
          calories: correctNutrition.calories,
          protein: correctNutrition.protein,
          carbs: correctNutrition.carbs,
          fat: correctNutrition.fat,
        }
      };
    }
    return entry;
  });

  // Recalculate total nutrition with corrected values
  const recalculatedTotalNutrition = fixedEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.nutrition.calories,
      protein: totals.protein + entry.nutrition.protein,
      carbs: totals.carbs + entry.nutrition.carbs,
      fat: totals.fat + entry.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const dailyLog = mealSession ? {
    ...mealSession,
    entries: fixedEntries,
    totalNutrition: recalculatedTotalNutrition,
  } : {
    date: "",
    entries: [],
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    calorieGoal: nutritionGoals.calories,
  };

  // Group entries by meal type
  type EntriesByMealType = Partial<Record<MealType, FoodEntry[]>>;
  const entriesByMeal: EntriesByMealType = (
    dailyLog.entries || []
  ).reduce<EntriesByMealType>((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = [];
    }
    acc[entry.mealType]!.push(entry);
    return acc;
  }, {});

  const orderedMealTypes: MealType[] = [
    "breakfast",
    "brunch",
    "lunch",
    "pre-workout",
    "post-workout",
    "dinner",
    "snack",
  ];

  useEffect(() => {
    setLoading(false);
  }, [sessionId]);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today's Meals";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday's Meals";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const formatSessionTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast": return "🌅";
      case "brunch": return "🥐";
      case "lunch": return "🍽️";
      case "pre-workout": return "⚡";
      case "post-workout": return "💪";
      case "dinner": return "🌙";
      case "snack": return "🥜";
      default: return "🍴";
    }
  };

  const getMealDisplayName = (mealType: MealType) => {
    switch (mealType) {
      case "pre-workout": return "Pre-Workout";
      case "post-workout": return "Post-Workout";
      default: return mealType.charAt(0).toUpperCase() + mealType.slice(1);
    }
  };

  const getGoalPercentage = () => {
    if (!dailyLog.calorieGoal) return 0;
    return Math.round(
      (dailyLog.totalNutrition.calories / dailyLog.calorieGoal) * 100
    );
  };

  return {
    loading,
    mealSession,
    dailyLog,
    entriesByMeal,
    orderedMealTypes,
    handleBack,
    formatDate,
    formatSessionTime,
    formatTime,
    getMealIcon,
    getMealDisplayName,
    getGoalPercentage
  };
};