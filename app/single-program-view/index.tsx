import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "@expo/vector-icons/MaterialIcons";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useProgramDetailsLogic } from "./logic";

const SingleProgramView = () => {
  const {
    loading,
    showDescription,
    expandedWorkout,
    workoutTemplates,
    toggleDescription,
    toggleWorkoutExpansion,
    handleBack,
    getWorkoutCompletionCount,
  } = useProgramDetailsLogic();

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading your program...</Text>
            <Text style={styles.loadingSubtext}>
              Getting your custom workout ready
            </Text>
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
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={1}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Push Pull Legs Program</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Program Overview */}
          <View style={styles.programOverview}>
            <Text style={styles.programDescription}>
              Rotate through these 6 workouts in order for balanced muscle
              development
            </Text>

            {/* Info Button to toggle description */}
            <TouchableOpacity
              style={styles.infoButton}
              onPress={toggleDescription}
            >
              <Icon name="info-outline" size={20} color={colors.primary} />
              <Text style={styles.infoButtonText}>
                {showDescription ? "Hide Info" : "Show Info"}
              </Text>
            </TouchableOpacity>

            {/* Collapsible Program Info */}
            {showDescription && (
              <View style={styles.infoBullets}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Push Day A & B focus on chest, shoulders, and triceps with
                    different exercise variations
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Pull Day A & B target back and biceps with varied exercises
                    for complete development
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Leg Day A & B work quads, hamstrings, and glutes with
                    different intensities and movements
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Alternate between A and B versions to prevent adaptation and
                    maximize muscle growth
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
                onPress={() => toggleWorkoutExpansion(workout.id)}
                activeOpacity={0.8}
              >
                <View style={styles.workoutCardHeader}>
                  <View style={styles.workoutCardLeft}>
                    <Text style={styles.workoutCardTitle}>{workout.name}</Text>
                    <Text style={styles.workoutCardMeta}>
                      {workout.exercises.length} exercises •{" "}
                      {workout.estimatedDuration} mins
                    </Text>
                    <Text style={styles.workoutCardCompletion}>
                      Completed {completionCount} times
                    </Text>
                  </View>
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
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
                          <Text style={styles.exerciseName}>
                            {exercise.name}
                          </Text>
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
