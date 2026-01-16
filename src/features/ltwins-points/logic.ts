import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/auth-store';
import {
  getUserLTwinsPoints,
  getUserLTwinsPointsHistory,
  isLTwinsGameEnabled,
  toggleLTwinsGame,
  getPointsChartData,
  type LTwinsPointsHistory,
} from '@/utils/ltwins-game';

export const useLTwinsPointsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LTwinsPointsHistory[]>([]);
  const [gameEnabled, setGameEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [currentPoints, pointsHistory, enabled] = await Promise.all([
        getUserLTwinsPoints(user.id),
        getUserLTwinsPointsHistory(user.id),
        isLTwinsGameEnabled(user.id),
      ]);
      
      setPoints(currentPoints);
      setHistory(pointsHistory);
      setGameEnabled(enabled);
    } catch (error) {
      console.error('Failed to load L Twins data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGame = async () => {
    if (!user?.id) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const newState = !gameEnabled;
      await toggleLTwinsGame(user.id, newState);
      setGameEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle L Twins game:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const chartData = getPointsChartData(history);

  return {
    points,
    history,
    gameEnabled,
    loading,
    chartData,
    handleToggleGame,
    handleBack,
  };
};