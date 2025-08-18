import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { WorkoutCalendarHeatMap } from './WorkoutCalendarHeatMap';
import { getWorkoutCompletionData, type WorkoutCompletionData } from '@/utils/workout-completion-tracker';
import { useAuthStore } from '@/store/auth-store';

interface WorkoutProgressChartsProps {
  currentWeek: number;
  currentDay: number;
  totalWeeks: number;
  daysPerWeek: number;
}

export const WorkoutProgressCharts: React.FC<WorkoutProgressChartsProps> = ({
  currentWeek,
  currentDay,
  totalWeeks,
  daysPerWeek,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const [completionData, setCompletionData] = useState<WorkoutCompletionData>({
    completedDates: [],
    startDate: new Date().toISOString().split('T')[0],
    totalCompletedWorkouts: 0,
  });
  const { user } = useAuthStore();

  // Calculate percentages
  const currentWeekProgress = Math.round((currentDay / daysPerWeek) * 100);
  const overallProgress = Math.round(((currentWeek - 1) * daysPerWeek + currentDay) / (totalWeeks * daysPerWeek) * 100);

  // Animation on component mount
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load completion data
  const loadCompletionData = useCallback(async () => {
    if (user?.id) {
      const data = await getWorkoutCompletionData(user.id);
      setCompletionData(data);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCompletionData();
  }, [loadCompletionData, currentWeek, currentDay]); // Reload when progress changes

  // Refresh completion data when screen gains focus (after completing workout)
  useFocusEffect(
    useCallback(() => {
      loadCompletionData();
    }, [loadCompletionData])
  );

  const animatedStyle = {
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.sectionTitle}>Progress Tracking</Text>
      
      <View style={styles.chartsRow}>
        {/* Current Week Progress */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={currentWeekProgress}
            tintColor={colors.primary}
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={200}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{currentWeekProgress}%</Text>
                <Text style={styles.chartLabel}>Week {currentWeek}</Text>
                <Text style={styles.chartSubLabel}>Day {currentDay}/{daysPerWeek}</Text>
              </View>
            )}
          </AnimatedCircularProgress>
          <Text style={styles.chartTitle}>Current Week</Text>
        </View>

        {/* Overall Program Progress */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={overallProgress}
            tintColor={colors.secondary}
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={400}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{overallProgress}%</Text>
                <Text style={styles.chartLabel}>Week {currentWeek}</Text>
                <Text style={styles.chartSubLabel}>of {totalWeeks}</Text>
              </View>
            )}
          </AnimatedCircularProgress>
          <Text style={styles.chartTitle}>Overall Program</Text>
        </View>
      </View>

      {/* Calendar Heat Map */}
      <WorkoutCalendarHeatMap
        completedDates={completionData.completedDates}
        startDate={completionData.startDate}
        currentWeek={currentWeek}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    ...typography.h2,
    color: colors.white,
    fontFamily: 'Saira-Bold',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 2,
  },
  chartSubLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 10,
  },
  chartTitle: {
    ...typography.body,
    color: colors.white,
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
