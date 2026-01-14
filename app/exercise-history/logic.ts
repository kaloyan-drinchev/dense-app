import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService } from '@/db/services';
import { 
  analyzeExercisePRs, 
  type ExerciseLogs,
  type ExercisePRs,
  type ExerciseSession
} from '@/utils/pr-tracking';

export const useExerciseHistoryLogic = () => {
  const router = useRouter();
  const { exerciseId, exerciseName } = useLocalSearchParams<{ 
    exerciseId: string; 
    exerciseName?: string; 
  }>();
  const { user } = useAuthStore();
  
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);

  const displayName = exerciseName || exerciseId?.replace(/-/g, ' ') || 'Exercise';

  const loadExerciseHistory = useCallback(async () => {
    if (!user?.id || !exerciseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress?.weeklyWeights) {
        const weeklyWeights = typeof progress.weeklyWeights === 'string' 
          ? JSON.parse(progress.weeklyWeights) 
          : progress.weeklyWeights;
          
        const logs = weeklyWeights?.exerciseLogs || {};
        
        setExerciseLogs(logs);
        
        // Analyze PRs for all exercises
        const allPRs = analyzeExercisePRs(logs);
        setExercisePRs(allPRs);
        
        // Get sessions for this specific exercise
        const exerciseSessions = logs[exerciseId] || [];
        const sortedSessions = [...exerciseSessions].sort((a: ExerciseSession, b: ExerciseSession) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Failed to load exercise history:', error);
      Alert.alert('Error', 'Failed to load exercise history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId]);

  useFocusEffect(
    React.useCallback(() => {
      loadExerciseHistory();
    }, [loadExerciseHistory])
  );

  const currentPRs = exerciseId ? exercisePRs[exerciseId] : undefined;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleBack = () => {
    router.back();
  };

  return {
    loading,
    displayName,
    currentPRs,
    sessions,
    exerciseId,
    exerciseLogs,
    formatDate,
    handleBack
  };
};