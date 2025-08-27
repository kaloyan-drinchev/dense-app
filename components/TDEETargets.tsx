import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { wizardResultsService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { TDEECalculation } from '@/components/SetupWizard/types';

export const TDEETargets: React.FC = () => {
  const { user } = useAuthStore();
  const [tdeeData, setTdeeData] = useState<TDEECalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTdeeData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        
        if (wizardResults?.tdeeData) {
          const parsedTdeeData = JSON.parse(wizardResults.tdeeData) as TDEECalculation;
          setTdeeData(parsedTdeeData);
        } else {
          // No TDEE data available
          setTdeeData(null);
        }
      } catch (err) {
        console.error('Failed to load TDEE data:', err);
        setError('Failed to load nutrition targets');
      } finally {
        setIsLoading(false);
      }
    };

    loadTdeeData();
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

  if (!tdeeData) {
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
          <Text style={styles.targetValue}>{tdeeData.adjustedCalories}</Text>
          <Text style={styles.targetLabel}>Calories</Text>
          <View style={[styles.targetIndicator, { backgroundColor: colors.primary }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{tdeeData.protein}g</Text>
          <Text style={styles.targetLabel}>Protein</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#FF6B35' }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{tdeeData.carbs}g</Text>
          <Text style={styles.targetLabel}>Carbs</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>
        
        <View style={styles.targetItem}>
          <Text style={styles.targetValue}>{tdeeData.fat}g</Text>
          <Text style={styles.targetLabel}>Fat</Text>
          <View style={[styles.targetIndicator, { backgroundColor: '#3A5199' }]} />
        </View>
      </View>

      <View style={styles.metricInfo}>
        <Text style={styles.metricText}>
          BMR: {tdeeData.bmr} cal • TDEE: {tdeeData.tdee} cal
        </Text>
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
