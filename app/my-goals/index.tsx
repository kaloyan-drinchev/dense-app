import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import {
  motivationOptions,
  trainingExperienceOptions,
  musclePriorityOptions,
} from "@/constants/wizard.constants";

import { styles } from "./styles";
import { useMyGoalsLogic } from "./logic";

export default function MyGoalsScreen() {
  const {
    isLoading,
    wizardData,
    tdeeData,
    motivations,
    musclePriorities,
    handleBack,
  } = useMyGoalsLogic();

  if (isLoading) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your goals...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!wizardData) {
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
            <Text style={styles.headerTitle}>My Goals</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.noDataText}>
              No goals data found. Complete the setup wizard first.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Goals</Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Motivation Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>✨</Text>
                <Text style={styles.cardTitle}>What Brings You to DENSE</Text>
              </View>
              <View style={styles.motivationTags}>
                {motivations.map((motivationId: string) => {
                  const motivation = motivationOptions.find(
                    (o) => o.id === motivationId
                  );
                  return motivation ? (
                    <View key={motivationId} style={styles.motivationTag}>
                      <Text style={styles.motivationTagEmoji}>
                        {motivation.emoji}
                      </Text>
                      <Text style={styles.motivationTagText}>
                        {motivation.label}
                      </Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>

            {/* Training Schedule Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💪</Text>
                <Text style={styles.cardTitle}>Training Schedule</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.trainingInfoGrid}>
                  <View style={styles.trainingInfoItem}>
                    <Text style={styles.trainingInfoNumber}>
                      {wizardData.trainingDaysPerWeek}
                    </Text>
                    <Text style={styles.trainingInfoLabel}>Days/Week</Text>
                  </View>
                  <View style={styles.trainingInfoItem}>
                    <Text style={styles.trainingInfoNumber}>
                      {wizardData.programDurationWeeks}
                    </Text>
                    <Text style={styles.trainingInfoLabel}>Weeks</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Nutrition Targets Card - Only show if TDEE data exists */}
            {tdeeData && (
              <View style={styles.preferenceCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>🍎</Text>
                  <Text style={styles.cardTitle}>Nutrition Targets</Text>
                </View>
                <View style={styles.tdeeCardContent}>
                  <View style={styles.calorieTargetSection}>
                    <Text style={styles.calorieTargetNumber}>
                      {tdeeData.calories > 0
                        ? Math.round(tdeeData.calories)
                        : "Not set"}
                    </Text>
                    <Text style={styles.calorieTargetLabel}>
                      Daily Calories
                    </Text>
                  </View>
                  {tdeeData.calories > 0 && (
                    <View style={styles.macrosGrid}>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(tdeeData.protein)}g
                        </Text>
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(tdeeData.carbs)}g
                        </Text>
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(tdeeData.fat)}g
                        </Text>
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Your Goal Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎯</Text>
                <Text style={styles.cardTitle}>Your Goal</Text>
              </View>
              <View style={styles.goalDisplay}>
                <Text style={styles.goalText}>
                  {wizardData.goal?.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Experience & Focus Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💪</Text>
                <Text style={styles.cardTitle}>Experience & Focus</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.experienceRow}>
                  <Text style={styles.experienceLabel}>Level:</Text>
                  <Text style={styles.experienceValue}>
                    {
                      trainingExperienceOptions.find(
                        (o) => o.id === wizardData.trainingExperience
                      )?.label
                    }
                  </Text>
                </View>
                <View style={styles.focusSection}>
                  <Text style={styles.focusLabel}>Priority Muscles:</Text>
                  <View style={styles.muscleTagsContainer}>
                    {musclePriorities.map((priority: string) => {
                      const muscle = musclePriorityOptions.find(
                        (o) => o.id === priority
                      );
                      return muscle ? (
                        <View key={priority} style={styles.muscleTag}>
                          <Text style={styles.muscleTagText}>
                            {muscle.label}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Body Stats Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📊</Text>
                <Text style={styles.cardTitle}>Your Stats</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{wizardData.age}</Text>
                  <Text style={styles.statLabel}>Years Old</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{wizardData.weight}</Text>
                  <Text style={styles.statLabel}>kg</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{wizardData.height}</Text>
                  <Text style={styles.statLabel}>cm</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {wizardData.gender === "male" ? "♂️" : "♀️"}
                  </Text>
                  <Text style={styles.statLabel}>
                    {wizardData.gender === "male" ? "Male" : "Female"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
