import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { workoutSessionService } from '@/db/services';
import { CARDIO_TYPES } from '@/utils/cardio-calories';
import { getCardioIcon } from './cardio-ui-data';

export const useCardioWorkoutLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshSession } = useActiveWorkout();
  
  // Form state
  const [selectedType, setSelectedType] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState<number>(30);
  const [starting, setStarting] = useState(false);

  const handleStartSession = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Required', 'Please select a cardio type');
      return;
    }

    if (targetMinutes <= 0 || targetMinutes > 180) {
      Alert.alert('Invalid Duration', 'Please select a target duration between 1 and 180 minutes');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setStarting(true);

    try {
      console.log('🏃 [CardioWorkout] Starting cardio workout session using NEW system');
      
      const cardioType = CARDIO_TYPES.find(c => c.id === selectedType);
      const workoutName = cardioType?.name || 'Cardio';
      
      // Prepare cardio exercise data for NEW system
      // Create it as a single "exercise" that represents the cardio session
      const exercisesData = [
        {
          id: `cardio-${selectedType}`,
          name: workoutName,
          targetSets: 1, // Single "set" representing the cardio session
          targetReps: `${targetMinutes} min`, // Display target duration as reps
          restSeconds: 0, // No rest for cardio
          isCardio: true,
        }
      ];

      // Create workout session in NEW system (workout_sessions + session_exercises + session_sets)
      const sessionId = await workoutSessionService.startManualWorkoutSession(
        user.id,
        workoutName,
        'cardio',
        exercisesData
      );

      if (!sessionId) {
        throw new Error('Failed to create cardio session');
      }

      console.log('✅ [CardioWorkout] Session created:', sessionId);

      // Refresh ActiveWorkoutContext to load the new session
      await refreshSession();

      // Navigate to workout session - use replace so back button works correctly
      router.replace('/workout-session');
    } catch (error) {
      console.error('❌ Error starting cardio session:', error);
      Alert.alert('Error', 'Failed to start cardio session');
      setStarting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return {
    selectedType,
    setSelectedType,
    targetMinutes,
    setTargetMinutes,
    starting,
    handleStartSession,
    handleBack,
    CARDIO_TYPES,
    getCardioIcon
  };
};