import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Exercise, ExerciseSet } from '@/types/workout';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { generateId } from '@/utils/helpers';
import { Feather as Icon } from '@expo/vector-icons';
import { typography } from '@/constants/typography';
import { 
  analyzeExercisePRs, 
  checkForNewPRs, 
  getBeatLastWorkoutSuggestions,
  type ExerciseLogs,
  type ExercisePRs,
  type PersonalRecord
} from '@/utils/pr-tracking';
import { PRCelebrationModal } from '@/components/PRCelebrationModal';

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
        reps: 10, // Default 10 reps
        weight: 10, // Default 10kg
        isCompleted: false,
      }))
  );


  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completionData, setCompletionData] = useState<{percentage: number, completed: number, total: number} | null>(null);
  const hasUserEditedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // PR tracking state
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [beatLastSuggestions, setBeatLastSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // PR Celebration Modal state
  const [showPRModal, setShowPRModal] = useState(false);
  const [achievedPRs, setAchievedPRs] = useState<PersonalRecord[]>([]);


  // Load PR data function (moved outside useEffect for reuse)
  const loadPRData = async () => {
    if (!user?.id) return;
    
    try {
      const progress = await userProgressService.getByUserId(user.id);
      if (progress?.weeklyWeights) {
        const weeklyWeights = JSON.parse(progress.weeklyWeights);
        const logs = weeklyWeights?.exerciseLogs || {};
        
        setExerciseLogs(logs);
        
        // Analyze PRs for all exercises
        const allPRs = analyzeExercisePRs(logs);
        setExercisePRs(allPRs);
        
        // Generate beat last workout suggestions
        const suggestions = getBeatLastWorkoutSuggestions(exerciseKey, allPRs);
        setBeatLastSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Failed to load PR data:', error);
    }
  };

  useEffect(() => {
    const loadSessionData = async () => {
      if (presetSession) {
        const limitedSets = presetSession.sets.slice(0, MAX_SETS);
        const hydrated: ExerciseSet[] = (limitedSets.length > 0
          ? limitedSets
          : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
        ).map((s) => ({ id: generateId(), reps: s.reps, weight: s.weightKg, isCompleted: !!s.isCompleted }));
        setUnit(presetSession.unit || 'kg');
        setSets(hydrated);
        return;
      }
      
      // Load current session data if not read-only
      if (!user?.id || !exerciseKey) return;
      try {
        console.log(`🔄 Loading today's session for ${exerciseKey}...`);
        
        // DEBUG: Check what's actually stored
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.weeklyWeights) {
          const data = JSON.parse(progress.weeklyWeights);
          console.log(`🔧 DEBUG - All stored exercise keys:`, Object.keys(data?.exerciseLogs || {}));
          console.log(`🔧 DEBUG - Looking for key: "${exerciseKey}"`);
          console.log(`🔧 DEBUG - Direct lookup:`, data?.exerciseLogs?.[exerciseKey]?.length || 0, 'sessions');
          if (data?.exerciseLogs?.[exerciseKey]) {
            console.log(`🔧 DEBUG - Sessions:`, data.exerciseLogs[exerciseKey].map(s => ({ date: s.date, sets: s.sets?.length })));
          }
        }
        
        const todaySession = await userProgressService.getTodayExerciseSession(user.id, exerciseKey);
        console.log(`📋 Today's session found:`, !!todaySession, todaySession?.sets?.length || 0, 'sets');
        
        if (todaySession?.sets && todaySession.sets.length > 0) {
          setUnit(todaySession.unit || 'kg');
          const limitedSets = todaySession.sets.slice(0, MAX_SETS);
          const hydrated: ExerciseSet[] = limitedSets.map((s) => ({ 
            id: generateId(), 
            reps: s.reps || 0, 
            weight: s.weightKg || 0, 
            isCompleted: !!s.isCompleted 
          }));
          setSets(hydrated);
        } else {
          console.log(`🆕 No today's session found for ${exerciseKey}, starting fresh`);
        }
      } catch (e) {
        // If no previous session found, start with empty sets
        console.log('❌ Error loading session, starting fresh:', e);
      }
    };
    

    
    loadSessionData();
    loadPRData();
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

  const handleWeightChange = (setId: string, weight: string) => {
    if (readOnly) return;
    const index = sets.findIndex((s) => s.id === setId);
    const isEditable = true; // Allow editing any set regardless of order
    if (!isEditable) return;
    const rawWeight = fromDisplayWeightToKg(weight);
    const numWeight = Math.max(0, Math.min(MAX_WEIGHT_KG, rawWeight));
    let updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, weight: numWeight } : set
    );
    
    // Auto-complete/uncomplete set based on values
    const target = updatedSets.find((s) => s.id === setId);
    if (target) {
      const shouldBeCompleted = (target.weight > 0 && target.reps > 0);
      if (target.isCompleted !== shouldBeCompleted) {
        updatedSets = updatedSets.map((s) =>
          s.id === setId ? { ...s, isCompleted: shouldBeCompleted } : s
        );
        updateExerciseSet(exerciseKey, setId, { isCompleted: shouldBeCompleted });
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
    const isEditable = true; // Allow editing any set regardless of order
    if (!isEditable) return;
    const rawReps = parseInt(reps) || 0;
    const numReps = Math.max(0, Math.min(MAX_REPS, rawReps));
    let updatedSets = sets.map((set) =>
      set.id === setId ? { ...set, reps: numReps } : set
    );
    
    // Auto-complete/uncomplete set based on values
    const target = updatedSets.find((s) => s.id === setId);
    if (target) {
      const shouldBeCompleted = (target.weight > 0 && target.reps > 0);
      if (target.isCompleted !== shouldBeCompleted) {
        updatedSets = updatedSets.map((s) =>
          s.id === setId ? { ...s, isCompleted: shouldBeCompleted } : s
        );
        updateExerciseSet(exerciseKey, setId, { isCompleted: shouldBeCompleted });
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
        { id: generateId(), reps: 10, weight: 10, isCompleted: false },
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
      setSaveStatus('saved');
    } catch (e) {
      console.error(`❌ Failed to save ${exerciseKey}:`, e);
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

  // Check if all sets are completed
  const allSetsCompleted = sets.every(s => s.isCompleted && s.weight > 0 && s.reps > 0);

  const handleCompleteExercise = async () => {
    if (readOnly || allSetsCompleted) return;
    
    // Calculate completion percentage
    const completedSets = sets.filter(s => s.isCompleted).length;
    const totalSets = sets.length;
    const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    
    // Always show modal for confirmation or congratulations
    setCompletionData({ percentage: completionPercentage, completed: completedSets, total: totalSets });
    setShowConfirmModal(true);
  };

  const completeExercise = async () => {
    console.log('🎯 Completing exercise - BEFORE:', sets.map(s => ({ reps: s.reps, weight: s.weight, isCompleted: s.isCompleted })));
    
    // Ensure all sets are marked as completed and have valid values
    const updatedSets = sets.map((set) => {
      // If set has no reps or weight, give it minimum valid values
      const reps = set.reps > 0 ? set.reps : 1;
      const weight = set.weight > 0 ? set.weight : 0;
      
      return {
        ...set,
        reps,
        weight,
        isCompleted: true, // Mark all sets as completed
      };
    });
    
    console.log('🎯 Completing exercise - AFTER:', updatedSets.map(s => ({ reps: s.reps, weight: s.weight, isCompleted: s.isCompleted })));
    
    // Update the sets state to reflect completion
    setSets(updatedSets);
    hasUserEditedRef.current = true;
    
    // Save the session with completed sets - use updatedSets directly
    const payload = {
      unit,
      sets: updatedSets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.weight ?? 0,
        reps: s.reps ?? 0,
        isCompleted: !!s.isCompleted,
      })),
    };
    
    try {
      if (!user?.id) {
        console.error('❌ No user ID available for saving');
        return;
      }
      await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);
      
      // Check for new PRs and show notifications
      const completedSets = updatedSets.filter(set => set.isCompleted && set.weight > 0 && set.reps > 0);
      console.log('🔍 PR Check - Completed sets:', completedSets.length);
      
      if (completedSets.length > 0) {
        // Get fresh PR data directly from database instead of relying on state
        console.log('🔄 Getting fresh PR data to include new session...');
        const progress = await userProgressService.getByUserId(user.id);
        
        if (progress?.weeklyWeights) {
          const weeklyWeights = JSON.parse(progress.weeklyWeights);
          const freshLogs = weeklyWeights?.exerciseLogs || {};
          console.log('📋 Fresh exercise logs:', Object.keys(freshLogs));
          console.log(`📋 Sessions for ${exerciseKey}:`, freshLogs[exerciseKey]?.length || 0);
          
          // Analyze PRs with fresh data
          const freshPRs = analyzeExercisePRs(freshLogs);
          
          // Convert ExerciseSet[] to PR tracking format
          const prSets = completedSets.map(set => ({
            weightKg: set.weight,
            reps: set.reps,
            isCompleted: set.isCompleted
          }));
          
          console.log('🎯 Checking for PRs with sets:', prSets);
          console.log('🎯 Previous exercise PRs:', exercisePRs[exerciseKey]);
          console.log('🎯 Fresh exercise PRs:', freshPRs[exerciseKey]);
          
          const newPRs = checkForNewPRs(exerciseKey, prSets, exercisePRs);
          console.log('🏆 New PRs found:', newPRs);
          
          if (newPRs.length > 0) {
            // Show PR celebration modal
            setAchievedPRs(newPRs);
            setShowPRModal(true);
            
            // Also trigger haptic feedback
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            return; // Don't go back yet, PR modal will handle navigation
          } else {
            console.log('💭 No new PRs detected');
          }
          
          // Update state with fresh data
          await loadPRData();
        } else {
          console.log('⚠️ No weeklyWeights data found');
        }
      }
    } catch (e) {
      console.error('❌ Failed to save completed exercise:', e);
    }
    
    
    router.back();
  };

  const handleResetToPending = async () => {
    if (readOnly) return;
    // Mark all sets as incomplete (pending)
    setSets((prev) => prev.map((s) => ({ ...s, isCompleted: false })));
    hasUserEditedRef.current = true;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSaveSession();
    }, 250);
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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
        </View>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push(`/exercise-history?exerciseId=${exerciseKey}&exerciseName=${encodeURIComponent(exercise.name)}`)}
        >
          <Icon name="bar-chart-2" size={20} color={colors.primary} />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
      
      {/* Beat Last Workout Suggestions */}
      {!readOnly && beatLastSuggestions.length > 0 && showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Icon name="target" size={16} color={colors.primary} />
            <Text style={styles.suggestionsTitle}>Beat Last Workout</Text>
            <TouchableOpacity onPress={() => setShowSuggestions(false)}>
              <Icon name="x" size={16} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
            {beatLastSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionChip}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
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
            activeOpacity={1}
          >
            <Text style={styles.unitButtonText}>kg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUnit('lb')}
            style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
            activeOpacity={1}
          >
            <Text style={styles.unitButtonText}>lb</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.setColumn]}>SET</Text>
        <Text style={[styles.headerText, styles.weightColumn]}>WEIGHT ({unit})</Text>
        <Text style={[styles.headerText, styles.repsColumn]}>REPS</Text>
      </View>

      {sets.map((set, index) => {
        const editable = true; // Allow editing any set regardless of order
        const readyToComplete = editable && (set.weight ?? 0) > 0 && (set.reps ?? 0) > 0;
        return (
          <View key={set.id} style={styles.setRow}>
            <View style={styles.setColumn}>
              <Text style={styles.setNumber}>{index + 1}</Text>
            </View>

            <View style={styles.weightColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || allSetsCompleted) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? -2.5 : -5)}
                  disabled={!editable || allSetsCompleted}
                  activeOpacity={1}
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
                  style={[styles.adjustButton, (!editable || allSetsCompleted) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? 2.5 : 5)}
                  disabled={!editable || allSetsCompleted}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.repsColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || set.reps <= 0 || allSetsCompleted) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, -1)}
                  disabled={!editable || set.reps <= 0 || allSetsCompleted}
                  activeOpacity={1}
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
                  style={[styles.adjustButton, (!editable || allSetsCompleted) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, 1)}
                  disabled={!editable || allSetsCompleted}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, sets.length <= MIN_SETS && styles.disabledButton]}
            onPress={() => handleRemoveSet()}
            disabled={sets.length <= MIN_SETS}
          >
            <Icon name="minus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Remove last</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, sets.length >= MAX_SETS && styles.disabledButton]}
            onPress={handleAddSet}
            disabled={sets.length >= MAX_SETS}
          >
            <Icon name="plus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Add set</Text>
          </TouchableOpacity>
        </View>
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.completeButton, allSetsCompleted && styles.completedButton]}
            onPress={handleCompleteExercise}
            disabled={allSetsCompleted}
          >
            <Text style={[styles.completeButtonText, allSetsCompleted && styles.completedButtonText]}>
              {allSetsCompleted ? 'Completed ✓' : 'Complete Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!readOnly && allSetsCompleted && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetToPending}
          >
            <Text style={styles.resetButtonText}>Reset to Pending (Testing)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      {completionData && (
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowConfirmModal(false)}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                {completionData.percentage === 100 ? (
                  <>
                    <Text style={styles.modalTitle}>🎉 Excellent Work!</Text>
                    <Text style={styles.modalDescription}>
                      Perfect! You've completed all {completionData.total} sets. Great job staying consistent with your training!
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.singleButton]}
                        onPress={() => {
                          setShowConfirmModal(false);
                          completeExercise();
                        }}
                      >
                        <Text style={styles.confirmButtonText}>Continue</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Great Job! 🎉</Text>
                    <Text style={styles.modalDescription}>
                      Awesome work on that set! You're making great progress. Ready to move on to the next exercise?
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.dualButton]}
                        onPress={() => {
                          console.log('🔴 FINISH TRAINING button clicked!');
                          setShowConfirmModal(false);
                          completeExercise();
                        }}
                      >
                        <Text style={styles.confirmButtonText}>Finish Exercise</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, styles.dualButton]}
                        onPress={() => {
                          console.log('🟢 CONTINUE TRAINING button clicked!');
                          setShowConfirmModal(false);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Continue Exercise</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* PR Celebration Modal */}
      <PRCelebrationModal
        visible={showPRModal}
        exerciseName={exercise.name}
        prs={achievedPRs}
        onClose={() => {
          setShowPRModal(false);
          router.back();
        }}
        onShare={() => {
          // TODO: Implement share functionality
          console.log('Share PR achievement');
          // Could use expo-sharing here
        }}
      />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: colors.black,
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
    width: '42%',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  repsColumn: {
    width: '43%',
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
  disabledField: {
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
    color: colors.black,
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
    color: colors.black,
  },
  completedButton: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
  },
  completedButtonText: {
    color: colors.lightGray,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    display: 'flex',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.mediumGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 200,
  },
  dualButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 140,
  },
  
  // New PR tracking styles
  titleContainer: {
    flex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  historyButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Beat Last Workout Suggestions
  suggestionsContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  suggestionsTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionChip: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 12,
  },
});
