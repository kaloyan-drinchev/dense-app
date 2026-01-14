import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { mealTypes } from "./nutrition-data";

import { styles } from "./styles";
import { useAddFoodLogic } from "./logic";

export default function AddFoodPage() {
  const {
    selectedMealType,
    setSelectedMealType,
    expandedCategory,
    toggleCategory,
    handleBack,
    handleRecipePress,
    currentMealRecipes,
    getRecipeNutrition,
  } = useAddFoodLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Food</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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
                      selectedMealType === mealType.id &&
                        styles.selectedMealTypeText,
                    ]}
                  >
                    {mealType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Recipes */}
          <View style={styles.recipesContainer}>
            <Text style={styles.instructionText}>
              👇 Select a {selectedMealType} meal recipe:
            </Text>

            {currentMealRecipes.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <Text style={styles.foodCount}>
                      ({category.recipes.length} recipes)
                    </Text>
                  </View>
                  <Icon
                    name={
                      expandedCategory === category.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
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
                        onPress={() => handleRecipePress(recipe)}
                      >
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeName}>{recipe.name}</Text>
                          <Text style={styles.recipeDescription}>
                            {recipe.description}
                          </Text>
                        </View>
                        <View style={styles.recipeNutrition}>
                          {(() => {
                            const nutrition = getRecipeNutrition(recipe.id);
                            return (
                              <>
                                <Text style={styles.caloriesBadge}>
                                  {nutrition.calories} cal
                                </Text>
                                <View style={styles.macroInfo}>
                                  <Text style={styles.macroText}>
                                    P: {nutrition.protein}g
                                  </Text>
                                  <Text style={styles.macroText}>
                                    C: {nutrition.carbs}g
                                  </Text>
                                  <Text style={styles.macroText}>
                                    F: {nutrition.fat}g
                                  </Text>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
