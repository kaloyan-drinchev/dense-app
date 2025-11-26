import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutCacheStore } from "@/store/workout-cache-store";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { LoadingState } from '@/components/LoadingState';

export default function ProgramsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, isCacheValid } = useWorkoutCacheStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loading, setLoading] = useState(!cachedProgram || !cachedProgress);

  // Use separate refs to prevent multiple simultaneous calls for each function
  const isLoadingProgramRef = useRef(false);
  const isLoadingProgressRef = useRef(false);

  // Load generated program - wrapped in useCallback to prevent stale closures
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgramRef.current) {
      return;
    }

    try {
      isLoadingProgramRef.current = true;
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      console.log('🔍 Programs tab - Wizard results:', wizardResults ? 'Found' : 'Not found');
      console.log('🔍 Programs tab - Has generatedSplit:', !!wizardResults?.generatedSplit);
      
      if (!wizardResults) {
        console.log('⚠️ Programs tab - No wizard results found for user');
        return;
      }
      
      if (wizardResults.generatedSplit) {
        try {
          // Handle both string and object types
          const program = typeof wizardResults.generatedSplit === 'string' 
            ? JSON.parse(wizardResults.generatedSplit)
            : wizardResults.generatedSplit;
          
          console.log('🔍 Programs tab - Program parsed:', program?.programName || 'Unknown');
          
          // Create a better program title based on muscle priorities
          if (wizardResults.musclePriorities) {
            try {
              const priorities = typeof wizardResults.musclePriorities === 'string'
                ? JSON.parse(wizardResults.musclePriorities)
                : wizardResults.musclePriorities;
              const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              program.displayTitle = `${priorityText} Focus`;
            } catch (e) {
              console.error('Failed to parse muscle priorities:', e);
            }
          }
          
          setGeneratedProgram(program);
          // Update cache
          const { setWorkoutData } = useWorkoutCacheStore.getState();
          setWorkoutData({ generatedProgram: program });
          console.log('✅ Programs tab - Program loaded successfully:', program.programName || program.displayTitle);
        } catch (parseError) {
          console.error('❌ Failed to parse generatedSplit:', parseError);
          console.error('Raw generatedSplit type:', typeof wizardResults.generatedSplit);
          console.error('Raw generatedSplit:', wizardResults.generatedSplit);
        }
      } else {
        console.log('⚠️ Programs tab - No generatedSplit found in wizard results');
        console.log('Wizard results keys:', Object.keys(wizardResults));
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingProgramRef.current = false;
      // Loading state is managed by loadAllData, not here
    }
  }, [user?.id]);

  // Load user progress - wrapped in useCallback to prevent stale closures
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;

    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgressRef.current) {
      return;
    }

    try {
      isLoadingProgressRef.current = true;
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        // Update cache
        const { setWorkoutData } = useWorkoutCacheStore.getState();
        setWorkoutData({ userProgressData: progress });
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      isLoadingProgressRef.current = false;
      // Loading state is managed by loadAllData, not here
    }
  }, [user?.id]);

  // Coordinated loading function that ensures loading state is managed correctly
  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Use cached data immediately if available
    const cache = useWorkoutCacheStore.getState();
    if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
      setGeneratedProgram(cache.generatedProgram);
      setUserProgressData(cache.userProgressData);
      setLoading(false);
      
      // Check cache age to decide if background refresh is needed
      const cacheAge = cache.lastUpdated 
        ? Date.now() - cache.lastUpdated 
        : Infinity;
      if (cacheAge < 60000) {
        return; // Cache is fresh (< 1 minute) - skip refresh
      }
      
      // Cache is stale (>= 1 minute) - refresh in background WITHOUT showing loading spinner
      Promise.allSettled([
        loadGeneratedProgram(),
        loadUserProgress()
      ]).then((results) => {
        // Check for any failed promises
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.error('❌ Failed to refresh cached data:', failures.map(f => (f as PromiseRejectedResult).reason));
        }
      });
      return; // Don't set loading to true - keep showing cached data
    }

    // No valid cache - show loading spinner and load fresh data
    setLoading(true);
    
    // Load both in parallel
    const programPromise = loadGeneratedProgram();
    const progressPromise = loadUserProgress();
    
    // Wait for both to complete
    await Promise.allSettled([programPromise, progressPromise]);
    
    // Set loading to false after both complete
    setLoading(false);
  }, [user?.id, loadGeneratedProgram, loadUserProgress]);

  // Load generated program and progress on mount
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id, loadAllData]);

  // Reload when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
        // Use cache if valid, otherwise reload
        if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
          setGeneratedProgram(cache.generatedProgram);
          setUserProgressData(cache.userProgressData);
          setLoading(false);
        } else {
          loadAllData();
        }
      }
    }, [user?.id, loadAllData])
  );

  // Helper function to get completed workouts count
  const getCompletedWorkoutsCount = () => {
    try {
      if (!userProgressData?.completedWorkouts) return 0;
      
      // Handle both array (from JSONB) and string (from JSON) types
      const completedRaw = userProgressData.completedWorkouts;
      let completed: any[] = [];
      
      if (Array.isArray(completedRaw)) {
        // Already an array (from Supabase JSONB)
        completed = completedRaw;
      } else if (typeof completedRaw === 'string') {
        // Parse JSON string
        completed = JSON.parse(completedRaw);
      } else {
        // Unknown type, return 0
        return 0;
      }
      
      return Array.isArray(completed) ? completed.length : 0;
    } catch {
      return 0;
    }
  };



  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Program</Text>
          <Text style={styles.subtitle}>Track your current training progress</Text>
        </View>

        {/* Current Program Progress Banner */}
        {generatedProgram && userProgressData && (
          <View style={styles.progressBanner}>
            <LinearGradient
              colors={['#000000', '#0A0A0A']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Your Current Program</Text>
                <Text style={styles.bannerProgramName}>{generatedProgram.displayTitle || generatedProgram.programName || 'Your Program'}</Text>
                <Text style={styles.bannerProgress}>
                  Week {userProgressData.currentWeek || 1}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/single-program-view')}
              >
                <Text style={styles.bannerButtonText}>View Program</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Training Schedule */}
        {generatedProgram && generatedProgram.trainingSchedule && (
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleTitle}>Your Training Schedule</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleColumn}>
                <Text style={styles.scheduleLabel}>Workout Days:</Text>
                <Text style={styles.scheduleText}>
                  {generatedProgram.trainingSchedule.map((day: string) => 
                    day.charAt(0).toUpperCase() + day.slice(1)
                  ).join(', ')}
                </Text>
              </View>
              <View style={styles.scheduleColumn}>
                <Text style={styles.scheduleLabel}>Rest Days:</Text>
                <Text style={styles.scheduleText}>
                  {generatedProgram.restDays && generatedProgram.restDays.length > 0 
                    ? generatedProgram.restDays.map((day: string) => 
                        day.charAt(0).toUpperCase() + day.slice(1)
                      ).join(', ')
                    : 'Active Recovery'
                  }
                </Text>
              </View>
            </View>
            <Text style={styles.scheduleNote}>
              💡 This is your suggested schedule. You can train on any day if needed!
            </Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState 
            text="Loading your program..." 
            showSkeleton={true} 
            skeletonType="banner" 
          />
        )}

        {/* Placeholder for when no program is active */}
        {!loading && !generatedProgram && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Program</Text>
            <Text style={styles.emptyText}>
              {!user?.id 
                ? "Please restart the app to load your profile."
                : "Complete the setup wizard to generate your personalized training program."
              }
            </Text>
          </View>
        )}


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 32,      // Keep bottom unchanged
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.lighterGray,
  },
  // Progress Banner Styles
  progressBanner: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerGradient: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  bannerProgramName: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 6,
  },
  bannerProgress: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButtonText: {
    ...typography.bodySmall,
    color: colors.black,
  },
  // Schedule Styles
  scheduleContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  scheduleTitle: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  scheduleColumn: {
    flex: 1,
  },
  scheduleLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  scheduleText: {
    ...typography.body,
    color: colors.white,
    lineHeight: 20,
  },
  scheduleNote: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});