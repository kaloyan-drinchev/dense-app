import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workout-store";
import { colors } from "@/constants/colors";
import { WorkoutCard } from "@/components/WorkoutCard";
import { getProgressPercentage } from "@/utils/helpers";
import { Stack } from "expo-router";

export default function WeekDetailScreen() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const router = useRouter();
  const { activeProgram, userProgress } = useWorkoutStore();

  if (!activeProgram || !userProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active program found</Text>
      </View>
    );
  }

  // Find the week in the active program
  const week = activeProgram.weeks.find(w => w.id === weekId);
  
  if (!week) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Week not found</Text>
      </View>
    );
  }

  const handleWorkoutPress = (workoutId: string) => {
    router.push(`/program/workout/${workoutId}` as any);
  };

  const completedWorkouts = week.workouts.filter(w => w.isCompleted).length;
  const totalWorkouts = week.workouts.length;
  const progressPercentage = getProgressPercentage(
    week.workouts.filter(w => w.isCompleted).map(w => w.id),
    totalWorkouts
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Week ${week.weekNumber}`,
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Week {week.weekNumber} Workouts</Text>
            <Text style={styles.subtitle}>
              {completedWorkouts}/{totalWorkouts} workouts completed
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progressPercentage}%` },
                  week.isCompleted && styles.completedProgressBar,
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>

          <View style={styles.workoutsContainer}>
            {week.workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => handleWorkoutPress(workout.id)}
              />
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Week {week.weekNumber} Focus</Text>
            <Text style={styles.infoText}>
              {activeProgram.type === 'full-body'
                ? week.weekNumber <= 4
                  ? 'Building a foundation with moderate weights and higher reps to establish proper form and muscle endurance.'
                  : week.weekNumber <= 8
                  ? 'Increasing weights and decreasing reps to focus on strength development and muscle growth.'
                  : 'Pushing heavy weights with lower reps to maximize strength gains and muscle density.'
                : 'Maintaining muscle mass while burning fat through consistent progressive overload and added cardio.'}
            </Text>
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
  header: {
    marginBottom: 16,
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
  errorText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.darkGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  completedProgressBar: {
    backgroundColor: colors.success,
  },
  progressPercentage: {
    fontSize: 14,
    color: colors.lightGray,
    alignSelf: 'flex-end',
  },
  workoutsContainer: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.lighterGray,
    lineHeight: 24,
  },
});