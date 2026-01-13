import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { analyzeExercisePRs, type PersonalRecord } from '@/utils/pr-tracking';

interface ExerciseVolume {
  name: string;
  sets: number;
  completedSets: number;
  totalReps: number;
  totalVolume: number; // in kg
}

interface PRInfo {
  exerciseName: string;
  prType: string;
  value: number;
  improvement?: number;
}

export default function WorkoutOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  // Parse data from params
  const workoutName = params.workoutName as string || 'Workout';
  const duration = params.duration as string || '0';
  const exercisesData = params.exercises ? JSON.parse(params.exercises as string) : [];
  const totalVolume = params.totalVolume ? parseFloat(params.totalVolume as string) : 0;

  const [prsAchieved, setPRsAchieved] = useState<PRInfo[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(true);

  useEffect(() => {
    checkForPRs();
  }, [user?.id]);

  const checkForPRs = async () => {
    if (!user?.id) {
      setLoadingPRs(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      if (!progress?.weeklyWeights) {
        setLoadingPRs(false);
        return;
      }

      const weeklyWeights = typeof progress.weeklyWeights === 'string'
        ? JSON.parse(progress.weeklyWeights)
        : progress.weeklyWeights;
      
      const exerciseLogs = weeklyWeights?.exerciseLogs || {};
      const allPRs = analyzeExercisePRs(exerciseLogs);
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Build a Set of exercise IDs from the current workout
      const workoutExerciseIds = new Set(
        exercisesData.map((ex: ExerciseVolume) => 
          ex.name.toLowerCase().replace(/\s+/g, '-')
        )
      );
      
      // Check if any PRs were achieved today for exercises in THIS workout only
      const todaysPRs: PRInfo[] = [];
      
      Object.entries(allPRs).forEach(([exerciseId, prs]: [string, any]) => {
        // IMPORTANT: Skip exercises that weren't in the current workout
        if (!workoutExerciseIds.has(exerciseId)) {
          return;
        }
        
        // Format exercise name
        const exerciseName = exercisesData.find((ex: ExerciseVolume) => 
          ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseId
        )?.name || exerciseId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        // Check weight PR
        if (prs.maxWeight && prs.maxWeight.date === today) {
          todaysPRs.push({
            exerciseName,
            prType: 'Weight',
            value: prs.maxWeight.value,
            improvement: prs.maxWeight.previousValue 
              ? prs.maxWeight.value - prs.maxWeight.previousValue 
              : undefined,
          });
        }
      });

      setPRsAchieved(todaysPRs);
    } catch (error) {
      console.error('Failed to check for PRs:', error);
    } finally {
      setLoadingPRs(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`; // tons
    }
    return `${Math.round(kg)}kg`;
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
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
                    {prsAchieved.length === 1 ? 'New Personal Record! 🏆' : `${prsAchieved.length} New Personal Records! 🔥`}
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
                      <Text style={styles.prExerciseName}>{pr.exerciseName}</Text>
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
              <Text style={styles.statValue}>{formatDuration(parseInt(duration))}</Text>
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
                  <Text style={styles.exerciseVolume}>{formatVolume(exercise.totalVolume)}</Text>
                </View>
                
                <View style={styles.exerciseStats}>
                  <View style={styles.exerciseStat}>
                    <Icon name="check-square" size={14} color={colors.primary} />
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
                      { width: `${(exercise.totalVolume / totalVolume) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)/Home')}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.homeButtonGradient}
            >
              <Text style={styles.homeButtonText}>Back to Home</Text>
              <Icon name="home" size={20} color={colors.black} />
            </LinearGradient>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 18,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  volumeCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseVolume: {
    ...typography.body,
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  exerciseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseStatText: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 13,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.mediumGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  homeButton: {
    marginTop: 8,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  prBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  prBannerHeaderText: {
    flex: 1,
  },
  prBannerTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prBannerSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 14,
  },
  prList: {
    gap: 12,
  },
  prItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  prItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prExerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  prType: {
    ...typography.caption,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  prItemStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  prValue: {
    ...typography.h3,
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  prImprovement: {
    ...typography.body,
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
});
