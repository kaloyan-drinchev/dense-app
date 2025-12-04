import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors } from '@/constants/colors';
import { FoodEntry, MealType } from '@/types/nutrition';
import { Feather as Icon } from '@expo/vector-icons';

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onRemoveEntry: (entryId: string) => void;
}

const getMealTitle = (mealType: MealType): string => {
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
      return 'Snacks';
    default:
      return '';
  }
};

const getMealIcon = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast':
      return '🍳';
    case 'brunch':
      return '🥐';
    case 'lunch':
      return '🥗';
    case 'pre-workout':
      return '🏋️';
    case 'post-workout':
      return '🥤';
    case 'dinner':
      return '🍽️';
    case 'snack':
      return '🍎';
    default:
      return '';
  }
};

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  entries,
  onRemoveEntry,
}) => {
  if (entries.length === 0) return null;

  // Calculate total calories for this meal
  const totalCalories = entries.reduce(
    (sum, entry) => sum + entry.nutrition.calories,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>{getMealIcon(mealType)}</Text>
          <Text style={styles.title}>{getMealTitle(mealType)}</Text>
        </View>
        <Text style={styles.calories}>{totalCalories} cal</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.foodItem}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodAmount}>
                {item.amount} {item.unit}
              </Text>
            </View>
            <View style={styles.foodNutrition}>
              <Text style={styles.foodCalories}>
                {item.nutrition.calories} cal
              </Text>
              <Text style={styles.foodMacros}>
                P: {item.nutrition.protein}g • C: {item.nutrition.carbs}g • F:{' '}
                {item.nutrition.fat}g
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onRemoveEntry(item.id)}
            >
              <Icon name="trash-2" size={16} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
        )}
      />
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  calories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  foodImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  foodAmount: {
    fontSize: 14,
    color: colors.lightGray,
  },
  foodNutrition: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  foodMacros: {
    fontSize: 12,
    color: colors.lightGray,
  },
  deleteButton: {
    padding: 8,
  },
});
