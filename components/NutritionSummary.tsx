import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { DailyLog } from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutrition-store';

interface NutritionSummaryProps {
  dailyLog: DailyLog;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ dailyLog }) => {
  const { totalNutrition, calorieGoal } = dailyLog;
  const { nutritionGoals } = useNutritionStore();
  
  // Calculate percentages
  const caloriePercentage = Math.min(100, Math.round((totalNutrition.calories / calorieGoal) * 100));
  
  // Calculate macronutrient percentages based on targets (not consumed calories)
  const proteinPercentage = Math.min(100, Math.round((totalNutrition.protein / nutritionGoals.protein) * 100));
  const carbsPercentage = Math.min(100, Math.round((totalNutrition.carbs / nutritionGoals.carbs) * 100));
  const fatPercentage = Math.min(100, Math.round((totalNutrition.fat / nutritionGoals.fat) * 100));
  
  // Calculate remaining calories
  const remainingCalories = calorieGoal - totalNutrition.calories;

  return (
    <View style={styles.container}>
      <View style={styles.calorieContainer}>
        <View style={styles.calorieHeader}>
          <Text style={styles.calorieTitle}>Calories</Text>
          <Text style={styles.calorieValue}>
            {totalNutrition.calories} / {calorieGoal}
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${caloriePercentage}%` },
              caloriePercentage > 100 && styles.progressBarExceeded
            ]} 
          />
        </View>
        
        <Text style={styles.remainingText}>
          {remainingCalories > 0 
            ? `${remainingCalories} calories remaining` 
            : `${Math.abs(remainingCalories)} calories over`}
        </Text>
      </View>

      <View style={styles.macrosContainer}>
        <Text style={styles.macrosTitle}>Macronutrients</Text>
        
        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroName}>Protein</Text>
            <Text style={styles.macroValue}>{totalNutrition.protein}g / {nutritionGoals.protein}g</Text>
          </View>
          <View style={styles.macroBarContainer}>
            <View 
              style={[
                styles.macroBar, 
                styles.proteinBar,
                { width: `${proteinPercentage}%` },
                proteinPercentage > 100 && styles.macroBarExceeded
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroName}>Carbs</Text>
            <Text style={styles.macroValue}>{totalNutrition.carbs}g / {nutritionGoals.carbs}g</Text>
          </View>
          <View style={styles.macroBarContainer}>
            <View 
              style={[
                styles.macroBar, 
                styles.carbsBar,
                { width: `${carbsPercentage}%` },
                carbsPercentage > 100 && styles.macroBarExceeded
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroName}>Fat</Text>
            <Text style={styles.macroValue}>{totalNutrition.fat}g / {nutritionGoals.fat}g</Text>
          </View>
          <View style={styles.macroBarContainer}>
            <View 
              style={[
                styles.macroBar, 
                styles.fatBar,
                { width: `${fatPercentage}%` },
                fatPercentage > 100 && styles.macroBarExceeded
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calorieContainer: {
    marginBottom: 24,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.mediumGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressBarExceeded: {
    backgroundColor: colors.error,
  },
  remainingText: {
    fontSize: 14,
    color: colors.lighterGray,
    textAlign: 'right',
  },
  macrosContainer: {
    
  },
  macrosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroName: {
    fontSize: 16,
    color: colors.white,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  macroBarContainer: {
    height: 8,
    backgroundColor: colors.mediumGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
    borderRadius: 4,
  },
  proteinBar: {
    backgroundColor: '#FF6B35', // Orange
  },
  carbsBar: {
    backgroundColor: '#4CAF50', // Green
  },
  fatBar: {
    backgroundColor: '#3A5199', // Blue
  },
  macroBarExceeded: {
    backgroundColor: colors.error,
  },
});