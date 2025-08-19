import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { formatTime } from '@/utils/helpers';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  index: number;
  status?: 'pending' | 'in-progress' | 'completed';
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  index,
  status = 'pending',
}) => {
  const statusLabel =
    status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Pending';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        exercise.isCompleted && styles.completedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            status === 'completed'
              ? styles.statusCompleted
              : status === 'in-progress'
              ? styles.statusInProgress
              : styles.statusPending,
          ]}
        >
          <Text style={[
            styles.statusText,
            status === 'completed' && styles.statusTextCompleted
          ]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Sets</Text>
          <Text style={styles.infoValue}>{exercise.sets}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Reps</Text>
          <Text style={styles.infoValue}>{exercise.reps}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Rest</Text>
          <View style={styles.restContainer}>
            <Icon name="clock" size={12} color={colors.lighterGray} />
            <Text style={styles.infoValue}>
              {formatTime(exercise.restTime)}
            </Text>
          </View>
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
  completedContainer: {
    borderLeftColor: colors.success,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  indexContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexText: {
    ...typography.bodySmall,
    color: colors.black,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: colors.lighterGray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.mediumGray,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    textTransform: 'uppercase',
  },
  statusTextCompleted: {
    color: colors.black,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.white,
  },
  restContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Status colors
  statusPending: {
    backgroundColor: colors.mediumGray,
  },
  statusInProgress: {
    backgroundColor: '#a67c00',
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
});
