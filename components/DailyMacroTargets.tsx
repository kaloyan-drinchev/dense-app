import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { NutritionGoals } from '@/types/nutrition';

interface DailyMacroTargetsProps {
  nutritionGoals: NutritionGoals;
}

export const DailyMacroTargets: React.FC<DailyMacroTargetsProps> = ({ nutritionGoals }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Targets</Text>
      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{nutritionGoals.calories}</Text>
          <Text style={styles.macroLabel}>CALORIES</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{nutritionGoals.protein}g</Text>
          <Text style={styles.macroLabel}>PROTEIN</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{nutritionGoals.carbs}g</Text>
          <Text style={styles.macroLabel}>CARBS</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{nutritionGoals.fat}g</Text>
          <Text style={styles.macroLabel}>FAT</Text>
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  title: {
    ...typography.h4,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: colors.mediumGray,
    marginHorizontal: 8,
  },
});
