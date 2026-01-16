import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { analyzeExercisePRs, type ExercisePRs } from '@/utils/pr-tracking';

export interface CompletedWorkout {
  date: string;
  workoutName?: string;
  totalVolume?: number;
  exercises?: Array<{
    name: string;
    totalVolume: number;
  }>;
}

export const useAchievementsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [bestWorkoutVolume, setBestWorkoutVolume] = useState<CompletedWorkout | null>(null);
  const [totalVolumeLifted, setTotalVolumeLifted] = useState(0);

  // The Big 3 exercises definition
  const keyExercises = [
    { name: 'Bench Press', ids: ['bench-press', 'barbell-bench-press', 'flat-barbell-bench-press'] },
    { name: 'Squat', ids: ['squat', 'barbell-squat', 'back-squat'] },
    { name: 'Deadlift', ids: ['deadlift', 'barbell-deadlift', 'conventional-deadlift'] },
  ];

  useEffect(() => {
    loadAchievements();
  }, [user?.id]);

  const loadAchievements = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      
      // Load exercise PRs
      if (progress?.weeklyWeights) {
        const weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;
        const logs = weeklyWeights?.exerciseLogs || {};
        const prs = analyzeExercisePRs(logs);
        setExercisePRs(prs);
      }

      // Load best workout volume
      if (progress?.completedWorkouts) {
        const workouts: CompletedWorkout[] = Array.isArray(progress.completedWorkouts)
          ? progress.completedWorkouts
          : typeof progress.completedWorkouts === 'string'
          ? JSON.parse(progress.completedWorkouts)
          : [];

        // Find workout with highest volume
        const bestWorkout = workouts.reduce<CompletedWorkout | null>((best, current) => {
          if (!current.totalVolume) return best;
          if (!best || current.totalVolume > (best.totalVolume || 0)) {
            return current;
          }
          return best;
        }, null);

        setBestWorkoutVolume(bestWorkout);

        // Calculate total volume lifted
        const total = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        setTotalVolumeLifted(total);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleBack = () => router.back();

  const hasAnyPRs = keyExercises.some(ex => ex.ids.some(id => exercisePRs[id]));

  return {
    loading,
    exercisePRs,
    bestWorkoutVolume,
    totalVolumeLifted,
    keyExercises,
    hasAnyPRs,
    formatVolume,
    formatDate,
    handleBack
  };
};