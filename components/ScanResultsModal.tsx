import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import { FoodItem, MealType } from '@/types/nutrition';
import Icon from 'react-native-vector-icons/Feather';
import * as Haptics from 'expo-haptics';

interface ScanResultsModalProps {
  visible: boolean;
  onClose: () => void;
  scanResults: Array<{ food: FoodItem; amount: number }>;
  mealType: MealType;
  onAddFood: (food: FoodItem, amount: number, mealType: MealType) => void;
}

export const ScanResultsModal: React.FC<ScanResultsModalProps> = ({
  visible,
  onClose,
  scanResults,
  mealType,
  onAddFood,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>(mealType);
  const [amounts, setAmounts] = useState<Record<string, number>>(
    scanResults.reduce((acc, item) => {
      acc[item.food.id] = item.amount;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleAddAll = () => {
    scanResults.forEach((item) => {
      onAddFood(item.food, amounts[item.food.id], selectedMealType);
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onClose();
  };

  const handleAddSingle = (food: FoodItem) => {
    onAddFood(food, amounts[food.id], selectedMealType);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Create a new array without the added food
    const updatedResults = scanResults.filter(
      (item) => item.food.id !== food.id
    );

    if (updatedResults.length === 0) {
      onClose();
    }
  };

  const adjustAmount = (foodId: string, delta: number) => {
    setAmounts((prev) => ({
      ...prev,
      [foodId]: Math.max(1, prev[foodId] + delta),
    }));

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const totalCalories = scanResults.reduce((total, item) => {
    const amount = amounts[item.food.id];
    return (
      total + Math.round(item.food.nutritionPer100g.calories * (amount / 100))
    );
  }, 0);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Results</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            We identified these foods in your photo:
          </Text>

          <View style={styles.mealTypeContainer}>
            <Text style={styles.mealTypeLabel}>Meal:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mealTypeScroll}
            >
              <View style={styles.mealTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'breakfast' && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('breakfast')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'breakfast' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Breakfast
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'brunch' && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('brunch')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'brunch' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Brunch
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'lunch' && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('lunch')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'lunch' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Lunch
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'pre-workout' &&
                      styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('pre-workout')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'pre-workout' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Pre-Workout
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'post-workout' &&
                      styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('post-workout')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'post-workout' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Post-Workout
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'dinner' && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('dinner')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'dinner' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Dinner
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === 'snack' && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType('snack')}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === 'snack' &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    Snack
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          <ScrollView style={styles.scrollView}>
            {scanResults.map((item, index) => (
              <View key={index} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.food.name}</Text>
                  <View style={styles.amountContainer}>
                    <TouchableOpacity
                      style={styles.amountButton}
                      onPress={() => adjustAmount(item.food.id, -5)}
                    >
                      <Text style={styles.amountButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.amountText}>
                      {amounts[item.food.id]} {item.food.servingUnit}
                    </Text>

                    <TouchableOpacity
                      style={styles.amountButton}
                      onPress={() => adjustAmount(item.food.id, 5)}
                    >
                      <Text style={styles.amountButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.foodCalories}>
                  <Text style={styles.caloriesText}>
                    {Math.round(
                      item.food.nutritionPer100g.calories *
                        (amounts[item.food.id] / 100)
                    )}{' '}
                    cal
                  </Text>
                  <TouchableOpacity
                    style={styles.addSingleButton}
                    onPress={() => handleAddSingle(item.food)}
                  >
                    <Icon name="check" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalCalories}>
              <Text style={styles.totalCaloriesLabel}>Total Calories:</Text>
              <Text style={styles.totalCaloriesValue}>{totalCalories}</Text>
            </View>

            <TouchableOpacity
              style={styles.addAllButton}
              onPress={handleAddAll}
            >
              <Icon name="check" size={20} color={colors.white} />
              <Text style={styles.addAllButtonText}>Add All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Note: Calorie estimates are approximate. For packaged foods, check
              the nutrition label for more accurate information.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.dark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
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
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 16,
  },
  mealTypeContainer: {
    marginBottom: 16,
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
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
    color: colors.white,
    fontWeight: 'bold',
  },
  scrollView: {
    maxHeight: 300,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  amountText: {
    fontSize: 14,
    color: colors.lighterGray,
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  addSingleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  totalCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCaloriesLabel: {
    fontSize: 16,
    color: colors.white,
    marginRight: 8,
  },
  totalCaloriesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  addAllButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  disclaimer: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
  },
});
