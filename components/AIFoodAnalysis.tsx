import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/constants/colors';
import { COMMON_FOODS } from '@/mocks/foods';
import { FoodItem, MealType } from '@/types/nutrition';
import { Feather as Icon } from '@expo/vector-icons';

interface AIFoodAnalysisProps {
  voiceInput: string;
  onAddFood: (food: FoodItem, amount: number, mealType: MealType) => void;
  onCancel: () => void;
}

export const AIFoodAnalysis: React.FC<AIFoodAnalysisProps> = ({
  voiceInput,
  onAddFood,
  onCancel,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [results, setResults] = useState<{
    foods: Array<{ food: FoodItem; amount: number }>;
    mealType: MealType;
    confidence: number;
  } | null>(null);

  // Simulate AI analysis
  React.useEffect(() => {
    const analyzeText = async () => {
      // Wait for a short time to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simple keyword matching to determine meal type
      let mealType: MealType = 'snack';
      if (voiceInput.toLowerCase().includes('breakfast')) {
        mealType = 'breakfast';
      } else if (voiceInput.toLowerCase().includes('lunch')) {
        mealType = 'lunch';
      } else if (voiceInput.toLowerCase().includes('dinner')) {
        mealType = 'dinner';
      }

      // Simple keyword matching to find foods
      const foundFoods: Array<{ food: FoodItem; amount: number }> = [];

      COMMON_FOODS.forEach((food) => {
        if (voiceInput.toLowerCase().includes(food.name.toLowerCase())) {
          // Determine amount (default to serving size)
          let amount = parseInt(food.servingSize);

          // Look for numbers before the food name
          const regex = new RegExp(`(\\d+)\\s+${food.name.toLowerCase()}`, 'i');
          const match = voiceInput.match(regex);
          if (match && match[1]) {
            amount = parseInt(match[1]);
          }

          foundFoods.push({ food, amount });
        }
      });

      // If no exact matches, try to find similar foods
      if (foundFoods.length === 0) {
        // For demo purposes, just add a random food
        const randomFood =
          COMMON_FOODS[Math.floor(Math.random() * COMMON_FOODS.length)];
        foundFoods.push({
          food: randomFood,
          amount: parseInt(randomFood.servingSize),
        });
      }

      setResults({
        foods: foundFoods,
        mealType,
        confidence: 0.85, // Simulated confidence score
      });

      setIsAnalyzing(false);
    };

    analyzeText();
  }, [voiceInput]);

  const handleAddFood = (food: FoodItem, amount: number) => {
    if (results) {
      onAddFood(food, amount, results.mealType);
    }
  };

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analyzing your food...</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
        <Text style={styles.inputText}>"{voiceInput}"</Text>
      </View>
    );
  }

  if (!results || results.foods.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No foods identified</Text>
        <Text style={styles.subtitle}>
          I couldn't identify any foods in your input.
        </Text>
        <Text style={styles.inputText}>"{voiceInput}"</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={1}>
          <Text style={styles.cancelButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Here's what I found</Text>
      <Text style={styles.subtitle}>
        I identified these foods in your {results.mealType}:
      </Text>

      <View style={styles.resultsContainer}>
        {results.foods.map((item, index) => (
          <View key={index} style={styles.foodItem}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.food.name}</Text>
              <Text style={styles.foodAmount}>
                {item.amount} {item.food.servingUnit}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddFood(item.food, item.amount)}
              activeOpacity={1}
            >
              <Icon name="check" size={16} color={colors.black} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={1}>
        <Icon name="x" size={16} color={colors.white} />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 24,
  },
  inputText: {
    fontSize: 16,
    color: colors.white,
    fontStyle: 'italic',
    backgroundColor: colors.mediumGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultsContainer: {
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
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
    marginBottom: 2,
  },
  foodAmount: {
    fontSize: 14,
    color: colors.lightGray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
