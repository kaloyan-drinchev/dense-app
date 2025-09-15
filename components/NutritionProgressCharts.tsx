import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { DailyLog } from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutrition-store';

interface NutritionProgressChartsProps {
  dailyLog: DailyLog;
}

export const NutritionProgressCharts: React.FC<NutritionProgressChartsProps> = ({ dailyLog }) => {
  const { nutritionGoals } = useNutritionStore();
  const { totalNutrition, calorieGoal } = dailyLog;

  // Calculate real percentages from actual data
  const currentCalories = totalNutrition?.calories || 0;
  const goalCalories = calorieGoal || 2000;
  const caloriePercentage = Math.min(100, Math.round((currentCalories / goalCalories) * 100));

  const currentProtein = totalNutrition?.protein || 0;
  const goalProtein = nutritionGoals?.protein || 150;
  const proteinPercentage = Math.min(100, Math.round((currentProtein / goalProtein) * 100));

  const currentCarbs = totalNutrition?.carbs || 0;
  const goalCarbs = nutritionGoals?.carbs || 200;
  const carbsPercentage = Math.min(100, Math.round((currentCarbs / goalCarbs) * 100));

  const currentFat = totalNutrition?.fat || 0;
  const goalFat = nutritionGoals?.fat || 60;
  const fatPercentage = Math.min(100, Math.round((currentFat / goalFat) * 100));


  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily Nutrition Progress</Text>
      
      {/* First Row */}
      <View style={styles.chartsRow}>
        {/* Main Calories Chart */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={caloriePercentage}
            tintColor="#4CAF50"
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={200}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{caloriePercentage}%</Text>
                <Text style={styles.chartLabel}>{currentCalories}/{goalCalories}</Text>
                <Text style={styles.chartSubLabel}>CALORIES</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Protein Chart */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={proteinPercentage}
            tintColor="#2196F3"
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={400}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{proteinPercentage}%</Text>
                <Text style={styles.chartLabel}>{currentProtein}/{goalProtein}g</Text>
                <Text style={styles.chartSubLabel}>PROTEIN</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>

      {/* Second Row */}
      <View style={[styles.chartsRow, styles.secondRow]}>
        {/* Carbs Chart */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={carbsPercentage}
            tintColor="#FFC107"
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={600}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{carbsPercentage}%</Text>
                <Text style={styles.chartLabel}>{currentCarbs}/{goalCarbs}g</Text>
                <Text style={styles.chartSubLabel}>CARBS</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Fat Chart */}
        <View style={styles.chartContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={fatPercentage}
            tintColor="#FF6B35"
            backgroundColor={colors.darkGray}
            rotation={0}
            lineCap="round"
            duration={1500}
            delay={800}
          >
            {() => (
              <View style={styles.chartContent}>
                <Text style={styles.percentageText}>{fatPercentage}%</Text>
                <Text style={styles.chartLabel}>{currentFat}/{goalFat}g</Text>
                <Text style={styles.chartSubLabel}>FAT</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>

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
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  secondRow: {
    marginTop: 20,
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
    color: colors.primary,
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
