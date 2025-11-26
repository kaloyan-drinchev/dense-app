import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
import { HomepageVideoModal } from '@/components/HomepageVideoModal';
import { Video, ResizeMode } from 'expo-av';



import { checkWorkoutAvailability, formatAvailabilityDate, type WorkoutAvailability } from '@/utils/workout-availability';
import { ensureMinimumDuration } from '@/utils/workout-duration';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';


export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram, programs } =
    useWorkoutStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, isCacheValid } = useWorkoutCacheStore();
  const { isWorkoutActive, timeElapsed, isRunning, updateTimeElapsed } = useTimerStore();
  const { shouldBlockAccess } = useSubscriptionStore();
  const [currentTime, setCurrentTime] = useState(timeElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  
  // State for generated program data - initialize from cache if available
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [loadingProgram, setLoadingProgram] = useState(!cachedProgram);
  
  // State for user progress tracking - initialize from cache if available
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loadingProgress, setLoadingProgress] = useState(!cachedProgress);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
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
      
      console.log('🔍 Home: Has generatedSplit:', !!wizardResults.generatedSplit);
      
      if (!wizardResults.generatedSplit) {
        console.log('⚠️ Home: Wizard results found but no generatedSplit - wizard may not be completed');
        setLoadingProgram(false);
        return;
      }
      
      // Handle both string (from JSON) and object (from JSONB) types
      const generatedSplit = typeof wizardResults.generatedSplit === 'string' 
        ? JSON.parse(wizardResults.generatedSplit)
        : wizardResults.generatedSplit;
      const generatedProgram = generatedSplit;
      
      // Create a better program title based on muscle priorities
      if (wizardResults.musclePriorities) {
        // Handle both string (from JSON) and object (from JSONB) types
        const priorities = typeof wizardResults.musclePriorities === 'string'
          ? JSON.parse(wizardResults.musclePriorities)
          : wizardResults.musclePriorities;
        const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        generatedProgram.displayTitle = `${priorityText} Focus`;
      }
      
      setGeneratedProgram(generatedProgram);
      // Cache the program data for workout session screen
      useWorkoutCacheStore.getState().setWorkoutData({ generatedProgram });
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
        // Create default progress starting at week 1, day 1
        const defaultProgress = await userProgressService.create({
          userId: user.id,
          programId: null, // No program assigned yet
          currentWeek: 1,
          currentWorkout: 1,
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

  // Get workout to display (today's if not completed, next if completed)
  const getTodaysWorkout = () => {
    if (!generatedProgram || !userProgressData) return null;
    
    const total = generatedProgram.weeklyStructure?.length || 0;
    const currentWorkout = userProgressData.currentWorkout;
    const isCompleted = workoutAvailability?.isCompletedToday;
    

    
    // If today's workout is completed, show the current workout (which is already the next one)
    if (isCompleted) {
      // currentWorkout is already pointing to the next workout we should do
      const nextWorkoutIndex = currentWorkout - 1; // -1 because array is 0-indexed
      const workout = generatedProgram.weeklyStructure?.[nextWorkoutIndex] || null;
      
      // Fix duration if too low
      if (workout) {
        return {
          ...workout,
          estimatedDuration: ensureMinimumDuration(workout.estimatedDuration)
        };
      }
      return null;
    }
    
    // Otherwise show current workout
    const currentWorkoutIndex = currentWorkout - 1; // currentWorkout is 1-indexed
    const workout = generatedProgram.weeklyStructure?.[currentWorkoutIndex] || null;
    
    // Fix duration if too low
    if (workout) {
      return {
        ...workout,
        estimatedDuration: ensureMinimumDuration(workout.estimatedDuration)
      };
    }
    return null;
  };

  // Memoized workout to display (depends on completion status)
  const todaysWorkout = useMemo(() => {
    return getTodaysWorkout();
  }, [generatedProgram, userProgressData, workoutAvailability]);



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
    if (isWorkoutActive) {
      // Navigate directly to workout session if timer is active
      router.push('/workout-session');
      return;
    }

    // Check if workout is available
    if (workoutAvailability && !workoutAvailability.canStartWorkout) {
      // Show unavailable modal
      setShowUnavailableModal(true);
      return;
    }

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

  // Format timer for display
  const formatTimerTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

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



  const handleContinueWorkout = () => {
    if (activeProgram && userProgress) {
      const weekId = activeProgram.weeks[userProgress.currentWeek - 1].id;
      router.push(`/program/week/${weekId}` as any);
    }
  };

  const getNextWorkout = () => {
    if (!activeProgram || !userProgress) return null;

    const currentWeek = activeProgram.weeks[userProgress.currentWeek - 1];
    if (!currentWeek) return null;

    // Find the first incomplete workout in the current week
    return currentWeek.workouts.find((workout) => !workout.isCompleted);
  };

  const nextWorkout = getNextWorkout();


  return (
    <SafeAreaView style={styles.container} edges={[]}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >


        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey, {user?.name || 'there'}!
          </Text>
          <Text style={styles.date}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View>

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

        {/* Today's Workout Preview */}
        {generatedProgram && userProgressData && (
          <View style={styles.todaysWorkout}>
            <Text style={styles.sectionTitle}>
              {workoutAvailability?.isCompletedToday ? "Next Workout" : "Today's Workout"}
            </Text>
            {todaysWorkout ? (
              <View style={styles.workoutCard}>
                <LinearGradient
                  colors={gradients.card as [string, string, ...string[]]}
                  style={styles.workoutGradient}
                >
                  <View style={styles.workoutHeader}>
                    {isRefreshingWorkout ? (
                      <View style={styles.loadingWorkoutName} />
                    ) : (
                      <Text style={styles.workoutName}>{todaysWorkout?.name}</Text>
                    )}
                    <Text style={styles.workoutDuration}>{todaysWorkout?.estimatedDuration} min</Text>
                  </View>
                  
                  <View style={styles.exercisePreview}>
                    <Text style={styles.exercisePreviewTitle}>Key Exercises:</Text>
                    {todaysWorkout?.exercises?.slice(0, 3).map((exercise: any, index: number) => (
                      <Text key={index} style={styles.exercisePreviewItem}>
                        • {exercise.name} - {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    ))}
                    {todaysWorkout?.exercises?.length > 3 && (
                      <Text style={styles.exercisePreviewMore}>
                        +{todaysWorkout?.exercises?.length - 3} more exercises
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.startWorkoutButtonContainer}
                    onPress={handleStartWorkoutPress}
                  >
                    <LinearGradient
                      colors={(isWorkoutActive ? gradients.success : gradients.primaryButton) as [string, string, ...string[]]}
                      style={[
                        styles.startWorkoutButton,
                        isWorkoutActive && styles.workoutInProgressButton
                      ]}
                    >
                      {isWorkoutActive ? (
                        <>
                          <Text style={styles.startWorkoutText}>
                            Workout in Progress • {formatTimerTime(currentTime)}
                          </Text>
                        </>
                      ) : workoutAvailability && !workoutAvailability.canStartWorkout ? (
                        <View style={styles.unavailableButtonContent}>
                          <Text style={styles.startWorkoutText}>
                            {workoutAvailability.nextWorkoutName || 'Next Workout'}
                          </Text>
                          <Text style={styles.availabilitySubtext}>
                            Available {workoutAvailability.nextAvailableDate ? 
                              formatAvailabilityDate(workoutAvailability.nextAvailableDate) : 
                              'Tomorrow'
                            }
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.startWorkoutText}>Start Workout</Text>
                          <Icon name="play" size={18} color={colors.black} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Rest Day Note */}
                  {isRestDay() && (
                    <View style={styles.restDayNote}>
                      <Icon name="moon" size={16} color={colors.secondary} />
                      <Text style={styles.restDayNoteText}>
                        <Text style={styles.restDayNoteTitle}>Rest Day: </Text>
                        <Text>Recovery time! But feel free to train if you're feeling strong 💪</Text>
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.noWorkoutCard}>
                <Icon name="check-circle" size={48} color={colors.primary} />
                <Text style={styles.noWorkoutTitle}>Great job!</Text>
                <Text style={styles.noWorkoutText}>You've completed all workouts for today</Text>
                <TouchableOpacity 
                  style={[styles.bannerButton, { marginTop: 12 }]}
                  onPress={() => router.push('/finished-workouts')}
                >
                  <Text style={styles.bannerButtonText}>View Finished Workouts</Text>
                  <Icon name="arrow-right" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
            
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
            
            {/* Finished Workouts Button - With Glow Effect for Comparison */}
            <TouchableOpacity 
              style={styles.finishedWorkoutsButtonContainer}
              onPress={() => router.push('/finished-workouts')}
            >
              <LinearGradient
                colors={gradients.primaryButton as [string, string, ...string[]]}
                style={styles.finishedWorkoutsButton}
              >
                <Icon name="list" size={20} color={colors.black} />
                <Text style={styles.finishedWorkoutsButtonText}>View Finished Workouts</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </LinearGradient>
            </TouchableOpacity>


          </View>
        )}


      </ScrollView>

      {/* Workout Start Modal */}
      <WorkoutStartModal
        visible={showWorkoutModal}
        onConfirm={handleConfirmWorkout}
        onCancel={handleCancelWorkout}
        workoutName={todaysWorkout?.name}
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

  // Today's Workout Styles
  todaysWorkout: {
    marginBottom: 24,
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
    padding: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutName: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
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

});

