import React from "react";
import {
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useWorkoutOverviewLogic, ExerciseVolume } from "./logic";
import { FloatingButton } from "@/components/FloatingButton";

export default function WorkoutOverviewScreen() {
  const {
    workoutName,
    duration,
    exercisesData,
    totalVolume,
    prsAchieved,
    loadingPRs,
    formatDuration,
    formatVolume,
    handleHomePress,
  } = useWorkoutOverviewLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Success Header */}
          <View style={styles.successHeader}>
            <Text style={styles.title}>Workout Complete! 🎉</Text>
            <Text style={styles.subtitle}>{workoutName}</Text>
          </View>

          {/* PR Celebration Banner */}
          {!loadingPRs && prsAchieved.length > 0 && (
            <View style={styles.prBanner}>
              <View style={styles.prBannerHeader}>
                <Icon name="award" size={32} color={colors.secondary} />
                <View style={styles.prBannerHeaderText}>
                  <Text style={styles.prBannerTitle}>
                    {prsAchieved.length === 1
                      ? "New Personal Record! 🏆"
                      : `${prsAchieved.length} New Personal Records! 🔥`}
                  </Text>
                  <Text style={styles.prBannerSubtitle}>
                    You're getting stronger!
                  </Text>
                </View>
              </View>

              <View style={styles.prList}>
                {prsAchieved.map((pr, index) => (
                  <View key={index} style={styles.prItem}>
                    <View style={styles.prItemHeader}>
                      <Text style={styles.prExerciseName}>
                        {pr.exerciseName}
                      </Text>
                      <Text style={styles.prType}>{pr.prType} PR</Text>
                    </View>
                    <View style={styles.prItemStats}>
                      <Text style={styles.prValue}>
                        {pr.value.toFixed(1)}kg
                      </Text>
                      {pr.improvement && (
                        <Text style={styles.prImprovement}>
                          +{pr.improvement.toFixed(1)}kg
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="clock" size={24} color={colors.primary} />
              <Text style={styles.statValue}>
                {formatDuration(parseInt(duration))}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="activity" size={24} color={colors.success} />
              <Text style={styles.statValue}>{exercisesData.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>

            <View style={[styles.statCard, styles.volumeCard]}>
              <Icon name="trending-up" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{formatVolume(totalVolume)}</Text>
              <Text style={styles.statLabel}>Total Volume</Text>
            </View>
          </View>

          {/* Exercise Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise Breakdown</Text>

            {exercisesData.map((exercise: ExerciseVolume, index: number) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseVolume}>
                    {formatVolume(exercise.totalVolume)}
                  </Text>
                </View>

                <View style={styles.exerciseStats}>
                  <View style={styles.exerciseStat}>
                    <Icon
                      name="check-square"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.exerciseStatText}>
                      {exercise.completedSets}/{exercise.sets} sets
                    </Text>
                  </View>

                  <View style={styles.exerciseStat}>
                    <Icon name="repeat" size={14} color={colors.primary} />
                    <Text style={styles.exerciseStatText}>
                      {exercise.totalReps} reps
                    </Text>
                  </View>
                </View>

                {/* Volume Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          totalVolume > 0
                            ? (exercise.totalVolume / totalVolume) * 100
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* Floating Action Button */}
        <FloatingButton
          text="Back to Home"
          onPress={handleHomePress}
          icon="home"
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
