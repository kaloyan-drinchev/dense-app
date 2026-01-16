import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useWorkoutExerciseTrackerLogic } from "./logic";

import { ExerciseTracker } from "@/components/ExerciseTracker";
import { FloatingButton } from "@/components/FloatingButton";

export default function WorkoutExerciseTrackerScreen() {
  const {
    exercise,
    loading,
    showLoadingOverlay,
    userProgressData,
    completeButtonState,
    setCompleteButtonState,
    isCustomExercise,
    handleDeleteCustomExercise,
    handleBackPress,
  } = useWorkoutExerciseTrackerLogic();

  // Show loading or error state
  if (loading || !exercise) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.dark, colors.darkGray]}
          style={styles.fullScreen}
        >
          <View style={styles.floatingHeaderBar}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.floatingBackButton}
            >
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.errorContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={64} color={colors.lightGray} />
              <Text style={styles.errorTitle}>Exercise Not Found</Text>
              <Text style={styles.errorText}>
                The requested exercise could not be loaded
              </Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.fullScreen}
      >
        {/* Floating Header */}
        <View style={styles.floatingHeaderBar}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.floatingBackButton}
          >
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          {isCustomExercise && exercise && (
            <TouchableOpacity
              onPress={handleDeleteCustomExercise}
              style={styles.floatingDeleteButton}
            >
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
          {/* Exercise Image */}
          <View style={styles.exerciseImageContainer}>
            <Image
              source={{
                uri:
                  exercise.thumbnail_url ||
                  "https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/default-image.jpg",
              }}
              style={styles.exerciseImage}
              contentFit="cover"
              transition={200}
              cachePolicy="none"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", colors.dark]}
              style={styles.imageGradientOverlay}
              locations={[0, 0.5, 1]}
            />
          </View>

          <View style={styles.exerciseContentWrapper}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            <ExerciseTracker
              exercise={exercise}
              exerciseKey={exercise.id}
              userProgressData={userProgressData}
              registerSave={() => {}}
              hideCompleteButton={true}
              onCompleteStateChange={setCompleteButtonState}
            />

            {exercise.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Technique Notes:</Text>
                <Text style={styles.notesText}>{exercise.notes}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Complete Button */}
        {completeButtonState && (
          <FloatingButton
            text={
              completeButtonState.allCompleted
                ? "Completed"
                : "Complete Exercise"
            }
            onPress={completeButtonState.onComplete}
            disabled={
              completeButtonState.allCompleted ||
              completeButtonState.isLoading ||
              completeButtonState.isCompleting
            }
            icon={!completeButtonState.allCompleted ? "check" : undefined}
          />
        )}

        {/* Loading Overlay */}
        {showLoadingOverlay && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingOverlayContent}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.spinner}
              />
              <Text style={styles.loadingOverlayText}>
                Loading exercise
                <Text style={styles.loadingDots}>...</Text>
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
