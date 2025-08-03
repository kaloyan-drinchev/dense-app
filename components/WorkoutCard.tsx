// @ts-nocheck
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Workout } from '@/types/workout';
import { colors } from '@/constants/colors';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onPress,
}) => {
  const totalExercises = workout.exercises.length;
  const hasCardio = !!workout.cardio;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        workout.isCompleted && styles.completedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{workout.name}</Text>
          <View style={styles.focusContainer}>
            <Text style={styles.focusText}>{workout.focusArea}</Text>
          </View>
        </View>
        {workout.isCompleted && (
          <Icon name="check-circle" size={20} color={colors.success} />
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <MaterialIcon
            name="fitness-center"
            size={16}
            color={colors.lighterGray}
          />
          <Text style={styles.infoText}>{totalExercises} exercises</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="clock" size={16} color={colors.lighterGray} />
          <Text style={styles.infoText}>
            {hasCardio ? '~80 min' : '~60 min'}
          </Text>
        </View>
      </View>

      {hasCardio && (
        <View style={styles.cardioContainer}>
          <Text style={styles.cardioText}>
            + {workout.cardio?.duration} min {workout.cardio?.type}
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  focusContainer: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  focusText: {
    fontSize: 12,
    color: colors.lighterGray,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: (hasCardio) => (hasCardio ? 12 : 0),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.lighterGray,
    marginLeft: 6,
  },
  cardioContainer: {
    backgroundColor: colors.mediumGray,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardioText: {
    fontSize: 12,
    color: colors.lighterGray,
    fontWeight: 'bold',
  },
});
