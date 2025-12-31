import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { WorkoutCalendarHeatMap } from './WorkoutCalendarHeatMap';
import { getWorkoutCompletionData, type WorkoutCompletionData } from '@/utils/workout-completion-tracker';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';

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
  const [completionData, setCompletionData] = useState<WorkoutCompletionData>({
    completedDates: [],
    startDate: new Date().toISOString().split('T')[0],
    totalCompletedWorkouts: 0,
  });
  const [volumeData, setVolumeData] = useState<{ labels: string[], values: number[] }>({ labels: [], values: [] });
  const [workoutTypeData, setWorkoutTypeData] = useState<{ labels: string[], values: number[] }>({ labels: [], values: [] });
  const { user } = useAuthStore();

  // Load all chart data
  const loadChartData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Load completion data for calendar
      const data = await getWorkoutCompletionData(user.id);
      setCompletionData(data);
      
      // Load user progress for volume and workout type data
      const progress = await userProgressService.getByUserId(user.id);
      if (progress?.completedWorkouts) {
        const completedData = Array.isArray(progress.completedWorkouts)
          ? progress.completedWorkouts
          : (typeof progress.completedWorkouts === 'string' 
              ? JSON.parse(progress.completedWorkouts) 
              : []);
        
        // Filter only detailed workout objects
        const workouts = completedData.filter((item: any) => 
          typeof item === 'object' && 
          item.date && 
          item.workoutName &&
          item.totalVolume !== undefined
        );
        
        // Sort by date
        workouts.sort((a: any, b: any) => (a.date > b.date ? 1 : -1));
        
        // CHART 1: Volume Over Time (last 10 workouts)
        const last10 = workouts.slice(-10);
        const volumeLabels = last10.map((w: any, idx: number) => `W${idx + 1}`);
        const volumeValues = last10.map((w: any) => Math.round(w.totalVolume || 0));
        setVolumeData({ labels: volumeLabels, values: volumeValues });
        
        // CHART 2: Workout Type Distribution
        const typeCount: Record<string, number> = {
          'Push': 0,
          'Pull': 0,
          'Legs': 0,
        };
        
        workouts.forEach((w: any) => {
          const name = (w.workoutName || '').toLowerCase();
          if (name.includes('push')) typeCount['Push']++;
          else if (name.includes('pull')) typeCount['Pull']++;
          else if (name.includes('leg')) typeCount['Legs']++;
        });
        
        setWorkoutTypeData({
          labels: ['Push', 'Pull', 'Legs'],
          values: [typeCount['Push'], typeCount['Pull'], typeCount['Legs']],
        });
      }
    } catch (error) {
      console.error('❌ WorkoutProgressCharts: Error loading chart data:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData, currentWeek, currentDay]);

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadChartData();
    }, [loadChartData])
  );

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 72; // Account for container padding

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Progress Tracking</Text>
      
      {/* Volume Over Time Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Volume Over Time</Text>
        <Text style={styles.chartSubtitle}>Total kg lifted per workout</Text>
        {volumeData.values.length > 0 ? (
          <LineChart
            data={{
              labels: volumeData.labels,
              datasets: [{ data: volumeData.values }],
            }}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: colors.darkGray,
              backgroundGradientFrom: colors.darkGray,
              backgroundGradientTo: colors.darkGray,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>Complete workouts to see your volume progress</Text>
          </View>
        )}
      </View>

      {/* Workout Type Distribution Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Workout Type Balance</Text>
        <Text style={styles.chartSubtitle}>Push / Pull / Legs distribution</Text>
        {workoutTypeData.values.length > 0 && workoutTypeData.values.some(v => v > 0) ? (
          <BarChart
            data={{
              labels: workoutTypeData.labels,
              datasets: [{ data: workoutTypeData.values }],
            }}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: colors.darkGray,
              backgroundGradientFrom: colors.darkGray,
              backgroundGradientTo: colors.darkGray,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: { borderRadius: 16 },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            style={styles.chart}
            withInnerLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>Complete workouts to see your balance</Text>
          </View>
        )}
      </View>

      {/* Calendar Heat Map */}
      <WorkoutCalendarHeatMap
        completedDates={completionData.completedDates}
        startDate={completionData.startDate}
        currentWeek={currentWeek}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 32,
  },
  chartTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartSubtitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 200,
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChartText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
});
