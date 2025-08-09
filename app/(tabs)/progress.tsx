import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { colors } from '@/constants/colors';
import { ProgressChart } from '@/components/ProgressChart';
import { WeightLogger } from '@/components/WeightLogger';
import { formatDate } from '@/utils/helpers';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';

export default function ProgressScreen() {
  const { userProgress, activeProgram } = useWorkoutStore();
  const [selectedTab, setSelectedTab] = useState<'weight' | 'workouts'>(
    'weight'
  );

  if (!userProgress || !activeProgram) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Program</Text>
          <Text style={styles.emptyText}>
            Start a program to track your progress
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedWorkouts = userProgress.completedWorkouts;
  const totalWorkoutsInProgram = activeProgram.weeks.reduce(
    (total, week) => total + week.workouts.length,
    0
  );
  const completionPercentage = Math.round(
    (completedWorkouts.length / totalWorkoutsInProgram) * 100
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>
            Track your fitness journey with {activeProgram.name}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Program Summary</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {activeProgram.type.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {completedWorkouts.length} of {totalWorkoutsInProgram} workouts
              completed
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {completionPercentage}%
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="calendar" size={20} color={colors.primary} />
              <Text style={styles.statValue}>
                Week {userProgress.currentWeek}
              </Text>
              <Text style={styles.statLabel}>Current Week</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.statValue}>{completedWorkouts.length}</Text>
              <Text style={styles.statLabel}>Workouts Done</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="clock" size={20} color={colors.secondary} />
              <Text style={styles.statValue}>
                {userProgress.lastWorkoutDate
                  ? formatDate(userProgress.lastWorkoutDate).split(',')[0]
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Last Workout</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'weight' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('weight')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'weight' && styles.activeTabButtonText,
              ]}
            >
              Weight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'workouts' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('workouts')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'workouts' && styles.activeTabButtonText,
              ]}
            >
              Workouts
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'weight' ? (
          <>
            <WeightLogger />
            <ProgressChart
              userProgress={userProgress}
            />
          </>
        ) : (
          <View style={styles.workoutsContainer}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>

            {userProgress.completedWorkouts.length === 0 ? (
              <View style={styles.emptyWorkouts}>
                <Text style={styles.emptyWorkoutsText}>
                  No completed workouts yet
                </Text>
              </View>
            ) : (
              userProgress.completedWorkouts
                .slice(-5)
                .reverse()
                .map((workoutId) => {
                  // Find the workout in the program
                  let workout = null;
                  for (const week of activeProgram.weeks) {
                    const found = week.workouts.find((w) => w.id === workoutId);
                    if (found) {
                      workout = found;
                      break;
                    }
                  }

                  if (!workout) return null;

                  return (
                    <View key={workoutId} style={styles.workoutItem}>
                      <View style={styles.workoutIcon}>
                        <MaterialIcon
                          name="fitness-center"
                          size={20}
                          color={colors.white}
                        />
                      </View>
                      <View style={styles.workoutInfo}>
                        <Text style={styles.workoutName}>{workout.name}</Text>
                        <Text style={styles.workoutFocus}>
                          {workout.focusArea}
                        </Text>
                      </View>
                      <Icon
                        name="check-circle"
                        size={20}
                        color={colors.success}
                      />
                    </View>
                  );
                })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 32,      // Keep bottom unchanged
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.lighterGray,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.lighterGray,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.mediumGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: colors.lighterGray,
    alignSelf: 'flex-end',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.mediumGray,
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.lightGray,
  },
  activeTabButtonText: {
    color: colors.white,
  },
  workoutsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  emptyWorkouts: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyWorkoutsText: {
    fontSize: 16,
    color: colors.lightGray,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 14,
    color: colors.lighterGray,
  },
});
