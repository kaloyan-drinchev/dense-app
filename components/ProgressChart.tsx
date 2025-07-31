import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { UserProgress } from '@/types/workout';

interface ProgressChartProps {
  userProgress: UserProgress;
  programType: 'bulking' | 'cutting';
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 180;
const BAR_WIDTH = 20;

export const ProgressChart: React.FC<ProgressChartProps> = ({ userProgress, programType }) => {
  // Get the last 7 weight logs or fewer if not available
  const weightLogs = userProgress.weightLog.slice(-7);
  
  if (weightLogs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Weight Progress</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No weight data recorded yet</Text>
        </View>
      </View>
    );
  }

  // Find min and max for scaling
  const weights = weightLogs.map(log => log.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  
  // Add a small buffer to min/max for better visualization
  const buffer = Math.max(1, (maxWeight - minWeight) * 0.1);
  const chartMin = Math.max(0, minWeight - buffer);
  const chartMax = maxWeight + buffer;
  const chartRange = chartMax - chartMin;

  // Calculate bar heights
  const getBarHeight = (weight: number) => {
    if (chartRange === 0) return CHART_HEIGHT * 0.5; // Default height if all weights are the same
    return ((weight - chartMin) / chartRange) * (CHART_HEIGHT - 40);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Progress</Text>
      
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{chartMax.toFixed(1)}</Text>
          <Text style={styles.axisLabel}>{((chartMax + chartMin) / 2).toFixed(1)}</Text>
          <Text style={styles.axisLabel}>{chartMin.toFixed(1)}</Text>
        </View>
        
        {/* Chart */}
        <View style={styles.chart}>
          {weightLogs.map((log, index) => {
            const barHeight = getBarHeight(log.weight);
            const isGain = index > 0 && log.weight > weightLogs[index - 1].weight;
            const isLoss = index > 0 && log.weight < weightLogs[index - 1].weight;
            
            // Determine bar color based on program type and weight change
            let barColor = colors.primary;
            if (programType === 'bulking') {
              barColor = isGain ? colors.success : isLoss ? colors.error : colors.primary;
            } else {
              barColor = isLoss ? colors.success : isGain ? colors.error : colors.primary;
            }
            
            return (
              <View key={log.date} style={styles.barContainer}>
                <View style={styles.barLabelContainer}>
                  <Text style={styles.barValue}>{log.weight.toFixed(1)}</Text>
                </View>
                <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]} />
                <Text style={styles.dateLabel}>{formatDate(log.date)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.lightGray,
    fontSize: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxisLabels: {
    width: 40,
    height: CHART_HEIGHT - 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  barLabelContainer: {
    height: 20,
  },
  barValue: {
    fontSize: 10,
    color: colors.lighterGray,
  },
  bar: {
    width: BAR_WIDTH - 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: colors.lightGray,
    position: 'absolute',
    bottom: 0,
  },
});