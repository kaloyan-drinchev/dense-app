import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { useNutritionStore } from "@/store/nutrition-store";
import { NutritionSummary } from "@/components/NutritionSummary";
import { MealSection } from "@/components/MealSection";
import { Feather as Icon } from "@expo/vector-icons";
import { MealType, FoodEntry } from "@/types/nutrition";

export default function NutritionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { loggedMealSessions, nutritionGoals } = useNutritionStore();
  const [loading, setLoading] = useState(true);

  const mealSession = loggedMealSessions.find(
    (session) => session.id === sessionId
  );

  const dailyLog = mealSession || {
    date: "",
    entries: [],
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    calorieGoal: nutritionGoals.calories,
  };

  // Group entries by meal type
  type EntriesByMealType = Partial<Record<MealType, FoodEntry[]>>;
  const entriesByMeal: EntriesByMealType = (
    dailyLog.entries || []
  ).reduce<EntriesByMealType>((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = [];
    }
    acc[entry.mealType]!.push(entry);
    return acc;
  }, {});

  useEffect(() => {
    setLoading(false);
  }, [sessionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today's Meals";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday's Meals";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const formatSessionTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast":
        return "🌅";
      case "brunch":
        return "🥐";
      case "lunch":
        return "🍽️";
      case "pre-workout":
        return "⚡";
      case "post-workout":
        return "💪";
      case "dinner":
        return "🌙";
      case "snack":
        return "🥜";
      default:
        return "🍴";
    }
  };

  const getMealDisplayName = (mealType: MealType) => {
    switch (mealType) {
      case "pre-workout":
        return "Pre-Workout";
      case "post-workout":
        return "Post-Workout";
      default:
        return mealType.charAt(0).toUpperCase() + mealType.slice(1);
    }
  };

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
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
                    <Text style={styles.statValue}>
                      {Math.round(
                        (dailyLog.totalNutrition.calories /
                          dailyLog.calorieGoal) *
                          100
                      )}
                      %
                    </Text>
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

                  {(
                    [
                      "breakfast",
                      "brunch",
                      "lunch",
                      "pre-workout",
                      "post-workout",
                      "dinner",
                      "snack",
                    ] as MealType[]
                  ).map((mealType) => {
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
                          {entries.map((entry, index) => (
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: { marginRight: 16, padding: 8 },
  headerTitle: { ...typography.h4, color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  centerBox: {
    padding: 24,
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: { ...typography.body, color: colors.white },

  dateHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  dateTitle: {
    ...typography.h3,
    color: colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  sessionTime: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: "center",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.mediumGray,
  },

  mealsContainer: {
    padding: 16,
  },
  mealsTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  mealContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.mediumGray,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTitle: {
    ...typography.h4,
    color: colors.white,
  },
  mealSummary: {
    alignItems: "flex-end",
  },
  mealCalories: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "bold",
  },
  mealProtein: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  foodsList: {
    padding: 16,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
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
  foodAmount: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 2,
  },
  foodTime: {
    ...typography.caption,
    color: colors.lightGray,
  },
  foodNutrition: {
    alignItems: "flex-end",
  },
  foodCalories: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 4,
  },
  foodMacros: {
    flexDirection: "row",
    gap: 6,
  },
  macroText: {
    ...typography.caption,
    color: colors.lightGray,
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
  },
  noDataText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: "center",
  },
});
