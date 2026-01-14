import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useFinishedWorkoutsLogic } from "./logic";

export default function FinishedWorkoutsScreen() {
  const { loading, entries, totalVolumeLifted, handleBack, handleEntryPress } =
    useFinishedWorkoutsLogic();

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
          <Text style={styles.headerTitle}>Finished Workouts</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading workouts...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.debugText}>No finished workouts yet</Text>
            </View>
          ) : (
            <>
              {/* Total Volume Stats */}
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Icon name="trending-up" size={24} color={colors.secondary} />
                  <Text style={styles.statsTitle}>Your Lifting Stats</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {totalVolumeLifted >= 1000
                        ? `${(totalVolumeLifted / 1000).toFixed(1)}t`
                        : `${Math.round(totalVolumeLifted)}kg`}
                    </Text>
                    <Text style={styles.statLabel}>Total Volume Lifted</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{entries.length}</Text>
                    <Text style={styles.statLabel}>Workouts Completed</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {entries.length > 0
                        ? `${Math.round(totalVolumeLifted / entries.length)}kg`
                        : "0kg"}
                    </Text>
                    <Text style={styles.statLabel}>Avg per Workout</Text>
                  </View>
                </View>
              </View>

              {/* Workout History */}
              <Text style={styles.sectionTitle}>Workout History</Text>

              {entries.map((item, idx) => {
                const dateObj = new Date(item.date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const workoutName = item.workoutName || "Workout";

                return (
                  <TouchableOpacity
                    key={`${item.date}-${idx}`}
                    style={styles.entryCard}
                    onPress={() => handleEntryPress(item)}
                  >
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryTitle}>
                        {formattedDate} - {workoutName}
                      </Text>
                      <View style={styles.entryMeta}>
                        <View style={styles.metaBadges}>
                          {/* Show volume for strength workouts */}
                          {item.totalVolume !== undefined &&
                            item.totalVolume !== null &&
                            item.totalVolume > 0 && (
                              <View style={styles.volumeBadge}>
                                <Icon
                                  name="trending-up"
                                  size={12}
                                  color={colors.secondary}
                                />
                                <Text style={styles.volumeBadgeText}>
                                  {item.totalVolume >= 1000
                                    ? `${(item.totalVolume / 1000).toFixed(1)}t`
                                    : `${Math.round(item.totalVolume)}kg`}
                                </Text>
                              </View>
                            )}
                          {/* Show duration for cardio workouts */}
                          {item.duration !== undefined &&
                            item.duration !== null &&
                            item.duration > 0 && (
                              <View style={styles.volumeBadge}>
                                <Icon
                                  name="clock"
                                  size={12}
                                  color={colors.primary}
                                />
                                <Text style={styles.volumeBadgeText}>
                                  {item.duration} min
                                </Text>
                              </View>
                            )}
                          {/* Show calories for cardio workouts */}
                          {item.caloriesBurned !== undefined &&
                            item.caloriesBurned !== null &&
                            item.caloriesBurned > 0 && (
                              <View style={styles.volumeBadge}>
                                <Icon
                                  name="zap"
                                  size={12}
                                  color={colors.secondary}
                                />
                                <Text style={styles.volumeBadgeText}>
                                  {Math.round(item.caloriesBurned)} cal
                                </Text>
                              </View>
                            )}
                          {/* Show success percentage for strength workouts */}
                          {item.percentageSuccess !== undefined &&
                            item.percentageSuccess !== null &&
                            item.workoutIndex !== -2 && (
                              <View style={styles.percentageBadge}>
                                <Text style={styles.percentageBadgeText}>
                                  {item.percentageSuccess}%
                                </Text>
                              </View>
                            )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.entryRight}>
                      <Icon name="arrow-right" size={18} color={colors.black} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
