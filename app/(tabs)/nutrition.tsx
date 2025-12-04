import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import {
  useNutritionStore,
  initializeNutritionGoals,
} from '@/store/nutrition-store';
import { startMidnightLogger, checkForUnloggedMeals } from '@/utils/midnight-logger';
import { NutritionSummary } from '@/components/NutritionSummary';
import { NutritionProgressCharts } from '@/components/NutritionProgressCharts';
import { DailyMacroTargets } from '@/components/DailyMacroTargets';
import { MealSection } from '@/components/MealSection';
import { TDEETargets } from '@/components/TDEETargets';

import { ConfirmationModal } from '@/components/ConfirmationModal';
import { MealType } from '@/types/nutrition';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { wizardResultsService, userProgressService } from '@/db/services';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';
import { useAuthStore } from '@/store/auth-store';

export default function NutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    dailyLogs,
    nutritionGoals,
    addFoodEntry,
    removeFoodEntry,
    clearAllData,
    logCurrentMeals,
  } = useNutritionStore();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ entryId: string; entryName: string } | null>(null);
  const [workoutCalories, setWorkoutCalories] = useState<number | null>(null);

  // Initialize nutrition goals based on user profile
  useEffect(() => {
    initializeNutritionGoals();
    
    // Start midnight auto-logging system
    startMidnightLogger();
    
    // Check for any unlogged meals from previous days
    checkForUnloggedMeals();
  }, []);

  const loadWorkoutCalories = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      const progress = await userProgressService.getByUserId(user.id);
      
      if (!wizardResults?.generatedSplit) {
        setWorkoutCalories(0);
        return;
      }
      
      if (!progress) {
        setWorkoutCalories(0);
        return;
      }
      
      // Handle both string (JSON) and object (JSONB) types
      const program = typeof wizardResults.generatedSplit === 'string'
        ? JSON.parse(wizardResults.generatedSplit)
        : wizardResults.generatedSplit;
      const currentWorkoutIndex = progress.currentWorkout - 1;
      const todaysWorkout = program.weeklyStructure?.[currentWorkoutIndex];
      
      if (!todaysWorkout?.exercises) {
        setWorkoutCalories(0);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Handle both string (JSON) and object/array (JSONB) types
      let completedWorkouts: any[] = [];
      if (progress.completedWorkouts) {
        if (Array.isArray(progress.completedWorkouts)) {
          completedWorkouts = progress.completedWorkouts;
        } else if (typeof progress.completedWorkouts === 'string') {
          try { 
            completedWorkouts = JSON.parse(progress.completedWorkouts); 
          } catch { 
            completedWorkouts = []; 
          }
        }
      }
      
      const todayWorkoutCompleted = completedWorkouts.some((w: any) => {
        if (typeof w === 'object' && w.date) {
          const workoutDate = new Date(w.date).toISOString().split('T')[0];
          return workoutDate === today;
        }
        return false;
      });
      
      // Handle both string (JSON) and object (JSONB) types
      const weeklyWeights = progress.weeklyWeights 
        ? (typeof progress.weeklyWeights === 'string' 
            ? JSON.parse(progress.weeklyWeights) 
            : progress.weeklyWeights)
        : {};
      const exerciseLogs = weeklyWeights?.exerciseLogs || {};
      const customExercises = weeklyWeights?.customExercises?.[today] || [];
      
      const completedExercises: Array<{ 
        name: string; 
        sets: number;
        setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
      }> = [];
      
      if (todayWorkoutCompleted) {
        (todaysWorkout.exercises || []).forEach((ex: any) => {
          const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
          const sessions = exerciseLogs[exId] || [];
          const todaySession = sessions.find((s: any) => s.date === today);
          const sets = typeof ex.sets === 'number' ? ex.sets : 3;
          
          if (todaySession?.sets && todaySession.sets.length > 0) {
            completedExercises.push({
              name: ex.name,
              sets: sets,
              setsData: todaySession.sets
            });
          } else {
            completedExercises.push({
              name: ex.name,
              sets: sets
            });
          }
        });
        
        customExercises.forEach((ex: any) => {
          const sessions = exerciseLogs[ex.id] || [];
          const todaySession = sessions.find((s: any) => s.date === today);
          const sets = typeof ex.sets === 'number' ? ex.sets : 3;
          
          if (todaySession?.sets && todaySession.sets.length > 0) {
            completedExercises.push({
              name: ex.name,
              sets: sets,
              setsData: todaySession.sets
            });
          } else {
            completedExercises.push({
              name: ex.name,
              sets: sets
            });
          }
        });
      } else {
        (todaysWorkout.exercises || []).forEach((ex: any) => {
          const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
          const sessions = exerciseLogs[exId] || [];
          const todaySession = sessions.find((s: any) => s.date === today);
          
          if (todaySession?.sets) {
            const completedSets = todaySession.sets.filter((s: any) => !!s.isCompleted).length;
            if (completedSets > 0) {
              completedExercises.push({
                name: ex.name,
                sets: completedSets,
                setsData: todaySession.sets
              });
            }
          }
        });
        
        customExercises.forEach((ex: any) => {
          const sessions = exerciseLogs[ex.id] || [];
          const todaySession = sessions.find((s: any) => s.date === today);
          
          if (todaySession?.sets) {
            const completedSets = todaySession.sets.filter((s: any) => !!s.isCompleted).length;
            if (completedSets > 0) {
              completedExercises.push({
                name: ex.name,
                sets: completedSets,
                setsData: todaySession.sets
              });
            }
          }
        });
      }
      
      const userWeight = wizardResults.weight || 70;
      const exerciseCalories = completedExercises.length > 0 
        ? calculateWorkoutCalories(completedExercises, userWeight)
        : 0;
      
      const cardioEntries = weeklyWeights?.cardioEntries?.[today] || [];
      const cardioCalories = cardioEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.calories || 0);
      }, 0);
      
      const totalCalories = exerciseCalories + cardioCalories;
      setWorkoutCalories(totalCalories);
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

  const dailyLog = dailyLogs[selectedDate] || {
    date: selectedDate,
    entries: [],
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
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
    const totalEntries = Object.keys(entriesByMeal).length;
    const totalCalories = dailyLog.totalNutrition.calories;
    const calorieGoal = dailyLog.calorieGoal;
    const completionPercentage = Math.round((totalCalories / calorieGoal) * 100);

    Alert.alert(
      'Log Selected Meals',
      `Ready to log these meals?\n\n📊 ${dailyLog.entries.length} foods\n🔥 ${totalCalories} calories (${completionPercentage}% of goal)\n\nThese meals will be saved to your history and cleared from the current view so you can add more meals.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Meals',
          style: 'default',
          onPress: () => {
            // Log the current meals and clear the view
            logCurrentMeals(selectedDate);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert(
              '✅ Meals Logged!', 
              'Your meals have been saved to history. You can now add more meals for today.'
            );
          },
        },
      ]
    );
  };





  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* <View style={styles.header}>
          <TouchableOpacity style={styles.dateButton}>
            <Icon name="calendar" size={16} color={colors.white} />
            <Text style={styles.dateText}>Today</Text>
          </TouchableOpacity>
        </View> */}

        {/* TDEETargets - Removed as requested */}
        {/* <TDEETargets /> */}

        {/* Daily Macro Targets */}
        <DailyMacroTargets nutritionGoals={nutritionGoals} />

        {/* Today's Workout Calories */}
        {workoutCalories !== null && (
          <View style={styles.workoutCaloriesCard}>
            <View style={styles.workoutCaloriesHeader}>
              <Icon name="zap" size={20} color={colors.primary} />
              <Text style={styles.workoutCaloriesTitle}>Today's Workout</Text>
            </View>
            {workoutCalories > 0 ? (
              <>
                <Text style={styles.workoutCaloriesValue}>~{workoutCalories} calories burned</Text>
                <Text style={styles.workoutCaloriesNote}>
                  Estimated calories from completed exercises and cardio
                </Text>
              </>
            ) : (
              <Text style={styles.workoutCaloriesNote}>
                Complete exercises to see calories burned
              </Text>
            )}
          </View>
        )}

        <NutritionProgressCharts dailyLog={dailyLog} />

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              // Check meal limit before navigating
              if (dailyLog.entries.length >= 10) {
                Alert.alert(
                  'Meal Limit Reached',
                  'You can only add up to 10 meals per day. Please log or clear some of the foods to add more.',
                  [{ text: 'OK', style: 'default' }]
                );
                return;
              }
              // Navigate to add food page
              router.push('/add-food-page');
            }}
            activeOpacity={1}
          >
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Add Foods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/allowed-foods')}
            activeOpacity={1}
          >
            <Icon name="list" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Allowed Foods</Text>
          </TouchableOpacity>
        </View>

        {/* Meal Entries Display - Individual foods removed, full meals kept */}
        {Object.keys(entriesByMeal).length > 0 ? (
          <>
            {entriesByMeal.breakfast && (
              <MealSection
                mealType="breakfast"
                entries={entriesByMeal.breakfast}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.breakfast.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.brunch && (
              <MealSection
                mealType="brunch"
                entries={entriesByMeal.brunch}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.brunch.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.lunch && (
              <MealSection
                mealType="lunch"
                entries={entriesByMeal.lunch}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.lunch.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal['pre-workout'] && (
              <MealSection
                mealType="pre-workout"
                entries={entriesByMeal['pre-workout']}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal['pre-workout'].find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal['post-workout'] && (
              <MealSection
                mealType="post-workout"
                entries={entriesByMeal['post-workout']}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal['post-workout'].find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.dinner && (
              <MealSection
                mealType="dinner"
                entries={entriesByMeal.dinner}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.dinner.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.snack && (
              <MealSection
                mealType="snack"
                entries={entriesByMeal.snack}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.snack.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.aiChatTip}>
              <Icon name="message-circle" size={16} color={colors.primary} />
              <Text style={styles.aiChatTipText}>
                For pre-workout and pump recipes ask the AI chat
              </Text>
            </View>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptyText}>
              Add meal recipes using the "Add Foods" button above
            </Text>
          </View>
        )}

        {/* Daily Actions - Always visible */}
        <View style={styles.dailyActions}>
          {Object.keys(entriesByMeal).length > 0 && (
            <TouchableOpacity
              style={styles.logDayButton}
              onPress={handleLogDaily}
              activeOpacity={1}
            >
              <Icon name="check-circle" size={18} color={colors.black} />
              <Text style={styles.logDayButtonText}>Log Selected Meals</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dailyActionButton}
            onPress={() => router.push('/nutrition-history')}
            activeOpacity={1}
          >
            <Icon name="calendar" size={18} color={colors.primary} />
            <Text style={styles.dailyActionText}>See Previous Nutrition</Text>
            <Icon name="arrow-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setEntryToDelete(null);
        }}
        title="Delete Food Entry"
        message={`Are you sure you want to remove "${entryToDelete?.entryName}" from your meal log? This action cannot be undone.`}
        iconName="trash-2"
        iconColor={colors.error}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setShowDeleteConfirmation(false);
              setEntryToDelete(null);
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmRemoveEntry,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 32,      // Keep bottom unchanged
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h1,
    color: colors.white,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.white,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  quickActionText: {
    ...typography.bodySmall,
    color: colors.white,
  },
  emptyContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  closeModalButton: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalButtonText: {
    ...typography.button,
    color: colors.white,
  },
  dailyActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  dailyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  dailyActionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  logDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  logDayButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  aiChatTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  aiChatTipText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  workoutCaloriesCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  workoutCaloriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  workoutCaloriesTitle: {
    ...typography.h5,
    color: colors.white,
    fontWeight: '600',
  },
  workoutCaloriesValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutCaloriesNote: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
});
