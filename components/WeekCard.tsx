import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Week } from '@/types/workout';
import { colors } from '@/constants/colors';
import { getProgressPercentage } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';

interface WeekCardProps {
  week: Week;
  onPress: () => void;
  isActive: boolean;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  onPress,
  isActive,
}) => {
  const completedWorkouts = week.workouts.filter((w) => w.isCompleted).length;
  const totalWorkouts = week.workouts.length;
  const progressPercentage = getProgressPercentage(
    week.workouts.filter((w) => w.isCompleted).map((w) => w.id),
    totalWorkouts
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.activeContainer,
        week.isLocked && styles.lockedContainer,
      ]}
      onPress={onPress}
      disabled={week.isLocked}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Week {week.weekNumber}</Text>
        {week.isLocked ? (
          <Icon name="lock" size={20} color={colors.lightGray} />
        ) : week.isCompleted ? (
          <Icon name="check-circle" size={20} color={colors.success} />
        ) : null}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            {completedWorkouts}/{totalWorkouts} workouts
          </Text>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBar,
                                { width: `${progressPercentage}%` },
              week.isCompleted && styles.completedProgressBar,
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeContainer: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  lockedContainer: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.lighterGray,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.mediumGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  completedProgressBar: {
    backgroundColor: colors.success,
  },
});
