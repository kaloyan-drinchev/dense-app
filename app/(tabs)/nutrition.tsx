import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import {
  useNutritionStore,
  initializeNutritionGoals,
} from '@/store/nutrition-store';
import { FoodSearchBar } from '@/components/FoodSearchBar';
import { FoodEntryForm } from '@/components/FoodEntryForm';
import { NutritionSummary } from '@/components/NutritionSummary';
import { MealSection } from '@/components/MealSection';
import { TDEETargets } from '@/components/TDEETargets';

import { FoodScanModal } from '@/components/FoodScanModal';
import { ScanResultsModal } from '@/components/ScanResultsModal';
import { CustomMealsList } from '@/components/CustomMealsList';
import { CustomMealForm } from '@/components/CustomMealForm';
import { FoodItem, MealType, CustomMeal } from '@/types/nutrition';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function NutritionScreen() {
  const {
    dailyLogs,
    nutritionGoals,
    addFoodEntry,
    removeFoodEntry,
    customMeals,
    addCustomMealToLog,
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
  const [showCustomMealForm, setShowCustomMealForm] = useState(false);
  const [selectedCustomMeal, setSelectedCustomMeal] =
    useState<CustomMeal | null>(null);
  const [showCustomMeals, setShowCustomMeals] = useState(false);
  const [barcodeData, setBarcodeData] = useState<string | null>(null);

  // Initialize nutrition goals based on user profile
  useEffect(() => {
    initializeNutritionGoals();
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

  const handleRemoveEntry = (entryId: string) => {
    removeFoodEntry(selectedDate, entryId);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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
    alert(
      `Barcode scanned: ${barcode}\nThis would search a food database in a production app.`
    );
  };



  const handleAddCustomMeal = () => {
    setSelectedCustomMeal(null);
    setShowCustomMealForm(true);
  };

  const handleEditCustomMeal = (meal: CustomMeal) => {
    setSelectedCustomMeal(meal);
    setShowCustomMealForm(true);
  };

  const handleSelectCustomMeal = (meal: CustomMeal) => {
    // Add all foods from the custom meal to the log
    addCustomMealToLog(selectedDate, meal.id);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setShowCustomMeals(false);
  };

  const handleCustomMealFormComplete = () => {
    setShowCustomMealForm(false);
    setSelectedCustomMeal(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition Tracker</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Icon name="calendar" size={16} color={colors.white} />
            <Text style={styles.dateText}>Today</Text>
          </TouchableOpacity>
        </View>

        <TDEETargets />

        <FoodSearchBar
          onSelectFood={handleSelectFood}
          onScanFood={handleScanFood}
        />



        <NutritionSummary dailyLog={dailyLog} />

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowCustomMeals(true)}
          >
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Custom Meals</Text>
          </TouchableOpacity>



          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleScanFood}
          >
            <Icon name="camera" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Scan Food</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setShowScanModal(true);
              // This will be handled by the FoodScanModal component
            }}
          >
            <MaterialIcon name="qr-code" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Barcode</Text>
          </TouchableOpacity>
        </View>

        {Object.keys(entriesByMeal).length > 0 ? (
          <>
            {entriesByMeal.breakfast && (
              <MealSection
                mealType="breakfast"
                entries={entriesByMeal.breakfast}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal.brunch && (
              <MealSection
                mealType="brunch"
                entries={entriesByMeal.brunch}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal.lunch && (
              <MealSection
                mealType="lunch"
                entries={entriesByMeal.lunch}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal['pre-workout'] && (
              <MealSection
                mealType="pre-workout"
                entries={entriesByMeal['pre-workout']}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal['post-workout'] && (
              <MealSection
                mealType="post-workout"
                entries={entriesByMeal['post-workout']}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal.dinner && (
              <MealSection
                mealType="dinner"
                entries={entriesByMeal.dinner}
                onRemoveEntry={handleRemoveEntry}
              />
            )}

            {entriesByMeal.snack && (
              <MealSection
                mealType="snack"
                entries={entriesByMeal.snack}
                onRemoveEntry={handleRemoveEntry}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No foods logged yet</Text>
            <Text style={styles.emptyText}>
              Search for foods or use camera input to log your meals
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Food Entry Form Modal */}
      <Modal
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
      </Modal>



      {/* Food Scan Modal */}
      <FoodScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanResult={handleScanResult}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Scan Results Modal */}
      <ScanResultsModal
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
      />

      {/* Custom Meals Modal */}
      <Modal
        visible={showCustomMeals}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomMeals(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomMealsList
              onAddMeal={handleAddCustomMeal}
              onEditMeal={handleEditCustomMeal}
              onSelectMeal={handleSelectCustomMeal}
            />
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowCustomMeals(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Meal Form Modal */}
      <Modal
        visible={showCustomMealForm}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCustomMealFormComplete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomMealForm
              existingMeal={selectedCustomMeal || undefined}
              onComplete={handleCustomMealFormComplete}
            />
          </View>
        </View>
      </Modal>
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
});
