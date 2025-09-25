import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { allowedFoodCategories, mealRecipeCategories } from '@/constants/allowed-foods';

export default function AllowedFoodsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'foods' | 'recipes'>('foods');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const renderFoodCategory = (category: typeof allowedFoodCategories[0]) => (
    <View key={category.id} style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => toggleCategory(category.id)}
        activeOpacity={1}
      >
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Text style={styles.foodCount}>({category.foods.length} items)</Text>
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
            <View key={index} style={styles.foodItem}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.details && (
                <Text style={styles.foodDetails}>{food.details}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecipeCategory = (category: typeof mealRecipeCategories[0]) => (
    <View key={category.id} style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => toggleCategory(category.id)}
        activeOpacity={1}
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
            <View key={recipe.id} style={styles.foodItem}>
              <Text style={styles.foodName}>{recipe.name}</Text>
              <Text style={styles.foodDetails}>{recipe.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={1}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dense Diet Food List</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'foods' && styles.activeTab]}
          onPress={() => setActiveTab('foods')}
          activeOpacity={1}
        >
          <Text style={[styles.tabText, activeTab === 'foods' && styles.activeTabText]}>
            Approved Foods
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
          activeOpacity={1}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            25 Meal Recipes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'foods' && (
          <View>
            <Text style={styles.sectionDescription}>
              Core foods approved for the Dense Diet program. These foods form the foundation of your nutrition plan.
            </Text>
            {allowedFoodCategories.map(renderFoodCategory)}
          </View>
        )}

        {activeTab === 'recipes' && (
          <View>
            <Text style={styles.sectionDescription}>
              25 meal recipes using approved Dense Diet foods with flavor variations for taste variety.
            </Text>
            {mealRecipeCategories.map(renderRecipeCategory)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.lightGray,
  },
  activeTabText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  categoryContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.white,
    marginRight: 8,
  },
  foodCount: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  foodsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  foodItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  foodName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  foodDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
    lineHeight: 18,
  },
});
