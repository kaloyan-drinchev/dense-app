import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Feather as Icon,
  MaterialIcons as MaterialIcon,
} from "@expo/vector-icons";

import { styles } from "./styles";
import { useHomeLogic } from "./logic";
import { colors, gradients } from "@/constants/colors";
import { getExerciseThumbnailUrl } from "@/services/video-service";

import { WorkoutStartModal } from "@/components/WorkoutStartModal";
import { WorkoutUnavailableModal } from "@/components/WorkoutUnavailableModal";
import { StatGroup } from "@/components/StatGroup";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { HomepageVideoModal } from "@/components/HomepageVideoModal";

// --- Small Helper Components (Can be moved to /components later) ---
const ExerciseThumbnailWithLoader: React.FC<{ exerciseName: string }> = ({
  exerciseName,
}) => {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.thumbnailWrapper}>
      <Image
        source={{ uri: getExerciseThumbnailUrl(exerciseName) }}
        style={styles.exerciseThumbnail}
        contentFit="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        transition={200}
      />
      {loading && (
        <View style={styles.thumbnailLoader}>
          <ActivityIndicator size="small" color={colors.white} />
        </View>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    // Data
    user,
    generatedProgram,
    userProgressData,
    nextWorkout,
    workoutAvailability,
    currentTime,
    // Flags
    loadingProgram,
    loadingProgress,
    isRegenerating,
    isSkipping,
    isRefreshingWorkout,
    isWorkoutActive,
    isRunning,
    // Modals
    showWorkoutModal,
    setShowWorkoutModal,
    showVideoModal,
    setShowVideoModal,
    showComingSoonModal,
    setShowComingSoonModal,
    showUnavailableModal,
    setShowUnavailableModal,
    // Handlers
    handleStartWorkoutPress,
    handleSkipWorkout,
    handleRegenerateWorkout,
    handleConfirmWorkout,
    handleCancelWorkout,
    handleShareWorkout,
    handleAdjustDuration,
    pauseTimer,
    resumeTimer,
    formatTimerTime,
    getFirstUncompletedExercise,
    calculateWorkoutStreak,
  } = useHomeLogic();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          isWorkoutActive && { paddingBottom: 180 },
        ]}
      >
        {/* Loading State */}
        {(loadingProgram || loadingProgress) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your workout...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loadingProgram && !loadingProgress && !generatedProgram && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Program</Text>
            <Text style={styles.emptyText}>
              {!user?.id
                ? "Please restart the app to load your profile."
                : "Complete the setup wizard to generate your personalized training program."}
            </Text>
          </View>
        )}

        {/* Weekly Schedule */}
        {!loadingProgram && !loadingProgress && generatedProgram && (
          <WeeklySchedule
            trainingDays={generatedProgram.trainingSchedule || []}
          />
        )}

        {/* Next Workout Preview */}
        {nextWorkout ? (
          <View style={styles.todaysWorkout}>
            <View style={styles.workoutCard}>
              <LinearGradient
                colors={gradients.card as [string, string, ...string[]]}
                style={styles.workoutGradient}
              >
                <View style={styles.nextWorkoutBadge}>
                  <Text style={styles.nextWorkoutBadgeText}>
                    {isWorkoutActive ? "IN PROGRESS" : "NEXT WORKOUT"}
                  </Text>
                </View>

                <View style={styles.workoutHeader}>
                  {isRefreshingWorkout ? (
                    <View style={styles.loadingWorkoutName} />
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={handleStartWorkoutPress}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.workoutName}>
                          {nextWorkout.name}
                        </Text>
                      </TouchableOpacity>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.thumbnailsContainer}
                        contentContainerStyle={styles.thumbnailsContent}
                      >
                        {nextWorkout.exercises
                          .slice(0, 6)
                          .map((exercise: any) => (
                            <ExerciseThumbnailWithLoader
                              key={exercise.id}
                              exerciseName={exercise.name}
                            />
                          ))}
                      </ScrollView>

                      <Text style={styles.workoutMeta}>
                        {nextWorkout.estimatedDuration} mins •{" "}
                        {nextWorkout.exercises.length} exercises
                      </Text>
                    </>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      (isWorkoutActive || isSkipping || isRegenerating) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={handleSkipWorkout}
                    disabled={isWorkoutActive || isSkipping || isRegenerating}
                  >
                    {isSkipping ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Icon
                          name="skip-forward"
                          size={20}
                          color={colors.white}
                        />
                        <Text style={styles.actionButtonText}>Skip</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      (isWorkoutActive || isSkipping || isRegenerating) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={handleRegenerateWorkout}
                    disabled={isWorkoutActive || isSkipping || isRegenerating}
                  >
                    {isRegenerating ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Icon
                          name="refresh-cw"
                          size={20}
                          color={colors.white}
                        />
                        <Text style={styles.actionButtonText}>Regenerate</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAdjustDuration}
                  >
                    <Icon name="clock" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Duration</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShareWorkout}
                  >
                    <Icon name="send" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        ) : null}

        {/* Alternative Workouts */}
        <View style={styles.alternativeWorkoutsSection}>
          <Text style={styles.alternativeWorkoutsTitle}>
            Feeling like something different?
          </Text>
          <View style={styles.alternativeWorkoutsRow}>
            <TouchableOpacity
              style={styles.alternativeCard}
              onPress={() => setShowComingSoonModal(true)}
            >
              <View
                style={[
                  styles.alternativeIconCircle,
                  { backgroundColor: "rgba(138, 43, 226, 0.2)" },
                ]}
              >
                <Icon name="star" size={24} color="#8A2BE2" />
              </View>
              <Text style={styles.alternativeCardTitle}>Custom</Text>
              <Text style={styles.alternativeCardSubtitle}>
                Let our AI help you create a workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alternativeCard}
              onPress={() => setShowComingSoonModal(true)}
            >
              <View
                style={[
                  styles.alternativeIconCircle,
                  { backgroundColor: "rgba(34, 197, 94, 0.2)" },
                ]}
              >
                <Icon name="activity" size={24} color="#22C55E" />
              </View>
              <Text style={styles.alternativeCardTitle}>Cardio</Text>
              <Text style={styles.alternativeCardSubtitle}>
                Log a cardio session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alternativeCard}
              onPress={() => setShowComingSoonModal(true)}
            >
              <View
                style={[
                  styles.alternativeIconCircle,
                  { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                ]}
              >
                <Icon name="edit" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.alternativeCardTitle}>Manual</Text>
              <Text style={styles.alternativeCardSubtitle}>
                Full control over workout
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.workoutsNavigationSection}>
          <View style={styles.workoutsNavigationRow}>
            <TouchableOpacity
              style={styles.workoutNavCard}
              onPress={() => router.push("/finished-workouts")}
            >
              <View
                style={[
                  styles.workoutNavIconCircle,
                  { backgroundColor: "rgba(132, 204, 22, 0.2)" },
                ]}
              >
                <Icon name="check-circle" size={28} color={colors.primary} />
              </View>
              <Text style={styles.workoutNavCardTitle}>Finished Workouts</Text>
              <Text style={styles.workoutNavCardSubtitle}>
                View your workout history
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.workoutNavCard}
              onPress={() => router.push("/Programs")}
            >
              <View
                style={[
                  styles.workoutNavIconCircle,
                  { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                ]}
              >
                <MaterialIcon name="fitness-center" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.workoutNavCardTitle}>Programs</Text>
              <Text style={styles.workoutNavCardSubtitle}>
                View your workout plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <StatGroup
          stats={[
            {
              value: userProgressData
                ? Math.ceil(
                    (Date.now() -
                      new Date(userProgressData.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
              label: "Journey Days",
              infoTitle: "Journey Days",
              infoDescription:
                "Total number of days since you started your fitness program.",
            },
            {
              value:
                userProgressData && generatedProgram
                  ? calculateWorkoutStreak(
                      typeof userProgressData.completedWorkouts === "string"
                        ? JSON.parse(userProgressData.completedWorkouts)
                        : userProgressData.completedWorkouts,
                      generatedProgram.trainingSchedule || []
                    )
                  : 0,
              label: "Streak",
              infoTitle: "Workout Streak",
              infoDescription: "Number of consecutive training days completed.",
            },
            {
              value:
                userProgressData && userProgressData.completedWorkouts
                  ? (() => {
                      try {
                        const completed =
                          typeof userProgressData.completedWorkouts === "string"
                            ? JSON.parse(userProgressData.completedWorkouts)
                            : userProgressData.completedWorkouts;
                        return completed.filter(
                          (item: any) =>
                            typeof item === "object" &&
                            item.date &&
                            item.workoutName
                        ).length;
                      } catch {
                        return 0;
                      }
                    })()
                  : 0,
              label: "Finished Workouts",
              infoTitle: "Finished Workouts",
              infoDescription: "Total workout sessions completed.",
            },
          ]}
        />
      </ScrollView>

      {/* Modals */}
      <WorkoutStartModal
        visible={showWorkoutModal}
        onConfirm={handleConfirmWorkout}
        onCancel={handleCancelWorkout}
        workoutName={nextWorkout?.name}
      />

      <WorkoutUnavailableModal
        visible={showUnavailableModal}
        onClose={() => setShowUnavailableModal(false)}
        nextWorkoutName={workoutAvailability?.nextWorkoutName || null}
        nextAvailableDate={workoutAvailability?.nextAvailableDate || null}
        motivationalMessage={workoutAvailability?.motivationalMessage || ""}
        isCompletedToday={workoutAvailability?.isCompletedToday || false}
      />

      <HomepageVideoModal
        visible={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />

      <Modal
        visible={showComingSoonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#1A1A1A", "#0A0A0A"]}
              style={styles.comingSoonModalContent}
            >
              <View style={styles.comingSoonIconContainer}>
                <Icon name="star" size={48} color={colors.primary} />
              </View>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonDescription}>
                Our AI-powered custom workout builder is on its way.
              </Text>
              <TouchableOpacity
                style={styles.comingSoonButton}
                onPress={() => setShowComingSoonModal(false)}
              >
                <Text style={styles.comingSoonButtonText}>Got it!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Bottom Banner */}
      {isWorkoutActive && (
        <TouchableOpacity
          style={styles.bottomBanner}
          onPress={() => router.push("/workout-session")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[
              "rgba(132, 204, 22, 0.15)",
              "rgba(34, 197, 94, 0.1)",
              "rgba(20, 25, 35, 0.8)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
              <View style={styles.bannerContent}>
                <View style={styles.bannerLeft}>
                  <Text style={styles.bannerTitle}>WORKOUT IN PROGRESS</Text>
                  {(() => {
                    const firstExercise = getFirstUncompletedExercise();
                    if (firstExercise) {
                      return (
                        <>
                          <Text
                            style={styles.bannerExerciseName}
                            numberOfLines={1}
                          >
                            {firstExercise.name}
                          </Text>
                          <Text style={styles.bannerExerciseMeta}>
                            {firstExercise.completedSets}/{firstExercise.sets}{" "}
                            sets
                            {firstExercise.lastWeight > 0 &&
                              ` • ${firstExercise.lastWeight} kg`}
                          </Text>
                        </>
                      );
                    }
                    return (
                      <Text style={styles.bannerExerciseName}>
                        Tap to continue
                      </Text>
                    );
                  })()}
                </View>

                <View style={styles.bannerRight}>
                  <TouchableOpacity
                    style={styles.circularTimerContainer}
                    onPress={(e) => {
                      e.stopPropagation();
                      isRunning ? pauseTimer() : resumeTimer();
                    }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(132, 204, 22, 0.3)",
                        "rgba(132, 204, 22, 0.1)",
                      ]}
                      style={styles.circularTimerGradient}
                    >
                      <Text style={styles.circularTimerText}>
                        {formatTimerTime(currentTime)}
                      </Text>
                      <View style={styles.circularPlayButton}>
                        <Icon
                          name={isRunning ? "pause" : "play"}
                          size={14}
                          color={colors.black}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
