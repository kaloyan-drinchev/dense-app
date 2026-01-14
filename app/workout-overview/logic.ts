import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { analyzeExercisePRs } from '@/utils/pr-tracking';

export interface ExerciseVolume {
  name: string;
  sets: number;
  completedSets: number;
  totalReps: number;
  totalVolume: number; // in kg
}

export interface PRInfo {
  exerciseName: string;
  prType: string;
  value: number;
  improvement?: number;
}

export const useWorkoutOverviewLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  // Parse data from params
  const workoutName = params.workoutName as string || 'Workout';
  const duration = params.duration as string || '0';
  const exercisesData: ExerciseVolume[] = params.exercises ? JSON.parse(params.exercises as string) : [];
  const totalVolume = params.totalVolume ? parseFloat(params.totalVolume as string) : 0;

  const [prsAchieved, setPRsAchieved] = useState<PRInfo[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(true);

  useEffect(() => {
    checkForPRs();
  }, [user?.id]);

  const checkForPRs = async () => {
    if (!user?.id) {
      setLoadingPRs(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      if (!progress?.weeklyWeights) {
        setLoadingPRs(false);
        return;
      }

      const weeklyWeights = typeof progress.weeklyWeights === 'string'
        ? JSON.parse(progress.weeklyWeights)
        : progress.weeklyWeights;
      
      const exerciseLogs = weeklyWeights?.exerciseLogs || {};
      const allPRs = analyzeExercisePRs(exerciseLogs);
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Build a Set of exercise IDs from the current workout
      const workoutExerciseIds = new Set(
        exercisesData.map((ex) => 
          ex.name.toLowerCase().replace(/\s+/g, '-')
        )
      );
      
      // Check if any PRs were achieved today for exercises in THIS workout only
      const todaysPRs: PRInfo[] = [];
      
      Object.entries(allPRs).forEach(([exerciseId, prs]: [string, any]) => {
        // IMPORTANT: Skip exercises that weren't in the current workout
        if (!workoutExerciseIds.has(exerciseId)) {
          return;
        }
        
        // Format exercise name
        const exerciseName = exercisesData.find((ex) => 
          ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseId
        )?.name || exerciseId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        // Check weight PR
        if (prs.maxWeight && prs.maxWeight.date === today) {
          todaysPRs.push({
            exerciseName,
            prType: 'Weight',
            value: prs.maxWeight.value,
            improvement: prs.maxWeight.previousValue 
              ? prs.maxWeight.value - prs.maxWeight.previousValue 
              : undefined,
          });
        }
      });

      setPRsAchieved(todaysPRs);
    } catch (error) {
      console.error('Failed to check for PRs:', error);
    } finally {
      setLoadingPRs(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`; // tons
    }
    return `${Math.round(kg)}kg`;
  };

  const handleHomePress = () => {
    router.push('/(tabs)/Home');
  };

  return {
    workoutName,
    duration,
    exercisesData,
    totalVolume,
    prsAchieved,
    loadingPRs,
    formatDuration,
    formatVolume,
    handleHomePress
  };
};