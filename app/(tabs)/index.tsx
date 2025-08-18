import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useTimerStore } from '@/store/timer-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { colors, gradients, buttonStyles } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatDate } from '@/utils/helpers';
import {
  Feather as Icon,
  MaterialIcons as MaterialIcon,
} from '@expo/vector-icons';
import { WorkoutStartModal } from '@/components/WorkoutStartModal';
import { WorkoutProgressCharts } from '@/components/WorkoutProgressCharts';
import { calculateWorkoutProgress } from '@/utils/progress-calculator';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';


export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram, programs } =
    useWorkoutStore();
  const { isWorkoutActive, timeElapsed, isRunning, updateTimeElapsed } = useTimerStore();
  const [currentTime, setCurrentTime] = useState(timeElapsed);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for generated program data
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  
  // State for user progress tracking
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  // Load user's generated program and progress
  useEffect(() => {
    loadGeneratedProgram();
    loadUserProgress();
  }, [user]);

  // Refresh progress when returning to Home to avoid stale day/workout
  useFocusEffect(
    useCallback(() => {
      loadUserProgress();
    }, [user?.id])
  );



  const loadGeneratedProgram = async () => {
    if (!user?.id) {
      console.log('❌ No user ID found');
      setLoadingProgram(false);
      return;
    }

    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (wizardResults?.generatedSplit) {
        const generatedProgram = JSON.parse(wizardResults.generatedSplit);
        
        // Create a better program title based on muscle priorities
        if (wizardResults.musclePriorities) {
          const priorities = JSON.parse(wizardResults.musclePriorities);
          const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          generatedProgram.displayTitle = `${priorityText} Focus`;
        }
        
        setGeneratedProgram(generatedProgram);
        console.log('✅ Loaded generated program:', generatedProgram.programName);
        console.log('🎯 Display title:', generatedProgram.displayTitle);
      } else {
        console.log('⚠️ No generated program found in wizard results');
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
    } finally {
      setLoadingProgram(false);
      console.log('🏁 loadGeneratedProgram completed');
    }
  };



  const loadUserProgress = async () => {
    if (!user?.id) {
      setLoadingProgress(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        console.log('✅ User progress loaded:', {
          week: progress.currentWeek,
          workout: progress.currentWorkout,
          programId: progress.programId
        });
      } else {
        console.log('⚠️ No user progress found - will create default');
        // Create default progress starting at week 1, day 1
        const defaultProgress = await userProgressService.create({
          userId: user.id,
          programId: 'ai-generated-program',
          currentWeek: 1,
          currentWorkout: 1,
          startDate: new Date().toISOString(),
          completedWorkouts: '[]',
          weeklyWeights: '{}'
        });
        setUserProgressData(defaultProgress);
        console.log('✅ Created default progress:', defaultProgress);
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Get today's workout based on current progress
  const getTodaysWorkout = () => {
    if (!generatedProgram || !userProgressData) return null;
    
    const currentWorkoutIndex = userProgressData.currentWorkout - 1;
    const total = generatedProgram.weeklyStructure?.length || 0;
    const safeIndex = Math.max(0, Math.min(currentWorkoutIndex, Math.max(0, total - 1)));
    const workout = generatedProgram.weeklyStructure?.[safeIndex];
    
    return workout || null;
  };

  // Memoized today's workout to prevent multiple function calls
  const todaysWorkout = useMemo(() => {
    return getTodaysWorkout();
  }, [generatedProgram, userProgressData]);

  // Calculate progress data for charts
  const progressData = useMemo(() => {
    return calculateWorkoutProgress(generatedProgram, userProgressData);
  }, [generatedProgram, userProgressData]);

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
    } else {
      // Navigate to workout session where the new modal will appear
      router.push('/workout-session');
    }
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
      router.push(`/program/week/${weekId}`);
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

  // Debug logging (only when loading changes to avoid timer spam)
  useEffect(() => {
    console.log('🏠 Home render - State:', {
      hasGeneratedProgram: !!generatedProgram,
      generatedProgramName: generatedProgram?.programName,
      hasUserProgress: !!userProgressData,
      currentWorkout: userProgressData?.currentWorkout || 0,
      loadingProgram,
      loadingProgress
    });
  }, [generatedProgram?.programName, userProgressData?.currentWorkout, loadingProgram, loadingProgress]);

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

        {/* Today's Workout Preview */}
        {generatedProgram && userProgressData && (
          <View style={styles.todaysWorkout}>
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            {todaysWorkout ? (
              <View style={styles.workoutCard}>
                <LinearGradient
                  colors={gradients.card}
                  style={styles.workoutGradient}
                >
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{todaysWorkout?.name}</Text>
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
                      colors={isWorkoutActive ? gradients.success : gradients.primaryButton}
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
                      ) : (
                        <>
                          <Text style={styles.startWorkoutText}>Start Workout</Text>
                          <Icon name="play" size={18} color={colors.black} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
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
            
            {/* Finished Workouts Button - With Glow Effect for Comparison */}
            <TouchableOpacity 
              style={styles.finishedWorkoutsButtonContainer}
              onPress={() => router.push('/finished-workouts')}
            >
              <LinearGradient
                colors={gradients.primaryButton}
                style={styles.finishedWorkoutsButton}
              >
                <Icon name="list" size={20} color={colors.black} />
                <Text style={styles.finishedWorkoutsButtonText}>View Finished Workouts</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </LinearGradient>
            </TouchableOpacity>

          </View>
        )}

        {/* Progress Charts */}
        {generatedProgram && userProgressData && (
          <WorkoutProgressCharts
            currentWeek={progressData.currentWeek}
            currentDay={progressData.currentDay}
            totalWeeks={progressData.totalWeeks}
            daysPerWeek={progressData.daysPerWeek}
          />
        )}
      </ScrollView>

      {/* Workout Start Modal */}
      <WorkoutStartModal
        visible={showWorkoutModal}
        onConfirm={handleConfirmWorkout}
        onCancel={handleCancelWorkout}
        workoutName={todaysWorkout?.name}
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
    <Text style={{ color, fontSize: size * 0.8, ...typography.timerSmall }}>⚖️</Text>
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
    marginBottom: 24,
  },
  greeting: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 4,
  },
  date: {
    ...typography.body,
    color: colors.lightGray,
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
  },
  startWorkoutText: {
    ...typography.button,
    color: colors.black,
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

});

