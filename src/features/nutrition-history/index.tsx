import React from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { NutritionProgressCircle } from "@/components/NutritionProgressCircle";
import { styles } from "./styles";
import { useNutritionHistoryLogic } from "./logic";

export default function NutritionHistoryScreen() {
  const {
    entries,
    loading,
    handleBack,
    handleEntryPress,
    formatDate,
    formatTime,
    getCaloriePercentage,
  } = useNutritionHistoryLogic();

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
          <Text style={styles.headerTitle}>Nutrition History</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No nutrition data logged yet</Text>
              <Text style={styles.emptySubtext}>
                Start logging your meals to see your nutrition history!
              </Text>
            </View>
          ) : (
            entries.map((entry) => {
              const caloriePercentage = getCaloriePercentage(
                entry.totalCalories,
                entry.calorieGoal
              );
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => handleEntryPress(entry.id)}
                >
                  <View style={styles.entryLeft}>
                    <View style={styles.entryHeader}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={styles.entryDate}>
                          {formatDate(entry.date)}
                        </Text>
                        <Text style={styles.entryTime}>
                          {formatTime(entry.timestamp)}
                        </Text>
                      </View>
                      <View style={styles.entryCountBadge}>
                        <Text style={styles.entryCountText}>
                          {entry.entryCount} items
                        </Text>
                      </View>
                    </View>

                    <View style={styles.nutritionSummary}>
                      <View style={styles.calorieRow}>
                        <Text style={styles.calorieText}>
                          {entry.totalCalories} / {entry.calorieGoal} cal
                        </Text>
                      </View>

                      <View style={styles.macroRow}>
                        <View style={styles.macroItems}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>P</Text>
                            <Text style={styles.macroValue}>
                              {entry.totalProtein}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>C</Text>
                            <Text style={styles.macroValue}>
                              {entry.totalCarbs}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>F</Text>
                            <Text style={styles.macroValue}>
                              {entry.totalFat}g
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.entryCenter}>
                    <NutritionProgressCircle percentage={caloriePercentage} />
                  </View>

                  <View style={styles.entryRight}>
                    <Icon name="arrow-right" size={18} color={colors.black} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
