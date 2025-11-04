import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';
// Services now imported dynamically to match working Programs tab pattern
import { WorkoutProgressCharts } from '@/components/WorkoutProgressCharts';
import { WeightTracker } from '@/components/WeightTracker';
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
  
  // State for weight tracking data
  const [wizardData, setWizardData] = useState<any>(null);
  const [loadingWizard, setLoadingWizard] = useState(true);

  // Load generated program data
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingProgram(true);
      
      // Use dynamic import like Programs tab does
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (wizardResults?.generatedSplit) {
        const generatedProgram = JSON.parse(wizardResults.generatedSplit);
        
        // Create a better program title based on muscle priorities (like Programs tab)
        if (wizardResults.musclePriorities) {
          const priorities = JSON.parse(wizardResults.musclePriorities);
          const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          generatedProgram.displayTitle = `${priorityText} Focus`;
        }
        
        setGeneratedProgram(generatedProgram);
      }
    } catch (error) {
      console.error('❌ Progress: Error loading generated program:', error);
    } finally {
      setLoadingProgram(false);
    }
  }, [user?.id]);

  // Load user progress data
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingProgress(true);
      
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
      }
    } catch (error) {
      console.error('❌ Progress: Error loading user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user?.id]);

  // Load wizard data for weight tracking
  const loadWizardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingWizard(true);
      
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      setWizardData(wizardResults);
    } catch (error) {
      console.error('❌ Progress: Error loading wizard data:', error);
    } finally {
      setLoadingWizard(false);
    }
  }, [user?.id]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadGeneratedProgram();
      loadUserProgress();
      loadWizardData();
    }, [loadGeneratedProgram, loadUserProgress, loadWizardData])
  );

  // Calculate progress data for charts
  const progressData = useMemo(() => {
    return calculateWorkoutProgress(generatedProgram, userProgressData);
  }, [generatedProgram, userProgressData]);


  if (loadingProgram || loadingProgress || loadingWizard) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading progress data...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!generatedProgram && !userProgressData) {
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
            <Text style={styles.title}>Track your consistency</Text>
          </View>

          {/* Workout Progress Charts - only show if we have data */}
          {generatedProgram && (
            <WorkoutProgressCharts
              currentWeek={progressData.currentWeek}
              currentDay={progressData.currentDay}
              totalWeeks={progressData.totalWeeks}
              daysPerWeek={progressData.daysPerWeek}
            />
          )}

          {/* Weight Progress Section - always show */}
          <View style={styles.section}>
            <WeightTracker
              targetWeight={userProfile?.['targetWeight'] as number | undefined}
              initialWeight={wizardData?.weight}
            />
          </View>

          {/* Debug info at bottom if needed */}
          {!generatedProgram && (
            <View style={styles.section}>
              <Text style={styles.emptyText}>
                Complete your workout program setup to see workout progress charts
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
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
  loadingSpinner: {
    marginBottom: 16,
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