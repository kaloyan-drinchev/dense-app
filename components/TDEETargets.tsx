import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useNutritionStore } from '@/store/nutrition-store';
import { wizardResultsService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';

export const TDEETargets: React.FC = () => {
  const { user } = useAuthStore();
  const { nutritionGoals } = useNutritionStore();
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTdeeMetrics = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        
        if (wizardResults?.tdeeData) {
          const parsedTdeeData = JSON.parse(wizardResults.tdeeData);
          setBmr(parsedTdeeData.bmr);
          setTdee(parsedTdeeData.tdee);
        }
      } catch (err) {
        console.error('Failed to load TDEE metrics:', err);
        setError('Failed to load nutrition targets');
      } finally {
        setIsLoading(false);
      }
    };

    loadTdeeMetrics();
  }, [user?.id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your targets...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Check if we have nutrition goals (which come from TDEE calculation)
  const hasTargets = nutritionGoals.calories !== 2500; // 2500 is the default fallback value

  if (!hasTargets) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataTitle}>🎯 Setup Your Nutrition Targets</Text>
          <Text style={styles.noDataText}>
            Complete the setup wizard to get personalized daily nutrition targets based on your goals and body metrics.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Your Daily Targets</Text>
        <Text style={styles.subtitle}>Based on your TDEE calculation</Text>
      </View>

      <View style={styles.targetsGrid}>
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{nutritionGoals.calories}</Text>
          <Text style={styles.targetLabel}>Calories</Text>
          <View style={[styles.targetIndicator, { backgroundColor: colors.primary }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{nutritionGoals.protein}g</Text>
          <Text style={styles.targetLabel}>Protein</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#FF6B35' }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{nutritionGoals.carbs}g</Text>
          <Text style={styles.targetLabel}>Carbs</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{nutritionGoals.fat}g</Text>
          <Text style={styles.targetLabel}>Fat</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#3A5199' }]} />
        </View>
      </View>

      {bmr && tdee && (
        <View style={styles.metricInfo}>
          <Text style={styles.metricText}>
            BMR: {bmr} cal • TDEE: {tdee} cal
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    marginLeft: 8,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noDataTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  targetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  targetItem: {
    alignItems: 'center',
    flex: 1,
  },
  targetValue: {
    ...typography.timerMedium,
    color: colors.white,
    marginBottom: 4,
  },
  targetLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginBottom: 8,
  },
  targetIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  metricInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  metricText: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
  },
});
