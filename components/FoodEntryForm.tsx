import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '@/constants/colors';
import { FoodItem, MealType } from '@/types/nutrition';
import { calculateNutrition, createFoodEntry } from '@/mocks/foods';
import { useNutritionStore } from '@/store/nutrition-store';
import Icon from 'react-native-vector-icons/Feather';
import * as Haptics from 'expo-haptics';

interface FoodEntryFormProps {
  food: FoodItem;
  onComplete: () => void;
}

export const FoodEntryForm: React.FC<FoodEntryFormProps> = ({
  food,
  onComplete,
}) => {
  const [amount, setAmount] = useState(parseInt(food.servingSize));
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const { addFoodEntry } = useNutritionStore();

  const nutrition = calculateNutrition(food, amount);

  const handleAmountChange = (text: string) => {
    const value = parseInt(text);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  const adjustAmount = (delta: number) => {
    const newAmount = Math.max(1, amount + delta);
    setAmount(newAmount);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddFood = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Create food entry
    const entry = createFoodEntry(food, amount, mealType);

    // Add to store
    addFoodEntry(today, entry);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Close form
    onComplete();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Add {food.name}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.label}>Amount ({food.servingUnit})</Text>
          <View style={styles.amountInputContainer}>
            <TouchableOpacity
              style={styles.amountButton}
              onPress={() => adjustAmount(-5)}
            >
              <Icon name="minus" size={16} color={colors.white} />
            </TouchableOpacity>

            <TextInput
              style={styles.amountInput}
              value={amount.toString()}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.amountButton}
              onPress={() => adjustAmount(5)}
            >
              <Icon name="plus" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mealTypeContainer}>
          <Text style={styles.label}>Meal</Text>
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
        </View>

        <View style={styles.nutritionContainer}>
          <Text style={styles.label}>Nutrition</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
        <Icon name="check" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add to Log</Text>
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
  scrollView: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  amountContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mealTypeContainer: {
    marginBottom: 16,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedMealType: {
    backgroundColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  selectedMealTypeText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  nutritionContainer: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 12,
    minWidth: '22%',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
