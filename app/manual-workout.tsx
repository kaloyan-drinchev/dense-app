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

interface ManualExercise {
  id: string;
  name: string;
  sets: Array<{
    reps: number;
    weightKg: number;
  }>;
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
  const [newExerciseSets, setNewExerciseSets] = useState<string>('3');
  const [newExerciseReps, setNewExerciseReps] = useState<string>('10');
  const [newExerciseWeight, setNewExerciseWeight] = useState<string>('0');

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Required', 'Please enter an exercise name');
      return;
    }

    const sets = parseInt(newExerciseSets) || 3;
    const reps = parseInt(newExerciseReps) || 10;
    const weight = parseFloat(newExerciseWeight) || 0;

    if (sets < 1 || sets > 10) {
      Alert.alert('Invalid', 'Sets must be between 1 and 10');
      return;
    }

    if (reps < 1 || reps > 50) {
      Alert.alert('Invalid', 'Reps must be between 1 and 50');
      return;
    }

    if (weight < 0 || weight > 1000) {
      Alert.alert('Invalid', 'Weight must be between 0 and 1000 kg');
      return;
    }

    const newExercise: ManualExercise = {
      id: `manual-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: Array.from({ length: sets }, () => ({
        reps: reps,
        weightKg: weight,
      })),
    };

    setExercises([...exercises, newExercise]);
    
    // Reset form
    setNewExerciseName('');
    setNewExerciseSets('3');
    setNewExerciseReps('10');
    setNewExerciseWeight('0');
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

  const handleSaveWorkout = async () => {
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
      const today = new Date().toISOString().split('T')[0];
      
      // Get current progress
      const progress = await userProgressService.getByUserId(user.id);
      if (!progress) {
        Alert.alert('Error', 'Could not load user progress');
        return;
      }

      // Parse completedWorkouts
      const completedWorkouts = Array.isArray(progress.completedWorkouts)
        ? progress.completedWorkouts
        : (typeof progress.completedWorkouts === 'string'
            ? JSON.parse(progress.completedWorkouts)
            : []);

      // Calculate total volume
      const totalVolume = exercises.reduce((total, exercise) => {
        const exerciseVolume = exercise.sets.reduce((sum, set) => {
          return sum + (set.reps * set.weightKg);
        }, 0);
        return total + exerciseVolume;
      }, 0);

      // Add manual workout to completed workouts
      const manualWorkoutEntry = {
        date: today,
        workoutName: `Manual: ${workoutName.trim()}`,
        workoutIndex: -1, // -1 indicates manual workout
        totalVolume: Math.round(totalVolume),
        duration: 0, // User didn't track duration
        percentageSuccess: 100, // Assume all completed
        exercises: exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.length,
          completedSets: ex.sets.length,
        })),
        timestamp: new Date().toISOString(),
      };

      completedWorkouts.push(manualWorkoutEntry);

      // Parse weeklyWeights
      const weeklyWeights = typeof progress.weeklyWeights === 'string'
        ? JSON.parse(progress.weeklyWeights)
        : progress.weeklyWeights || {};

      // Save exercise logs
      if (!weeklyWeights.exerciseLogs) {
        weeklyWeights.exerciseLogs = {};
      }

      exercises.forEach(exercise => {
        const exerciseId = exercise.name.toLowerCase().replace(/\s+/g, '-');
        
        if (!weeklyWeights.exerciseLogs[exerciseId]) {
          weeklyWeights.exerciseLogs[exerciseId] = [];
        }

        weeklyWeights.exerciseLogs[exerciseId].push({
          date: today,
          unit: 'kg',
          sets: exercise.sets.map(set => ({
            reps: set.reps,
            weightKg: set.weightKg,
            isCompleted: true,
          })),
        });
      });

      // Update progress
      await userProgressService.update(progress.id, {
        completedWorkouts: completedWorkouts,
        weeklyWeights: weeklyWeights,
      });

      Alert.alert(
        'Success!',
        `Manual workout "${workoutName}" logged with ${exercises.length} exercises`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error saving manual workout:', error);
      Alert.alert('Error', 'Failed to save manual workout');
    } finally {
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
                <Text style={styles.exerciseDetails}>
                  {exercise.sets.length} sets × {exercise.sets[0].reps} reps @ {exercise.sets[0].weightKg} kg
                </Text>
                <Text style={styles.exerciseVolume}>
                  Volume: {Math.round(exercise.sets.length * exercise.sets[0].reps * exercise.sets[0].weightKg)} kg
                </Text>
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
                    placeholder="e.g., Bench Press"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formFieldSmall}>
                    <Text style={styles.formLabel}>Sets</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={newExerciseSets}
                      onChangeText={setNewExerciseSets}
                      placeholder="3"
                      placeholderTextColor={colors.lightGray}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>

                  <View style={styles.formFieldSmall}>
                    <Text style={styles.formLabel}>Reps</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={newExerciseReps}
                      onChangeText={setNewExerciseReps}
                      placeholder="10"
                      placeholderTextColor={colors.lightGray}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>

                  <View style={styles.formFieldSmall}>
                    <Text style={styles.formLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.inputSmall}
                      value={newExerciseWeight}
                      onChangeText={setNewExerciseWeight}
                      placeholder="0"
                      placeholderTextColor={colors.lightGray}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddExercise(false);
                      setNewExerciseName('');
                      setNewExerciseSets('3');
                      setNewExerciseReps('10');
                      setNewExerciseWeight('0');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.confirmButton]}
                    onPress={handleAddExercise}
                  >
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
              onPress={handleSaveWorkout}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <>
                  <Icon name="check" size={20} color={colors.black} />
                  <Text style={styles.saveButtonText}>Save Manual Workout</Text>
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

