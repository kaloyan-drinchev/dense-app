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

import { styles } from "./styles";
import { useRecipeDetailLogic } from "./logic";

export default function SingleRecipeView() {
  const { router, recipe, mealType, handleAddToMeal, getDifficultyColor } =
    useRecipeDetailLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipe Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.recipeDescription}>{recipe.description}</Text>

            <View style={styles.recipeMetadata}>
              <View style={styles.metadataItem}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={styles.metadataText}>{recipe.cookTime}</Text>
              </View>
              <View style={styles.metadataItem}>
                <Icon
                  name="bar-chart"
                  size={16}
                  color={getDifficultyColor(recipe.difficulty)}
                />
                <Text
                  style={[
                    styles.metadataText,
                    { color: getDifficultyColor(recipe.difficulty) },
                  ]}
                >
                  {recipe.difficulty}
                </Text>
              </View>
            </View>

            {/* Nutrition Info */}
            <View style={styles.nutritionCard}>
              <Text style={styles.sectionTitle}>Nutrition per serving</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.calories}
                  </Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.protein}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.carbs}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {recipe.nutrition.fat}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Icon name="check-circle" size={16} color={colors.primary} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((instruction) => (
              <View key={instruction.step} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{instruction.step}</Text>
                </View>
                <Text style={styles.instructionText}>
                  {instruction.instruction}
                </Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          {recipe.tips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pro Tips</Text>
              {recipe.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Icon
                    name="zap"
                    size={16}
                    color={colors.warning || "#FF9800"}
                  />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bottom spacing for button */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Add to Meal Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToMeal}>
            <Icon name="plus" size={20} color={colors.black} />
            <Text style={styles.addButtonText}>
              Add to {mealType || "meal"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
