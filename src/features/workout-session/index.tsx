import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useWorkoutSessionLogic } from "./logic";

// Components
import { ExerciseCard } from "@/components/ExerciseCard";
import { WorkoutOptionsModal } from "@/components/WorkoutOptionsModal";
import { WorkoutPreviewModal } from "@/components/WorkoutPreviewModal";
import { WorkoutNotStartedModal } from "@/components/WorkoutNotStartedModal";
import { AddCustomExerciseModal } from "@/components/AddCustomExerciseModal";
import { CardioEntryModal } from "@/components/CardioEntryModal";
import { FloatingButton } from "@/components/FloatingButton";

export default function WorkoutSessionScreen() {
  const {
    userProgressData,
    loading,
    todaysWorkout,
    isCardioWorkout,
    workoutStarted,
    formattedTime,
    cardioTimer,
    totalWorkoutCalories,
    workoutProgress,
    customExercises,
    cardioEntries,
    showOptionsModal,
    setShowOptionsModal,
    showPreviewModal,
    setShowPreviewModal,
    showNotStartedModal,
    setShowNotStartedModal,
    showAddExerciseModal,
    setShowAddExerciseModal,
    showCardioModal,
    setShowCardioModal,
    showWorkoutConfirmModal,
    setShowWorkoutConfirmModal,
    workoutCompletionData,
    isFinishing,
    isStartingWorkout,
    userWeight,
    updatingExerciseId,

    // Functions
    getExerciseStatus,
    hasPRPotential,
    handleStartWorkout,
    handleStartWorkoutPress,
    handleViewOption,
    handleLetsGoOption,
    handleStopWorkout,
    handleExercisePress,
    handleFinishWorkout,
    completeWorkoutWithPercentage,
    handleAddCustomExercise,
    handleAddCardio,
    handleResetTimer,
    handleBackPress,
    ensureMinimumDuration,
    isRunning,
    pauseTimer,
    resumeTimer,
  } = useWorkoutSessionLogic();

  if (loading || !userProgressData) {
    return (
      <LinearGradient colors={["#000000", "#0A0A0A"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loadingSpinner}
            />
            <Text style={styles.loadingText}>Loading your workout...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#000000", "#0A0A0A"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Starting Workout Loading Overlay */}
        {isStartingWorkout && (
          <BlurView intensity={20} style={styles.startingWorkoutOverlay}>
            <View style={styles.startingWorkoutContent}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loadingSpinner}
              />
              <Text style={styles.startingWorkoutText}>Starting workout...</Text>
            </View>
          </BlurView>
        )}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={1}
          >
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutName}>{todaysWorkout?.name}</Text>

            <View
              style={[
                styles.timerContainer,
                !workoutStarted && styles.timerContainerInactive,
                isCardioWorkout &&
                  cardioTimer.isComplete &&
                  styles.timerContainerComplete,
              ]}
            >
              {isCardioWorkout && workoutStarted ? (
                <View style={styles.cardioTimerContent}>
                  <Text
                    style={[
                      styles.timerText,
                      cardioTimer.isComplete && styles.timerTextComplete,
                    ]}
                  >
                    {cardioTimer.display}
                  </Text>
                  <Text style={styles.timerLabel}>
                    {cardioTimer.isComplete ? "overtime 🎯" : "remaining"}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.timerText, !workoutStarted && styles.timerTextInactive]}>
                  {workoutStarted ? formattedTime : "00:00"}
                </Text>
              )}

              {workoutStarted && (
                <View style={styles.timerControls}>
                  <TouchableOpacity
                    style={[styles.timerButton, styles.resetButton]}
                    onPress={handleResetTimer}
                  >
                    <Icon name="refresh-cw" size={16} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.timerButton,
                      isRunning ? styles.pauseButton : styles.playButton,
                    ]}
                    onPress={isRunning ? pauseTimer : resumeTimer}
                  >
                    <Icon
                      name={isRunning ? "pause" : "play"}
                      size={16}
                      color={colors.black}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timerButton, styles.stopButton]}
                    onPress={handleStopWorkout}
                  >
                    <Icon name="x" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={styles.metaText}>
                  {isCardioWorkout
                    ? todaysWorkout?.estimatedDuration
                    : ensureMinimumDuration(
                        todaysWorkout?.estimatedDuration
                      )}{" "}
                  min
                </Text>
              </View>
              {(!workoutStarted || isCardioWorkout) && (
                <View style={styles.metaItem}>
                  <Icon name="zap" size={16} color={colors.primary} />
                  <Text style={styles.metaText}>
                    Approx. {totalWorkoutCalories} calories burned
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.exercisesSection}>
            {isCardioWorkout ? (
              <>
                <Text style={styles.sectionTitle}>Cardio Session</Text>
                <View style={styles.cardioSessionCard}>
                  <View style={styles.cardioSessionIcon}>
                    <Icon name="activity" size={48} color={colors.primary} />
                  </View>
                  {!workoutStarted ? (
                    <Text style={styles.cardioSessionText}>
                      Start timer to track
                    </Text>
                  ) : (
                    <>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${cardioTimer.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.cardioSessionText}>
                        {cardioTimer.isComplete
                          ? "Target reached!"
                          : `${Math.round(cardioTimer.progress)}% complete`}
                      </Text>
                    </>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.exercisesSectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Exercises (
                    {(todaysWorkout?.exercises?.length || 0) +
                      customExercises.length}
                    )
                  </Text>
                  {workoutStarted && (
                    <View style={styles.addButtonsContainer}>
                      {customExercises.length < 3 && (
                        <TouchableOpacity
                          style={styles.addExerciseButton}
                          onPress={() => setShowAddExerciseModal(true)}
                        >
                          <Icon name="plus" size={20} color={colors.black} />
                          <Text style={styles.addExerciseButtonText}>
                            Exercise
                          </Text>
                        </TouchableOpacity>
                      )}
                      {(cardioEntries?.length ?? 0) < 3 && (
                        <TouchableOpacity
                          style={styles.addCardioButton}
                          onPress={() => setShowCardioModal(true)}
                        >
                          <Icon
                            name="activity"
                            size={20}
                            color={colors.black}
                          />
                          <Text style={styles.addCardioButtonText}>
                            + Cardio
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {todaysWorkout?.exercises?.map(
                  (exercise: any, index: number) => {
                    const exerciseId =
                      exercise.id ||
                      exercise.name.replace(/\s+/g, "-").toLowerCase();
                    return (
                      <ExerciseCard
                        key={index}
                        exercise={{
                          ...exercise,
                          id: exerciseId,
                          targetMuscle: exercise.targetMuscle || "General",
                          restTime: exercise.restSeconds || 60,
                          isCompleted:
                            getExerciseStatus(exerciseId, exercise.sets) ===
                            "completed",
                        }}
                        index={index}
                        onPress={() => handleExercisePress(exerciseId)}
                        status={getExerciseStatus(exerciseId, exercise.sets)}
                        prPotential={hasPRPotential(exerciseId)}
                        isUpdating={updatingExerciseId === exerciseId}
                      />
                    );
                  }
                )}

                {customExercises.map((exercise: any, index: number) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={{
                      ...exercise,
                      isCustom: true,
                      isCompleted:
                        getExerciseStatus(exercise.id, exercise.sets) ===
                        "completed",
                    }}
                    index={(todaysWorkout?.exercises?.length || 0) + index}
                    onPress={() => handleExercisePress(exercise.id)}
                    status={getExerciseStatus(exercise.id, exercise.sets)}
                    prPotential={false}
                    isUpdating={updatingExerciseId === exercise.id}
                  />
                ))}

                {/* Cardio List */}
                {cardioEntries.length > 0 && (
                  <View style={styles.cardioSection}>
                    <Text style={styles.cardioSectionTitle}>Cardio</Text>
                    {cardioEntries.map((cardio: any) => (
                      <View key={cardio.id} style={styles.cardioCard}>
                        <View style={styles.cardioCardContent}>
                          <Icon
                            name="activity"
                            size={20}
                            color={colors.primary}
                          />
                          <View style={styles.cardioCardInfo}>
                            <Text style={styles.cardioCardName}>
                              {cardio.typeName}
                            </Text>
                            <Text style={styles.cardioCardDetails}>
                              {cardio.calories} cal
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {workoutStarted && (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinishWorkout}
              >
                <Text style={styles.finishButtonText}>
                  {isCardioWorkout
                    ? "Finish Cardio Session"
                    : `Finish Workout (${workoutProgress.percentage}%)`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {!workoutStarted && (
          <FloatingButton
            text="Start Workout"
            onPress={handleStartWorkoutPress}
            icon="play"
            gradientColors={["#00FF88", "#00CC6A"]}
            textColor={colors.black}
          />
        )}
      </SafeAreaView>

      {/* Modals */}
      <WorkoutOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onView={handleViewOption}
        onLetsGo={handleLetsGoOption}
        workoutName={todaysWorkout?.name}
      />
      <WorkoutPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onStartWorkout={handleStartWorkout}
        workoutName={todaysWorkout?.name}
        exercises={
          todaysWorkout?.exercises?.map((ex: any) => ({
            ...ex,
            id: ex.id || ex.name.replace(/\s+/g, "-").toLowerCase(),
          })) || []
        }
        estimatedDuration={`${ensureMinimumDuration(
          todaysWorkout?.estimatedDuration
        )} min`}
      />
      <WorkoutNotStartedModal
        visible={showNotStartedModal}
        onClose={() => setShowNotStartedModal(false)}
        onStartWorkout={() => {
          setShowNotStartedModal(false);
          handleStartWorkout();
        }}
      />
      <AddCustomExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAdd={handleAddCustomExercise}
      />
      <CardioEntryModal
        visible={showCardioModal}
        onClose={() => setShowCardioModal(false)}
        onSave={handleAddCardio}
        userWeight={userWeight}
      />

      {workoutCompletionData && (
        <Modal
          visible={showWorkoutConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWorkoutConfirmModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWorkoutConfirmModal(false)}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>
                  {workoutCompletionData.percentage === 100
                    ? "🎉 Amazing Work!"
                    : "Complete Workout?"}
                </Text>
                <Text style={styles.modalDescription}>
                  {workoutCompletionData.percentage === 100
                    ? `You've completed all ${workoutCompletionData.total} exercises!`
                    : `You're at ${workoutCompletionData.percentage}% completion.`}
                </Text>
                <View style={styles.modalButtons}>
                  {workoutCompletionData.percentage !== 100 && (
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.cancelButton,
                        styles.dualButton,
                      ]}
                      onPress={() => {
                        setShowWorkoutConfirmModal(false);
                        completeWorkoutWithPercentage();
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Yes, Finish</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      workoutCompletionData.percentage === 100
                        ? styles.singleButton
                        : styles.dualButton,
                    ]}
                    onPress={() => {
                      if (workoutCompletionData.percentage === 100) {
                        setShowWorkoutConfirmModal(false);
                        completeWorkoutWithPercentage();
                      } else {
                        setShowWorkoutConfirmModal(false);
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>
                      {workoutCompletionData.percentage === 100
                        ? "Finish Workout"
                        : "Continue"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {isFinishing && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.finishingOverlay}>
            <View style={styles.finishingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.finishingText}>Finishing workout...</Text>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}
