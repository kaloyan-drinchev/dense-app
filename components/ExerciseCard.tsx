import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';
import Icon from 'react-native-vector-icons/Feather';
import { formatTime } from '@/utils/helpers';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  index: number;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

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
        <TouchableOpacity onPress={toggleExpanded} style={styles.expandButton}>
          {expanded ? (
            <Icon name="chevron-up" size={20} color={colors.lighterGray} />
          ) : (
            <Icon name="chevron-down" size={20} color={colors.lighterGray} />
          )}
        </TouchableOpacity>
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

      {expanded && (
        <View style={styles.expandedContent}>
          {exercise.imageUrl && (
            <Image
              source={{ uri: exercise.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          )}
          {exercise.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{exercise.notes}</Text>
            </View>
          )}
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: colors.lighterGray,
    marginTop: 2,
  },
  expandButton: {
    padding: 4,
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
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  restContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandedContent: {
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesContainer: {
    backgroundColor: colors.mediumGray,
    padding: 12,
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.lighterGray,
    lineHeight: 20,
  },
});
