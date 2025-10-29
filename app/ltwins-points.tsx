import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import {
  getUserLTwinsPoints,
  getUserLTwinsPointsHistory,
  isLTwinsGameEnabled,
  toggleLTwinsGame,
  getPointsChartData,
  type LTwinsPointsHistory,
} from '@/utils/ltwins-game';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LTwinsPointsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LTwinsPointsHistory[]>([]);
  const [gameEnabled, setGameEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [currentPoints, pointsHistory, enabled] = await Promise.all([
        getUserLTwinsPoints(user.id),
        getUserLTwinsPointsHistory(user.id),
        isLTwinsGameEnabled(user.id),
      ]);
      
      setPoints(currentPoints);
      setHistory(pointsHistory);
      setGameEnabled(enabled);
    } catch (error) {
      console.error('Failed to load L Twins data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGame = async () => {
    if (!user?.id) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const newState = !gameEnabled;
      await toggleLTwinsGame(user.id, newState);
      setGameEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle L Twins game:', error);
    }
  };

  const chartData = getPointsChartData(history);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
        <View style={styles.iconContainer}>
          <Text style={styles.twinEmoji}>👯‍♂️</Text>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <LinearGradient
            colors={[colors.primary, '#4A90E2'] as [string, string, ...string[]]}
            style={styles.pointsGradient}
          >
            <Text style={styles.pointsLabel}>Your Total Points</Text>
            <Text style={styles.pointsValue}>{points}</Text>
            <Text style={styles.pointsMax}>/ 1000 Points</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(points / 1000) * 100}%` }]} />
            </View>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>How it works</Text>
          <Text style={styles.descriptionText}>
            After completing each exercise, guess the Lazarov Twins' current sets, reps, and weight for that movement.
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
                  const barHeight = maxPoints > 0 ? (value / maxPoints) * 120 : 0;
                  
                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barColumn}>
                        <Text style={styles.barValue}>{value}</Text>
                        <View style={[styles.bar, { height: barHeight }]} />
                      </View>
                      <Text style={styles.barLabel}>{chartData.labels[index]}</Text>
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
            {history.slice(-5).reverse().map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyExercise}>{entry.exerciseName}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[
                    styles.historyPoints,
                    { color: entry.pointsEarned === 10 ? colors.primary : colors.white }
                  ]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  twinEmoji: {
    fontSize: 80,
  },
  pointsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pointsGradient: {
    padding: 24,
    alignItems: 'center',
  },
  pointsLabel: {
    ...typography.body,
    color: colors.black,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 64,
    fontFamily: typography.timer.fontFamily,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  pointsMax: {
    ...typography.body,
    color: colors.black,
    opacity: 0.7,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.black,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  descriptionCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  descriptionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 12,
  },
  descriptionText: {
    ...typography.body,
    color: colors.lighterGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  highlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    padding: 16,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginTop: 4,
    minHeight: 4,
  },
  barValue: {
    ...typography.caption,
    color: colors.white,
    marginBottom: 4,
    fontSize: 10,
  },
  barLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 8,
    fontSize: 10,
  },
  historyCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  historyLeft: {
    flex: 1,
  },
  historyExercise: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  historyDate: {
    ...typography.caption,
    color: colors.lightGray,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyPoints: {
    ...typography.body,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  toggleCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  toggleDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
});

