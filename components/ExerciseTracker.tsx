import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { typography } from '@/constants/typography';

interface ExerciseTrackerProps {
  exercise: Exercise;
  exerciseKey: string;
  registerSave?: (fn: () => Promise<void>) => void;
  readOnly?: boolean;
  presetSession?: {
    unit: 'kg' | 'lb';
    sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>;
  };
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exercise,
  exerciseKey,
  registerSave,
  readOnly = false,
  presetSession,
}) => {
  const router = useRouter();
  const MAX_SETS = 8;
  const MIN_SETS = 1;
  const MAX_WEIGHT_KG = 300; // Maximum weight in kg
  const MAX_REPS = 50; // Maximum reps per set
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
      if (presetSession) {
        const limitedSets = presetSession.sets.slice(0, MAX_SETS);
        const hydrated: ExerciseSet[] = (limitedSets.length > 0
          ? limitedSets
          : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
        ).map((s) => ({ id: generateId(), reps: s.reps, weight: s.weightKg, isCompleted: !!s.isCompleted }));
        setUnit(presetSession.unit || 'kg');
        setSets(hydrated);
        setPrevSessionSets(presetSession.sets);
        return;
      }
      if (!user?.id || !exerciseKey) return;
      try {
        const last = await userProgressService.getLastExerciseSession(user.id, exerciseKey);
        if (last?.sets) {
          setPrevSessionSets(last.sets);
          setUnit(last.unit || 'kg');
          const limitedSets = last.sets.slice(0, MAX_SETS);
          const hydrated: ExerciseSet[] = (limitedSets.length > 0
            ? limitedSets
            : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
          ).map((s) => ({ id: generateId(), reps: s.reps, weight: s.weightKg, isCompleted: !!s.isCompleted }));
          setSets(hydrated);
        }
      } catch (e) {}
    };
    loadPrev();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, exerciseKey, presetSession?.unit, JSON.stringify(presetSession?.sets)]);

  // Expose immediate save to parent (e.g., on back press)
  useEffect(() => {
    if (!registerSave) return;
    registerSave(async () => {
      // Flush any pending debounce and force save now
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (!readOnly) {
        await handleSaveSession();
      }
    });
  }, [registerSave, unit, sets, readOnly]);

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
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = index === 0 || sets.slice(0, index).every((s) => s.isCompleted);
    const target = index >= 0 ? sets[index] : null;
    const hasValues = !!target && (target.weight ?? 0) > 0 && (target.reps ?? 0) > 0;
    if (!isEditable || !hasValues) return;
    const updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, isCompleted } : set
    );
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { isCompleted });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleWeightChange = (setId: string, weight: string) => {
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = index === 0 || sets.slice(0, index).every((s) => s.isCompleted);
    if (!isEditable) return;
    const rawWeight = fromDisplayWeightToKg(weight);
    const numWeight = Math.max(0, Math.min(MAX_WEIGHT_KG, rawWeight));
    let updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, weight: numWeight } : set
    );
    // If values become zero, unmark done automatically
    const target = updatedSets.find((s) => s.id === setId);
    if (target && (target.weight ?? 0) <= 0 || (target?.reps ?? 0) <= 0) {
      if (target && target.isCompleted) {
        updatedSets = updatedSets.map((s) =>
          s.id === setId ? { ...s, isCompleted: false } : s
        );
        updateExerciseSet(exerciseKey, setId, { isCompleted: false });
      }
    }
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { weight: numWeight });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleRepsChange = (setId: string, reps: string) => {
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = index === 0 || sets.slice(0, index).every((s) => s.isCompleted);
    if (!isEditable) return;
    const rawReps = parseInt(reps) || 0;
    const numReps = Math.max(0, Math.min(MAX_REPS, rawReps));
    let updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, reps: numReps } : set
    );
    // If values become zero, unmark done automatically
    const target = updatedSets.find((s) => s.id === setId);
    if (target && (target.weight ?? 0) <= 0 || (target?.reps ?? 0) <= 0) {
      if (target && target.isCompleted) {
        updatedSets = updatedSets.map((s) =>
          s.id === setId ? { ...s, isCompleted: false } : s
        );
        updateExerciseSet(exerciseKey, setId, { isCompleted: false });
      }
    }
    setSets(updatedSets);
    updateExerciseSet(exerciseKey, setId, { reps: numReps });
    hasUserEditedRef.current = true;
    scheduleAutoSave();
  };

  const handleAdjustWeight = (setId: string, deltaDisplayUnits: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const currentDisplay = parseFloat(toDisplayWeight(set.weight)) || 0;
    const nextDisplay = Math.max(0, Math.min(MAX_WEIGHT_KG, currentDisplay + deltaDisplayUnits));
    handleWeightChange(setId, nextDisplay.toString());
  };

  const handleAdjustReps = (setId: string, delta: number) => {
    const set = sets.find((s) => s.id === setId);
    if (!set) return;
    const next = Math.max(0, Math.min(MAX_REPS, (set.reps || 0) + delta));
    handleRepsChange(setId, next.toString());
  };

  const handleAddSet = () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
    if (!user?.id) return;
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
      await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);
      // Reload last to confirm persisted state and keep banner visible
      try {
        const last = await userProgressService.getLastExerciseSession(user.id, exerciseKey);
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
    if (readOnly) return;
    // Only allow completion when all sets are already marked done
    if (!sets.every((s) => s.isCompleted)) return;
    await handleSaveSession();
    // Navigate back to Today's Workout
    router.replace('/workout-session');
  };

  const handleClearAll = async () => {
    if (readOnly) return;
    setSets((prev) => prev.map((s) => ({ ...s, reps: 0, weight: 0, isCompleted: false })));
    hasUserEditedRef.current = true;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await handleSaveSession();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
      </View>
      {readOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>Finished workout • Read-only</Text>
        </View>
      )}
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

      {sets.map((set, index) => {
        const editable = index === 0 || sets.slice(0, index).every((s) => s.isCompleted);
        const readyToComplete = editable && (set.weight ?? 0) > 0 && (set.reps ?? 0) > 0;
        return (
          <View key={set.id} style={styles.setRow}>
            <View style={styles.setColumn}>
              <Text style={styles.setNumber}>{index + 1}</Text>
            </View>

            <View style={styles.weightColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, !editable && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? -2.5 : -5)}
                  disabled={!editable}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={toDisplayWeight(set.weight)}
                  onChangeText={(text) => handleWeightChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_WEIGHT_KG}${unit})`}
                  editable={editable && !readOnly}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, !editable && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? 2.5 : 5)}
                  disabled={!editable}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.repsColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || set.reps <= 0) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, -1)}
                  disabled={!editable || set.reps <= 0}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={set.reps.toString()}
                  onChangeText={(text) => handleRepsChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_REPS})`}
                  editable={editable && !readOnly}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, !editable && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, 1)}
                  disabled={!editable}
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
                (!readyToComplete) && styles.disabledButton,
              ]}
              onPress={() => handleSetComplete(set.id, !set.isCompleted)}
              disabled={!readyToComplete || readOnly}
            >
              {set.isCompleted ? (
                <Icon name="check" size={20} color={colors.white} />
              ) : null}
            </TouchableOpacity>
          </View>
        );
      })}

      {!readOnly && (
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
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              !(sets.length > 0 && sets.every((s) => s.isCompleted)) && styles.disabledButton,
            ]}
            onPress={handleCompleteExercise}
            disabled={!(sets.length > 0 && sets.every((s) => s.isCompleted))}
          >
            <Text style={styles.completeButtonText}>Complete Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>Clear All (Today)</Text>
          </TouchableOpacity>
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
    ...typography.h5,
    color: colors.white,
  },
  subtitle: {
    ...typography.bodySmall,
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
    ...typography.caption,
    color: colors.white,
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
    ...typography.caption,
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
    ...typography.timerSmall,
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
    ...typography.timerSmall,
    flex: 1,
    textAlign: 'center',
    color: colors.white,
  },
  inputDisabled: {
    opacity: 0.5,
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
    ...typography.button,
    color: colors.white,
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
    ...typography.button,
    color: colors.white,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.button,
    color: colors.white,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  clearButtonText: {
    color: colors.lighterGray,
    fontWeight: 'bold',
  },

  readOnlyBanner: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  readOnlyText: {
    ...typography.caption,
    color: colors.lighterGray,
    textAlign: 'center',
  },
});
