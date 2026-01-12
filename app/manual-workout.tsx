import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService, activeWorkoutSessionService } from '@/db/services';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { exerciseDatabase, ExerciseData } from '@/constants/exercise-database';

interface ManualExercise {
  id: string;
  name: string;
}

// Only allow these 36 exercises from the workout program
const ALLOWED_EXERCISE_NAMES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Dumbbell Flyes',
  'Overhead Press',
  'Lateral Raises',
  'Tricep Pushdowns',
  'Incline Barbell Bench Press',
  'Seated Dumbbell Press',  // Fixed: was "Dumbbell Shoulder Press"
  'Cable Flyes',
  'Arnold Press',
  'Front Raises',
  'Overhead Tricep Extension',
  'Deadlift',
  'Pull-ups',
  'Barbell Row',
  'Lat Pulldown',
  'Face Pulls',
  'Barbell Curl',
  'Rack Pulls',
  'Chin-ups',
  'Dumbbell Row',
  'Cable Row',
  'Rear Delt Flyes',
  'Hammer Curl',
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Romanian Deadlift',
  'Leg Curl',
  'Calf Raise',
  'Front Squat',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Stiff Leg Deadlift',
  'Seated Leg Curl',
  'Seated Calf Raise',
];

// Filter to only include the 36 allowed exercises
const AVAILABLE_EXERCISES = exerciseDatabase.filter(ex =>
  ALLOWED_EXERCISE_NAMES.some(name =>
    ex.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(ex.name.toLowerCase())
  )
);

// Get unique categories for filter chips
const CATEGORIES = ['All', ...Array.from(new Set(AVAILABLE_EXERCISES.map(ex => ex.category)))];

export default function ManualWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [workoutName, setWorkoutName] = useState<string>('');
  const [exercises, setExercises] = useState<ManualExercise[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Bottom sheet state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExercises, setSelectedExercises] = useState<ExerciseData[]>([]);

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return AVAILABLE_EXERCISES.filter(ex => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      
      // Don't show already added exercises
      const notAlreadyAdded = !exercises.some(e => e.id === ex.id);
      
      return matchesSearch && matchesCategory && notAlreadyAdded;
    });
  }, [searchQuery, selectedCategory, exercises]);

  const handleToggleExercise = (exercise: ExerciseData) => {
    const isSelected = selectedExercises.some(e => e.id === exercise.id);
    
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else {
      // Limit to 8 exercises
      if (selectedExercises.length >= 8) {
        Alert.alert('Maximum Reached', 'You can select up to 8 exercises at a time');
        return;
      }
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleAddSelectedExercises = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Selection', 'Please select at least one exercise');
      return;
    }

    const newExercises: ManualExercise[] = selectedExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
    }));
    
    setExercises([...exercises, ...newExercises]);
    
    // Close bottom sheet and reset
    setShowExercisePicker(false);
    setSelectedExercises([]);
    setSearchQuery('');
    setSelectedCategory('All');
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
      // Generate unique workout ID for this manual workout session
      const workoutSessionId = `manual-${Date.now()}`;
      
      // Prepare workout structure compatible with workout-session
      const manualWorkoutData = {
        id: 'manual-workout',
        name: workoutName.trim(),
        type: 'manual',
        category: 'manual',
        estimatedDuration: exercises.length * 10, // Rough estimate
        exercises: exercises.map((ex, index) => ({
          id: `${workoutSessionId}-${ex.id}`, // Prefix with session ID for uniqueness
          name: ex.name,
          targetMuscle: 'General',
          sets: 3, // Default number of sets
          reps: '10', // Default reps per set
          restTime: 60, // Default rest time
          notes: '',
          thumbnail_url: ex.thumbnail_url, // CRITICAL: Preserve media URLs
          video_url: ex.video_url, // CRITICAL: Preserve media URLs
        })),
      };

      // CRITICAL: Create active session for manual workout
      await activeWorkoutSessionService.create(
        user.id,
        'manual',
        workoutName.trim()
      );

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
            <Text style={styles.sectionLabel}>Workout Name</Text>
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
            {/* <View style={styles.exercisesHeader}>
              <Text style={styles.sectionLabel}>Exercises ({exercises.length})</Text>
            </View>

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="clipboard" size={48} color={colors.lightGray} />
                <Text style={styles.emptyStateText}>No exercises added yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap button below to choose from {AVAILABLE_EXERCISES.length} exercises</Text>
              </View>
            )} */}

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

            {/* Add Exercise Button */}
            <TouchableOpacity
              style={styles.openPickerButton}
              onPress={() => setShowExercisePicker(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus-circle" size={20} color={colors.primary} />
              <Text style={styles.openPickerButtonText}>
                Add Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Exercise Picker Bottom Sheet */}
        <Modal
          visible={showExercisePicker}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setShowExercisePicker(false);
            setSelectedExercises([]);
            setSearchQuery('');
            setSelectedCategory('All');
          }}
        >
          <SafeAreaView style={styles.bottomSheetContainer}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowExercisePicker(false);
                  setSelectedExercises([]);
                  setSearchQuery('');
                  setSelectedCategory('All');
                }} 
                style={styles.closeButton}
              >
                <Icon name="arrow-left" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>
                {selectedExercises.length > 0 
                  ? `${selectedExercises.length} Selected` 
                  : 'Select Exercises'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            
            {/* Content Section with darkGray background */}
            <View style={styles.contentSection}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Icon name="search" size={18} color={colors.lightGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={colors.lightGray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="x-circle" size={18} color={colors.lightGray} />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Category Filter Chips */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryChipsContainer}
                contentContainerStyle={styles.categoryChipsContent}
              >
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Exercise List */}
              <ScrollView 
                style={styles.exerciseList}
                contentContainerStyle={styles.exerciseListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredExercises.length === 0 ? (
                  <View style={styles.emptyExerciseList}>
                    <Icon name="search" size={48} color={colors.lightGray} />
                    <Text style={styles.emptyExerciseText}>No exercises found</Text>
                    <Text style={styles.emptyExerciseSubtext}>
                      Try adjusting your search or category filter
                    </Text>
                  </View>
                ) : (
                  filteredExercises.map((exercise) => {
                    const isSelected = selectedExercises.some(e => e.id === exercise.id);
                    
                    return (
                      <TouchableOpacity
                        key={exercise.id}
                        style={[
                          styles.exerciseItem,
                          isSelected && styles.exerciseItemSelected
                        ]}
                        onPress={() => handleToggleExercise(exercise)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.exerciseItemContent}>
                          <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                          <Text style={styles.exerciseItemMuscle}>
                            {exercise.targetMuscle} • {exercise.category}
                          </Text>
                        </View>
                        <Icon 
                          name={isSelected ? "check-circle" : "circle"} 
                          size={24} 
                          color={isSelected ? colors.primary : colors.lightGray} 
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Floating Add Button */}
              {selectedExercises.length > 0 && (
                <View style={styles.floatingButtonContainer}>
                  <TouchableOpacity
                    style={styles.floatingAddButton}
                    onPress={handleAddSelectedExercises}
                    activeOpacity={0.8}
                  >
                    <Icon name="check" size={20} color={colors.black} />
                    <Text style={styles.floatingAddButtonText}>
                      Add {selectedExercises.length} Exercise{selectedExercises.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

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
  openPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  openPickerButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
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
  // Bottom Sheet Styles (Full Screen)
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: colors.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  closeButton: {
    padding: 4,
    marginRight: 8,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
    flex: 1,
    fontSize: 20,
  },
  headerSpacer: {
    width: 32,
  },
  contentSection: {
    flex: 1,
    backgroundColor: colors.darkGray,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mediumGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    fontSize: 18,
  },
  categoryChipsContainer: {
    marginTop: 12,
    marginBottom: 6,
    maxHeight: 32,
  },
  categoryChipsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.mediumGray,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: colors.black,
  },
  exerciseList: {
    flex: 1,
    marginTop: 4,
  },
  exerciseListContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mediumGray,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseItemSelected: {
    backgroundColor: colors.darkGray,
    borderColor: colors.primary,
  },
  exerciseItemContent: {
    flex: 1,
    marginRight: 12,
  },
  exerciseItemName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 2,
  },
  exerciseItemMuscle: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontSize: 12,
  },
  emptyExerciseList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyExerciseText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyExerciseSubtext: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginTop: 4,
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: colors.darkGray,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  floatingAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  floatingAddButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
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

