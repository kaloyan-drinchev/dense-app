import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { CARDIO_TYPES } from '@/utils/cardio-calories';
import { getCardioIcon } from './cardio-ui-data';

export const useCardioWorkoutLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  
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
      const cardioType = CARDIO_TYPES.find(c => c.id === selectedType);
      
      // Create cardio workout structure compatible with workout-session
      // We'll create it as a single "exercise" that's just cardio
      const cardioWorkoutData = {
        id: 'cardio-workout',
        name: cardioType?.name || 'Cardio',
        type: 'cardio',
        category: 'cardio',
        estimatedDuration: targetMinutes, // User's target duration
        targetDuration: targetMinutes, // Store target for countdown
        cardioType: selectedType, // Store cardio type for later use
        exercises: [
          {
            id: `cardio-${selectedType}`,
            name: cardioType?.name || 'Cardio',
            targetMuscle: 'Cardio',
            sets: 1, // Single "set" representing the cardio session
            reps: '1', // Not used for cardio
            restTime: 0, // No rest for cardio
            notes: '',
            isCardio: true, // Flag to identify cardio exercises
          }
        ],
      };

      // Save workout data to cache store for workout-session to use
      const { setManualWorkout } = useWorkoutCacheStore.getState();
      setManualWorkout(cardioWorkoutData);

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