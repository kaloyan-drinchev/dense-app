import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useWorkoutStore } from '@/store/workout-store';
import { colors } from '@/constants/colors';
import { ExerciseCard } from '@/components/ExerciseCard';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const { activeProgram, completeWorkout } = useWorkoutStore();
  const [timer, setTimer] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  if (!activeProgram) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active program found</Text>
      </View>
    );
  }

  // Find the workout in the active program
  let workout = null;
  let weekNumber = 0;

  for (const week of activeProgram.weeks) {
    const found = week.workouts.find((w) => w.id === workoutId);
    if (found) {
      workout = found;
      weekNumber = week.weekNumber;
      break;
    }
  }

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const handleExercisePress = (exerciseId: string) => {
    router.push(`/program/exercise/${exerciseId}` as any);
  };

  const handleStartTimer = () => {
    if (timer) {
      // Stop timer
      clearInterval(timer);
      setTimer(null);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Start timer
      const intervalId = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
      setTimer(intervalId as unknown as number);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const resetTimer = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setSeconds(0);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleCompleteWorkout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert('Complete Workout', 'Mark this workout as completed?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Complete',
        onPress: () => {
          completeWorkout(workout!.id);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: workout.name,
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{workout.name}</Text>
              <Text style={styles.subtitle}>
                Week {weekNumber} • Day {workout.day}
              </Text>
            </View>
            {workout.isCompleted && (
              <View style={styles.completedBadge}>
                <Icon name="check-circle" size={16} color={colors.white} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerDisplay}>
              <Icon name="clock" size={20} color={colors.white} />
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>
            <View style={styles.timerButtons}>
              <TouchableOpacity
                style={[
                  styles.timerButton,
                  timer ? styles.timerButtonStop : styles.timerButtonStart,
                ]}
                onPress={handleStartTimer}
              >
                <Text style={styles.timerButtonText}>
                  {timer ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timerButtonReset}
                onPress={resetTimer}
              >
                <Text style={styles.timerButtonResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.exercisesContainer}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {workout.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => handleExercisePress(exercise.id)}
                index={index}
              />
            ))}
          </View>

          {workout.cardio && (
            <View style={styles.cardioContainer}>
              <Text style={styles.sectionTitle}>Cardio</Text>
              <View style={styles.cardioCard}>
                <View style={styles.cardioHeader}>
                  <View style={styles.cardioIcon}>
                    <MaterialIcon name="timer" size={24} color={colors.white} />
                  </View>
                  <View style={styles.cardioInfo}>
                    <Text style={styles.cardioTitle}>
                      {workout.cardio.type}
                    </Text>
                    <Text style={styles.cardioSubtitle}>
                      {workout.cardio.duration} minutes •{' '}
                      {workout.cardio.intensity} intensity
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardioDescription}>
                  Complete this cardio session after your strength workout to
                  maximize fat burning while preserving muscle mass.
                </Text>
              </View>
            </View>
          )}

          {!workout.isCompleted && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteWorkout}
            >
              <Icon name="check-circle" size={20} color={colors.white} />
              <Text style={styles.completeButtonText}>Complete Workout</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  errorText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 24,
  },
  timerCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timerButtonStart: {
    backgroundColor: colors.primary,
  },
  timerButtonStop: {
    backgroundColor: colors.error,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  timerButtonReset: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.mediumGray,
    alignItems: 'center',
  },
  timerButtonResetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  exercisesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  cardioContainer: {
    marginBottom: 24,
  },
  cardioCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
  },
  cardioHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  cardioSubtitle: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  cardioDescription: {
    fontSize: 16,
    color: colors.lighterGray,
    lineHeight: 24,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
