import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
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
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, isCacheValid } = useWorkoutCacheStore();
  
  // State for generated program data
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [loadingProgram, setLoadingProgram] = useState(!cachedProgram);
  
  // State for user progress tracking
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loadingProgress, setLoadingProgress] = useState(!cachedProgress);
  
  // State for weight tracking data
  const [wizardData, setWizardData] = useState<any>(null);
  const [loadingWizard, setLoadingWizard] = useState(false); // Start as false, will be set to true only when loading
  
  // Use separate refs to prevent multiple simultaneous calls for each function
  const isLoadingProgramRef = useRef(false);
  const isLoadingProgressRef = useRef(false);
  const isLoadingWizardRef = useRef(false);

  // Load generated program data
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgramRef.current) {
      return;
    }
    
    try {
      isLoadingProgramRef.current = true;
      setLoadingProgram(true);
      
      // Use dynamic import like Programs tab does
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (wizardResults?.generatedSplit) {
        // Handle both string and object types
        const program = typeof wizardResults.generatedSplit === 'string'
          ? JSON.parse(wizardResults.generatedSplit)
          : wizardResults.generatedSplit;
        
        // Create a better program title based on muscle priorities (like Programs tab)
        if (wizardResults.musclePriorities) {
          const priorities = typeof wizardResults.musclePriorities === 'string'
            ? JSON.parse(wizardResults.musclePriorities)
            : wizardResults.musclePriorities;
          const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          program.displayTitle = `${priorityText} Focus`;
        }
        
        setGeneratedProgram(program);
        // Update cache
        const { setWorkoutData } = useWorkoutCacheStore.getState();
        setWorkoutData({ generatedProgram: program });
      }
    } catch (error) {
      console.error('❌ Progress: Error loading generated program:', error);
    } finally {
      isLoadingProgramRef.current = false;
      setLoadingProgram(false);
    }
  }, [user?.id]);

  // Load user progress data
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgressRef.current) {
      return;
    }
    
    try {
      isLoadingProgressRef.current = true;
      setLoadingProgress(true);
      
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        // Update cache
        const { setWorkoutData } = useWorkoutCacheStore.getState();
        setWorkoutData({ userProgressData: progress });
      }
    } catch (error) {
      console.error('❌ Progress: Error loading user progress:', error);
    } finally {
      isLoadingProgressRef.current = false;
      setLoadingProgress(false);
    }
  }, [user?.id]);

  // Load wizard data for weight tracking
  const loadWizardData = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    
    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingWizardRef.current) {
      return;
    }
    
    try {
      isLoadingWizardRef.current = true;
      if (showLoading) {
        setLoadingWizard(true);
      }
      
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      setWizardData(wizardResults);
    } catch (error) {
      console.error('❌ Progress: Error loading wizard data:', error);
    } finally {
      isLoadingWizardRef.current = false;
      if (showLoading) {
        setLoadingWizard(false);
      }
    }
  }, [user?.id]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      // Use cached data immediately if available
      if (cachedProgram && cachedProgress && isCacheValid()) {
        setGeneratedProgram(cachedProgram);
        setUserProgressData(cachedProgress);
        setLoadingProgram(false);
        setLoadingProgress(false);
        setLoadingWizard(false); // Don't show loading for wizard data if we have cached program/progress
        
        // Check cache age to decide if background refresh is needed
        const cacheAge = useWorkoutCacheStore.getState().lastUpdated 
          ? Date.now() - useWorkoutCacheStore.getState().lastUpdated 
          : Infinity;
        if (cacheAge < 60000) {
          // Cache is fresh (< 1 minute) - only load wizard data in background
          loadWizardData(false).catch(() => {
            // Silently fail - wizard data is not critical for showing the screen
          });
          return; // Skip full refresh
        }
        
        // Cache is stale (>= 1 minute) - refresh all data in background WITHOUT showing loading spinner
        Promise.allSettled([
          loadGeneratedProgram(),
          loadUserProgress(),
          loadWizardData(false)
        ]).then((results) => {
          // Check for any failed promises
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.error('❌ Progress: Failed to refresh cached data:', failures.map(f => (f as PromiseRejectedResult).reason));
          }
        });
        return; // Don't fall through - keep showing cached data while refreshing in background
      }
      // No cache or cache is stale - load everything
      loadGeneratedProgram();
      loadUserProgress();
      loadWizardData();
    } else {
      // No user - set all loading to false
      setLoadingProgram(false);
      setLoadingProgress(false);
      setLoadingWizard(false);
    }
  }, [user?.id, loadGeneratedProgram, loadUserProgress, loadWizardData]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
        // Use cache if valid, otherwise reload
        if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
          setGeneratedProgram(cache.generatedProgram);
          setUserProgressData(cache.userProgressData);
          setLoadingProgram(false);
          setLoadingProgress(false);
          setLoadingWizard(false); // Don't show loading for wizard data if we have cached program/progress
          // Load wizard data in background without blocking UI (don't show loading)
          loadWizardData(false).catch(() => {
            // Silently fail - wizard data is not critical
          });
        } else {
          loadGeneratedProgram();
          loadUserProgress();
          loadWizardData(true); // Show loading when loading fresh data
        }
      } else {
        // No user - set all loading to false
        setLoadingProgram(false);
        setLoadingProgress(false);
        setLoadingWizard(false);
      }
    }, [user?.id, loadGeneratedProgram, loadUserProgress, loadWizardData])
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