import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { wizardResultsService, userProgressService } from '@/db/services';
import { WorkoutProgressCharts } from '@/components/WorkoutProgressCharts';
import { calculateWorkoutProgress } from '@/utils/progress-calculator';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram, programs } = useWorkoutStore();
  
  // State for generated program data
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  
  // State for user progress tracking
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Load generated program data
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingProgram(true);
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      if (wizardResults?.generatedSplit) {
        const generatedProgram = JSON.parse(wizardResults.generatedSplit);
        setGeneratedProgram(generatedProgram);
      }
    } catch (error) {
      console.error('Error loading generated program:', error);
    } finally {
      setLoadingProgram(false);
    }
  }, [user?.id]);

  // Load user progress data
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingProgress(true);
      const progress = await userProgressService.getByUserId(user.id);
      if (progress) {
        setUserProgressData(progress);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user?.id]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadGeneratedProgram();
      loadUserProgress();
    }, [loadGeneratedProgram, loadUserProgress])
  );

  // Calculate progress data for charts
  const progressData = useMemo(() => {
    return calculateWorkoutProgress(generatedProgram, userProgressData);
  }, [generatedProgram, userProgressData]);

  if (loadingProgram || loadingProgress) {
    return (
      <View style={[styles.container, { backgroundColor: colors.dark }]}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.loadingContainer} />
        </SafeAreaView>
      </View>
    );
  }

  if (!generatedProgram || !userProgressData) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Progress Data</Text>
            <Text style={styles.emptyText}>
              Start your first workout to track progress
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>Track your workout journey and consistency</Text>
          </View>

          {/* Progress Charts */}
          <WorkoutProgressCharts
            currentWeek={progressData.currentWeek}
            currentDay={progressData.currentDay}
            totalWeeks={progressData.totalWeeks}
            daysPerWeek={progressData.daysPerWeek}
          />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGray,
  },
});