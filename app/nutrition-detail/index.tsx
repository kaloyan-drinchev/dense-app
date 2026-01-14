import React from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { NutritionSummary } from "@/components/NutritionSummary";
import { styles } from "./styles";
import { useNutritionDetailLogic } from "./logic";

export default function NutritionDetailScreen() {
  const {
    loading,
    mealSession,
    dailyLog,
    entriesByMeal,
    orderedMealTypes,
    handleBack,
    formatDate,
    formatSessionTime,
    formatTime,
    getMealIcon,
    getMealDisplayName,
    getGoalPercentage,
  } = useNutritionDetailLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Detail</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <>
              {/* Session Header */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>
                  {formatDate(dailyLog.date || "")}
                </Text>
                {mealSession?.timestamp && (
                  <Text style={styles.sessionTime}>
                    Logged at {formatSessionTime(mealSession.timestamp)}
                  </Text>
                )}
                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {dailyLog.entries.length}
                    </Text>
                    <Text style={styles.statLabel}>Foods</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {dailyLog.totalNutrition.calories}
                    </Text>
                    <Text style={styles.statLabel}>Calories</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getGoalPercentage()}%</Text>
                    <Text style={styles.statLabel}>of Goal</Text>
                  </View>
                </View>
              </View>

              {/* Nutrition Summary */}
              <NutritionSummary dailyLog={dailyLog} />

              {/* Meals by Type */}
              {Object.keys(entriesByMeal).length > 0 ? (
                <View style={styles.mealsContainer}>
                  <Text style={styles.mealsTitle}>Meals & Foods</Text>

                  {orderedMealTypes.map((mealType) => {
                    const entries = entriesByMeal[mealType];
                    if (!entries || entries.length === 0) return null;

                    const mealTotalCalories = entries.reduce(
                      (sum, entry) => sum + entry.nutrition.calories,
                      0
                    );
                    const mealTotalProtein = entries.reduce(
                      (sum, entry) => sum + entry.nutrition.protein,
                      0
                    );

                    return (
                      <View key={mealType} style={styles.mealContainer}>
                        <View style={styles.mealHeader}>
                          <View style={styles.mealTitleContainer}>
                            <Text style={styles.mealIcon}>
                              {getMealIcon(mealType)}
                            </Text>
                            <Text style={styles.mealTitle}>
                              {getMealDisplayName(mealType)}
                            </Text>
                          </View>
                          <View style={styles.mealSummary}>
                            <Text style={styles.mealCalories}>
                              {mealTotalCalories} cal
                            </Text>
                            <Text style={styles.mealProtein}>
                              {Math.round(mealTotalProtein)}g protein
                            </Text>
                          </View>
                        </View>

                        <View style={styles.foodsList}>
                          {entries.map((entry) => (
                            <View key={entry.id} style={styles.foodItem}>
                              <View style={styles.foodInfo}>
                                <Text style={styles.foodName}>
                                  {entry.name}
                                </Text>
                                <Text style={styles.foodAmount}>
                                  {entry.amount} {entry.unit}
                                </Text>
                                {entry.timestamp && (
                                  <Text style={styles.foodTime}>
                                    {formatTime(entry.timestamp)}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.foodNutrition}>
                                <Text style={styles.foodCalories}>
                                  {entry.nutrition.calories} cal
                                </Text>
                                <View style={styles.foodMacros}>
                                  <Text style={styles.macroText}>
                                    P: {entry.nutrition.protein}g
                                  </Text>
                                  <Text style={styles.macroText}>
                                    C: {entry.nutrition.carbs}g
                                  </Text>
                                  <Text style={styles.macroText}>
                                    F: {entry.nutrition.fat}g
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    No foods found in this session
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
