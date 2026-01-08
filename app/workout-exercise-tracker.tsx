import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import {
  Feather as Icon,
} from '@expo/vector-icons';

export default function WorkoutExerciseTrackerScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { user } = useAuthStore();
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const isCustomExercise = exerciseId?.startsWith('custom-');

  useEffect(() => {
    loadExerciseData();
  }, [exerciseId, user]);

  useEffect(() => {
    // Only show loading overlay if exercise is completed
    if (isExerciseCompleted) {
      setShowLoadingOverlay(true);
      
      // Hide loading overlay after 1 second
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isExerciseCompleted]);

  const loadExerciseData = async () => {
    if (!user?.id || !exerciseId) {
      setLoading(false);
      return;
    }

    // Declare variables at function scope
    let progress: any = null;
    let program: any = null;
    let foundExercise: any = null;

    try {
      // Use cache first
      const cache = useWorkoutCacheStore.getState();
      
      // OPTIMIZATION: Check for manual exercises FIRST (skip database fetch)
      if (exerciseId.startsWith('manual-')) {
        console.log(`🚀 [ExerciseTracker] Fast path for manual exercise "${exerciseId}"`);
        
        const manualWorkout = cache.manualWorkout;
        
        if (manualWorkout?.exercises) {
          const found = manualWorkout.exercises.find((ex: any) => ex.id === exerciseId);
          
          if (found) {
            console.log(`✅ [ExerciseTracker] Found manual exercise: ${found.name}`);
            foundExercise = {
              ...found,
              targetMuscle: found.targetMuscle || 'General',
              restTime: Math.min(found.restTime || 60, 120),
            };
            
            // Manual exercises are never pre-completed, skip completion check
            setIsExerciseCompleted(false);
            
            // Skip to setting exercise data
            if (foundExercise) {
              setExercise(foundExercise);
              setLoading(false);
              return; // Exit early for manual exercises
            }
          } else {
            console.warn(`⚠️ [ExerciseTracker] Manual exercise "${exerciseId}" not found in manual workout`);
          }
        }
        
        // If manual exercise not found, continue with normal flow
      }
      
      // For non-manual exercises, fetch from database
      progress = cache.userProgressData;
      program = cache.generatedProgram;
      
      // Only fetch from DB if cache is missing or invalid
      const needsFetch = !progress || !cache.isCacheValid();
      
      if (needsFetch) {
        progress = await userProgressService.getByUserId(user.id);
      }
      
      // Safety: If progress is still undefined, try one more fetch
      if (!progress) {
        progress = await userProgressService.getByUserId(user.id);
      }
      
      // Check if exercise is completed today
      let isCompleted = false;
      
      if (progress?.weeklyWeights) {
        const weeklyWeights = typeof progress.weeklyWeights === 'string'
          ? JSON.parse(progress.weeklyWeights)
          : progress.weeklyWeights;
        const today = new Date().toISOString().split('T')[0];
        const exerciseLogs = weeklyWeights?.exerciseLogs || {};
        
        const todaySession = exerciseLogs[exerciseId]?.find((session: any) => session.date === today);
        
        if (todaySession?.sets) {
          isCompleted = todaySession.sets.every((set: any) => set.isCompleted);
        }
      }
      
      setIsExerciseCompleted(isCompleted);
      
      // Check if it's a custom exercise (starts with 'custom-')
      if (exerciseId.startsWith('custom-')) {
        if (progress?.weeklyWeights) {
          // Handle both string (from JSON) and object (from JSONB) types
          const weeklyWeights = typeof progress.weeklyWeights === 'string'
            ? JSON.parse(progress.weeklyWeights)
            : progress.weeklyWeights;
          const today = new Date().toISOString().split('T')[0];
          const customExercises = weeklyWeights?.customExercises?.[today] || [];
          
          foundExercise = customExercises.find((ex: any) => ex.id === exerciseId);
          
          if (foundExercise) {
            foundExercise = {
              ...foundExercise,
              targetMuscle: foundExercise.targetMuscle || 'Custom',
              restTime: Math.min(foundExercise.restSeconds || 60, 120),
            };
          }
        }
      } else {
        // NEW SYSTEM: Load from workout templates
        const currentWorkoutType = progress?.currentWorkout; // e.g., 'push-a', 'pull-b'
        
        console.log(`🔍 [ExerciseTracker] Loading exercise "${exerciseId}" from workout "${currentWorkoutType}"`);
        
        if (currentWorkoutType) {
          // Import workout template dynamically
          const { getWorkoutTemplate } = await import('@/lib/workout-templates');
          const workoutTemplate = getWorkoutTemplate(currentWorkoutType);
          
          if (workoutTemplate) {
            console.log(`✅ [ExerciseTracker] Found workout template with ${workoutTemplate.exercises.length} exercises`);
            
            // Find the exercise in the template
            const found = workoutTemplate.exercises.find((ex) => ex.id === exerciseId);
            
            if (found) {
              console.log(`✅ [ExerciseTracker] Found exercise: ${found.name}`);
              foundExercise = {
                ...found,
                restTime: Math.min(found.restTime || 60, 120),
              };
            } else {
              console.warn(`⚠️ [ExerciseTracker] Exercise "${exerciseId}" not found in workout template`);
            }
          } else {
            console.warn(`⚠️ [ExerciseTracker] Workout template "${currentWorkoutType}" not found`);
          }
        } else {
          console.warn(`⚠️ [ExerciseTracker] No currentWorkout set in progress`);
        }
        
        // FALLBACK: Load legacy program if no workout template found (for backward compatibility)
        if (!foundExercise) {
          if (!program) {
        const wizardResults = await wizardResultsService.getByUserId(user.id);
            if ((wizardResults as any)?.generatedSplit) {
              program = typeof (wizardResults as any).generatedSplit === 'string'
                ? JSON.parse((wizardResults as any).generatedSplit)
                : (wizardResults as any).generatedSplit;
            }
          }
          
          if (program) {
          // Handle both string (from JSON) and object (from JSONB) types
            const programData = typeof program === 'string'
              ? JSON.parse(program)
              : program;
          
          // Find the exercise in the program structure
            for (const workout of programData.weeklyStructure || []) {
            const found = workout.exercises?.find((ex: any) => {
              const exerciseIdMatch = ex.id === exerciseId || 
                                    ex.name.replace(/\s+/g, '-').toLowerCase() === exerciseId;
              return exerciseIdMatch;
            });
            
            if (found) {
              foundExercise = {
                ...found,
                id: found.id || found.name.replace(/\s+/g, '-').toLowerCase(),
                targetMuscle: found.targetMuscle || 'General',
                  restTime: Math.min(found.restSeconds || 60, 120),
              };
              break;
              }
            }
          }
        }
        
        // FINAL FALLBACK: Load from exercise database (for manual workouts)
        if (!foundExercise) {
          try {
            const { exerciseDatabase } = await import('@/constants/exercise-database');
            const dbExercise = exerciseDatabase.find(ex => ex.id === exerciseId);
            
            if (dbExercise) {
              console.log(`✅ [ExerciseTracker] Found exercise in database: ${dbExercise.name}`);
              foundExercise = {
                id: dbExercise.id,
                name: dbExercise.name,
                targetMuscle: dbExercise.targetMuscle,
                sets: 3,
                reps: '10',
                restTime: 60,
                notes: '',
              };
            }
          } catch (error) {
            console.error('❌ [ExerciseTracker] Error loading from exercise database:', error);
          }
        }
      }
      
      setExercise(foundExercise);
      
      // Safety: Only set progress if it's defined to avoid reference errors
      if (progress) {
        setUserProgressData(progress);
      }
    } catch (error) {
      console.error('❌ Failed to load exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomExercise = async () => {
    Alert.alert(
      'Delete Exercise',
      `Remove "${exercise?.name}" from today's workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id || !exerciseId) return;
              
              const progress = await userProgressService.getByUserId(user.id);
              if (progress?.weeklyWeights) {
                // Handle both string (from JSON) and object (from JSONB) types
                const weeklyWeights = typeof progress.weeklyWeights === 'string'
                  ? JSON.parse(progress.weeklyWeights)
                  : progress.weeklyWeights;
                const today = new Date().toISOString().split('T')[0];
                
                if (weeklyWeights.customExercises && weeklyWeights.customExercises[today]) {
                  weeklyWeights.customExercises[today] = weeklyWeights.customExercises[today].filter(
                    (ex: any) => ex.id !== exerciseId
                  );
                }
                
                await userProgressService.update(progress.id, {
                  weeklyWeights: JSON.stringify(weeklyWeights),
                });
                
                console.log('✅ Custom exercise deleted');
                router.back();
              }
            } catch (error) {
              console.error('❌ Failed to delete custom exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show loading while data is being fetched
  if (loading || !exercise) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {loading ? 'Loading...' : 'Exercise Not Found'}
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.errorContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={64} color={colors.lightGray} />
            <Text style={styles.errorTitle}>Exercise Not Found</Text>
            <Text style={styles.errorText}>The requested exercise could not be loaded</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exercise?.name || 'Exercise'}</Text>
          {isCustomExercise && exercise && (
            <TouchableOpacity onPress={handleDeleteCustomExercise} style={styles.deleteButton}>
              <Icon name="trash-2" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {exercise && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          {/* Details header intentionally hidden */}

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sets</Text>
              <Text style={styles.infoValue}>{exercise.sets}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Reps</Text>
              <Text style={styles.infoValue}>{exercise.reps}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rest</Text>
              <Text style={styles.infoValue}>{exercise.restTime}s</Text>
            </View>
          </View>
            <ExerciseTracker
                exercise={exercise}
                exerciseKey={exercise.id}
                userProgressData={userProgressData}
                registerSave={(fn) => {
                  // hook for future if we add custom back handling
                }}
              />
          {exercise.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Technique Notes:</Text>
              <Text style={styles.notesText}>{exercise.notes}</Text>
            </View>
          )}
          <View style={styles.trackerContainer}>
            <Text style={styles.trackerTitle}>Track Your Sets</Text>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>💪 Do more reps than the previous workout</Text>
            </View>
          </View>
        </ScrollView>
        )}
        
        {/* Loading Overlay - Only shows for completed exercises */}
        {showLoadingOverlay && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingOverlayContent}>
              <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
              <Text style={styles.loadingOverlayText}>
                Loading exercise
                <Text style={styles.loadingDots}>...</Text>
              </Text>
            </View>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  deleteButton: {
    marginLeft: 16,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  targetMuscle: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  targetMuscleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  notesContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesTitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: 8,
  },
  notesText: {
    ...typography.body,
    color: colors.lighterGray,
    lineHeight: 24,
  },
  trackerContainer: {
    marginBottom: 16,
  },
  trackerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  instructionContainer: {
    backgroundColor: 'rgba(58, 81, 153, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  instructionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayContent: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingOverlayText: {
    fontSize: 20,
    color: colors.lightGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingDots: {
    color: colors.primary,
  },
});
