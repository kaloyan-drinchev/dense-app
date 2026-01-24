import React from "react";
import { Text, View, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useLTwinsPointsLogic } from "./logic";

export default function LTwinsPointsScreen() {
  const {
    points,
    history,
    gameEnabled,
    loading,
    chartData,
    handleToggleGame,
    handleBack,
  } = useLTwinsPointsLogic();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beat the L Twins</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Twin Icon */}
        <View>
          <Text style={styles.headerTitle}>Coming Soon</Text>
        </View>
        <View style={styles.iconContainer}>
          <Text style={styles.twinEmoji}>👯‍♂️</Text>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <LinearGradient
            colors={
              [colors.primary, "#4A90E2"] as [string, string, ...string[]]
            }
            style={styles.pointsGradient}
          >
            <Text style={styles.pointsLabel}>Your Total Points</Text>
            <Text style={styles.pointsValue}>{points}</Text>
            <Text style={styles.pointsMax}>/ 1000 Points</Text>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(points / 1000) * 100}%` },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>How it works</Text>
          <Text style={styles.descriptionText}>
            After completing each exercise, guess the Lazarov Twins' current
            sets, reps, and weight for that movement.
          </Text>
          <Text style={styles.descriptionText}>
            • Perfect guess = <Text style={styles.highlight}>+10 points</Text>
          </Text>
          <Text style={styles.descriptionText}>
            • Close guess = <Text style={styles.highlight}>+5-9 points</Text>
          </Text>
          <Text style={styles.descriptionText}>
            • Way off = <Text style={styles.highlight}>+1-4 points</Text>
          </Text>
          <Text style={styles.descriptionText}>
            • Max points = <Text style={styles.highlight}>1000 points</Text>
          </Text>
        </View>

        {/* Points History Chart */}
        {history.length > 0 && chartData.data.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Points History</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartContent}>
                {chartData.data.map((value, index) => {
                  const maxPoints = Math.max(...chartData.data);
                  const barHeight =
                    maxPoints > 0 ? (value / maxPoints) * 120 : 0;

                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barColumn}>
                        <Text style={styles.barValue}>{value}</Text>
                        <View style={[styles.bar, { height: barHeight }]} />
                      </View>
                      <Text style={styles.barLabel}>
                        {chartData.labels[index]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Guesses */}
        {history.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Recent Guesses</Text>
            {history
              .slice(-5)
              .reverse()
              .map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyExercise}>
                      {entry.exerciseName}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyPoints,
                        {
                          color:
                            entry.pointsEarned === 10
                              ? colors.primary
                              : colors.white,
                        },
                      ]}
                    >
                      +{entry.pointsEarned} pts
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Empty State */}
        {history.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="award" size={64} color={colors.mediumGray} />
            <Text style={styles.emptyStateTitle}>No guesses yet!</Text>
            <Text style={styles.emptyStateText}>
              Complete your first exercise to start guessing the L Twins' stats
            </Text>
          </View>
        )}

        {/* Toggle Switch */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleTitle}>Enable L Twins Game</Text>
              <Text style={styles.toggleDescription}>
                Show guessing modal after each exercise
              </Text>
            </View>
            <Switch
              value={gameEnabled}
              onValueChange={handleToggleGame}
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.mediumGray}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
