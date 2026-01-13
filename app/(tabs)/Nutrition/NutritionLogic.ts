import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useNutritionStore, initializeNutritionGoals } from '@/store/nutrition-store';
import { useAuthStore } from '@/store/auth-store';
import { startMidnightLogger, checkForUnloggedMeals } from '@/utils/midnight-logger';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';
import { wizardResultsService, userProgressService } from '@/db/services';
import { MealType } from '@/types/nutrition';

export const useNutritionLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    dailyLogs,
    nutritionGoals,
    removeFoodEntry,
    logCurrentMeals,
  } = useNutritionStore();

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ entryId: string; entryName: string } | null>(null);
  const [workoutCalories, setWorkoutCalories] = useState<number | null>(null);

  // --- EFFECTS ---

  // Initialize goals & background tasks
  useEffect(() => {
    initializeNutritionGoals();
    startMidnightLogger();
    checkForUnloggedMeals();
  }, []);

  // Logic to calculate burned calories from DB data
  const loadWorkoutCalories = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      const progress = await userProgressService.getByUserId(user.id);
      
      if (!(wizardResults as any)?.generatedSplit || !progress) {
        setWorkoutCalories(0);
        return;
      }
      
      // Parse Program (legacy field)
      const program = typeof (wizardResults as any).generatedSplit === 'string'
        ? JSON.parse((wizardResults as any).generatedSplit)
        : (wizardResults as any).generatedSplit;
        
      // currentWorkout is now a string type ('push-a'), but legacy code expects index
      // Convert to number if it's actually a string number, otherwise default to 0
      const workoutIndex = typeof progress.currentWorkout === 'string' 
        ? parseInt(progress.currentWorkout as string, 10) || 0
        : (progress.currentWorkout as number);
      const currentWorkoutIndex = workoutIndex - 1;
      const todaysWorkout = program.weeklyStructure?.[currentWorkoutIndex];
      
      if (!todaysWorkout?.exercises) {
        setWorkoutCalories(0);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Parse Completed Workouts
      let completedWorkouts: any[] = [];
      if (progress.completedWorkouts) {
        if (Array.isArray(progress.completedWorkouts)) {
          completedWorkouts = progress.completedWorkouts;
        } else if (typeof progress.completedWorkouts === 'string') {
          try { completedWorkouts = JSON.parse(progress.completedWorkouts); } catch { completedWorkouts = []; }
        }
      }
      
      const todayWorkoutCompleted = completedWorkouts.some((w: any) => {
        if (typeof w === 'object' && w.date) {
          const workoutDate = new Date(w.date).toISOString().split('T')[0];
          return workoutDate === today;
        }
        return false;
      });
      
      // Parse Weekly Weights / Logs
      const weeklyWeights = progress.weeklyWeights 
        ? (typeof progress.weeklyWeights === 'string' ? JSON.parse(progress.weeklyWeights) : progress.weeklyWeights)
        : {};
      const exerciseLogs = weeklyWeights?.exerciseLogs || {};
      const customExercises = weeklyWeights?.customExercises?.[today] || [];
      
      const completedExercises: Array<{ name: string; sets: number; setsData?: any }> = [];
      
      // Helper to process exercises
      const processExercises = (sourceList: any[]) => {
        sourceList.forEach((ex: any) => {
          const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
          const sessions = exerciseLogs[exId] || [];
          const todaySession = sessions.find((s: any) => s.date === today);
          
          if (todayWorkoutCompleted) {
             const sets = typeof ex.sets === 'number' ? ex.sets : 3;
             if (todaySession?.sets?.length > 0) {
                completedExercises.push({ name: ex.name, sets: sets, setsData: todaySession.sets });
             } else {
                completedExercises.push({ name: ex.name, sets: sets });
             }
          } else {
            // Not fully completed, check partials
            if (todaySession?.sets) {
              const completedSets = todaySession.sets.filter((s: any) => !!s.isCompleted).length;
              if (completedSets > 0) {
                completedExercises.push({ name: ex.name, sets: completedSets, setsData: todaySession.sets });
              }
            }
          }
        });
      };

      processExercises(todaysWorkout.exercises || []);
      processExercises(customExercises);
      
      const userWeight = wizardResults.weight || 70;
      const exerciseCalories = completedExercises.length > 0 
        ? calculateWorkoutCalories(completedExercises, userWeight)
        : 0;
      
      const cardioEntries = weeklyWeights?.cardioEntries?.[today] || [];
      const cardioCalories = cardioEntries.reduce((sum: number, entry: any) => sum + (entry.calories || 0), 0);
      
      setWorkoutCalories(exerciseCalories + cardioCalories);
    } catch (error) {
      console.error('Failed to load workout calories:', error);
      setWorkoutCalories(0);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutCalories();
    }, [loadWorkoutCalories])
  );

  // --- DERIVED STATE ---

  const dailyLog = dailyLogs[selectedDate] || {
    date: selectedDate,
    entries: [],
    totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    calorieGoal: nutritionGoals.calories,
  };
  dailyLog.calorieGoal = nutritionGoals.calories;

  const entriesByMeal = dailyLog.entries.reduce((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = [];
    }
    acc[entry.mealType].push(entry);
    return acc;
  }, {} as Record<MealType, typeof dailyLog.entries>);

  // --- HANDLERS ---

  const handleRemoveEntry = (entryId: string, entryName: string) => {
    setEntryToDelete({ entryId, entryName });
    setShowDeleteConfirmation(true);
  };

  const confirmRemoveEntry = () => {
    if (entryToDelete) {
      removeFoodEntry(selectedDate, entryToDelete.entryId);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    setEntryToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleLogDaily = () => {
    const totalEntries = dailyLog.entries.length;
    const totalCalories = dailyLog.totalNutrition.calories;
    const calorieGoal = dailyLog.calorieGoal;
    const completionPercentage = Math.round((totalCalories / calorieGoal) * 100);

    Alert.alert(
      'Log Selected Meals',
      `Ready to log these meals?\n\n📊 ${totalEntries} foods\n🔥 ${totalCalories} calories (${completionPercentage}% of goal)\n\nThese meals will be saved to your history and cleared from the current view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Meals',
          style: 'default',
          onPress: () => {
            logCurrentMeals(selectedDate);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('✅ Meals Logged!', 'Your meals have been saved to history.');
          },
        },
      ]
    );
  };

  const navigateToAddFood = () => {
    if (dailyLog.entries.length >= 10) {
      Alert.alert(
        'Meal Limit Reached',
        'You can only add up to 10 meals per day.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    router.push('/add-food-page');
  };

  return {
    router,
    dailyLog,
    entriesByMeal,
    nutritionGoals,
    workoutCalories,
    showDeleteConfirmation,
    entryToDelete,
    setShowDeleteConfirmation,
    setEntryToDelete,
    handleRemoveEntry,
    confirmRemoveEntry,
    handleLogDaily,
    navigateToAddFood
  };
};