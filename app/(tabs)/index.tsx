import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { useTimerStore } from '@/store/timer-store';
import { useSubscriptionStore } from '@/store/subscription-store.js';
import { wizardResultsService, userProgressService } from '@/db/services';
import { colors, gradients, buttonStyles } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatDate } from '@/utils/helpers';
import {
  Feather as Icon,
  MaterialIcons as MaterialIcon,
} from '@expo/vector-icons';
import { WorkoutStartModal } from '@/components/WorkoutStartModal';
import { WorkoutUnavailableModal } from '@/components/WorkoutUnavailableModal';
import { StatGroup } from '@/components/StatGroup';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { getExerciseThumbnailUrl } from '@/services/video-service';
import { HomepageVideoModal } from '@/components/HomepageVideoModal';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';

// NEW: Import workout template system
import { getNextSuggestedWorkout, getAlternateWorkout, updateWorkoutProgression, type WorkoutType } from '@/lib/workout-suggestion';
import { getWorkoutTemplate } from '@/lib/workout-templates';

import { checkWorkoutAvailability, formatAvailabilityDate, type WorkoutAvailability } from '@/utils/workout-availability';
import { ensureMinimumDuration } from '@/utils/workout-duration';


export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram, programs } =
    useWorkoutStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, manualWorkout: cachedManualWorkout, isCacheValid } = useWorkoutCacheStore();
  const { isWorkoutActive, timeElapsed, isRunning, updateTimeElapsed, pauseTimer, resumeTimer } = useTimerStore();
  const { shouldBlockAccess } = useSubscriptionStore();
  const [currentTime, setCurrentTime] = useState(timeElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  
  // State for generated program data - initialize from cache if available
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [loadingProgram, setLoadingProgram] = useState(!cachedProgram);
  
  // State for user progress tracking - initialize from cache if available
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  
  // Loading states for Skip and Regenerate buttons
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(!cachedProgress);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  
  // Loading state for workout info update (for instant feedback after completing workout)
  const [isRefreshingWorkout, setIsRefreshingWorkout] = useState(false);

  
  // State for workout availability
  const [workoutAvailability, setWorkoutAvailability] = useState<WorkoutAvailability | null>(null);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) {
      setLoadingProgram(false);
      return;
    }

    try {
      console.log('🔍 Home: Loading program for user ID:', user.id);
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      console.log('🔍 Home: Wizard results:', wizardResults ? 'Found' : 'Not found');
      
      if (!wizardResults) {
        console.log('⚠️ Home: No wizard results found for user ID:', user.id);
        console.log('💡 Home: User may need to complete the setup wizard');
        setLoadingProgram(false);
        return;
      }
      
      // NEW: We no longer use wizard-generated programs, using templates instead
      // Keeping this for backward compatibility with existing users
      console.log('🔍 Home: Checking for legacy generatedSplit (for backward compatibility)');
      
      // Try to load legacy program if it exists (for users who haven't migrated yet)
      let generatedProgram = null;
      if ((wizardResults as any).generatedSplit) {
        try {
          const generatedSplit = typeof (wizardResults as any).generatedSplit === 'string' 
            ? JSON.parse((wizardResults as any).generatedSplit)
            : (wizardResults as any).generatedSplit;
          generatedProgram = generatedSplit;
          console.log('✅ Loaded legacy program for backward compatibility');
        } catch (e) {
          console.warn('⚠️ Failed to parse legacy program, will use templates');
        }
      }
      
      // Set the program (even if null - templates don't need this)
      setGeneratedProgram(generatedProgram);
      if (generatedProgram) {
        // Cache for backward compatibility
        useWorkoutCacheStore.getState().setWorkoutData({ generatedProgram });
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
    } finally {
      setLoadingProgram(false);
    }
  }, [user?.id]);

  const loadUserProgress = useCallback(async () => {
    if (!user?.id) {
      setLoadingProgress(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        // Cache the progress data for workout session screen
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: progress });
      } else {
        // Create default progress starting with Push Day A
        const defaultProgress = await userProgressService.create({
          userId: user.id,
          programId: null, // No program assigned yet
          currentWorkout: 'push-a', // Start with Push Day A
          lastCompletedWorkout: null,
          lastWorkoutDate: null,
          startDate: new Date(),
          completedWorkouts: [],
          weeklyWeights: {}
        });
        setUserProgressData(defaultProgress);
        // Cache the default progress
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: defaultProgress });
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user?.id]);

  // Load user's generated program and progress
  useEffect(() => {
    if (!user?.id) {
      setLoadingProgram(false);
      setLoadingProgress(false);
      return;
    }

    // Use cached data immediately if available
    const cache = useWorkoutCacheStore.getState();
    if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
      setGeneratedProgram(cache.generatedProgram);
      setUserProgressData(cache.userProgressData);
      setLoadingProgram(false);
      setLoadingProgress(false);
      
      // Check cache age to decide if background refresh is needed
      const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
      if (cacheAge < 60000) {
        return; // Cache is fresh (< 1 minute) - skip refresh
      }
      
      // Cache is stale (>= 1 minute) - refresh in background
      Promise.allSettled([loadGeneratedProgram(), loadUserProgress()])
        .then((results) => {
          // Check for any failed promises
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.error('❌ Failed to refresh cached data:', failures.map(f => (f as PromiseRejectedResult).reason));
          }
        });
      return;
    }

    // No valid cache - load fresh data
    loadGeneratedProgram();
    loadUserProgress();
  }, [user?.id, loadGeneratedProgram, loadUserProgress]);

  // Check workout availability when data changes
  useEffect(() => {
    if (user?.id && generatedProgram && userProgressData) {
      checkAvailability();
    }
  }, [user?.id, generatedProgram, userProgressData]);

  // Refresh progress when returning to Home to avoid stale day/workout
  useFocusEffect(
    useCallback(() => {
      // Check if we're returning from a workout completion
      const cache = useWorkoutCacheStore.getState();
      const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
      
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // If cache was updated very recently (within 3 seconds), we're likely returning from a workout completion
      if (cacheAge < 3000) {
        setIsRefreshingWorkout(true);
        
        // Load fresh data with a small delay to ensure database is committed
        timeoutId = setTimeout(() => {
          loadUserProgress()
            .then(() => {
              setIsRefreshingWorkout(false);
            })
            .catch((error) => {
              console.error('❌ Failed to refresh workout data:', error);
              setIsRefreshingWorkout(false);
            });
        }, 300);
      } else {
        // Normal focus, just load data
        loadUserProgress();
      }
      
      // Cleanup function to clear timeout if screen loses focus or component unmounts
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [loadUserProgress])
  );

  const checkAvailability = async () => {
    if (!user?.id || !generatedProgram || !userProgressData) return;
    
    try {
      const availability = await checkWorkoutAvailability(
        user.id,
        generatedProgram,
        userProgressData
      );
      setWorkoutAvailability(availability);
    } catch (error) {
      console.error('❌ Failed to check workout availability:', error);
    }
  };

  // NEW: Get next suggested workout using PPL template system
  const getNextWorkout = () => {
    // Check for manual workout first (active manual workout takes priority)
    if (cachedManualWorkout) {
      console.log('🏠 Home Screen - Active Manual Workout:', {
        workoutName: cachedManualWorkout.name,
        exerciseCount: cachedManualWorkout.exercises.length,
      });
      return cachedManualWorkout;
    }
    
    if (!userProgressData) return null;
    
    const currentWorkoutType = userProgressData.currentWorkout; // e.g., 'push-a', 'pull-b'
    
    // Get the suggested workout template
    const workoutTemplate = getWorkoutTemplate(currentWorkoutType || 'push-a');
    
    if (!workoutTemplate) {
      console.error('❌ Failed to load workout template');
      return null;
    }
    
    console.log('🏠 Home Screen - Next Workout:', {
      currentWorkoutType,
      workoutName: workoutTemplate.name,
      category: workoutTemplate.category,
      exerciseCount: workoutTemplate.exercises.length,
    });
    
    return workoutTemplate;
  };

  // Memoized next workout to display
  const nextWorkout = useMemo(() => {
    return getNextWorkout();
  }, [cachedManualWorkout, userProgressData]);



  // Calculate workout streak
  const calculateWorkoutStreak = (completedWorkouts: any[], trainingSchedule: string[]) => {
    if (!completedWorkouts || !trainingSchedule) return 0;

    try {
      // Get workout dates from detailed workout objects
      const workoutDates = completedWorkouts
        .filter(w => typeof w === 'object' && w.date && w.workoutName)
        .map(w => new Date(w.date).toISOString().split('T')[0])
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Most recent first

      if (workoutDates.length === 0) return 0;

      const today = new Date().toISOString().split('T')[0];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      let streak = 0;
      let checkDate = new Date();
      
      // Start from today and count backwards
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayName = dayNames[checkDate.getDay()];
        
        // Is this a scheduled training day?
        const isTrainingDay = trainingSchedule.includes(dayName);
        
        if (isTrainingDay) {
          // Check if workout was completed on this training day
          if (workoutDates.includes(dateStr)) {
            streak++;
          } else {
            // Missed a training day - streak breaks
            break;
          }
        }
        // Skip rest days (don't affect streak)
        
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  // Check if today is a rest day
  const isRestDay = () => {
    if (!generatedProgram || !workoutAvailability) return false;
    
    // Get today's day name
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    // Check if today is in the rest days
    if (generatedProgram.restDays && generatedProgram.restDays.includes(todayName)) {
      return true;
    }
    
    // For older programs without restDays, check if not in training schedule
    if (generatedProgram.trainingSchedule && !generatedProgram.trainingSchedule.includes(todayName)) {
      return true;
    }
    
    // Fallback: if we have workout availability and can start workout, probably not a rest day
    return false;
  };

  const handleEditProfile = () => {
    router.push('/profile');
  };

  const handleProgramSelect = () => {
    router.push('/programs');
  };

  const handleStartWorkoutPress = () => {
    // Check if we're clicking on a manual workout
    const isClickingManualWorkout = cachedManualWorkout !== null;
    
    if (isClickingManualWorkout) {
      // Don't clear manual workout - just navigate to continue it
      console.log('📱 Continuing manual workout:', cachedManualWorkout.name);
      router.push('/workout-session');
      return;
    }
    
    if (isWorkoutActive) {
      // Navigate directly to workout session if timer is active (PPL workout)
      router.push('/workout-session');
      return;
    }

    // Check if workout is available
    if (workoutAvailability && !workoutAvailability.canStartWorkout) {
      // Show unavailable modal
      setShowUnavailableModal(true);
      return;
    }

    // Starting a fresh PPL workout (no manual workout in cache)
    // Workout is available, navigate to workout session
    router.push('/workout-session');
  };

  // Update timer display continuously when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      intervalRef.current = setInterval(() => {
        updateTimeElapsed();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isWorkoutActive, updateTimeElapsed]);

  // Update current time when timeElapsed changes
  useEffect(() => {
    setCurrentTime(timeElapsed);
  }, [timeElapsed]);

  // Check if active workout is cardio
  const isCardioWorkout = nextWorkout?.type === 'cardio' || nextWorkout?.category === 'cardio';
  
  // Format timer for display (countdown for cardio, elapsed for regular workouts)
  const formatTimerTime = (seconds: number): string => {
    let displaySeconds = seconds;
    
    // For cardio workouts, show countdown
    if (isCardioWorkout && nextWorkout?.targetDuration) {
      const targetSeconds = nextWorkout.targetDuration * 60;
      const remainingSeconds = Math.max(0, targetSeconds - seconds);
      
      // If target reached, show overtime with + prefix
      if (remainingSeconds === 0) {
        const overtimeSeconds = seconds - targetSeconds;
        const overtimeMinutes = Math.floor(overtimeSeconds / 60);
        const overtimeSecs = overtimeSeconds % 60;
        return `+${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSecs.toString().padStart(2, '0')}`;
      }
      
      displaySeconds = remainingSeconds;
    }
    
    const hours = Math.floor(displaySeconds / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleConfirmWorkout = () => {
    setShowWorkoutModal(false);
    router.push('/workout-session');
  };

  const handleCancelWorkout = () => {
    setShowWorkoutModal(false);
  };

  // NEW: Action button handlers for workout card
  const handleSkipWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    
    setIsSkipping(true);
    try {
      // Clear any active manual/cardio workout from cache FIRST
      useWorkoutCacheStore.getState().setManualWorkout(null);
      
      // Also clear the timer if a manual/cardio workout was active
      useTimerStore.getState().completeWorkout();
      
      // Skip to next workout in rotation
      const nextWorkoutType = updateWorkoutProgression(userProgressData.currentWorkout);
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: nextWorkoutType,
      });
      
      // Update local state AND cache with fresh data
      if (updated) {
        setUserProgressData(updated);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
      }
      
      console.log('✅ Skipped to next workout:', nextWorkoutType);
    } catch (error) {
      console.error('❌ Failed to skip workout:', error);
      Alert.alert('Error', 'Failed to skip workout. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleRegenerateWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    
    setIsRegenerating(true);
    try {
      // Clear any active manual/cardio workout from cache FIRST
      useWorkoutCacheStore.getState().setManualWorkout(null);
      
      // Also clear the timer if a manual/cardio workout was active
      useTimerStore.getState().completeWorkout();
      
      // Switch to alternate variation (A ↔ B)
      const alternateWorkout = getAlternateWorkout(userProgressData.currentWorkout);
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: alternateWorkout.type,
      });
      
      // Update local state AND cache with fresh data
      if (updated) {
        setUserProgressData(updated);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: updated });
      }
      
      console.log('✅ Regenerated workout to:', alternateWorkout.name);
    } catch (error) {
      console.error('❌ Failed to regenerate workout:', error);
      Alert.alert('Error', 'Failed to regenerate workout. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAdjustDuration = () => {
    // TODO: Implement duration adjustment (future feature)
    console.log('⏱️ Adjust duration clicked');
  };

  const handleShareWorkout = () => {
    // TODO: Implement workout sharing (future feature)
    console.log('📤 Share workout clicked');
  };

  const handleContinueWorkout = () => {
    if (activeProgram && userProgress) {
      const weekId = activeProgram.weeks[userProgress.currentWeek - 1].id;
      router.push(`/program/week/${weekId}` as any);
    }
  };

  // Get first uncompleted exercise for bottom banner
  const getFirstUncompletedExercise = useCallback(() => {
    if (!nextWorkout || !userProgressData) return null;
    
    const today = new Date().toISOString().slice(0, 10);
    const weeklyWeights = userProgressData.weeklyWeights;
    
    // Helper function to check if exercise is completed
    const isExerciseCompleted = (exerciseId: string, plannedSets: number) => {
      try {
        const exerciseLogs = weeklyWeights?.exerciseLogs?.[exerciseId];
        if (!exerciseLogs || !Array.isArray(exerciseLogs)) return false;
        
        const todaySession = exerciseLogs.find((log: any) => log.date === today);
        if (!todaySession || !todaySession.sets || todaySession.sets.length === 0) return false;
        
        const completedSets = todaySession.sets.filter((set: any) => set.isCompleted);
        return completedSets.length >= plannedSets;
      } catch (e) {
        return false;
      }
    };
    
    // Find first uncompleted exercise
    for (const exercise of nextWorkout.exercises) {
      const exerciseId = exercise.id || exercise.name.toLowerCase().replace(/\s+/g, '-');
      if (!isExerciseCompleted(exerciseId, exercise.sets)) {
        // Get the last completed set data for display
        try {
          const exerciseLogs = weeklyWeights?.exerciseLogs?.[exerciseId];
          const todaySession = exerciseLogs?.find((log: any) => log.date === today);
          const lastSet = todaySession?.sets?.[todaySession.sets.length - 1];
          
          return {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            lastWeight: lastSet?.weightKg || 0,
            lastReps: lastSet?.reps || 0,
            completedSets: todaySession?.sets?.filter((s: any) => s.isCompleted).length || 0,
          };
        } catch (e) {
          return {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            lastWeight: 0,
            lastReps: 0,
            completedSets: 0,
          };
        }
      }
    }
    
    return null;
  }, [nextWorkout, userProgressData]);


  return (
    <SafeAreaView style={styles.container} edges={[]}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          isWorkoutActive && { paddingBottom: 180 }
        ]}
      >

{/* 
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey, {user?.name || 'there'}!
          </Text>
          <Text style={styles.date}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View> */}

        {/* Loading State */}
        {(loadingProgram || loadingProgress) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your workout...</Text>
          </View>
        )}

        {/* Empty State - No Program */}
        {!loadingProgram && !loadingProgress && !generatedProgram && (
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

        {/* Weekly Schedule */}
        {!loadingProgram && !loadingProgress && generatedProgram && (
          <WeeklySchedule 
            trainingDays={generatedProgram.trainingSchedule || []} 
          />
        )}

        {/* Homepage Video */}
        {/* <View style={styles.videoSection}>
          <TouchableOpacity 
            style={styles.videoContainer}
            onPress={() => setShowVideoModal(true)}
            activeOpacity={1}
          >
            <Video
              style={styles.videoThumbnail}
              source={require('@/assets/videos/3-17.mp4')}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isMuted={true}
              isLooping={true}
              positionMillis={0}
            />
            <View style={styles.videoPlayOverlay}>
              <Icon name="play-circle" size={40} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View> */}

        {/* Next Workout Preview */}
        {nextWorkout ? (
          <View style={styles.todaysWorkout}>
            <TouchableOpacity 
              style={styles.workoutCard}
              onPress={handleStartWorkoutPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.card as [string, string, ...string[]]}
                style={styles.workoutGradient}
              >
                {/* Badge - Full Width at Top */}
                <View style={styles.nextWorkoutBadge}>
                  <Text style={styles.nextWorkoutBadgeText}>
                    {isWorkoutActive ? 'IN PROGRESS' : 'NEXT WORKOUT'}
                  </Text>
                </View>
                
                {/* Workout Details */}
                <View style={styles.workoutHeader}>
                  {isRefreshingWorkout ? (
                    <View style={styles.loadingWorkoutName} />
                  ) : (
                    <>
                      {/* Workout Name */}
                      <Text style={styles.workoutName}>{nextWorkout.name}</Text>
                      
                      {/* Exercise Thumbnails Row */}
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.thumbnailsContainer}
                        contentContainerStyle={styles.thumbnailsContent}
                      >
                        {nextWorkout.exercises.slice(0, 6).map((exercise: any, idx: number) => (
                          <View key={exercise.id} style={styles.thumbnailWrapper}>
                            <Image
                              source={{ uri: getExerciseThumbnailUrl(exercise.name) }}
                              style={styles.exerciseThumbnail}
                              contentFit="cover"
                            />
                          </View>
                        ))}
                      </ScrollView>
                      
                      {/* Meta Info Below */}
                      <Text style={styles.workoutMeta}>
                        {nextWorkout.estimatedDuration} mins • {nextWorkout.exercises.length} exercises
                      </Text>
                    </>
                  )}
                </View>
                
                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                  {/* Skip Button - Disabled when workout is active or loading */}
                  <TouchableOpacity 
                    style={[
                      styles.actionButton, 
                      (isWorkoutActive || isSkipping || isRegenerating) && styles.actionButtonDisabled
                    ]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSkipWorkout();
                    }}
                    disabled={isWorkoutActive || isSkipping || isRegenerating}
                  >
                    {isSkipping ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Icon name="skip-forward" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>Skip</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {/* Regenerate Button - Disabled when workout is active or loading */}
                  <TouchableOpacity 
                    style={[
                      styles.actionButton, 
                      (isWorkoutActive || isSkipping || isRegenerating) && styles.actionButtonDisabled
                    ]} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRegenerateWorkout();
                    }}
                    disabled={isWorkoutActive || isSkipping || isRegenerating}
                  >
                    {isRegenerating ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Icon name="refresh-cw" size={20} color={colors.white} />
                        <Text style={styles.actionButtonText}>Regenerate</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {/* Duration Button */}
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAdjustDuration();
                    }}
                  >
                    <Icon name="clock" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Duration</Text>
                  </TouchableOpacity>
                  
                  {/* Share Button */}
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShareWorkout();
                    }}
                  >
                    <Icon name="send" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
            
        {/* Feeling like something different? Section */}
        <View style={styles.alternativeWorkoutsSection}>
          <Text style={styles.alternativeWorkoutsTitle}>Feeling like something different?</Text>
          
          <View style={styles.alternativeWorkoutsRow}>
            {/* Custom Workout Card */}
            <TouchableOpacity style={styles.alternativeCard} onPress={() => setShowComingSoonModal(true)}>
              <View style={[styles.alternativeIconCircle, { backgroundColor: 'rgba(138, 43, 226, 0.2)' }]}>
                <Icon name="star" size={24} color="#8A2BE2" />
              </View>
              <Text style={styles.alternativeCardTitle}>Custom</Text>
              <Text style={styles.alternativeCardSubtitle}>Let our AI help you create a workout</Text>
            </TouchableOpacity>
            
            {/* Cardio Card */}
            <TouchableOpacity 
              style={[styles.alternativeCard, isWorkoutActive && styles.alternativeCardDisabled]} 
              onPress={() => !isWorkoutActive && router.push('/cardio-workout')}
              disabled={isWorkoutActive}
            >
              <View style={[styles.alternativeIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <Icon name="activity" size={24} color="#22C55E" />
              </View>
              <Text style={styles.alternativeCardTitle}>Cardio</Text>
              <Text style={styles.alternativeCardSubtitle}>Log a cardio session</Text>
            </TouchableOpacity>
            
            {/* Manual Card */}
            <TouchableOpacity 
              style={[styles.alternativeCard, isWorkoutActive && styles.alternativeCardDisabled]} 
              onPress={() => !isWorkoutActive && router.push('/manual-workout')}
              disabled={isWorkoutActive}
            >
              <View style={[styles.alternativeIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Icon name="edit" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.alternativeCardTitle}>Manual</Text>
              <Text style={styles.alternativeCardSubtitle}>Full control over workout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Workouts Navigation Section */}
        <View style={styles.workoutsNavigationSection}>
          <View style={styles.workoutsNavigationRow}>
            {/* Finished Workouts Card */}
            <TouchableOpacity 
              style={styles.workoutNavCard} 
              onPress={() => router.push('/finished-workouts')}
            >
              <View style={[styles.workoutNavIconCircle, { backgroundColor: 'rgba(132, 204, 22, 0.2)' }]}>
                <Icon name="check-circle" size={28} color={colors.primary} />
              </View>
              <Text style={styles.workoutNavCardTitle}>Finished Workouts</Text>
              <Text style={styles.workoutNavCardSubtitle}>View your workout history</Text>
            </TouchableOpacity>
            
            {/* Programs/Upcoming Workouts Card */}
            <TouchableOpacity 
              style={styles.workoutNavCard} 
              onPress={() => router.push('/programs')}
            >
              <View style={[styles.workoutNavIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <MaterialIcon name="fitness-center" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.workoutNavCardTitle}>Programs</Text>
              <Text style={styles.workoutNavCardSubtitle}>View your workout plan</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Progress Stats */}
        <StatGroup 
              stats={[
                {
                  value: userProgressData ? Math.ceil((Date.now() - new Date(userProgressData.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
                  label: 'Journey Days',
                  infoTitle: 'Journey Days',
                  infoDescription: 'Total number of days since you started your fitness program. This tracks your overall commitment and shows how long you\'ve been on your journey!'
                },
                {
                  value: userProgressData && generatedProgram ? 
                    (() => {
                      try {
                        const completed = typeof userProgressData.completedWorkouts === 'string' ? 
                          JSON.parse(userProgressData.completedWorkouts) : 
                          userProgressData.completedWorkouts;
                        return calculateWorkoutStreak(completed, generatedProgram.trainingSchedule || []);
                      } catch {
                        return 0;
                      }
                    })() : 0,
                  label: 'Streak',
                  infoTitle: 'Workout Streak ',
                  infoDescription: 'Number of consecutive training days where you completed your workouts. Rest days don\'t break your streak - only missed training days do. Keep it going! 🔥'
                },
                {
                  value: userProgressData && userProgressData.completedWorkouts ? 
                    (() => {
                      try {
                        const completed = typeof userProgressData.completedWorkouts === 'string' ? 
                          JSON.parse(userProgressData.completedWorkouts) : 
                          userProgressData.completedWorkouts;
                        // Only count detailed workout objects, not simple calendar entries
                        const detailedWorkouts = completed.filter((item: any) => 
                          typeof item === 'object' && item.date && item.workoutName
                        );
                        return detailedWorkouts.length;
                      } catch (error) {
                        console.error('❌ Error in workout counting:', error);
                        return 0;
                      }
                    })() : 0,
                  label: 'Finished Workouts',
                  infoTitle: 'Finished Workouts',
                  infoDescription: 'Total number of workout sessions you\'ve completed successfully. Each finished workout brings you closer to your fitness goals! 💪'
                }
              ]}
            />

      </ScrollView>

      {/* Workout Start Modal */}
      <WorkoutStartModal
        visible={showWorkoutModal}
        onConfirm={handleConfirmWorkout}
        onCancel={handleCancelWorkout}
        workoutName={nextWorkout?.name}
      />

      {/* Workout Unavailable Modal */}
      <WorkoutUnavailableModal
        visible={showUnavailableModal}
        onClose={() => setShowUnavailableModal(false)}
        nextWorkoutName={workoutAvailability?.nextWorkoutName || null}
        nextAvailableDate={workoutAvailability?.nextAvailableDate || null}
        motivationalMessage={workoutAvailability?.motivationalMessage || ''}
        isCompletedToday={workoutAvailability?.isCompletedToday || false}
      />

      {/* Homepage Video Modal */}
      <HomepageVideoModal
        visible={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1A1A1A', '#0A0A0A']}
              style={styles.comingSoonModalContent}
            >
              <View style={styles.comingSoonIconContainer}>
                <Icon name="star" size={48} color={colors.primary} />
              </View>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonDescription}>
                Our AI-powered custom workout builder is on its way. Stay tuned for personalized workouts tailored to your goals!
              </Text>
              <TouchableOpacity
                style={styles.comingSoonButton}
                onPress={() => setShowComingSoonModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.comingSoonButtonText}>Got it!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Bottom Banner - Workout In Progress */}
      {isWorkoutActive && (
        <TouchableOpacity 
          style={styles.bottomBanner}
          onPress={() => router.push('/workout-session')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[
              'rgba(132, 204, 22, 0.15)',
              'rgba(34, 197, 94, 0.1)',
              'rgba(20, 25, 35, 0.8)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <BlurView 
              intensity={40} 
              tint="dark"
              style={styles.blurContainer}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerLeft}>
                  <Text style={styles.bannerTitle}>WORKOUT IN PROGRESS</Text>
                  {(() => {
                    const firstExercise = getFirstUncompletedExercise();
                    if (firstExercise) {
                      return (
                        <>
                          <Text style={styles.bannerExerciseName} numberOfLines={1}>
                            {firstExercise.name}
                          </Text>
                          <Text style={styles.bannerExerciseMeta}>
                            {firstExercise.completedSets}/{firstExercise.sets} sets
                            {firstExercise.lastWeight > 0 && ` • ${firstExercise.lastWeight} kg`}
                          </Text>
                        </>
                      );
                    }
                    return <Text style={styles.bannerExerciseName}>Tap to continue</Text>;
                  })()}
                </View>
                
                <View style={styles.bannerRight}>
                  <TouchableOpacity 
                    style={styles.circularTimerContainer}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (isRunning) {
                        pauseTimer();
                      } else {
                        resumeTimer();
                      }
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(132, 204, 22, 0.3)', 'rgba(132, 204, 22, 0.1)']}
                      style={styles.circularTimerGradient}
                    >
                      <Text style={styles.circularTimerText}>{formatTimerTime(currentTime)}</Text>
                      <View style={styles.circularPlayButton}>
                        <Icon 
                          name={isRunning ? 'pause' : 'play'} 
                          size={14} 
                          color={colors.black} 
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const WeightIcon = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color, fontSize: size * 0.8 }}>⚖️</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16, // Only left/right padding
    paddingTop: 8, // Minimal top padding
    paddingBottom: 16, // Bottom padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    ...typography.h1,
    color: colors.white,
  },
  date: {
    ...typography.body,
    color: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
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
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButtonText: {
    ...typography.bodySmall,
    color: colors.white,
  },

  // Next Workout Styles
  todaysWorkout: {
    marginBottom: 24,
  },
  nextWorkoutBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  nextWorkoutBadgeText: {
    ...typography.caption,
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 16,
  },
  workoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  workoutGradient: {
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 0,
  },
  workoutHeader: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  workoutName: {
    ...typography.h3,
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginBottom: 12,
  },
  thumbnailsContainer: {
    marginBottom: 12,
  },
  thumbnailsContent: {
    gap: 8,
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.darkGray,
  },
  exerciseThumbnail: {
    width: '100%',
    height: '100%',
  },
  workoutMeta: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    backgroundColor: colors.darkGray,
    opacity: 0.5,
  },
  alternativeWorkoutsSection: {
    marginBottom: 24,
  },
  alternativeWorkoutsTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  alternativeWorkoutsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alternativeCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  alternativeCardDisabled: {
    opacity: 0.4,
  },
  alternativeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alternativeCardTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alternativeCardSubtitle: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    textAlign: 'center',
  },
  workoutsNavigationSection: {
    marginBottom: 24,
  },
  workoutsNavigationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutNavCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  workoutNavIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  workoutNavCardTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  workoutNavCardSubtitle: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    textAlign: 'center',
  },
  loadingWorkoutName: {
    height: 28,
    width: '70%',
    backgroundColor: colors.mediumGray,
    borderRadius: 6,
    opacity: 0.5,
  },
  workoutDuration: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
  },
  exercisePreview: {
    marginBottom: 20,
  },
  exercisePreviewTitle: {
    ...typography.bodySmall,
    color: colors.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  exercisePreviewItem: {
    ...typography.bodySmall,
    color: colors.white,
    marginBottom: 4,
    opacity: 0.8,
  },
  exercisePreviewMore: {
    ...typography.bodySmall,
    color: colors.white,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
  },
  startWorkoutButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  startWorkoutButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 54,
  },
  startWorkoutText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
  availabilitySubtext: {
    ...typography.bodySmall,
    color: colors.black,
    opacity: 0.8,
    fontSize: 12,
    marginTop: 2,
  },
  unavailableButtonContent: {
    alignItems: 'center',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  infoModalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  infoModalTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoModalDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoModalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoModalButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
  comingSoonModalContent: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  comingSoonIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
  },
  comingSoonDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontSize: 16,
  },
  comingSoonButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  comingSoonButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  restDayNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  restDayNoteText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  restDayNoteTitle: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  workoutInProgressButton: {
    // LinearGradient handles the colors, so we just need any specific styling
  },



  noWorkoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noWorkoutTitle: {
    ...typography.h3,
    color: colors.white,
    marginTop: 12,
    marginBottom: 8,
  },
  noWorkoutText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
  },
  finishedWorkoutsButtonContainer: {
    borderRadius: 12,
    marginTop: 16,
    // Glow effect for comparison
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  finishedWorkoutsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  finishedWorkoutsButtonText: {
    ...typography.body,
    flex: 1,
    color: colors.black,
    fontWeight: 'bold',
  },


  // Video Section Styles
  videoSection: {
    marginBottom: 24,
  },
  videoContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16/9,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Banner - Workout In Progress
  bottomBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 82,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1000,
  },
  bannerGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.3)',
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15, 20, 30, 0.85)',
  },
  bannerLeft: {
    flex: 1,
    marginRight: 16,
  },
  bannerTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bannerExerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerExerciseMeta: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontSize: 13,
    fontWeight: '500',
  },
  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularTimerContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  circularTimerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.5)',
  },
  circularTimerText: {
    ...typography.body,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  circularPlayButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

});

