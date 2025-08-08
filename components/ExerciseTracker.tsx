import React, { useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { generateId } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';

interface ExerciseTrackerProps {
  exercise: Exercise;
  exerciseKey: string;
  registerSave?: (fn: () => Promise<void>) => void;
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exercise,
  exerciseKey,
  registerSave,
}) => {
  const MAX_SETS = 8;
  const MIN_SETS = 1;
  const { updateExerciseSet } = useWorkoutStore();
  const { user } = useAuthStore();

  // Unit handling
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  // Local sets state (weight stored internally as kg)
  const initialCount = Math.min(
    Math.max(typeof exercise.sets === 'number' ? exercise.sets : MIN_SETS, MIN_SETS),
    MAX_SETS
  );
  const [sets, setSets] = useState<ExerciseSet[]>(
    exercise.userSets ||
      Array.from({ length: initialCount }, () => ({
        id: generateId(),
        reps: 0,
        weight: 0, // weightKg internally
        isCompleted: false,
      }))
  );

  // Previous session for PREV column
  const [prevSessionSets, setPrevSessionSets] = useState<
    Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>
  >([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const hasUserEditedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    const loadPrev = async () => {
      if (!user?.email || !exerciseKey) return;
      try {
        const last = await userProgressService.getLastExerciseSession(user.email, exerciseKey);
        if (last?.sets) {
          setPrevSessionSets(last.sets);
          // Prefill current sets from last session for immediate continuity
          setUnit(last.unit || 'kg');
          const limitedSets = last.sets.slice(0, MAX_SETS);
          const hydrated: ExerciseSet[] = (limitedSets.length > 0
            ? limitedSets
            : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
          ).map((s) => ({
            id: generateId(),
            reps: s.reps,
            weight: s.weightKg,
            isCompleted: !!s.isCompleted,
          }));
          setSets(hydrated);
        } else {
          
        }
      } catch (e) {
        
      }
    };
    loadPrev();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, exerciseKey]);

  // Expose immediate save to parent (e.g., on back press)
  useEffect(() => {
    if (!registerSave) return;
    registerSave(async () => {
      // Flush any pending debounce and force save now
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      await handleSaveSession();
    });
  }, [registerSave, unit, sets]);

  // Flush save when screen loses focus (navigate back)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (hasUserEditedRef.current) {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          // fire and forget
          handleSaveSession();
        }
      };
    }, [unit, sets])
  );

  // Removed auto-save on unmount to avoid dev double-mount overwriting saved state

  const toDisplayWeight = (weightKg: number): string => {
    if (unit === 'kg') return (Math.round(weightKg * 10) / 10).toString();
    const lb = weightKg * 2.2046226218;
    return (Math.round(lb * 10) / 10).toString();
  };

  const fromDisplayWeightToKg = (value: string): number => {
    const n = parseFloat(value);
    if (!isFinite(n)) return 0;
    if (unit === 'kg') return n;
    return n / 2.2046226218;
  };

  const handleSetComplete = (setId: string, isCompleted: boolean) => {
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, isCompleted } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { isCompleted });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleWeightChange = (setId: string, weight: string) => {
    const numWeight = Math.max(0, fromDisplayWeightToKg(weight));
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, weight: numWeight } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { weight: numWeight });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleRepsChange = (setId: string, reps: string) => {
    const numReps = parseInt(reps) || 0;
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, reps: numReps } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { reps: numReps });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleAdjustWeight = (setId: string, deltaDisplayUnits: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const currentDisplay = parseFloat(toDisplayWeight(set.weight)) || 0;
    const nextDisplay = Math.max(0, currentDisplay + deltaDisplayUnits);
    handleWeightChange(setId, nextDisplay.toString());
  };

  const handleAdjustReps = (setId: string, delta: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const next = Math.max(0, (set.reps || 0) + delta);
    handleRepsChange(setId, next.toString());
  };

  const handleAddSet = () => {
    setSets((prev) => {
      if (prev.length >= MAX_SETS) return prev;
      const next = [
        ...prev,
        { id: generateId(), reps: 0, weight: 0, isCompleted: false },
      ];
      hasUserEditedRef.current = true;
      scheduleAutoSave();
      return next;
    });
  };

  const handleRemoveSet = (setId?: string) => {
    setSets((prev) => {
      if (prev.length <= MIN_SETS) return prev;
      let next: ExerciseSet[];
      if (setId) {
        const filtered = prev.filter((s) => s.id !== setId);
        next = filtered.length >= MIN_SETS ? filtered : prev;
      } else {
        next = prev.slice(0, -1);
      }
      if (next !== prev) {
        hasUserEditedRef.current = true;
        scheduleAutoSave();
      }
      return next;
    });
  };

  const handleSaveSession = async () => {
    if (!user?.email) return;
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    isSavingRef.current = true;
    setSaveStatus('saving');
    const payload = {
      unit,
      sets: sets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.weight ?? 0,
        reps: s.reps ?? 0,
        isCompleted: !!s.isCompleted,
      })),
    };
    try {
      await userProgressService.upsertTodayExerciseSession(user.email, exerciseKey, payload);
      // Reload last to confirm persisted state and keep banner visible
      try {
        const last = await userProgressService.getLastExerciseSession(user.email, exerciseKey);
        if (last?.sets) {
          setPrevSessionSets(last.sets);
        }
      } catch (e) {
        
      }
      setSaveStatus('saved');
    } catch (e) {
      
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        // schedule immediate follow-up save
        handleSaveSession();
      }
    }
  };

  const scheduleAutoSave = () => {
    if (!hasUserEditedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSaveSession();
    }, 250);
  };

  const handleCompleteExercise = async () => {
    const completed = sets.map((s) => ({ ...s, isCompleted: true }));
    setSets(completed);
    await handleSaveSession();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
      </View>
      <View style={styles.unitToggleRow}>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            onPress={() => setUnit('kg')}
            style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
          >
            <Text style={styles.unitButtonText}>kg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUnit('lb')}
            style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
          >
            <Text style={styles.unitButtonText}>lb</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.setColumn]}>SET</Text>
        <Text style={[styles.headerText, styles.weightColumn]}>WEIGHT ({unit})</Text>
        <Text style={[styles.headerText, styles.repsColumn]}>REPS</Text>
        <Text style={[styles.headerText, styles.doneColumn]}>DONE</Text>
      </View>

      {sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <View style={styles.setColumn}>
            <Text style={styles.setNumber}>{index + 1}</Text>
          </View>

          <View style={styles.weightColumn}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? -2.5 : -5)}
              >
                <Icon name="minus" size={16} color={colors.white} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={toDisplayWeight(set.weight)}
                onChangeText={(text) => handleWeightChange(set.id, text)}
                keyboardType="numeric"
                placeholderTextColor={colors.lightGray}
                placeholder="0"
              />

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? 2.5 : 5)}
              >
                <Icon name="plus" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.repsColumn}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAdjustReps(set.id, -1)}
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
                onPress={() => handleAdjustReps(set.id, 1)}
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

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, sets.length >= MAX_SETS && styles.disabledButton]}
          onPress={handleAddSet}
          disabled={sets.length >= MAX_SETS}
        >
          <Icon name="plus" size={16} color={colors.white} />
          <Text style={styles.secondaryButtonText}>Add set</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, sets.length <= MIN_SETS && styles.disabledButton]}
          onPress={() => handleRemoveSet()}
          disabled={sets.length <= MIN_SETS}
        >
          <Icon name="minus" size={16} color={colors.white} />
          <Text style={styles.secondaryButtonText}>Remove last</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteExercise}>
          <Text style={styles.completeButtonText}>Complete Exercise</Text>
        </TouchableOpacity>
      </View>

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
    marginBottom: 8,
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
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitToggleRow: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.mediumGray,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
  },
  unitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
    marginBottom: 8,
  },
  // removed saved banner styles
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
    width: '15%',
    alignItems: 'center',
  },
  weightColumn: {
    width: '35%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  repsColumn: {
    width: '35%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  doneColumn: {
    width: '15%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mediumGray,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
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
