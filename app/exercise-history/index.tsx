import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import {
  formatPRDisplay,
  getPRTrend,
  calculateWorkoutVolume,
  getBestSet,
  type ExerciseSession,
} from "@/utils/pr-tracking";

import { styles } from "./styles";
import { useExerciseHistoryLogic } from "./logic";

export default function ExerciseHistoryScreen() {
  const {
    loading,
    displayName,
    currentPRs,
    sessions,
    exerciseId,
    exerciseLogs,
    formatDate,
    handleBack,
  } = useExerciseHistoryLogic();

  // Helper render functions
  const renderPRCard = (
    title: string,
    pr: any,
    icon: string,
    trendType: "weight" | "volume" | "1rm" = "weight"
  ) => {
    if (!pr || !exerciseId) return null;

    const trend = getPRTrend(exerciseId, exerciseLogs, trendType);
    const trendIcon =
      trend === "up"
        ? "trending-up"
        : trend === "down"
        ? "trending-down"
        : "minus";
    const trendColor =
      trend === "up"
        ? colors.success
        : trend === "down"
        ? colors.error
        : colors.lightGray;

    return (
      <View style={styles.prCard}>
        <View style={styles.prCardHeader}>
          <View style={styles.prCardTitleContainer}>
            <Icon name={icon as any} size={20} color={colors.primary} />
            <Text style={styles.prCardTitle}>{title}</Text>
          </View>
          <View style={styles.prCardTrend}>
            <Icon name={trendIcon as any} size={16} color={trendColor} />
          </View>
        </View>
        <Text style={styles.prCardValue}>{formatPRDisplay(pr)}</Text>
        <Text style={styles.prCardDate}>{formatDate(pr.date)}</Text>
      </View>
    );
  };

  const renderSessionCard = (session: ExerciseSession, index: number) => {
    const completedSets = session.sets.filter(
      (set) => set.isCompleted && set.weightKg > 0 && set.reps > 0
    );

    if (completedSets.length === 0) return null;

    const bestSet = getBestSet(completedSets);
    const totalVolume = calculateWorkoutVolume(completedSets);
    const isLatest = index === 0;

    return (
      <View
        key={session.date}
        style={[styles.sessionCard, isLatest && styles.latestSession]}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          {isLatest && (
            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeText}>Latest</Text>
            </View>
          )}
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatLabel}>Best Set</Text>
            <Text style={styles.sessionStatValue}>
              {bestSet ? `${bestSet.weightKg}kg × ${bestSet.reps}` : "N/A"}
            </Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatLabel}>Total Volume</Text>
            <Text style={styles.sessionStatValue}>
              {totalVolume.toFixed(0)}kg
            </Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatLabel}>Sets</Text>
            <Text style={styles.sessionStatValue}>{completedSets.length}</Text>
          </View>
        </View>

        <View style={styles.setsGrid}>
          {completedSets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setChip}>
              <Text style={styles.setChipText}>
                {set.weightKg}kg × {set.reps}
              </Text>
            </View>
          ))}
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
            <Text style={styles.loadingText}>Loading exercise history...</Text>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{displayName}</Text>
            <Text style={styles.headerSubtitle}>Exercise History</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Personal Records Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Personal Records</Text>

            {currentPRs ? (
              <View style={styles.prGrid}>
                {renderPRCard(
                  "Max Weight",
                  currentPRs.maxWeight,
                  "award",
                  "weight"
                )}
                {renderPRCard("Max Reps", currentPRs.maxReps, "repeat")}
                {renderPRCard(
                  "Max Volume",
                  currentPRs.maxVolume,
                  "trending-up",
                  "volume"
                )}
                {renderPRCard(
                  "Est. 1RM",
                  currentPRs.estimated1RM,
                  "target",
                  "1rm"
                )}
              </View>
            ) : (
              <View style={styles.noPRsContainer}>
                <Icon name="bar-chart-2" size={48} color={colors.lightGray} />
                <Text style={styles.noPRsTitle}>No Records Yet</Text>
                <Text style={styles.noPRsText}>
                  Complete your first workout to start tracking PRs!
                </Text>
              </View>
            )}
          </View>

          {/* Workout History Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Workout History</Text>

            {sessions.length > 0 ? (
              <View style={styles.sessionsContainer}>
                {sessions.map((session, index) =>
                  renderSessionCard(session, index)
                )}
              </View>
            ) : (
              <View style={styles.noHistoryContainer}>
                <Icon name="calendar" size={48} color={colors.lightGray} />
                <Text style={styles.noHistoryTitle}>No Workout History</Text>
                <Text style={styles.noHistoryText}>
                  Start working out to build your exercise history!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
