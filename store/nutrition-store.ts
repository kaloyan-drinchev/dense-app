import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyLog,
  FoodEntry,
  NutritionGoals,
  NutritionPreferences,
  CustomMeal,
  LoggedMealSession,
} from '@/types/nutrition';
import { COMMON_FOODS, calculateNutrition } from '@/mocks/foods';
import { generateId } from '@/utils/helpers';
import { ApiService } from '@/utils/api';

interface NutritionState {
  dailyLogs: { [date: string]: DailyLog };
  loggedMealSessions: LoggedMealSession[]; // All logged meal sessions
  nutritionGoals: NutritionGoals;
  nutritionPreferences: NutritionPreferences;
  recentFoods: string[]; // IDs of recently added foods
  customMeals: CustomMeal[]; // Custom meals created by the user
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  currentUserId: string | null;

  // User management
  setCurrentUser: (userId: string) => void;

  // Actions
  addFoodEntry: (date: string, entry: FoodEntry) => Promise<void>;
  removeFoodEntry: (date: string, entryId: string) => void;
  updateNutritionGoals: (goals: Partial<NutritionGoals>) => void;
  updateNutritionPreferences: (prefs: Partial<NutritionPreferences>) => void;
  clearDailyLog: (date: string) => void;
  clearAllData: () => void;
  logCurrentMeals: (date: string) => void;
  autoLogUnloggedMeals: () => void;
  loadNutritionData: (date: string) => Promise<void>;

  // Custom meals actions
  addCustomMeal: (meal: CustomMeal) => void;
  updateCustomMeal: (mealId: string, updates: Partial<CustomMeal>) => void;
  removeCustomMeal: (mealId: string) => void;
  addCustomMealToLog: (date: string, mealId: string) => void;
}

// Helper to calculate default calorie goal based on user profile
const calculateDefaultCalorieGoal = (
  weight: number,
  height: number,
  age: number,
  goal: string
): number => {
  // Basic BMR calculation (Harris-Benedict equation)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

  // Adjust based on activity level (moderate activity)
  const tdee = bmr * 1.55;

  // Adjust based on goal
  if (goal === 'bulking') return Math.round(tdee * 1.1); // 10% surplus
  if (goal === 'cutting') return Math.round(tdee * 0.8); // 20% deficit
  return Math.round(tdee); // maintenance
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper to create an empty daily log
const createEmptyDailyLog = (date: string, calorieGoal: number): DailyLog => ({
  date,
  entries: [],
  totalNutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  calorieGoal,
});

// Helper to calculate total nutrition from entries
const calculateTotalNutrition = (entries: FoodEntry[]) => {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.nutrition.calories,
      protein: parseFloat((total.protein + entry.nutrition.protein).toFixed(1)),
      carbs: parseFloat((total.carbs + entry.nutrition.carbs).toFixed(1)),
      fat: parseFloat((total.fat + entry.nutrition.fat).toFixed(1)),
      fiber: entry.nutrition.fiber
        ? parseFloat(
            ((total.fiber || 0) + (entry.nutrition.fiber || 0)).toFixed(1)
          )
        : total.fiber,
      sugar: entry.nutrition.sugar
        ? parseFloat(
            ((total.sugar || 0) + (entry.nutrition.sugar || 0)).toFixed(1)
          )
        : total.sugar,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );
};

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dailyLogs: {},
      loggedMealSessions: [],
      nutritionGoals: {
        calories: 2500, // Default value, will be updated based on user profile
        protein: 180,
        carbs: 250,
        fat: 80,
      },
      nutritionPreferences: {
        dietType: 'standard',
        allergies: [],
        excludedFoods: [],
        favoriteItems: [],
      },
      recentFoods: [],
      customMeals: [],
      isLoading: false,
      error: null,
      isConnected: false,
      currentUserId: null,

      // User management
      setCurrentUser: (userId: string) => {
        set({ currentUserId: userId });
      },

      // Load nutrition data from backend
      loadNutritionData: async (date: string) => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        try {
          set({ isLoading: true, error: null });
          const nutritionData = await ApiService.getNutritionHistory(
            currentUserId,
            date
          );

          // Transform backend data to match frontend format
          const dailyLog: DailyLog = {
            date: nutritionData.date,
            entries: nutritionData.entries.map((entry: any) => ({
              id: entry.id,
              foodId: entry.foodId,
              name: entry.name,
              amount: entry.amount,
              unit: entry.unit,
              mealType: entry.mealType,
              timestamp: entry.loggedAt,
              nutrition: entry.nutrition,
            })),
            totalNutrition: nutritionData.totalNutrition,
            calorieGoal: get().nutritionGoals.calories,
          };

          set({
            dailyLogs: {
              ...get().dailyLogs,
              [date]: dailyLog,
            },
            isLoading: false,
            isConnected: true,
          });
        } catch (error) {
          console.error('Failed to load nutrition data:', error);
          set({
            error: 'Failed to load nutrition data from server',
            isLoading: false,
            isConnected: false,
          });
        }
      },

      addFoodEntry: async (date, entry) => {
        const { dailyLogs, nutritionGoals } = get();

        // Create or get the daily log for the date
        const dailyLog =
          dailyLogs[date] || createEmptyDailyLog(date, nutritionGoals.calories);

        // Add the entry
        const updatedEntries = [...dailyLog.entries, entry];

        // Calculate new total nutrition
        const totalNutrition = calculateTotalNutrition(updatedEntries);

        // Update the daily log
        const updatedDailyLog = {
          ...dailyLog,
          entries: updatedEntries,
          totalNutrition,
        };

        // Update recent foods
        const currentRecentFoods = get().recentFoods;
        const updatedRecentFoods = [
          entry.foodId,
          ...currentRecentFoods.filter((id) => id !== entry.foodId),
        ].slice(0, 10); // Keep only the 10 most recent

        // Update state
        set({
          dailyLogs: {
            ...dailyLogs,
            [date]: updatedDailyLog,
          },
          recentFoods: updatedRecentFoods,
        });

        // Sync with backend
        const { currentUserId, isConnected } = get();
        if (currentUserId && isConnected) {
          try {
            await ApiService.logFood(currentUserId, {
              foodId: entry.foodId,
              name: entry.name,
              amount: entry.amount,
              unit: entry.unit,
              mealType: entry.mealType,
              nutrition: entry.nutrition,
            });
          } catch (error) {
            console.error('Failed to sync food entry with backend:', error);
            // Don't revert local changes, just log the error
          }
        }
      },

      removeFoodEntry: (date, entryId) => {
        const { dailyLogs } = get();
        const dailyLog = dailyLogs[date];

        if (!dailyLog) return;

        // Remove the entry
        const updatedEntries = dailyLog.entries.filter(
          (entry) => entry.id !== entryId
        );

        // Calculate new total nutrition
        const totalNutrition = calculateTotalNutrition(updatedEntries);

        // Update the daily log
        const updatedDailyLog = {
          ...dailyLog,
          entries: updatedEntries,
          totalNutrition,
        };

        // Update state
        set({
          dailyLogs: {
            ...dailyLogs,
            [date]: updatedDailyLog,
          },
        });
      },

      updateNutritionGoals: (goals) => {
        set((state) => ({
          nutritionGoals: {
            ...state.nutritionGoals,
            ...goals,
          },
        }));
      },

      updateNutritionPreferences: (prefs) => {
        set((state) => ({
          nutritionPreferences: {
            ...state.nutritionPreferences,
            ...prefs,
          },
        }));
      },

      clearDailyLog: (date) => {
        const { dailyLogs, nutritionGoals } = get();

        if (!dailyLogs[date]) return;

        // Create an empty log
        const emptyLog = createEmptyDailyLog(date, nutritionGoals.calories);

        // Update state
        set({
          dailyLogs: {
            ...dailyLogs,
            [date]: emptyLog,
          },
        });
      },

      clearAllData: () => {
        set({
          dailyLogs: {},
          loggedMealSessions: [],
          recentFoods: [],
          error: null,
        });
      },

      logCurrentMeals: (date) => {
        set((state) => {
          const currentLog = state.dailyLogs[date];
          if (!currentLog || currentLog.entries.length === 0) return state;

          // Create a new logged meal session
          const newSession: LoggedMealSession = {
            id: `session_${Date.now()}`,
            date,
            timestamp: new Date().toISOString(),
            entries: [...currentLog.entries],
            totalNutrition: { ...currentLog.totalNutrition },
            calorieGoal: currentLog.calorieGoal,
          };

          // Clear the current day's entries but keep the log structure
          const clearedLog = createEmptyDailyLog(date, state.nutritionGoals.calories);

          return {
            loggedMealSessions: [...state.loggedMealSessions, newSession],
            dailyLogs: {
              ...state.dailyLogs,
              [date]: clearedLog,
            },
          };
        });
      },

      autoLogUnloggedMeals: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const newLoggedSessions = [...state.loggedMealSessions];
          const newDailyLogs = { ...state.dailyLogs };

          // Check all daily logs for unlogged meals
          Object.entries(state.dailyLogs).forEach(([date, log]) => {
            // Skip today's meals - only auto-log past days
            if (date === today) return;
            
            // Check if this day has unlogged meals
            if (log.entries.length > 0) {
              // Check if already logged by looking for existing session for this date
              const hasLoggedSession = state.loggedMealSessions.some(session => session.date === date);
              
              if (!hasLoggedSession) {
                console.log(`🕛 Auto-logging meals for ${date} (${log.entries.length} entries)`);
                
                // Create auto-logged meal session
                const autoSession: LoggedMealSession = {
                  id: `auto_${date}_${Date.now()}`,
                  date,
                  timestamp: `${date}T23:59:59.000Z`, // Set to end of day
                  entries: [...log.entries],
                  totalNutrition: { ...log.totalNutrition },
                  calorieGoal: log.calorieGoal,
                };

                newLoggedSessions.push(autoSession);
                
                // Clear the daily log after auto-logging
                newDailyLogs[date] = createEmptyDailyLog(date, state.nutritionGoals.calories);
              }
            }
          });

          return {
            loggedMealSessions: newLoggedSessions,
            dailyLogs: newDailyLogs,
          };
        });
      },

      // Custom meals actions
      addCustomMeal: (meal) => {
        set((state) => ({
          customMeals: [...state.customMeals, meal],
        }));
      },

      updateCustomMeal: (mealId, updates) => {
        set((state) => {
          const mealIndex = state.customMeals.findIndex(
            (meal) => meal.id === mealId
          );

          if (mealIndex === -1) return state;

          const updatedMeals = [...state.customMeals];
          updatedMeals[mealIndex] = {
            ...updatedMeals[mealIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          return {
            customMeals: updatedMeals,
          };
        });
      },

      removeCustomMeal: (mealId) => {
        set((state) => ({
          customMeals: state.customMeals.filter((meal) => meal.id !== mealId),
        }));
      },

      addCustomMealToLog: (date, mealId) => {
        const { customMeals } = get();
        const meal = customMeals.find((m) => m.id === mealId);

        if (!meal) return;

        // Create entries for each food in the custom meal
        const foodEntries: FoodEntry[] = [];

        meal.foods.forEach(({ foodId, amount }) => {
          const food = COMMON_FOODS.find((f) => f.id === foodId);

          if (!food) return;

          const entry: FoodEntry = {
            id: generateId(),
            foodId,
            name: food.name,
            amount,
            unit: food.servingUnit,
            mealType: meal.mealType,
            timestamp: new Date().toISOString(),
            nutrition: calculateNutrition(food, amount),
          };

          foodEntries.push(entry);
        });

        // Add each entry to the log
        foodEntries.forEach((entry) => {
          get().addFoodEntry(date, entry);
        });
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dailyLogs: state.dailyLogs,
        nutritionGoals: state.nutritionGoals,
        nutritionPreferences: state.nutritionPreferences,
        recentFoods: state.recentFoods,
        customMeals: state.customMeals,
        currentUserId: state.currentUserId,
        isConnected: state.isConnected,
      }),
    }
  )
);

// Initialize nutrition goals based on TDEE calculation from wizard results
export const initializeNutritionGoals = async () => {
  const { updateNutritionGoals } = useNutritionStore.getState();
  
  try {
    // Import services here to avoid circular dependency
    const { wizardResultsService } = await import('@/db/services');
    const { useAuthStore } = await import('@/store/auth-store');
    
    const user = useAuthStore.getState().user;
    if (!user?.id) {
      console.log('No user found, using default nutrition goals');
      return;
    }

    // Get wizard results with TDEE data
    const wizardResults = await wizardResultsService.getByUserId(user.id);
    
    if (wizardResults?.tdeeData) {
      // Parse TDEE data from wizard results
      const tdeeData = JSON.parse(wizardResults.tdeeData);
      
      console.log('🎯 Using TDEE-calculated nutrition goals:', tdeeData);
      
      updateNutritionGoals({
        calories: tdeeData.adjustedCalories,
        protein: tdeeData.protein,
        carbs: tdeeData.carbs,
        fat: tdeeData.fat,
      });
    } else {
      // Fallback to old calculation if no TDEE data available
      console.log('No TDEE data found, using fallback calculation');
      const userProfile =
        require('@/store/workout-store').useWorkoutStore.getState().userProfile;

      if (userProfile) {
        const calorieGoal = calculateDefaultCalorieGoal(
          userProfile.weight,
          userProfile.height,
          userProfile.age,
          userProfile.goal
        );

        // Set protein based on body weight (1.8g per kg for bulking, 2.2g for cutting)
        const proteinGoal = Math.round(
          userProfile.weight * (userProfile.goal === 'cutting' ? 2.2 : 1.8)
        );

        // Set fat at 25-30% of calories
        const fatGoal = Math.round((calorieGoal * 0.3) / 9);

        // Remaining calories from carbs
        const carbGoal = Math.round(
          (calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4
        );

        updateNutritionGoals({
          calories: calorieGoal,
          protein: proteinGoal,
          carbs: carbGoal,
          fat: fatGoal,
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize nutrition goals:', error);
  }
};
