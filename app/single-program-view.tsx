import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { userProgressService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';
import { PUSH_DAY_A, PUSH_DAY_B, PULL_DAY_A, PULL_DAY_B, LEG_DAY_A, LEG_DAY_B, WorkoutTemplate } from '@/lib/workout-templates';

const SingleProgramView = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);

  // All workout templates
  const workoutTemplates: WorkoutTemplate[] = [
    PUSH_DAY_A,
    PUSH_DAY_B,
    PULL_DAY_A,
    PULL_DAY_B,
    LEG_DAY_A,
    LEG_DAY_B,
  ];

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const progress = await userProgressService.getByUserId(user.id);
      setUserProgressData(progress);
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate how many times each workout type has been completed
  const getWorkoutCompletionCount = (workoutType: string) => {
    try {
      if (!userProgressData?.completedWorkouts) return 0;
      
      const completedRaw = userProgressData.completedWorkouts;
      let completed: any[] = [];
      
      if (Array.isArray(completedRaw)) {
        completed = completedRaw;
      } else if (typeof completedRaw === 'string') {
        completed = JSON.parse(completedRaw);
      }
      
      // Count workouts matching this type
      return completed.filter((item: any) => 
        item.workoutName && item.workoutName.toLowerCase().includes(workoutType.toLowerCase())
      ).length;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading your program...</Text>
            <Text style={styles.loadingSubtext}>Getting your custom workout ready</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={1}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Push Pull Legs Program</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Program Overview */}
          <View style={styles.programOverview}>
            <Text style={styles.programDescription}>
              Rotate through these 6 workouts in order for balanced muscle development
            </Text>
            
            {/* Info Button to toggle description */}
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowDescription(!showDescription)}
            >
              <Icon name="info-outline" size={20} color={colors.primary} />
              <Text style={styles.infoButtonText}>
                {showDescription ? 'Hide Info' : 'Show Info'}
              </Text>
            </TouchableOpacity>

            {/* Collapsible Program Info */}
            {showDescription && (
              <View style={styles.infoBullets}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Push Day A & B focus on chest, shoulders, and triceps with different exercise variations
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Pull Day A & B target back and biceps with varied exercises for complete development
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Leg Day A & B work quads, hamstrings, and glutes with different intensities and movements
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Alternate between A and B versions to prevent adaptation and maximize muscle growth
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Workout Templates */}
          {workoutTemplates.map((workout) => {
            const completionCount = getWorkoutCompletionCount(workout.name);
            const isExpanded = expandedWorkout === workout.id;
            
            return (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                activeOpacity={0.8}
              >
                <View style={styles.workoutCardHeader}>
                  <View style={styles.workoutCardLeft}>
                    <Text style={styles.workoutCardTitle}>{workout.name}</Text>
                    <Text style={styles.workoutCardMeta}>
                      {workout.exercises.length} exercises • {workout.estimatedDuration} mins
                    </Text>
                    <Text style={styles.workoutCardCompletion}>
                      Completed {completionCount} times
                    </Text>
                  </View>
                  <Feather 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={colors.lightGray} 
                  />
                </View>

                {/* Expanded Exercise List */}
                {isExpanded && (
                  <View style={styles.exerciseList}>
                    {workout.exercises.map((exercise, idx) => (
                      <View key={exercise.id} style={styles.exerciseItem}>
                        <Text style={styles.exerciseNumber}>{idx + 1}</Text>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseDetails}>
                            {exercise.sets} sets • {exercise.reps} reps
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SingleProgramView;

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 8,
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.lightGray,
  },
  programOverview: {
    paddingVertical: 24,
  },
  programDescription: {
    ...typography.body,
    color: colors.lightGray,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  infoButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBullets: {
    marginTop: 20,
    gap: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    ...typography.body,
    color: colors.primary,
    fontSize: 20,
    lineHeight: 20,
    marginTop: 2,
  },
  bulletText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 22,
  },
  workoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  workoutCardTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
  },
  workoutCardMeta: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 4,
  },
  workoutCardCompletion: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  exerciseList: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
});
