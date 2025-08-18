import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors } from '@/constants/colors';
import { CustomMeal, MealType } from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutrition-store';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface CustomMealsListProps {
  onAddMeal: () => void;
  onEditMeal: (meal: CustomMeal) => void;
  onSelectMeal: (meal: CustomMeal) => void;
}

export const CustomMealsList: React.FC<CustomMealsListProps> = ({
  onAddMeal,
  onEditMeal,
  onSelectMeal,
}) => {
  const { customMeals, removeCustomMeal } = useNutritionStore();

  const handleDeleteMeal = (mealId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    removeCustomMeal(mealId);
  };

  const getMealTypeLabel = (mealType: MealType): string => {
    switch (mealType) {
      case 'breakfast':
        return 'Breakfast';
      case 'brunch':
        return 'Brunch';
      case 'lunch':
        return 'Lunch';
      case 'pre-workout':
        return 'Pre-Workout';
      case 'post-workout':
        return 'Post-Workout';
      case 'dinner':
        return 'Dinner';
      case 'snack':
        return 'Snack';
      default:
        return '';
    }
  };

  const renderMealItem = ({ item }: { item: CustomMeal }) => (
    <TouchableOpacity
      style={styles.mealItem}
      onPress={() => onSelectMeal(item)}
    >
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealType}>{getMealTypeLabel(item.mealType)}</Text>
        <Text style={styles.mealCalories}>
          {item.totalNutrition.calories} calories
        </Text>
        <Text style={styles.mealMacros}>
          P: {item.totalNutrition.protein}g • C: {item.totalNutrition.carbs}g •
          F: {item.totalNutrition.fat}g
        </Text>
      </View>

      <View style={styles.mealActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEditMeal(item)}
        >
          <Icon name="edit-2" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMeal(item.id)}
        >
          <Icon name="trash-2" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Meals</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddMeal}>
          <Icon name="plus" size={16} color={colors.black} />
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {customMeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No custom meals yet</Text>
          <Text style={styles.emptyText}>
            Create custom meals to quickly log your favorite food combinations.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={onAddMeal}>
            <Icon name="plus" size={20} color={colors.white} />
            <Text style={styles.createButtonText}>Create First Meal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customMeals}
          keyExtractor={(item) => item.id}
          renderItem={renderMealItem}
          contentContainerStyle={styles.mealsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  mealsList: {
    gap: 8,
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    padding: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  mealMacros: {
    fontSize: 12,
    color: colors.lightGray,
  },
  mealActions: {
    justifyContent: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mediumGray,
    borderWidth: 1,
    borderColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
