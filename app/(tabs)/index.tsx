import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/helpers';
import {
  Feather as Icon,
  MaterialIcons as MaterialIcon,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';


export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile, userProgress, activeProgram, programs } =
    useWorkoutStore();
  
  // State for generated program data
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  
  // State for user progress tracking
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Load user's generated program and progress
  useEffect(() => {
    loadGeneratedProgram();
    loadUserProgress();
  }, [user]);

  // Refresh progress when returning to Home to avoid stale day/workout
  useFocusEffect(
    useCallback(() => {
      loadUserProgress();
    }, [user?.email])
  );

  const loadGeneratedProgram = async () => {
    console.log('🔍 loadGeneratedProgram called, user:', user?.email);
    
    if (!user?.email) {
      console.log('❌ No user email found');
      setLoadingProgram(false);
      return;
    }

    try {
      console.log('🔄 Fetching wizard results for user:', user.email);
      const wizardResults = await wizardResultsService.getByUserId(user.email);
      console.log('📊 Wizard results:', wizardResults);
      
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
    if (!user?.email) {
      setLoadingProgress(false);
      return;
    }

    try {
      const progress = await userProgressService.getByUserId(user.email);
      
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
          userId: user.email,
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
    // Clamp index to available workouts range
    const total = generatedProgram.weeklyStructure?.length || 0;
    const safeIndex = Math.max(0, Math.min(currentWorkoutIndex, Math.max(0, total - 1)));
    const workout = generatedProgram.weeklyStructure?.[safeIndex];
    
    return workout || null;
  };

  const handleEditProfile = () => {
    router.push('/profile');
  };

  const handleProgramSelect = () => {
    router.push('/programs');
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

  // Debug logging
  console.log('🏠 Home render - State:', {
    userEmail: user?.email,
    hasGeneratedProgram: !!generatedProgram,
    generatedProgramName: generatedProgram?.programName,
    hasActiveProgram: !!activeProgram,
    activeProgramName: activeProgram?.name,
    loadingProgram
  });

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
            {getTodaysWorkout() ? (
              <View style={styles.workoutCard}>
                <LinearGradient
                  colors={['rgba(58, 81, 153, 0.8)', 'rgba(45, 65, 120, 0.9)']}
                  style={styles.workoutGradient}
                >
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{getTodaysWorkout()?.name}</Text>
                    <Text style={styles.workoutDuration}>{getTodaysWorkout()?.estimatedDuration} min</Text>
                  </View>
                  
                  <View style={styles.exercisePreview}>
                    <Text style={styles.exercisePreviewTitle}>Key Exercises:</Text>
                    {getTodaysWorkout()?.exercises?.slice(0, 3).map((exercise: any, index: number) => (
                      <Text key={index} style={styles.exercisePreviewItem}>
                        • {exercise.name} - {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    ))}
                    {getTodaysWorkout()?.exercises?.length > 3 && (
                      <Text style={styles.exercisePreviewMore}>
                        +{getTodaysWorkout()?.exercises?.length - 3} more exercises
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => router.push('/workout-session')}
                  >
                    <Text style={styles.startWorkoutText}>Start Workout</Text>
                    <Icon name="play" size={18} color={colors.white} />
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
            
            {/* Finished Workouts Button */}
            <TouchableOpacity 
              style={styles.finishedWorkoutsButton}
              onPress={() => router.push('/finished-workouts')}
            >
              <Icon name="list" size={20} color={colors.primary} />
              <Text style={styles.finishedWorkoutsButtonText}>View Finished Workouts</Text>
              <Icon name="arrow-right" size={16} color={colors.lightGray} />
            </TouchableOpacity>


          </View>
        )}
      </ScrollView>
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
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>⚖️</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
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
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  workoutDuration: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  exercisePreview: {
    marginBottom: 20,
  },
  exercisePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  exercisePreviewItem: {
    fontSize: 14,
    color: colors.white,
    marginBottom: 4,
    opacity: 0.8,
  },
  exercisePreviewMore: {
    fontSize: 14,
    color: colors.white,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
  },
  startWorkoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startWorkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  noWorkoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 12,
    marginBottom: 8,
  },
  noWorkoutText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
  },
  finishedWorkoutsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  finishedWorkoutsButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

});
