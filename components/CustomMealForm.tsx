import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import {
  FoodItem,
  MealType,
  CustomMeal,
  NutritionInfo,
} from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutrition-store';
import { COMMON_FOODS, calculateNutrition } from '@/mocks/foods';
import { generateId } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CustomMealFormProps {
  existingMeal?: CustomMeal;
  onComplete: () => void;
}

export const CustomMealForm: React.FC<CustomMealFormProps> = ({
  existingMeal,
  onComplete,
}) => {
  const [name, setName] = useState(existingMeal?.name || '');
  const [description, setDescription] = useState(
    existingMeal?.description || ''
  );
  const [mealType, setMealType] = useState<MealType>(
    existingMeal?.mealType || 'dinner'
  );
  const [selectedFoods, setSelectedFoods] = useState<
    Array<{ foodId: string; amount: number }>
  >(existingMeal?.foods || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { addCustomMeal, updateCustomMeal } = useNutritionStore();

  // Calculate total nutrition
  const calculateTotalNutrition = (): NutritionInfo => {
    return selectedFoods.reduce(
      (total, { foodId, amount }) => {
        const food = COMMON_FOODS.find((f) => f.id === foodId);
        if (!food) return total;

        const nutrition = calculateNutrition(food, amount);

        return {
          calories: total.calories + nutrition.calories,
          protein: parseFloat((total.protein + nutrition.protein).toFixed(1)),
          carbs: parseFloat((total.carbs + nutrition.carbs).toFixed(1)),
          fat: parseFloat((total.fat + nutrition.fat).toFixed(1)),
          fiber: nutrition.fiber
            ? parseFloat(
                ((total.fiber || 0) + (nutrition.fiber || 0)).toFixed(1)
              )
            : total.fiber,
          sugar: nutrition.sugar
            ? parseFloat(
                ((total.sugar || 0) + (nutrition.sugar || 0)).toFixed(1)
              )
            : total.sugar,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
    );
  };

  const totalNutrition = calculateTotalNutrition();

  // Search for foods
  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = COMMON_FOODS.filter(
        (food) =>
          food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (food.brand &&
            food.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAddFood = (food: FoodItem) => {
    // Check if food is already in the list
    const existingIndex = selectedFoods.findIndex(
      (item) => item.foodId === food.id
    );

    if (existingIndex >= 0) {
      // Update amount if already exists
      const updatedFoods = [...selectedFoods];
      updatedFoods[existingIndex].amount += parseInt(food.servingSize);
      setSelectedFoods(updatedFoods);
    } else {
      // Add new food
      setSelectedFoods([
        ...selectedFoods,
        { foodId: food.id, amount: parseInt(food.servingSize) },
      ]);
    }

    // Clear search
    setSearchQuery('');
    setShowSearch(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((item) => item.foodId !== foodId));

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const adjustAmount = (foodId: string, delta: number) => {
    const updatedFoods = selectedFoods.map((item) => {
      if (item.foodId === foodId) {
        return { ...item, amount: Math.max(1, item.amount + delta) };
      }
      return item;
    });

    setSelectedFoods(updatedFoods);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    if (!name.trim() || selectedFoods.length === 0) {
      // Show error or validation message
      return;
    }

    const now = new Date().toISOString();

    if (existingMeal) {
      // Update existing meal
      updateCustomMeal(existingMeal.id, {
        name,
        description,
        mealType,
        foods: selectedFoods,
        totalNutrition,
        updatedAt: now,
      });
    } else {
      // Create new meal
      const newMeal: CustomMeal = {
        id: generateId(),
        name,
        description,
        mealType,
        foods: selectedFoods,
        totalNutrition,
        createdAt: now,
        updatedAt: now,
      };

      addCustomMeal(newMeal);
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onComplete();
  };

  // Get food details by ID
  const getFoodById = (foodId: string): FoodItem | undefined => {
    return COMMON_FOODS.find((f) => f.id === foodId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {existingMeal ? 'Edit Custom Meal' : 'Create Custom Meal'}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onComplete}>
          <Icon name="x" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

              <ScrollView 
          style={styles.scrollView}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Meal Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter meal name"
            placeholderTextColor={colors.lightGray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter meal description"
            placeholderTextColor={colors.lightGray}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Meal Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mealTypeScroll}
          >
            <View style={styles.mealTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'breakfast' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('breakfast')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'breakfast' && styles.selectedMealTypeText,
                  ]}
                >
                  Breakfast
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'brunch' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('brunch')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'brunch' && styles.selectedMealTypeText,
                  ]}
                >
                  Brunch
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'lunch' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('lunch')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'lunch' && styles.selectedMealTypeText,
                  ]}
                >
                  Lunch
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'pre-workout' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('pre-workout')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'pre-workout' && styles.selectedMealTypeText,
                  ]}
                >
                  Pre-Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'post-workout' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('post-workout')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'post-workout' && styles.selectedMealTypeText,
                  ]}
                >
                  Post-Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'dinner' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('dinner')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'dinner' && styles.selectedMealTypeText,
                  ]}
                >
                  Dinner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealTypeButton,
                  mealType === 'snack' && styles.selectedMealType,
                ]}
                onPress={() => setMealType('snack')}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === 'snack' && styles.selectedMealTypeText,
                  ]}
                >
                  Snack
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.foodsHeader}>
            <Text style={styles.label}>Foods</Text>
            <TouchableOpacity
              style={styles.addFoodButton}
              onPress={() => setShowSearch(true)}
            >
              <Icon name="plus" size={16} color={colors.white} />
              <Text style={styles.addFoodButtonText}>Add Food</Text>
            </TouchableOpacity>
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Icon
                  name="search"
                  size={20}
                  color={colors.lightGray}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for a food..."
                  placeholderTextColor={colors.lightGray}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowSearch(false)}
                  style={styles.closeSearchButton}
                >
                  <Icon name="x" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={styles.searchResultItem}
                      onPress={() => handleAddFood(food)}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{food.name}</Text>
                        {food.brand && (
                          <Text style={styles.searchResultBrand}>
                            {food.brand}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.searchResultCalories}>
                        {food.nutritionPer100g.calories} cal
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {selectedFoods.length === 0 ? (
            <View style={styles.emptyFoods}>
              <Text style={styles.emptyFoodsText}>No foods added yet</Text>
            </View>
          ) : (
            <View style={styles.foodsList}>
              {selectedFoods.map(({ foodId, amount }) => {
                const food = getFoodById(foodId);
                if (!food) return null;

                const nutrition = calculateNutrition(food, amount);

                return (
                  <View key={foodId} style={styles.foodItem}>
                    <View style={styles.foodItemHeader}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <TouchableOpacity
                        style={styles.removeFoodButton}
                        onPress={() => handleRemoveFood(foodId)}
                      >
                        <Icon name="x" size={16} color={colors.lightGray} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.foodItemDetails}>
                      <View style={styles.amountContainer}>
                        <TouchableOpacity
                          style={styles.amountButton}
                          onPress={() => adjustAmount(foodId, -5)}
                        >
                          <Icon name="minus" size={14} color={colors.white} />
                        </TouchableOpacity>

                        <Text style={styles.amountText}>
                          {amount} {food.servingUnit}
                        </Text>

                        <TouchableOpacity
                          style={styles.amountButton}
                          onPress={() => adjustAmount(foodId, 5)}
                        >
                          <Icon name="plus" size={14} color={colors.white} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.foodCalories}>
                        {nutrition.calories} cal
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.nutritionSummary}>
          <Text style={styles.nutritionTitle}>Nutrition Summary</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {totalNutrition.calories}
              </Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {totalNutrition.protein}g
              </Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!name.trim() || selectedFoods.length === 0) && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={!name.trim() || selectedFoods.length === 0}
      >
        <Icon name="check" size={20} color={colors.white} />
        <Text style={styles.saveButtonText}>Save Custom Meal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mealTypeScroll: {
    marginBottom: 8,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedMealType: {
    backgroundColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  selectedMealTypeText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  addFoodButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.white,
    fontSize: 16,
  },
  closeSearchButton: {
    padding: 8,
  },
  searchResults: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchResultBrand: {
    fontSize: 12,
    color: colors.lightGray,
  },
  searchResultCalories: {
    fontSize: 14,
    color: colors.white,
  },
  emptyFoods: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptyFoodsText: {
    fontSize: 14,
    color: colors.lightGray,
  },
  foodsList: {
    gap: 8,
  },
  foodItem: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 12,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  removeFoodButton: {
    padding: 4,
  },
  foodItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    color: colors.lighterGray,
    marginHorizontal: 8,
    minWidth: 60,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  nutritionSummary: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
