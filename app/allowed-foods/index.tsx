import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import {
  allowedFoodCategories as FoodCategoriesType,
  mealRecipeCategories as RecipeCategoriesType,
} from "@/constants/allowed-foods";

import { styles } from "./styles";
import { useAllowedFoodsLogic } from "./logic";

export default function AllowedFoodsScreen() {
  const {
    activeTab,
    setActiveTab,
    expandedCategory,
    toggleCategory,
    handleBack,
    handleAddFood,
    allowedFoodCategories,
    mealRecipeCategories,
  } = useAllowedFoodsLogic();

  const renderFoodCategory = (category: (typeof FoodCategoriesType)[0]) => (
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
          name={
            expandedCategory === category.id ? "chevron-up" : "chevron-down"
          }
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

  const renderRecipeCategory = (category: (typeof RecipeCategoriesType)[0]) => (
    <View key={category.id} style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => toggleCategory(category.id)}
        activeOpacity={1}
      >
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Text style={styles.foodCount}>
            ({category.recipes.length} recipes)
          </Text>
        </View>
        <Icon
          name={
            expandedCategory === category.id ? "chevron-up" : "chevron-down"
          }
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
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
          style={[styles.tab, activeTab === "foods" && styles.activeTab]}
          onPress={() => setActiveTab("foods")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "foods" && styles.activeTabText,
            ]}
          >
            Approved Foods
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "recipes" && styles.activeTab]}
          onPress={() => setActiveTab("recipes")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "recipes" && styles.activeTabText,
            ]}
          >
            25 Meal Recipes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerContent}>
          <Icon
            name="info"
            size={20}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <View style={styles.infoBannerTextContainer}>
            <Text style={styles.infoBannerTitle}>Read-Only Reference</Text>
            <Text style={styles.infoBannerText}>
              This is a reference list of approved foods and recipes.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addFoodButton}
          onPress={handleAddFood}
          activeOpacity={1}
        >
          <Icon name="plus" size={16} color={colors.black} />
          <Text style={styles.addFoodButtonText}>Add Food to Diary</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "foods" && (
          <View>
            <Text style={styles.sectionDescription}>
              Core foods approved for the Dense Diet program. These foods form
              the foundation of your nutrition plan.
            </Text>
            {allowedFoodCategories.map(renderFoodCategory)}
          </View>
        )}

        {activeTab === "recipes" && (
          <View>
            <Text style={styles.sectionDescription}>
              25 meal recipes using approved Dense Diet foods with flavor
              variations for taste variety.
            </Text>
            {mealRecipeCategories.map(renderRecipeCategory)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
