import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';

interface ManualExercise {
  id: string;
  name: string;
}

export default function ManualWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [workoutName, setWorkoutName] = useState<string>('');
  const [exercises, setExercises] = useState<ManualExercise[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Add exercise form
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Required', 'Please enter an exercise name');
      return;
    }

    const newExercise: ManualExercise = {
      id: `manual-${Date.now()}`,
      name: newExerciseName.trim(),
    };

    setExercises([...exercises, newExercise]);
    
    // Reset form
    setNewExerciseName('');
    setShowAddExercise(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter(ex => ex.id !== exerciseId));
          },
        },
      ]
    );
  };

  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Required', 'Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Required', 'Please add at least one exercise');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setSaving(true);

    try {
      // Prepare workout structure compatible with workout-session
      const manualWorkoutData = {
        id: 'manual-workout',
        name: workoutName.trim(),
        type: 'manual',
        category: 'manual',
        estimatedDuration: exercises.length * 10, // Rough estimate
        exercises: exercises.map((ex, index) => ({
          id: ex.id,
          name: ex.name,
          targetMuscle: 'General',
          sets: 3, // Default number of sets
          reps: '10', // Default reps per set
          restTime: 60, // Default rest time
          notes: '',
        })),
      };

      // Save workout data to cache store for workout-session to use
      const { setManualWorkout } = useWorkoutCacheStore.getState();
      setManualWorkout(manualWorkoutData);

      // Navigate to workout session - use replace so back button works correctly
      // Note: Don't call setSaving(false) here as component will unmount after navigation
      router.replace('/workout-session');
    } catch (error) {
      console.error('❌ Error starting manual workout:', error);
      Alert.alert('Error', 'Failed to start manual workout');
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title with Back Button */}
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Manual Workout</Text>
          </View>
          
          {/* Workout Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Workout Name *</Text>
            <TextInput
              style={styles.input}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g., Morning Workout, Upper Body, etc."
              placeholderTextColor={colors.lightGray}
            />
          </View>

          {/* Exercises List */}
          <View style={styles.section}>
            <View style={styles.exercisesHeader}>
              <Text style={styles.sectionLabel}>Exercises ({exercises.length})</Text>
              {!showAddExercise && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddExercise(true)}
                >
                  <Icon name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              )}
            </View>

            {exercises.length === 0 && !showAddExercise && (
              <View style={styles.emptyState}>
                <Icon name="clipboard" size={48} color={colors.lightGray} />
                <Text style={styles.emptyStateText}>No exercises added yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap "Add Exercise" to get started</Text>
              </View>
            )}

            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(exercise.id)}
                    style={styles.removeButton}
                  >
                    <Icon name="trash-2" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add Exercise Form */}
            {showAddExercise && (
              <View style={styles.addExerciseForm}>
                <Text style={styles.formTitle}>Add Exercise</Text>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Exercise Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                    placeholder="e.g., Bench Press, Squats, Deadlifts"
                    placeholderTextColor={colors.lightGray}
                    autoFocus
                  />
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddExercise(false);
                      setNewExerciseName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.confirmButton]}
                    onPress={handleAddExercise}
                  >
                    <Icon name="check" size={18} color={colors.black} />
                    <Text style={styles.confirmButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        {exercises.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleStartWorkout}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <>
                  <Icon name="play" size={20} color={colors.black} />
                  <Text style={styles.saveButtonText}>Create Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 14,
    color: colors.white,
    fontSize: 16,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.white,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginTop: 4,
  },
  exerciseCard: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 4,
  },
  exerciseVolume: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  addExerciseForm: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  formTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formFieldSmall: {
    flex: 1,
  },
  inputSmall: {
    ...typography.body,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 12,
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.mediumGray,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '700',
  },
});

