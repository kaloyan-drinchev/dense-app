import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { userProgressService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { 
  PUSH_DAY_A, PUSH_DAY_B, 
  PULL_DAY_A, PULL_DAY_B, 
  LEG_DAY_A, LEG_DAY_B, 
  WorkoutTemplate 
} from '@/lib/workout-templates';

export const useProgramDetailsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);

  // All workout templates
  const workoutTemplates: WorkoutTemplate[] = [
    PUSH_DAY_A,
    PUSH_DAY_B,
    PULL_DAY_A,
    PULL_DAY_B,
    LEG_DAY_A,
    LEG_DAY_B,
  ];

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const progress = await userProgressService.getByUserId(user.id);
      setUserProgressData(progress);
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate how many times each workout type has been completed
  const getWorkoutCompletionCount = (workoutType: string) => {
    try {
      if (!userProgressData?.completedWorkouts) return 0;
      
      const completedRaw = userProgressData.completedWorkouts;
      let completed: any[] = [];
      
      if (Array.isArray(completedRaw)) {
        completed = completedRaw;
      } else if (typeof completedRaw === 'string') {
        completed = JSON.parse(completedRaw);
      }
      
      // Count workouts matching this type
      return completed.filter((item: any) => 
        item.workoutName && item.workoutName.toLowerCase().includes(workoutType.toLowerCase())
      ).length;
    } catch {
      return 0;
    }
  };

  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  const handleBack = () => {
    router.back();
  };

  return {
    // State
    loading,
    showDescription,
    expandedWorkout,
    workoutTemplates,
    
    // Actions
    toggleDescription,
    toggleWorkoutExpansion,
    handleBack,
    getWorkoutCompletionCount
  };
};