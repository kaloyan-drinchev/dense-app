import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { MealType } from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutrition-store';
import * as Haptics from 'expo-haptics';

interface RecipeInstruction {
  step: number;
  instruction: string;
}

interface RecipeDetails {
  id: string;
  name: string;
  description: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: RecipeInstruction[];
  tips: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Comprehensive recipe instructions database
const recipeInstructionsDatabase: Record<string, RecipeDetails> = {
  'classic-chicken-rice': {
    id: 'classic-chicken-rice',
    name: 'Classic Chicken & Rice',
    description: '200g grilled chicken breast + 100g rice + steamed broccoli',
    cookTime: '25 mins',
    difficulty: 'Easy',
    ingredients: [
      '200g chicken breast',
      '100g white rice (dry weight)',
      '200g fresh broccoli',
      'Salt and pepper to taste',
      'Olive oil spray',
    ],
    instructions: [
      { step: 1, instruction: 'Season chicken breast with salt and pepper on both sides.' },
      { step: 2, instruction: 'Heat a non-stick pan over medium heat. Spray with olive oil.' },
      { step: 3, instruction: 'Cook chicken breast for 6-7 minutes per side until golden and cooked through (internal temp 165°F).' },
      { step: 4, instruction: 'Meanwhile, rinse rice and cook in 200ml boiling water for 15-18 minutes until tender.' },
      { step: 5, instruction: 'Steam broccoli for 4-5 minutes until bright green and tender.' },
      { step: 6, instruction: 'Let chicken rest for 2 minutes, then slice. Serve with rice and broccoli.' },
    ],
    tips: [
      'Pound chicken breast to even thickness for uniform cooking',
      'Use a meat thermometer to ensure chicken reaches 165°F',
      'Don\'t overcook broccoli - it should be vibrant green',
    ],
    nutrition: { calories: 540, protein: 50, carbs: 48, fat: 8 },
  },
  
  'egg-bell-pepper': {
    id: 'egg-bell-pepper',
    name: 'Egg & Bell Pepper Plate',
    description: '2 fried eggs (low heat, no oil) + 1 whole bell pepper',
    cookTime: '12 mins',
    difficulty: 'Easy',
    ingredients: [
      '2 large eggs',
      '1 medium bell pepper (any color)',
      'Salt and pepper to taste',
      'Non-stick cooking spray',
    ],
    instructions: [
      { step: 1, instruction: 'Wash and slice bell pepper into strips or rings.' },
      { step: 2, instruction: 'Heat a non-stick pan over low-medium heat.' },
      { step: 3, instruction: 'Spray pan lightly with cooking spray.' },
      { step: 4, instruction: 'Cook bell pepper slices for 4-5 minutes until slightly softened.' },
      { step: 5, instruction: 'Push peppers to one side of pan.' },
      { step: 6, instruction: 'Crack eggs into the empty side of pan. Cook on low heat for 3-4 minutes until whites are set.' },
      { step: 7, instruction: 'Season with salt and pepper. Serve immediately.' },
    ],
    tips: [
      'Keep heat low to prevent eggs from burning',
      'Red bell peppers are sweetest when cooked',
      'Cover pan briefly to help egg whites cook faster',
    ],
    nutrition: { calories: 190, protein: 15, carbs: 8, fat: 12 },
  },

  'protein-yogurt-bowl': {
    id: 'protein-yogurt-bowl',
    name: 'Protein Yogurt Bowl',
    description: '200g low-fat yogurt, banana slices, cinnamon',
    cookTime: '3 mins',
    difficulty: 'Easy',
    ingredients: [
      '200g Greek yogurt (low-fat)',
      '1 medium banana',
      '1 tsp cinnamon powder',
      'Optional: 1 tsp honey',
    ],
    instructions: [
      { step: 1, instruction: 'Place Greek yogurt in a serving bowl.' },
      { step: 2, instruction: 'Peel and slice banana into rounds.' },
      { step: 3, instruction: 'Arrange banana slices on top of yogurt.' },
      { step: 4, instruction: 'Sprinkle cinnamon evenly over the bowl.' },
      { step: 5, instruction: 'Add a drizzle of honey if desired for extra sweetness.' },
      { step: 6, instruction: 'Mix gently and enjoy immediately.' },
    ],
    tips: [
      'Use Greek yogurt for higher protein content',
      'Choose ripe but firm bananas for best texture',
      'Add nuts or seeds for extra crunch and nutrients',
    ],
    nutrition: { calories: 240, protein: 22, carbs: 35, fat: 2 },
  },

  'soy-garlic-chicken': {
    id: 'soy-garlic-chicken',
    name: 'Soy Garlic Chicken',
    description: 'Chicken breast stir-fried in soy sauce, garlic, ginger + zucchini + rice',
    cookTime: '20 mins',
    difficulty: 'Medium',
    ingredients: [
      '200g chicken breast, diced',
      '100g white rice (dry weight)',
      '1 medium zucchini, sliced',
      '3 cloves garlic, minced',
      '1 tsp fresh ginger, grated',
      '2 tbsp low-sodium soy sauce',
      'Cooking spray',
    ],
    instructions: [
      { step: 1, instruction: 'Cook rice in boiling water according to package directions.' },
      { step: 2, instruction: 'Cut chicken breast into bite-sized cubes.' },
      { step: 3, instruction: 'Slice zucchini into rounds, mince garlic, and grate ginger.' },
      { step: 4, instruction: 'Heat a non-stick pan over medium-high heat with cooking spray.' },
      { step: 5, instruction: 'Cook diced chicken for 5-6 minutes until golden and cooked through.' },
      { step: 6, instruction: 'Add garlic and ginger, stir-fry for 30 seconds until fragrant.' },
      { step: 7, instruction: 'Add zucchini and soy sauce, stir-fry for 3-4 minutes until zucchini is tender.' },
      { step: 8, instruction: 'Serve over cooked rice immediately.' },
    ],
    tips: [
      'Don\'t overcrowd the pan when cooking chicken',
      'Fresh ginger has more flavor than powder',
      'Zucchini should be tender but still have some bite',
    ],
    nutrition: { calories: 520, protein: 48, carbs: 45, fat: 9 },
  },

  'steak-potato-plate': {
    id: 'steak-potato-plate',
    name: 'Steak & Potato Plate',
    description: 'Lean beef steak (150g) + baked potatoes + side salad (tomato, cucumber)',
    cookTime: '30 mins',
    difficulty: 'Medium',
    ingredients: [
      '150g lean beef steak',
      '200g potatoes',
      '1 medium tomato, diced',
      '1 cucumber, sliced',
      'Salt and pepper to taste',
      'Cooking spray',
    ],
    instructions: [
      { step: 1, instruction: 'Preheat oven to 425°F (220°C). Wash and pierce potatoes with a fork.' },
      { step: 2, instruction: 'Bake potatoes for 25-30 minutes until tender when pierced.' },
      { step: 3, instruction: 'Meanwhile, season steak with salt and pepper on both sides.' },
      { step: 4, instruction: 'Heat a non-stick pan over medium-high heat with cooking spray.' },
      { step: 5, instruction: 'Cook steak for 3-4 minutes per side for medium doneness.' },
      { step: 6, instruction: 'Let steak rest for 5 minutes, then slice against the grain.' },
      { step: 7, instruction: 'Prepare salad by dicing tomato and slicing cucumber.' },
      { step: 8, instruction: 'Serve sliced steak with baked potato and fresh salad.' },
    ],
    tips: [
      'Let steak come to room temperature before cooking',
      'Use a meat thermometer: 135°F for medium-rare, 145°F for medium',
      'Always slice steak against the grain for tenderness',
    ],
    nutrition: { calories: 550, protein: 42, carbs: 35, fat: 20 },
  },

  'scrambled-eggs-veggies': {
    id: 'scrambled-eggs-veggies',
    name: 'Scrambled Eggs with Veggies',
    description: '3 eggs scrambled with tomato + spinach + chili flakes',
    cookTime: '8 mins',
    difficulty: 'Easy',
    ingredients: [
      '3 large eggs',
      '1 medium tomato, diced',
      '2 handfuls fresh spinach',
      '1/4 tsp chili flakes',
      'Salt and pepper to taste',
      'Cooking spray',
    ],
    instructions: [
      { step: 1, instruction: 'Crack eggs into a bowl and whisk until well combined.' },
      { step: 2, instruction: 'Dice tomato and wash spinach leaves.' },
      { step: 3, instruction: 'Heat a non-stick pan over medium-low heat with cooking spray.' },
      { step: 4, instruction: 'Add diced tomato and cook for 2 minutes until softened.' },
      { step: 5, instruction: 'Add spinach and cook until wilted, about 1 minute.' },
      { step: 6, instruction: 'Pour in beaten eggs and gently scramble with a spatula.' },
      { step: 7, instruction: 'Season with salt, pepper, and chili flakes.' },
      { step: 8, instruction: 'Remove from heat when eggs are creamy and just set.' },
    ],
    tips: [
      'Keep heat low to prevent eggs from becoming rubbery',
      'Stir gently and frequently for creamy scrambled eggs',
      'Remove from heat while slightly underdone - they\'ll finish cooking',
    ],
    nutrition: { calories: 250, protein: 20, carbs: 8, fat: 15 },
  },

  'oats-banana-fuel': {
    id: 'oats-banana-fuel',
    name: 'Oats & Banana Fuel',
    description: '50g oats cooked in water, 1 sliced banana, sprinkle cinnamon',
    cookTime: '8 mins',
    difficulty: 'Easy',
    ingredients: [
      '50g rolled oats',
      '1 medium banana',
      '1 tsp cinnamon powder',
      '250ml water',
      'Pinch of salt',
      'Optional: 1 tsp honey',
    ],
    instructions: [
      { step: 1, instruction: 'Bring 250ml water to a boil in a small saucepan.' },
      { step: 2, instruction: 'Add a pinch of salt and the rolled oats.' },
      { step: 3, instruction: 'Reduce heat to medium-low and simmer for 5-7 minutes, stirring occasionally.' },
      { step: 4, instruction: 'Meanwhile, peel and slice banana into rounds.' },
      { step: 5, instruction: 'When oats are creamy and cooked, remove from heat.' },
      { step: 6, instruction: 'Transfer oats to a bowl and top with sliced banana.' },
      { step: 7, instruction: 'Sprinkle generously with cinnamon powder.' },
      { step: 8, instruction: 'Add honey if desired for extra sweetness.' },
    ],
    tips: [
      'Stir oats regularly to prevent sticking and ensure even cooking',
      'Add more water if oats become too thick',
      'Use old-fashioned oats for better texture than instant',
    ],
    nutrition: { calories: 260, protein: 8, carbs: 58, fat: 3 },
  },

  'beef-burger-bowl': {
    id: 'beef-burger-bowl',
    name: 'Beef Burger Bowl',
    description: 'Beef mince (5%) + iceberg lettuce base + tomato + mustard + pickles (deconstructed burger)',
    cookTime: '12 mins',
    difficulty: 'Easy',
    ingredients: [
      '150g lean beef mince (5% fat)',
      '2 cups iceberg lettuce, chopped',
      '1 medium tomato, diced',
      '2 tbsp mustard',
      '50g pickles, sliced',
      'Salt and pepper to taste',
      'Cooking spray',
    ],
    instructions: [
      { step: 1, instruction: 'Heat a non-stick pan over medium-high heat with cooking spray.' },
      { step: 2, instruction: 'Add beef mince and cook for 6-8 minutes, breaking it up with a spoon.' },
      { step: 3, instruction: 'Season with salt and pepper while cooking.' },
      { step: 4, instruction: 'Meanwhile, wash and chop iceberg lettuce into bite-sized pieces.' },
      { step: 5, instruction: 'Dice tomato and slice pickles if not pre-sliced.' },
      { step: 6, instruction: 'When beef is fully cooked and browned, remove from heat.' },
      { step: 7, instruction: 'Place lettuce in a bowl as the base.' },
      { step: 8, instruction: 'Top with cooked beef, diced tomato, pickles, and mustard.' },
    ],
    tips: [
      'Choose the leanest beef mince available (5% fat or less)',
      'Don\'t overcook the beef to keep it juicy',
      'Chill lettuce beforehand for extra crispness',
    ],
    nutrition: { calories: 380, protein: 40, carbs: 12, fat: 18 },
  },

  'cottage-cheese-cucumber': {
    id: 'cottage-cheese-cucumber',
    name: 'Cottage Cheese & Cucumber Bowl',
    description: 'Cottage cheese + cucumber + dill',
    cookTime: '5 mins',
    difficulty: 'Easy',
    ingredients: [
      '200g low-fat cottage cheese',
      '1 medium cucumber',
      '2 tbsp fresh dill, chopped',
      'Salt and pepper to taste',
      'Optional: lemon juice',
    ],
    instructions: [
      { step: 1, instruction: 'Wash cucumber and dice into small cubes.' },
      { step: 2, instruction: 'Finely chop fresh dill.' },
      { step: 3, instruction: 'Place cottage cheese in a serving bowl.' },
      { step: 4, instruction: 'Add diced cucumber and chopped dill.' },
      { step: 5, instruction: 'Season with salt and pepper to taste.' },
      { step: 6, instruction: 'Add a squeeze of lemon juice if desired for brightness.' },
      { step: 7, instruction: 'Mix gently and serve immediately.' },
    ],
    tips: [
      'Use full-fat cottage cheese for richer flavor if macros allow',
      'Fresh dill is much better than dried for this recipe',
      'Serve chilled for best taste and texture',
    ],
    nutrition: { calories: 180, protein: 25, carbs: 8, fat: 4 },
  },
};

// Function to get recipe details with fallback
const getRecipeDetails = (recipeId: string): RecipeDetails => {
  return recipeInstructionsDatabase[recipeId] || {
    id: recipeId,
    name: 'Recipe',
    description: 'Delicious and nutritious meal',
    cookTime: '15 mins',
    difficulty: 'Easy' as const,
    ingredients: ['Ingredients coming soon...'],
    instructions: [
      { step: 1, instruction: 'Detailed cooking instructions will be available soon!' }
    ],
    tips: ['Check back for cooking tips!'],
    nutrition: { calories: 400, protein: 25, carbs: 35, fat: 10 },
  };
};

export default function SingleRecipeView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addFoodEntry } = useNutritionStore();
  
  const recipeId = params.recipeId as string;
  const mealType = params.mealType as MealType;
  
  const recipe = getRecipeDetails(recipeId);

  const handleAddToMeal = async () => {
    try {
      // Create nutrition entry
      const nutritionEntry = {
        id: `entry_${Date.now()}`,
        foodId: `recipe_${recipe.id}`,
        name: recipe.name,
        amount: 1, // 1 serving
        unit: '1 meal',
        mealType: mealType,
        timestamp: new Date().toISOString(),
        nutrition: {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fat: recipe.nutrition.fat,
          fiber: 0,
          sugar: 0,
        },
      };

      // Get today's date
      const selectedDate = new Date().toISOString().split('T')[0];

      // Add to daily log
      await addFoodEntry(selectedDate, nutritionEntry);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show success message
      Alert.alert(
        '✅ Meal Added!',
        `${recipe.name} has been added to your ${mealType} log.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to nutrition tab
              router.push('/(tabs)/nutrition');
            },
          },
        ]
      );

    } catch (error) {
      console.error('Failed to add meal:', error);
      Alert.alert('Error', 'Failed to add meal to your log.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success || '#4CAF50';
      case 'Medium': return colors.warning || '#FF9800';
      case 'Hard': return colors.error || '#F44336';
      default: return colors.primary;
    }
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <Icon name="bar-chart" size={16} color={getDifficultyColor(recipe.difficulty)} />
              <Text style={[styles.metadataText, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          {/* Nutrition Info */}
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition per serving</Text>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
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
              <Text style={styles.instructionText}>{instruction.instruction}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        {recipe.tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            {recipe.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Icon name="zap" size={16} color={colors.warning || '#FF9800'} />
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
          <Text style={styles.addButtonText}>Add to {mealType || 'meal'}</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.darkGray,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  recipeName: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 8,
  },
  recipeDescription: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 16,
    lineHeight: 22,
  },
  recipeMetadata: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  nutritionCard: {
    backgroundColor: colors.mediumGray,
    padding: 16,
    borderRadius: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  ingredientText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  instructionText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    lineHeight: 22,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  tipText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    ...typography.h4,
    color: colors.black,
    fontWeight: 'bold',
  },
});
