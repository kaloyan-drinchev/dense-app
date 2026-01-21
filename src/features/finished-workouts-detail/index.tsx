import React from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { ExerciseTracker } from "@/components/ExerciseTracker";

import { styles } from "./styles";
import { useFinishedWorkoutDetailLogic } from "./logic";

export default function FinishedWorkoutsDetailScreen() {
  const {
    loading,
    workout,
    workoutPercentage,
    totalCalories,
    date,
    dateKey,
    exerciseLogs,
    sessionExercises, // NEW: From workout_sessions table
    customExercises,
    cardioEntries,
    handleBack,
  } = useFinishedWorkoutDetailLogic();

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {workout?.name || "Finished Workout"}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.workoutHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.dateText}>
                {new Date(String(date)).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {workoutPercentage !== null && (
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageText}>
                    {workoutPercentage === 100
                      ? "100% Completed"
                      : `${workoutPercentage}%`}
                  </Text>
                </View>
              )}
              {totalCalories > 0 && (
                <View style={styles.caloriesContainer}>
                  <Icon name="zap" size={14} color={colors.primary} />
                  <Text style={styles.caloriesText}>~{totalCalories} cal</Text>
                </View>
              )}
            </View>
          </View>

          {totalCalories >= 200 && (
            <View style={styles.motivationalMessage}>
              <Text style={styles.motivationalText}>
                {totalCalories >= 500
                  ? "🔥 This calorie burn is for LEGENDS! "
                  : totalCalories >= 300
                  ? "💪 Incredible effort! You're absolutely CRUSHING it!"
                  : "⭐ Nice work! Keep PUSHING forward!"}
              </Text>
            </View>
          )}

          {/* Standard Exercises */}
          {workout?.exercises?.map((ex: any, i: number) => {
            const exId = ex.id || ex.name.replace(/\s+/g, "-").toLowerCase();
            
            // NEW: Check completion from workout_sessions (session_exercises)
            let isCompleted = false;
            let sessionData = null;
            
            if (sessionExercises && sessionExercises.length > 0) {
              // Use NEW system - check session_exercises status
              const sessionExercise = sessionExercises.find((se: any) => se.exercise_id === exId);
              
              // DEBUG: Log ALL exercises to see their statuses
              if (i === 0) {
                console.log('🔍 [FinishedWorkoutDetail] === ALL EXERCISES STATUS ===');
                sessionExercises.forEach((se: any) => {
                  console.log(`  ${se.exercise_id}: ${se.status} (${se.sets?.filter((s: any) => s.is_completed).length || 0}/${se.sets?.length || 0} sets)`);
                });
                console.log('🔍 [FinishedWorkoutDetail] ==============================');
              }
              
              if (sessionExercise) {
                isCompleted = sessionExercise.status === 'COMPLETED';
                sessionData = sessionExercise;
              }
            } else {
              // Fallback to OLD system - check exerciseLogs
              const sessions = exerciseLogs[exId] || [];
              const sessionForDay = sessions.find((s: any) => s.date === dateKey);
              isCompleted = !!sessionForDay && sessionForDay.sets && sessionForDay.sets.some((set: any) => set.isCompleted);
              sessionData = sessionForDay;
            }

            return (
              <View key={i} style={{ marginTop: 8 }}>
                <View style={styles.exerciseHeader}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Icon
                        name="check-circle"
                        size={14}
                        color={colors.success}
                      />
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.notCompletedBadge}>
                      <Icon name="circle" size={14} color={colors.lightGray} />
                      <Text style={styles.notCompletedBadgeText}>
                        Not Completed
                      </Text>
                    </View>
                  )}
                </View>
                <ExerciseTracker
                  exercise={{
                    id: exId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restSeconds || 60,
                    targetMuscle: ex.targetMuscle || "General",
                  }}
                  exerciseKey={exId}
                  readOnly
                  presetSession={
                    sessionData
                      ? sessionData.sets
                        ? {
                            // NEW system: session_sets
                            unit: "kg",
                            sets: sessionData.sets.map((s: any) => ({
                              setNumber: s.set_number || 0,
                              weightKg: s.weight_kg || 0,
                              reps: s.reps || 0,
                              isCompleted: s.is_completed || false,
                            })),
                          }
                        : {
                            // OLD system: exerciseLogs
                            unit: sessionData.unit || "kg",
                            sets: sessionData.sets || [],
                          }
                      : undefined
                  }
                />
              </View>
            );
          })}

          {/* Custom Exercises */}
          {customExercises.map((ex: any) => {
            const exId = ex.id;
            const sessions = exerciseLogs[exId] || [];
            const sessionForDay = sessions.find((s: any) => s.date === dateKey);
            const isCompleted =
              !!sessionForDay &&
              sessionForDay.sets &&
              sessionForDay.sets.some((set: any) => set.isCompleted);

            return (
              <View key={exId} style={{ marginTop: 8 }}>
                <View style={styles.exerciseHeader}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Icon
                        name="check-circle"
                        size={14}
                        color={colors.success}
                      />
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.notCompletedBadge}>
                      <Icon name="circle" size={14} color={colors.lightGray} />
                      <Text style={styles.notCompletedBadgeText}>
                        Not Completed
                      </Text>
                    </View>
                  )}
                </View>
                <ExerciseTracker
                  exercise={{
                    id: exId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restSeconds || 60,
                    targetMuscle: ex.targetMuscle || "Custom",
                  }}
                  exerciseKey={exId}
                  readOnly
                  presetSession={
                    sessionForDay
                      ? {
                          unit: sessionForDay.unit || "kg",
                          sets: sessionForDay.sets || [],
                        }
                      : undefined
                  }
                />
              </View>
            );
          })}

          {/* Cardio Section */}
          {cardioEntries.length > 0 && (
            <View style={styles.cardioSection}>
              <Text style={styles.cardioSectionTitle}>Cardio</Text>
              {cardioEntries.map((cardio: any) => {
                const durationText =
                  cardio.hours > 0
                    ? `${cardio.hours}h ${cardio.minutes || 0}m`
                    : `${cardio.durationMinutes || cardio.minutes || 0}m`;

                return (
                  <View key={cardio.id} style={styles.cardioCard}>
                    <View style={styles.cardioCardContent}>
                      <Icon name="activity" size={20} color={colors.primary} />
                      <View style={styles.cardioCardInfo}>
                        <View style={styles.cardioCardHeader}>
                          <Text style={styles.cardioCardName}>
                            {cardio.typeName}
                          </Text>
                          <View style={styles.cardioCompletedBadge}>
                            <Icon
                              name="check-circle"
                              size={14}
                              color={colors.success}
                            />
                            <Text style={styles.cardioCompletedBadgeText}>
                              Completed
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardioCardDetails}>
                          {durationText} • {cardio.calories} cal
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
