import React, { useState, useEffect } from 'react';
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
import { FoodSearchBar } from '@/components/FoodSearchBar';
import { FoodEntryForm } from '@/components/FoodEntryForm';
import { NutritionSummary } from '@/components/NutritionSummary';
import { NutritionProgressCharts } from '@/components/NutritionProgressCharts';
import { DailyMacroTargets } from '@/components/DailyMacroTargets';
import { MealSection } from '@/components/MealSection';
import { TDEETargets } from '@/components/TDEETargets';

import { FoodScanModal } from '@/components/FoodScanModal';
import { ScanResultsModal } from '@/components/ScanResultsModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
// import { FoodSelectionModal } from '@/components/FoodSelectionModal'; // Replaced with add-food-page
import { FoodItem, MealType } from '@/types/nutrition';
import { FoodItem as AllowedFoodItem } from '@/constants/allowed-foods';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function NutritionScreen() {
  const router = useRouter();
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
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResults, setScanResults] = useState<
    Array<{ food: FoodItem; amount: number }>
  >([]);
  const [scanMealType, setScanMealType] = useState<MealType>('breakfast');
  const [showScanResults, setShowScanResults] = useState(false);
  // const [showFoodSelection, setShowFoodSelection] = useState(false); // Replaced with navigation
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ entryId: string; entryName: string } | null>(null);

  // Initialize nutrition goals based on user profile
  useEffect(() => {
    initializeNutritionGoals();
    
    // Start midnight auto-logging system
    startMidnightLogger();
    
    // Check for any unlogged meals from previous days
    checkForUnloggedMeals();
  }, []);

  // Get or create daily log for selected date
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

  // Always use current nutrition goals for calorie goal (in case they were updated)
  dailyLog.calorieGoal = nutritionGoals.calories;

  console.log('📊 Nutrition Tab - nutritionGoals:', nutritionGoals);
  console.log('📊 Nutrition Tab - dailyLog calorieGoal:', dailyLog.calorieGoal);

  // Group entries by meal type
  const entriesByMeal = dailyLog.entries.reduce((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = [];
    }
    acc[entry.mealType].push(entry);
    return acc;
  }, {} as Record<MealType, typeof dailyLog.entries>);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setShowFoodForm(true);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFoodFormComplete = () => {
    setSelectedFood(null);
    setShowFoodForm(false);
  };

  // handleFoodSelection - REMOVED since we now use add-food-page instead of modal

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

  const handleScanFood = () => {
    setShowScanModal(true);
  };

  const handleScanResult = (
    foods: Array<{ food: FoodItem; amount: number }>,
    mealType: MealType
  ) => {
    setScanResults(foods);
    setScanMealType(mealType);
    setShowScanModal(false);
    setShowScanResults(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setBarcodeData(barcode);
    // In a real app, you would query a food database with this barcode
    // For now, we'll just show a message
    Alert.alert(
      'Barcode Scanned',
      `Barcode: ${barcode}\nThis would search a food database in a production app.`
    );
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

        {/* FoodSearchBar - Temporarily commented out */}
        {/* <FoodSearchBar
          onSelectFood={handleSelectFood}
          onScanFood={handleScanFood}
        /> */}


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

          {/* <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleScanFood}
          >
            <Icon name="camera" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Scan Food</Text>
          </TouchableOpacity> */}

          {/* <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setShowScanModal(true);
              // This will be handled by the FoodScanModal component
            }}
          >
            <MaterialIcon name="qr-code" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Barcode</Text>
          </TouchableOpacity> */}
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

      {/* Individual Food Tracking Modals - COMMENTED OUT */}
      {/* Food Entry Form Modal */}
      {/* <Modal
        visible={showFoodForm && selectedFood !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleFoodFormComplete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedFood && (
              <FoodEntryForm
                food={selectedFood}
                onComplete={handleFoodFormComplete}
              />
            )}
          </View>
        </View>
      </Modal> */}



      {/* Food Scan Modal */}
      {/* <FoodScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanResult={handleScanResult}
        onBarcodeScanned={handleBarcodeScanned}
      /> */}

      {/* Scan Results Modal */}
      {/* <ScanResultsModal
        visible={showScanResults}
        onClose={() => setShowScanResults(false)}
        scanResults={scanResults}
        mealType={scanMealType}
        onAddFood={(food, amount, mealType) => {
          // Create a food entry and add it to the log
          const entry = {
            id: `${Date.now()}`,
            foodId: food.id,
            name: food.name,
            amount,
            unit: food.servingUnit,
            mealType,
            timestamp: new Date().toISOString(),
            nutrition: {
              calories: Math.round(food.nutritionPer100g.calories * (amount / 100)),
              protein: parseFloat(
                (food.nutritionPer100g.protein * (amount / 100)).toFixed(1)
              ),
              carbs: parseFloat(
                (food.nutritionPer100g.carbs * (amount / 100)).toFixed(1)
              ),
              fat: parseFloat(
                (food.nutritionPer100g.fat * (amount / 100)).toFixed(1)
              ),
            },
          };

          addFoodEntry(selectedDate, entry);

          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }}
      /> */}

      {/* Food Selection Modal - REPLACED WITH add-food-page */}
      {/* <FoodSelectionModal
        visible={showFoodSelection}
        onClose={() => setShowFoodSelection(false)}
        onSelectFood={handleFoodSelection}
      /> */}

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
});
