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

export const FoodSelectionModal: React.FC<FoodSelectionModalProps> = ({
  visible,
  onClose,
  onSelectFood,
}) => {
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
            👇 Select a {selectedMealType} recipe from the options below:
          </Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {currentMealRecipes.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
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
                          // Create a meal entry from the recipe
                          const mealFood: FoodItem = {
                            name: recipe.name,
                            details: recipe.description,
                            servingSize: '1 meal',
                            calories: 450, // Average meal calories
                            protein: 30,   // Average protein
                            carbs: 40,     // Average carbs  
                            fat: 15        // Average fat
                          };
                          handleFoodSelect(mealFood);
                        }}
                      >
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeName}>{recipe.name}</Text>
                          <Text style={styles.recipeDescription}>{recipe.description}</Text>
                        </View>
                        <View style={styles.recipeNutrition}>
                          <Text style={styles.caloriesBadge}>~450 cal</Text>
                          <Text style={styles.macroText}>Complete meal</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            
            {/* Option to browse individual foods */}
            <TouchableOpacity 
              style={styles.browseIndividualButton}
              onPress={() => {
                // Switch to individual foods view
                setExpandedCategory('proteins');
              }}
            >
              <Text style={styles.browseIndividualText}>
                Or browse individual foods by category
              </Text>
              <Icon name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* Individual Foods (collapsed by default) */}
            {expandedCategory && ['proteins', 'carbs', 'fats', 'vegetables', 'fruits', 'flavor-boosters'].includes(expandedCategory) && (
              <View style={styles.individualFoodsSection}>
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
              </View>
            )}
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
  browseIndividualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  browseIndividualText: {
    ...typography.body,
    color: colors.primary,
    marginRight: 8,
  },
  individualFoodsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
});
