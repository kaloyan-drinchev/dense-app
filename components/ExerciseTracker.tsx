import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';
import { useExerciseTracker } from './useExerciseTracker';
import { styles } from './ExerciseTracker.styles'; // <--- IMPORT STYLES HERE

interface ExerciseTrackerProps {
  exercise: Exercise;
  exerciseKey: string;
  registerSave?: (fn: () => Promise<void>) => void;
  readOnly?: boolean;
  presetSession?: {
    unit: 'kg' | 'lb';
    sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>;
  };
  userProgressData?: any;
  hideCompleteButton?: boolean;
  onCompleteStateChange?: (state: any) => void;
}

const ExerciseTrackerComponent: React.FC<ExerciseTrackerProps> = (props) => {
  const {
    sets,
    unit,
    setUnit,
    isLoadingSets,
    isCompletingExercise,
    isExerciseFinalized,
    showConfirmModal,
    setShowConfirmModal,
    completionData,
    beatLastSuggestions,
    showSuggestions,
    setShowSuggestions,
    isPRDataLoaded,
    restTimerActive,
    setRestTimerActive,
    restTimeRemaining,
    MAX_SETS,
    MIN_SETS,
    MAX_WEIGHT_KG,
    MAX_REPS,
    
    toDisplayWeight,
    handleWeightChange,
    handleRepsChange,
    handleAdjustWeight,
    handleAdjustReps,
    handleToggleSetComplete,
    handleAddSet,
    handleRemoveSet,
    handleCompleteRequest,
    completeExercise,
    formatRestTime,
    stopRestTimer,
    setAchievedPRs
  } = useExerciseTracker(props);

  const { exercise, readOnly, hideCompleteButton } = props;
  const allSetsChecked = sets.some(s => s.isCompleted && s.weight > 0 && s.reps > 0);

  return (
    <View style={styles.container}>
      {/* Exercise Name Header */}
      <View style={styles.exerciseNameHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseTarget}>{exercise.targetMuscle}</Text>
      </View>
      
      {isExerciseFinalized && (
        <View style={styles.completedBanner}>
          <Icon name="check-circle" size={20} color={colors.success} />
          <Text style={styles.completedBannerText}>Completed</Text>
        </View>
      )}
      
      {!isExerciseFinalized && false && !readOnly && beatLastSuggestions.length > 0 && showSuggestions && isPRDataLoaded && (
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
        <View style={styles.exerciseInfoRow}>
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
            <Text style={styles.infoValue}>{exercise.restTime}s</Text>
          </View>
        </View>
        
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

      {isLoadingSets ? (
        <View style={styles.loadingSetsSkeleton}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        sets.map((set, index) => {
        const editable = true;
        return (
          <View key={set.id} style={styles.setRow}>
            <View style={styles.setColumn}>
              <Text style={styles.setNumber}>{index + 1}</Text>
            </View>

            <View style={styles.weightColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? -2.5 : -5)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, (!editable || isExerciseFinalized) && styles.inputDisabled]}
                  value={toDisplayWeight(set.weight)}
                  onChangeText={(text) => handleWeightChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_WEIGHT_KG}${unit})`}
                  editable={editable && !readOnly && !isExerciseFinalized}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustWeight(set.id, unit === 'kg' ? 2.5 : 5)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.repsColumn}>
              <View style={[styles.inputContainer, !editable && styles.disabledField]}>
                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || set.reps <= 0 || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, -1)}
                  disabled={!editable || set.reps <= 0 || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="minus" size={16} color={colors.white} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, (!editable || isExerciseFinalized) && styles.inputDisabled]}
                  value={set.reps.toString()}
                  onChangeText={(text) => handleRepsChange(set.id, text)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.lightGray}
                  placeholder={`0 (max ${MAX_REPS})`}
                  editable={editable && !readOnly && !isExerciseFinalized}
                />

                <TouchableOpacity
                  style={[styles.adjustButton, (!editable || isExerciseFinalized) && styles.disabledButton]}
                  onPress={() => handleAdjustReps(set.id, 1)}
                  disabled={!editable || isExerciseFinalized}
                  activeOpacity={1}
                >
                  <Icon name="plus" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {!readOnly && (
              <View style={styles.checkboxColumn}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    set.isCompleted && styles.checkboxChecked,
                    isExerciseFinalized && styles.disabledButton
                  ]}
                  onPress={() => handleToggleSetComplete(set.id)}
                  disabled={isExerciseFinalized}
                  activeOpacity={0.7}
                >
                  {set.isCompleted && (
                    <Icon name="check" size={16} color={colors.black} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
        })
      )}

      {restTimerActive && !readOnly && (
        <View style={styles.restTimerBanner}>
          <LinearGradient
            colors={[
              'rgba(132, 204, 22, 0.15)',
              'rgba(34, 197, 94, 0.1)',
              'rgba(20, 25, 35, 0.8)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.restTimerGradient}
          >
            <View style={styles.restTimerContent}>
              <View style={styles.restTimerLeft}>
                <Text style={styles.restTimerTitle}>REST TIME</Text>
                <Text style={styles.restTimerSubtext}>Recover before next set</Text>
              </View>
              <View style={styles.restTimerRight}>
                <Text style={styles.restTimerTime}>{formatRestTime(restTimeRemaining)}</Text>
                <TouchableOpacity
                  onPress={stopRestTimer}
                  style={styles.restTimerSkip}
                >
                  <Text style={styles.restTimerSkipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, (sets.length <= MIN_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={() => handleRemoveSet()}
            disabled={sets.length <= MIN_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Icon name="minus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Remove last</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, (sets.length >= MAX_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={handleAddSet}
            disabled={sets.length >= MAX_SETS || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Icon name="plus" size={16} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Add set</Text>
          </TouchableOpacity>
        </View>
      )}

      {!readOnly && !hideCompleteButton && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.completeButton, (!allSetsChecked || isExerciseFinalized || isLoadingSets || isCompletingExercise) && styles.disabledButton]}
            onPress={handleCompleteRequest}
            disabled={!allSetsChecked || isExerciseFinalized || isLoadingSets || isCompletingExercise}
          >
            <Text style={styles.completeButtonText}>
              {isExerciseFinalized ? 'Completed' : 'Complete Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {completionData && (
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowConfirmModal(false);
            setAchievedPRs([]);
          }}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowConfirmModal(false);
              setAchievedPRs([]);
            }}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>Complete Exercise?</Text>
                    <Text style={styles.modalDescription}>
                  Mark this exercise as completed and move to the next one?
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.dualButton]}
                        onPress={() => {
                          setShowConfirmModal(false);
                          setAchievedPRs([]);
                          completeExercise();
                        }}
                      >
                    <Text style={styles.confirmButtonText}>Complete</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, styles.dualButton]}
                        onPress={() => {
                          setShowConfirmModal(false);
                          setAchievedPRs([]);
                        }}
                      >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {isCompletingExercise && (
        <View style={styles.completingOverlay}>
          <View style={styles.completingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.completingText}>Completing exercise...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Memoize component to prevent re-renders when props don't change
export const ExerciseTracker = React.memo(ExerciseTrackerComponent);