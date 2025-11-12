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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
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
  const isCustomExercise = exerciseId?.startsWith('custom-');

  useEffect(() => {
    loadExerciseData();
  }, [exerciseId, user]);

  const loadExerciseData = async () => {
    if (!user?.id || !exerciseId) {
      setLoading(false);
      return;
    }

    try {
      let foundExercise = null;
      
      // Check if it's a custom exercise (starts with 'custom-')
      if (exerciseId.startsWith('custom-')) {
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.weeklyWeights) {
          const weeklyWeights = JSON.parse(progress.weeklyWeights);
          const today = new Date().toISOString().split('T')[0];
          const customExercises = weeklyWeights?.customExercises?.[today] || [];
          
          foundExercise = customExercises.find((ex: any) => ex.id === exerciseId);
          
          if (foundExercise) {
            foundExercise = {
              ...foundExercise,
              targetMuscle: foundExercise.targetMuscle || 'Custom',
              restTime: foundExercise.restSeconds || 60,
            };
          }
        }
      } else {
        // Load from generated program data
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        if (wizardResults?.generatedSplit) {
          const program = JSON.parse(wizardResults.generatedSplit);
          
          // Find the exercise in the program structure
          for (const workout of program.weeklyStructure || []) {
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
                restTime: found.restSeconds || 60,
              };
              break;
            }
          }
        }
      }
      
      setExercise(foundExercise);
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
                const weeklyWeights = JSON.parse(progress.weeklyWeights);
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

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading exercise...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!exercise) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Exercise</Text>
          </View>
          
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
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          {isCustomExercise && (
            <TouchableOpacity onPress={handleDeleteCustomExercise} style={styles.deleteButton}>
              <Icon name="trash-2" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

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
            <ExerciseTracker
              exercise={exercise}
              exerciseKey={exercise.id}
              registerSave={(fn) => {
                // hook for future if we add custom back handling
              }}
            />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
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
});
