import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useAchievementsLogic } from "./logic";

export default function MyAchievementsScreen() {
  const {
    loading,
    exercisePRs,
    bestWorkoutVolume,
    totalVolumeLifted,
    keyExercises,
    hasAnyPRs,
    formatVolume,
    formatDate,
    handleBack,
  } = useAchievementsLogic();

  // Helper render function for PR cards
  const renderExercisePRCard = (exerciseName: string, exerciseId: string) => {
    const prs = exercisePRs[exerciseId];
    if (!prs || (!prs.maxWeight && !prs.maxVolume && !prs.estimated1RM)) {
      return null;
    }

    return (
      <View key={exerciseId} style={styles.prCard}>
        <View style={styles.prHeader}>
          <Icon name="award" size={24} color={colors.secondary} />
          <Text style={styles.exerciseName}>{exerciseName}</Text>
        </View>

        <View style={styles.prStats}>
          {prs.maxWeight && (
            <View style={styles.prStatItem}>
              <Text style={styles.prStatLabel}>Max Weight</Text>
              <Text style={styles.prStatValue}>{prs.maxWeight.value}kg</Text>
              <Text style={styles.prStatDate}>
                {formatDate(prs.maxWeight.date)}
              </Text>
            </View>
          )}

          {prs.estimated1RM && (
            <View style={styles.prStatItem}>
              <Text style={styles.prStatLabel}>Est. 1RM</Text>
              <Text style={styles.prStatValue}>
                {prs.estimated1RM.value.toFixed(1)}kg
              </Text>
              <Text style={styles.prStatDate}>
                {formatDate(prs.estimated1RM.date)}
              </Text>
            </View>
          )}

          {prs.maxVolume && (
            <View style={styles.prStatItem}>
              <Text style={styles.prStatLabel}>Best Volume</Text>
              <Text style={styles.prStatValue}>
                {formatVolume(prs.maxVolume.value)}
              </Text>
              <Text style={styles.prStatDate}>
                {formatDate(prs.maxVolume.date)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading achievements...</Text>
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
          <Text style={styles.headerTitle}>My Achievements</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Overall Stats */}
          <View style={styles.overallStatsCard}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Icon name="trending-up" size={32} color={colors.secondary} />
                <Text style={styles.statValue}>
                  {formatVolume(totalVolumeLifted)}
                </Text>
                <Text style={styles.statLabel}>Total Lifted</Text>
              </View>

              <View style={styles.statBox}>
                <Icon name="zap" size={32} color={colors.primary} />
                <Text style={styles.statValue}>
                  {bestWorkoutVolume
                    ? formatVolume(bestWorkoutVolume.totalVolume || 0)
                    : "0kg"}
                </Text>
                <Text style={styles.statLabel}>Best Workout</Text>
              </View>
            </View>

            {bestWorkoutVolume && (
              <View style={styles.bestWorkoutInfo}>
                <Text style={styles.bestWorkoutLabel}>
                  Best workout: {bestWorkoutVolume.workoutName || "Workout"}
                </Text>
                <Text style={styles.bestWorkoutDate}>
                  {formatDate(bestWorkoutVolume.date)}
                </Text>
              </View>
            )}
          </View>

          {/* Exercise PRs - The Big 3 */}
          <Text style={styles.sectionTitle}>The Big 3 - Personal Records</Text>

          {keyExercises.map((exercise) => {
            // Find the exercise in PRs by checking all possible IDs
            const foundId = exercise.ids.find((id) => exercisePRs[id]);
            if (foundId) {
              return renderExercisePRCard(exercise.name, foundId);
            }
            return null;
          })}

          {/* Show empty state if no Big 3 exercises found */}
          {!hasAnyPRs && (
            <View style={styles.emptyState}>
              <Icon name="award" size={64} color={colors.lightGray} />
              <Text style={styles.emptyStateTitle}>No PRs Yet</Text>
              <Text style={styles.emptyStateText}>
                Complete workouts with Bench Press, Squat, and Deadlift to track
                your Big 3 personal records!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
