import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Exercise, ExerciseSet } from '@/types/workout';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/store/workout-store';
import { generateId } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';

interface ExerciseTrackerProps {
  exercise: Exercise;
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exercise,
}) => {
  const { updateExerciseSet } = useWorkoutStore();
  const [sets, setSets] = useState<ExerciseSet[]>(
    exercise.userSets ||
      Array.from({ length: exercise.sets }, (_, i) => ({
        id: generateId(),
        reps: 0,
        weight: 0,
        isCompleted: false,
      }))
  );

  const handleSetComplete = (setId: string, isCompleted: boolean) => {
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, isCompleted } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exercise.id, setId, { isCompleted });
  };

  const handleWeightChange = (setId: string, weight: string) => {
    const numWeight = parseFloat(weight) || 0;
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, weight: numWeight } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exercise.id, setId, { weight: numWeight });
  };

  const handleRepsChange = (setId: string, reps: string) => {
    const numReps = parseInt(reps) || 0;
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, reps: numReps } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exercise.id, setId, { reps: numReps });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.setColumn]}>SET</Text>
        <Text style={[styles.headerText, styles.prevColumn]}>PREV</Text>
        <Text style={[styles.headerText, styles.weightColumn]}>
          WEIGHT (kg)
        </Text>
        <Text style={[styles.headerText, styles.repsColumn]}>REPS</Text>
        <Text style={[styles.headerText, styles.doneColumn]}>DONE</Text>
      </View>

      {sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <View style={styles.setColumn}>
            <Text style={styles.setNumber}>{index + 1}</Text>
          </View>

          <View style={styles.prevColumn}>
            <Text style={styles.prevText}>-</Text>
          </View>

          <View style={styles.weightColumn}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() =>
                  handleWeightChange(set.id, (set.weight - 2.5).toString())
                }
              >
                <Icon name="minus" size={16} color={colors.white} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={set.weight.toString()}
                onChangeText={(text) => handleWeightChange(set.id, text)}
                keyboardType="numeric"
                placeholderTextColor={colors.lightGray}
                placeholder="0"
              />

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() =>
                  handleWeightChange(set.id, (set.weight + 2.5).toString())
                }
              >
                <Icon name="plus" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.repsColumn}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() =>
                  handleRepsChange(set.id, (set.reps - 1).toString())
                }
                disabled={set.reps <= 0}
              >
                <Icon name="minus" size={16} color={colors.white} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={set.reps.toString()}
                onChangeText={(text) => handleRepsChange(set.id, text)}
                keyboardType="numeric"
                placeholderTextColor={colors.lightGray}
                placeholder="0"
              />

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() =>
                  handleRepsChange(set.id, (set.reps + 1).toString())
                }
              >
                <Icon name="plus" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.doneColumn,
              styles.doneButton,
              set.isCompleted && styles.doneButtonActive,
            ]}
            onPress={() => handleSetComplete(set.id, !set.isCompleted)}
          >
            {set.isCompleted ? (
              <Icon name="check" size={20} color={colors.white} />
            ) : null}
          </TouchableOpacity>
        </View>
      ))}

      {exercise.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{exercise.notes}</Text>
        </View>
      )}
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.lighterGray,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.lightGray,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  setColumn: {
    width: '10%',
    alignItems: 'center',
  },
  prevColumn: {
    width: '15%',
    alignItems: 'center',
  },
  weightColumn: {
    width: '30%',
    alignItems: 'center',
  },
  repsColumn: {
    width: '30%',
    alignItems: 'center',
  },
  doneColumn: {
    width: '15%',
    alignItems: 'center',
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  prevText: {
    fontSize: 14,
    color: colors.lightGray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 36,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonActive: {
    backgroundColor: colors.success,
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.mediumGray,
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
