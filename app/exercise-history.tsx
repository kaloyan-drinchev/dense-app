import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { 
  analyzeExercisePRs, 
  formatPRDisplay, 
  getPRTrend, 
  calculateWorkoutVolume,
  getBestSet,
  type ExerciseLogs,
  type ExercisePRs,
  type ExerciseSession
} from '@/utils/pr-tracking';
import { Feather as Icon } from '@expo/vector-icons';

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const { exerciseId, exerciseName } = useLocalSearchParams<{ 
    exerciseId: string; 
    exerciseName?: string; 
  }>();
  const { user } = useAuthStore();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);

  const displayName = exerciseName || exerciseId?.replace(/-/g, ' ') || 'Exercise';

  const loadExerciseHistory = useCallback(async () => {
    if (!user?.id || !exerciseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress?.weeklyWeights) {
        const weeklyWeights = JSON.parse(progress.weeklyWeights);
        const logs = weeklyWeights?.exerciseLogs || {};
        
        setExerciseLogs(logs);
        
        // Analyze PRs for all exercises
        const allPRs = analyzeExercisePRs(logs);
        setExercisePRs(allPRs);
        
        // Get sessions for this specific exercise
        const exerciseSessions = logs[exerciseId] || [];
        const sortedSessions = [...exerciseSessions].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Failed to load exercise history:', error);
      Alert.alert('Error', 'Failed to load exercise history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId]);

  useFocusEffect(loadExerciseHistory);

  const currentPRs = exercisePRs[exerciseId];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const renderPRCard = (title: string, pr: any, icon: string, trendType: 'weight' | 'volume' | '1rm' = 'weight') => {
    if (!pr) return null;
    
    const trend = getPRTrend(exerciseId, exerciseLogs, trendType);
    const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
    const trendColor = trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.lightGray;
    
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
    const completedSets = session.sets.filter(set => 
      set.isCompleted && set.weightKg > 0 && set.reps > 0
    );
    
    if (completedSets.length === 0) return null;
    
    const bestSet = getBestSet(completedSets);
    const totalVolume = calculateWorkoutVolume(completedSets);
    const isLatest = index === 0;
    
    return (
      <View key={session.date} style={[styles.sessionCard, isLatest && styles.latestSession]}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          {isLatest && <View style={styles.latestBadge}><Text style={styles.latestBadgeText}>Latest</Text></View>}
        </View>
        
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatLabel}>Best Set</Text>
            <Text style={styles.sessionStatValue}>
              {bestSet ? `${bestSet.weightKg}kg × ${bestSet.reps}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatLabel}>Total Volume</Text>
            <Text style={styles.sessionStatValue}>{totalVolume.toFixed(0)}kg</Text>
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
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading exercise history...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{displayName}</Text>
            <Text style={styles.headerSubtitle}>Exercise History</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Personal Records Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
            
            {currentPRs ? (
              <View style={styles.prGrid}>
                {renderPRCard('Max Weight', currentPRs.maxWeight, 'award', 'weight')}
                {renderPRCard('Max Reps', currentPRs.maxReps, 'repeat')}
                {renderPRCard('Max Volume', currentPRs.maxVolume, 'trending-up', 'volume')}
                {renderPRCard('Est. 1RM', currentPRs.estimated1RM, 'target', '1rm')}
              </View>
            ) : (
              <View style={styles.noPRsContainer}>
                <Icon name="bar-chart-2" size={48} color={colors.lightGray} />
                <Text style={styles.noPRsTitle}>No Records Yet</Text>
                <Text style={styles.noPRsText}>Complete your first workout to start tracking PRs!</Text>
              </View>
            )}
          </View>

          {/* Workout History Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Workout History</Text>
            
            {sessions.length > 0 ? (
              <View style={styles.sessionsContainer}>
                {sessions.map((session, index) => renderSessionCard(session, index))}
              </View>
            ) : (
              <View style={styles.noHistoryContainer}>
                <Icon name="calendar" size={48} color={colors.lightGray} />
                <Text style={styles.noHistoryTitle}>No Workout History</Text>
                <Text style={styles.noHistoryText}>Start working out to build your exercise history!</Text>
              </View>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  
  // PR Cards
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  prCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prCardTitle: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  prCardTrend: {
    opacity: 0.7,
  },
  prCardValue: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  prCardDate: {
    ...typography.caption,
    color: colors.lighterGray,
    fontSize: 10,
  },
  noPRsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noPRsTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noPRsText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  
  // Session Cards
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  latestSession: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  latestBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    ...typography.caption,
    color: colors.black,
    fontSize: 10,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginBottom: 4,
  },
  sessionStatValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setChip: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setChipText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
  },
  noHistoryContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noHistoryTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noHistoryText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
});
