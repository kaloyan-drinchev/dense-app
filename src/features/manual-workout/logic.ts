import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { workoutSessionService } from '@/db/services';
import { ExerciseData } from '@/constants/exercise-database';
import { AVAILABLE_EXERCISES, CATEGORIES } from './manual-data';

export interface ManualExercise {
  id: string;
  name: string;
}

export const useManualWorkoutLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshSession } = useActiveWorkout();
  
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
      console.log('🏋️ [ManualWorkout] Starting manual workout session using NEW system');
      
      // Prepare exercises data for NEW system
      const exercisesData = exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        targetSets: 3, // Default number of sets
        targetReps: '10', // Default reps per set
        restSeconds: 60, // Default rest time
        isCardio: false,
      }));

      // Create workout session in NEW system (workout_sessions + session_exercises + session_sets)
      const sessionId = await workoutSessionService.startManualWorkoutSession(
        user.id,
        workoutName.trim(),
        'manual',
        exercisesData
      );

      if (!sessionId) {
        throw new Error('Failed to create workout session');
      }

      console.log('✅ [ManualWorkout] Session created:', sessionId);

      // Refresh ActiveWorkoutContext to load the new session
      await refreshSession();

      // Navigate to workout session - use replace so back button works correctly
      router.replace('/workout-session');
    } catch (error) {
      console.error('❌ Error starting manual workout:', error);
      Alert.alert('Error', 'Failed to start manual workout');
      setSaving(false);
    }
  };

  const closePicker = () => {
    setShowExercisePicker(false);
    setSelectedExercises([]);
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const handleBack = () => router.back();

  return {
    // State
    workoutName,
    setWorkoutName,
    exercises,
    saving,
    showExercisePicker,
    setShowExercisePicker,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedExercises,
    filteredExercises,
    AVAILABLE_EXERCISES,
    CATEGORIES,

    // Handlers
    handleToggleExercise,
    handleAddSelectedExercises,
    handleRemoveExercise,
    handleStartWorkout,
    closePicker,
    handleBack
  };
};