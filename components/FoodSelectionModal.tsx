import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { allowedFoodCategories, mealRecipeCategories, FoodItem } from '@/constants/allowed-foods';
import { MealType } from '@/types/nutrition';

interface FoodSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, mealType: MealType) => void;
}

// Comprehensive nutrition database for all recipes
const recipeNutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  // Breakfast Options
  'egg-bell-pepper': { calories: 190, protein: 15, carbs: 8, fat: 12 },
  'egg-white-omelette': { calories: 160, protein: 24, carbs: 3, fat: 5 },
  'protein-yogurt-bowl': { calories: 240, protein: 22, carbs: 35, fat: 2 },
  'oats-banana-fuel': { calories: 260, protein: 8, carbs: 58, fat: 3 },
  'avocado-eggs-toast': { calories: 420, protein: 20, carbs: 25, fat: 28 },

  // Chicken Meals
  'classic-chicken-rice': { calories: 540, protein: 50, carbs: 48, fat: 8 },
  'soy-garlic-chicken': { calories: 520, protein: 48, carbs: 45, fat: 9 },
  'chicken-potato-salad': { calories: 480, protein: 46, carbs: 38, fat: 7 },
  'mediterranean-chicken': { calories: 420, protein: 45, carbs: 12, fat: 18 },
  'spicy-chicken-bowl': { calories: 520, protein: 48, carbs: 44, fat: 8 },
  'chicken-salad-bowl': { calories: 380, protein: 46, carbs: 8, fat: 15 },
  'chicken-popcorn-combo': { calories: 460, protein: 45, carbs: 22, fat: 6 },
  'buffalo-chicken-salad': { calories: 360, protein: 46, carbs: 10, fat: 14 },

  // Beef Meals
  'steak-potato-plate': { calories: 550, protein: 42, carbs: 35, fat: 20 },
  'beef-chili-bowl': { calories: 520, protein: 40, carbs: 44, fat: 16 },
  'asian-beef-stir-fry': { calories: 480, protein: 38, carbs: 42, fat: 14 },
  'steakhouse-beef-bowl': { calories: 500, protein: 40, carbs: 40, fat: 16 },
  'beef-avocado-salad': { calories: 450, protein: 38, carbs: 15, fat: 26 },
  'beef-pickle-plate': { calories: 520, protein: 42, carbs: 32, fat: 20 },
  'beef-burger-bowl': { calories: 380, protein: 40, carbs: 12, fat: 18 },
  'beef-broccoli-bowl': { calories: 480, protein: 38, carbs: 42, fat: 14 },

  // Egg-Based Meals
  'egg-steak-breakfast': { calories: 380, protein: 32, carbs: 4, fat: 24 },
  'scrambled-eggs-veggies': { calories: 250, protein: 20, carbs: 8, fat: 15 },
  'egg-white-wrap': { calories: 320, protein: 38, carbs: 8, fat: 12 },
  'egg-salad-mix': { calories: 230, protein: 20, carbs: 6, fat: 15 },
  'egg-white-protein-wrap': { calories: 300, protein: 36, carbs: 6, fat: 10 },

  // Snack Options
  'protein-shake-rice-cakes': { calories: 380, protein: 28, carbs: 42, fat: 12 },
  'yogurt-almonds-bowl': { calories: 320, protein: 22, carbs: 18, fat: 18 },
  'cottage-cheese-cucumber': { calories: 180, protein: 25, carbs: 8, fat: 4 },
  'banana-peanut-butter': { calories: 250, protein: 6, carbs: 30, fat: 12 },
  'peanut-butter-rice-cakes': { calories: 290, protein: 10, carbs: 32, fat: 14 },
  'bagel-protein-sandwich': { calories: 420, protein: 35, carbs: 45, fat: 8 },
  'rice-cakes-skyr': { calories: 220, protein: 18, carbs: 32, fat: 2 },

  // Sweet Options
  'blueberry-protein-cream': { calories: 200, protein: 20, carbs: 22, fat: 3 },
  'frozen-berry-yogurt': { calories: 180, protein: 18, carbs: 20, fat: 3 },
  'strawberry-skyr-mix': { calories: 160, protein: 16, carbs: 18, fat: 2 },
};

const getRecipeNutrition = (recipeId: string) => {
  return recipeNutritionDatabase[recipeId] || { calories: 400, protein: 25, carbs: 35, fat: 10 };
};

export const FoodSelectionModal: React.FC<FoodSelectionModalProps> = ({
  visible,
  onClose,
  onSelectFood,
}) => {
  const router = useRouter();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);


  const mealTypes: { id: MealType; label: string; icon: string }[] = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '🍽️' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snack', label: 'Snack', icon: '🥜' },
  ];

  const handleFoodSelect = (food: FoodItem) => {
    onSelectFood(food, selectedMealType);
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Map meal types to appropriate recipe categories
  const getMealRecipes = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return mealRecipeCategories.filter(cat => cat.id === 'breakfast');
      case 'lunch':
        return mealRecipeCategories.filter(cat => 
          ['chicken', 'beef', 'egg-based'].includes(cat.id)
        );
      case 'dinner':
        return mealRecipeCategories.filter(cat => 
          ['chicken', 'beef', 'egg-based'].includes(cat.id)
        );
      case 'snack':
        return mealRecipeCategories.filter(cat => 
          ['snacks', 'sweet-options'].includes(cat.id)
        );
      default:
        return [];
    }
  };

  const currentMealRecipes = getMealRecipes(selectedMealType);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Food</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={24} color={colors.lightGray} />
            </TouchableOpacity>
          </View>

          {/* Meal Type Selector */}
          <View style={styles.mealTypeContainer}>
            <Text style={styles.mealTypeLabel}>Add to meal:</Text>
            <View style={styles.mealTypeButtons}>
              {mealTypes.map((mealType) => (
                <TouchableOpacity
                  key={mealType.id}
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === mealType.id && styles.selectedMealType,
                  ]}
                  onPress={() => setSelectedMealType(mealType.id)}
                  activeOpacity={1}
                >
                  <Text style={styles.mealTypeIcon}>{mealType.icon}</Text>
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === mealType.id && styles.selectedMealTypeText,
                    ]}
                  >
                    {mealType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Recipes */}
          <Text style={styles.instructionText}>
            👇 Select a {selectedMealType} meal recipe:
          </Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {currentMealRecipes.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <Text style={styles.foodCount}>({category.recipes.length} recipes)</Text>
                  </View>
                  <Icon
                    name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.lightGray}
                  />
                </TouchableOpacity>

                {expandedCategory === category.id && (
                  <View style={styles.foodsList}>
                    {category.recipes.map((recipe) => (
                      <TouchableOpacity
                        key={recipe.id}
                        style={styles.recipeItem}
                        onPress={() => {
                          // Close the modal first
                          onClose();
                          // Then navigate to single recipe view
                          router.push({
                            pathname: '/single-recipe-view',
                            params: {
                              recipeId: recipe.id,
                              mealType: selectedMealType,
                              recipeName: recipe.name,
                              recipeDescription: recipe.description,
                            }
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeName}>{recipe.name}</Text>
                          <Text style={styles.recipeDescription}>{recipe.description}</Text>
                        </View>
                        <View style={styles.recipeNutrition}>
                          {(() => {
                            const nutrition = getRecipeNutrition(recipe.id);
                            return (
                              <>
                                <Text style={styles.caloriesBadge}>{nutrition.calories} cal</Text>
                                <View style={styles.macroInfo}>
                                  <Text style={styles.macroText}>P: {nutrition.protein}g</Text>
                                  <Text style={styles.macroText}>C: {nutrition.carbs}g</Text>
                                  <Text style={styles.macroText}>F: {nutrition.fat}g</Text>
                                </View>
                              </>
                            );
                          })()}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            
            {/* Individual Foods - COMMENTED OUT */}
            {/* <View style={styles.individualFoodsSection}>
              <Text style={styles.sectionTitle}>Individual Foods</Text>
              {allowedFoodCategories.map((category) => (
                <View key={category.id} style={styles.categoryContainer}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <View style={styles.categoryTitleContainer}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryTitle}>{category.name}</Text>
                      <Text style={styles.foodCount}>({category.foods.length} foods)</Text>
                    </View>
                    <Icon
                      name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.lightGray}
                    />
                  </TouchableOpacity>

                  {expandedCategory === category.id && (
                    <View style={styles.foodsList}>
                      {category.foods.map((food, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.foodItem}
                          onPress={() => handleFoodSelect(food)}
                        >
                          <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.foodServing}>{food.servingSize}</Text>
                            <Text style={styles.foodDetails}>{food.details}</Text>
                          </View>
                          <View style={styles.foodNutrition}>
                            <Text style={styles.caloriesBadge}>{food.calories} cal</Text>
                            <View style={styles.macroInfo}>
                              <Text style={styles.macroText}>P: {food.protein}g</Text>
                              <Text style={styles.macroText}>C: {food.carbs}g</Text>
                              <Text style={styles.macroText}>F: {food.fat}g</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View> */}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  closeButton: {
    padding: 8,
  },
  mealTypeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mealTypeLabel: {
    ...typography.body,
    color: colors.white,
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: colors.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMealType: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeText: {
    ...typography.bodySmall,
    color: colors.white,
    textAlign: 'center',
  },
  selectedMealTypeText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  instructionText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  foodCount: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.mediumGray,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.white,
  },
  foodsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 2,
  },
  foodServing: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 2,
  },
  foodDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  foodNutrition: {
    alignItems: 'flex-end',
  },
  caloriesBadge: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    ...typography.caption,
    color: colors.lightGray,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  recipeInfo: {
    flex: 1,
    marginRight: 12,
  },
  recipeName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  recipeDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
    lineHeight: 18,
  },
  recipeNutrition: {
    alignItems: 'flex-end',
  },

  individualFoodsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: colors.mediumGray,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
});
