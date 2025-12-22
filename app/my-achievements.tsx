import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { Feather as Icon } from '@expo/vector-icons';
import { analyzeExercisePRs, type ExercisePRs, type PersonalRecord } from '@/utils/pr-tracking';

interface CompletedWorkout {
  date: string;
  workoutName?: string;
  totalVolume?: number;
  exercises?: Array<{
    name: string;
    totalVolume: number;
  }>;
}

export default function MyAchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [bestWorkoutVolume, setBestWorkoutVolume] = useState<CompletedWorkout | null>(null);
  const [totalVolumeLifted, setTotalVolumeLifted] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, [user?.id]);

  const loadAchievements = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      
      // Load exercise PRs
      if (progress?.weeklyWeights) {
        const weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;
        const logs = weeklyWeights?.exerciseLogs || {};
        const prs = analyzeExercisePRs(logs);
        setExercisePRs(prs);
      }

      // Load best workout volume
      if (progress?.completedWorkouts) {
        const workouts: CompletedWorkout[] = Array.isArray(progress.completedWorkouts)
          ? progress.completedWorkouts
          : typeof progress.completedWorkouts === 'string'
          ? JSON.parse(progress.completedWorkouts)
          : [];

        // Find workout with highest volume
        const bestWorkout = workouts.reduce<CompletedWorkout | null>((best, current) => {
          if (!current.totalVolume) return best;
          if (!best || current.totalVolume > (best.totalVolume || 0)) {
            return current;
          }
          return best;
        }, null);

        setBestWorkoutVolume(bestWorkout);

        // Calculate total volume lifted
        const total = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        setTotalVolumeLifted(total);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getExercisePRCard = (exerciseName: string, exerciseId: string) => {
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
              <Text style={styles.prStatDate}>{formatDate(prs.maxWeight.date)}</Text>
            </View>
          )}

          {prs.estimated1RM && (
            <View style={styles.prStatItem}>
              <Text style={styles.prStatLabel}>Est. 1RM</Text>
              <Text style={styles.prStatValue}>{prs.estimated1RM.value.toFixed(1)}kg</Text>
              <Text style={styles.prStatDate}>{formatDate(prs.estimated1RM.date)}</Text>
            </View>
          )}

          {prs.maxVolume && (
            <View style={styles.prStatItem}>
              <Text style={styles.prStatLabel}>Best Volume</Text>
              <Text style={styles.prStatValue}>{formatVolume(prs.maxVolume.value)}</Text>
              <Text style={styles.prStatDate}>{formatDate(prs.maxVolume.date)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // The Big 3 exercises
  const keyExercises = [
    { name: 'Bench Press', ids: ['bench-press', 'barbell-bench-press', 'flat-barbell-bench-press'] },
    { name: 'Squat', ids: ['squat', 'barbell-squat', 'back-squat'] },
    { name: 'Deadlift', ids: ['deadlift', 'barbell-deadlift', 'conventional-deadlift'] },
  ];

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
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
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Achievements</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {/* Overall Stats */}
          <View style={styles.overallStatsCard}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Icon name="trending-up" size={32} color={colors.secondary} />
                <Text style={styles.statValue}>{formatVolume(totalVolumeLifted)}</Text>
                <Text style={styles.statLabel}>Total Lifted</Text>
              </View>

              <View style={styles.statBox}>
                <Icon name="zap" size={32} color={colors.primary} />
                <Text style={styles.statValue}>
                  {bestWorkoutVolume ? formatVolume(bestWorkoutVolume.totalVolume || 0) : '0kg'}
                </Text>
                <Text style={styles.statLabel}>Best Workout</Text>
              </View>
            </View>

            {bestWorkoutVolume && (
              <View style={styles.bestWorkoutInfo}>
                <Text style={styles.bestWorkoutLabel}>
                  Best workout: {bestWorkoutVolume.workoutName || 'Workout'}
                </Text>
                <Text style={styles.bestWorkoutDate}>
                  {formatDate(bestWorkoutVolume.date)}
                </Text>
              </View>
            )}
          </View>

          {/* Exercise PRs - The Big 3 */}
          <Text style={styles.sectionTitle}>The Big 3 - Personal Records</Text>
          
          {keyExercises.map(exercise => {
            // Find the exercise in PRs by checking all possible IDs
            const foundId = exercise.ids.find(id => exercisePRs[id]);
            if (foundId) {
              return getExercisePRCard(exercise.name, foundId);
            }
            return null;
          })}

          {/* Show empty state if no Big 3 exercises found */}
          {!keyExercises.some(ex => ex.ids.some(id => exercisePRs[id])) && (
            <View style={styles.emptyState}>
              <Icon name="award" size={64} color={colors.lightGray} />
              <Text style={styles.emptyStateTitle}>No PRs Yet</Text>
              <Text style={styles.emptyStateText}>
                Complete workouts with Bench Press, Squat, and Deadlift to track your Big 3 personal records!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  overallStatsCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  statValue: {
    ...typography.h2,
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  bestWorkoutInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  bestWorkoutLabel: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
  },
  bestWorkoutDate: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 4,
  },
  prCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prStats: {
    flexDirection: 'row',
    gap: 12,
  },
  prStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  prStatLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    marginBottom: 4,
  },
  prStatValue: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prStatDate: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
