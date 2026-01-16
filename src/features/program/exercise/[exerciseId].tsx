import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useWorkoutStore } from "@/store/workout-store";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { ExerciseTracker } from "@/components/ExerciseTracker";
import { Image } from "expo-image";

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { activeProgram } = useWorkoutStore();

  if (!activeProgram) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active program found</Text>
      </View>
    );
  }

  // Find the exercise in the active program
  let exercise = null;
  let workout = null;
  
  for (const week of activeProgram.weeks) {
    for (const w of week.workouts) {
      const found = w.exercises.find(e => e.id === exerciseId);
      if (found) {
        exercise = found;
        workout = w;
        break;
      }
    }
    if (exercise) break;
  }
  
  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: exercise.name,
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {exercise.imageUrl && (
            <Image
              source={{ uri: exercise.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          )}

          <View style={styles.header}>
            <Text style={styles.title}>{exercise.name}</Text>
            <View style={styles.targetMuscle}>
              <Text style={styles.targetMuscleText}>{exercise.targetMuscle}</Text>
            </View>
          </View>

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
            <ExerciseTracker exercise={exercise} exerciseKey={exerciseId || exercise.id || exercise.name} />
          </View>
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
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
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
  errorText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 24,
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
    fontSize: 16,
    fontWeight: 'bold',
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
});