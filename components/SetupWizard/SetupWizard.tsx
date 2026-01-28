import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";

import { colors } from "@/constants/colors";
import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { AnimatePresence, MotiView } from "moti";
import { SubscriptionScreen } from "@/components/SubscriptionScreen";

import {
  steps,
  trainingExperienceOptions,
  trainingDaysOptions,
  musclePriorityOptions,
  pumpWorkOptions,
  durationOptions,
  genderOptions,
  goalOptions,
  motivationOptions,
} from "@/constants/wizard.constants";

import { styles } from "./SetupWizard.styles";
import { useSetupWizard } from "./useSetupWizard";

interface SetupWizardProps {
  onClose: () => void;
}

export default function SetupWizard({ onClose }: SetupWizardProps) {
  const {
    phase,
    currentStep,
    direction,
    preferences,
    validationError,
    scrollKey,
    fieldErrors,
    setFieldErrors,
    generationStep,
    generationProgress,
    showCheckProgramButton,
    setShowCheckProgramButton,
    generatedProgramData,
    showProgramView,
    setShowProgramView,
    isNavigatingToProgram,
    handleNext,
    paginate,
    handleInputChange,
    toggleMotivation,
    toggleMusclePriority,
    handleSubscriptionComplete,
    handleSubscriptionSkip,
    setWizardCompleted,
    getActivityLevelFromTrainingDays,
    calculateTDEEAndMacros,
  } = useSetupWizard({ onClose });

  const renderStepContent = () => {
    if (currentStep < 0 || currentStep >= steps.length) {
      return <Text style={styles.stepSubtitle}>Loading...</Text>;
    }

    const step = steps[currentStep];
    if (!step) return <Text style={styles.stepSubtitle}>Loading...</Text>;

    switch (step.id) {
      case "welcome":
        return (
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Answer 9 quick questions and we'll create the perfect{" "}
              {preferences.programDurationWeeks || 12}-week program tailored to
              your goals and preferences.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="target" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Muscle-focused programs</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="trending-up" size={20} color={colors.secondary} />
                <Text style={styles.featureText}>
                  {preferences.programDurationWeeks || 12}-week structured plans
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="zap" size={20} color={colors.success} />
                <Text style={styles.featureText}>
                  Personalized recommendations
                </Text>
              </View>
            </View>
          </View>
        );

      case "motivation":
        return (
          <View style={styles.optionsContainer}>
            {motivationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.motivation.includes(option.id) &&
                    styles.selectedOption,
                ]}
                onPress={() => {
                  if (Platform.OS !== "web")
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleMotivation(option.id);
                }}
                activeOpacity={1}
              >
                <Text style={styles.motivationEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.optionText,
                    preferences.motivation.includes(option.id) &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "name":
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              value={preferences.name}
              onChangeText={(value: string) => handleInputChange("name", value)}
              placeholder="Enter your name"
              placeholderTextColor={colors.lightGray}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={25}
            />
          </View>
        );

      case "current-strength":
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Squat 1RM (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0 (max 400kg)"
                placeholderTextColor={colors.lightGray}
                value={preferences.squatKg}
                onChangeText={(value) =>
                  handleInputChange("squatKg", value.replace(/[^0-9.]/g, ""))
                }
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bench Press 1RM (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0 (max 300kg)"
                placeholderTextColor={colors.lightGray}
                value={preferences.benchKg}
                onChangeText={(value) =>
                  handleInputChange("benchKg", value.replace(/[^0-9.]/g, ""))
                }
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deadlift 1RM (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0 (max 400kg)"
                placeholderTextColor={colors.lightGray}
                value={preferences.deadliftKg}
                onChangeText={(value) =>
                  handleInputChange("deadliftKg", value.replace(/[^0-9.]/g, ""))
                }
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <Text
              style={{
                color: colors.lightGray,
                fontSize: 14,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              💡 Enter 0 if you don't know your maxes yet
            </Text>
          </View>
        );

      case "training-experience":
        return (
          <View style={styles.optionsContainer}>
            {trainingExperienceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.trainingExperience === option.id &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  handleInputChange("trainingExperience", option.id)
                }
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.trainingExperience === option.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "tdee-calculation":
        return (
          <View style={styles.inputContainer}>
            <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 0.6 }}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.age && {
                      borderWidth: 1.5,
                      borderColor: colors.validationWarning,
                    },
                  ]}
                  value={preferences.age}
                  onChangeText={(value) => {
                    handleInputChange("age", value.replace(/[^0-9]/g, ""));
                    if (fieldErrors.age)
                      setFieldErrors((prev) => ({ ...prev, age: false }));
                  }}
                  placeholder="e.g 25"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        { flex: 1, marginBottom: 0 },
                        preferences.gender === option.id &&
                          styles.selectedOption,
                      ]}
                      onPress={() => {
                        handleInputChange("gender", option.id);
                        if (fieldErrors.gender)
                          setFieldErrors((prev) => ({
                            ...prev,
                            gender: false,
                          }));
                      }}
                      activeOpacity={1}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          preferences.gender === option.id &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.weight && {
                      borderWidth: 1.5,
                      borderColor: colors.validationWarning,
                    },
                  ]}
                  value={preferences.weight}
                  onChangeText={(value) => {
                    const filteredValue = value.replace(/[^0-9.]/g, "");
                    const parts = filteredValue.split(".");
                    const cleanValue =
                      parts[0] + (parts.length > 1 ? "." + parts[1] : "");
                    handleInputChange("weight", cleanValue);
                    if (fieldErrors.weight)
                      setFieldErrors((prev) => ({ ...prev, weight: false }));
                  }}
                  placeholder="e.g 75"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.height && {
                      borderWidth: 1.5,
                      borderColor: colors.validationWarning,
                    },
                  ]}
                  value={preferences.height}
                  onChangeText={(value) => {
                    const filteredValue = value.replace(/[^0-9.]/g, "");
                    const parts = filteredValue.split(".");
                    const cleanValue =
                      parts[0] + (parts.length > 1 ? "." + parts[1] : "");
                    handleInputChange("height", cleanValue);
                    if (fieldErrors.height)
                      setFieldErrors((prev) => ({ ...prev, height: false }));
                  }}
                  placeholder="e.g 170"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Goal</Text>
              <View style={[styles.optionsContainer]}>
                {goalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      preferences.goal === option.id && styles.selectedOption,
                    ]}
                    onPress={() => {
                      handleInputChange("goal", option.id);
                      if (fieldErrors.goal)
                        setFieldErrors((prev) => ({ ...prev, goal: false }));
                    }}
                    activeOpacity={1}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        preferences.goal === option.id &&
                          styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Training Days per Week</Text>
              <View style={[styles.trainingDaysContainer]}>
                {trainingDaysOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.trainingDayOption,
                      preferences.trainingDaysPerWeek === option.id &&
                        styles.selectedTrainingDay,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web")
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleInputChange("trainingDaysPerWeek", option.id);
                      if (fieldErrors.trainingDays)
                        setFieldErrors((prev) => ({
                          ...prev,
                          trainingDays: false,
                        }));
                    }}
                    activeOpacity={1}
                  >
                    <View style={styles.trainingDayContent}>
                      <Text
                        style={[
                          styles.trainingDayLabel,
                          preferences.trainingDaysPerWeek === option.id &&
                            styles.selectedTrainingDayLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.trainingDayNickname,
                          preferences.trainingDaysPerWeek === option.id &&
                            styles.selectedTrainingDayNickname,
                        ]}
                      >
                        {option.nickname}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {preferences.age &&
              preferences.gender &&
              preferences.weight &&
              preferences.height &&
              preferences.trainingDaysPerWeek &&
              preferences.goal && (
                <View
                  style={{
                    backgroundColor: colors.darkGray,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 20,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    📊 Your Daily Nutrition Targets
                  </Text>
                  {(() => {
                    try {
                      const activityLevel = getActivityLevelFromTrainingDays(
                        preferences.trainingDaysPerWeek,
                      );
                      const tdeeResult = calculateTDEEAndMacros({
                        age: parseInt(preferences.age),
                        gender: preferences.gender as "male" | "female",
                        weight: parseFloat(preferences.weight),
                        height: parseFloat(preferences.height),
                        activityLevel: activityLevel,
                        goal: preferences.goal,
                      });

                      return (
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-around",
                          }}
                        >
                          <View style={{ alignItems: "center" }}>
                            <Text
                              style={{
                                color: colors.white,
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              {tdeeResult.adjustedCalories}
                            </Text>
                            <Text
                              style={{ color: colors.lightGray, fontSize: 12 }}
                            >
                              Calories
                            </Text>
                          </View>
                          <View style={{ alignItems: "center" }}>
                            <Text
                              style={{
                                color: colors.white,
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              {tdeeResult.protein}g
                            </Text>
                            <Text
                              style={{ color: colors.lightGray, fontSize: 12 }}
                            >
                              Protein
                            </Text>
                          </View>
                          <View style={{ alignItems: "center" }}>
                            <Text
                              style={{
                                color: colors.white,
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              {tdeeResult.carbs}g
                            </Text>
                            <Text
                              style={{ color: colors.lightGray, fontSize: 12 }}
                            >
                              Carbs
                            </Text>
                          </View>
                          <View style={{ alignItems: "center" }}>
                            <Text
                              style={{
                                color: colors.white,
                                fontSize: 18,
                                fontWeight: "bold",
                              }}
                            >
                              {tdeeResult.fat}g
                            </Text>
                            <Text
                              style={{ color: colors.lightGray, fontSize: 12 }}
                            >
                              Fat
                            </Text>
                          </View>
                        </View>
                      );
                    } catch (error) {
                      return (
                        <Text
                          style={{
                            color: colors.lightGray,
                            textAlign: "center",
                          }}
                        >
                          Complete all fields to see your targets
                        </Text>
                      );
                    }
                  })()}
                </View>
              )}
          </View>
        );

      case "muscle-priorities":
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.priorityHint}>
              Choose up to 3 muscle groups to prioritize (
              {preferences.musclePriorities.length}/3)
            </Text>
            {musclePriorityOptions.map((option) => {
              const isSelected = preferences.musclePriorities.includes(
                option.id,
              );
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => toggleMusclePriority(option.id)}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "pump-work":
        return (
          <View style={styles.optionsContainer}>
            {pumpWorkOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.pumpWorkPreference === option.id &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  handleInputChange("pumpWorkPreference", option.id)
                }
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.pumpWorkPreference === option.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "program-duration":
        return (
          <View style={styles.optionsContainer}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  preferences.programDurationWeeks === option.id &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  handleInputChange("programDurationWeeks", option.id)
                }
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.programDurationWeeks === option.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "review-preferences":
        // REVIEW PREFERENCES UI
        return (
          <ScrollView
            style={styles.completeScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.completeContent}>
              <View style={styles.preferencesContainer}>
                {/* Motivation Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>✨</Text>
                    <Text style={styles.cardTitle}>Motivation</Text>
                  </View>
                  <View style={styles.motivationTags}>
                    {preferences.motivation.map((motivationId) => {
                      const motivation = motivationOptions.find(
                        (o) => o.id === motivationId,
                      );
                      return motivation ? (
                        <View key={motivationId} style={styles.motivationTag}>
                          <Text style={styles.motivationTagEmoji}>
                            {motivation.emoji}
                          </Text>
                          <Text style={styles.motivationTagText}>
                            {motivation.label}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>

                {/* Training Info Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>🏋️</Text>
                    <Text style={styles.cardTitle}>Training Schedule</Text>
                  </View>
                  <View style={styles.trainingInfoGrid}>
                    <View style={styles.trainingInfoItem}>
                      <Text style={styles.trainingInfoNumber}>
                        {preferences.trainingDaysPerWeek}
                      </Text>
                      <Text style={styles.trainingInfoLabel}>Days/Week</Text>
                    </View>
                    <View style={styles.trainingInfoItem}>
                      <Text style={styles.trainingInfoNumber}>
                        {preferences.programDurationWeeks}
                      </Text>
                      <Text style={styles.trainingInfoLabel}>Weeks</Text>
                    </View>
                  </View>
                </View>

                {/* Body Stats Card */}
                <View style={styles.preferenceCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📊</Text>
                    <Text style={styles.cardTitle}>Your Stats</Text>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.age}</Text>
                      <Text style={styles.statLabelSmall}>Years Old</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.weight}</Text>
                      <Text style={styles.statLabelSmall}>kg</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{preferences.height}</Text>
                      <Text style={styles.statLabelSmall}>cm</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {preferences.gender === "male" ? "♂️" : "♀️"}
                      </Text>
                      <Text style={styles.statLabelSmall}>
                        {preferences.gender}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Big 3 Lifts Card - Show if any lift data was entered */}
                {(parseFloat(preferences.squatKg) > 0 ||
                  parseFloat(preferences.benchKg) > 0 ||
                  parseFloat(preferences.deadliftKg) > 0) && (
                  <View style={styles.preferenceCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>🏋️</Text>
                      <Text style={styles.cardTitle}>
                        Strength Profile (1RM)
                      </Text>
                    </View>
                    <View style={styles.strengthStatsGrid}>
                      {parseFloat(preferences.squatKg) > 0 && (
                        <View style={styles.strengthStatItem}>
                          <Text style={styles.strengthStatLabel}>Squat</Text>
                          <Text style={styles.strengthStatValue}>
                            {preferences.squatKg} kg
                          </Text>
                        </View>
                      )}
                      {parseFloat(preferences.benchKg) > 0 && (
                        <View style={styles.strengthStatItem}>
                          <Text style={styles.strengthStatLabel}>
                            Bench Press
                          </Text>
                          <Text style={styles.strengthStatValue}>
                            {preferences.benchKg} kg
                          </Text>
                        </View>
                      )}
                      {parseFloat(preferences.deadliftKg) > 0 && (
                        <View style={styles.strengthStatItem}>
                          <Text style={styles.strengthStatLabel}>Deadlift</Text>
                          <Text style={styles.strengthStatValue}>
                            {preferences.deadliftKg} kg
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.strengthStatItem,
                          {
                            backgroundColor: colors.darkGray,
                            borderWidth: 2,
                            borderColor: colors.primary,
                            marginTop: 8,
                          },
                        ]}
                      >
                        <Text style={styles.strengthStatLabel}>Total</Text>
                        <Text
                          style={[
                            styles.strengthStatValue,
                            {
                              color: colors.primary,
                              fontSize: 18,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {(parseFloat(preferences.squatKg) || 0) +
                            (parseFloat(preferences.benchKg) || 0) +
                            (parseFloat(preferences.deadliftKg) || 0)}{" "}
                          kg
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        );

      case "complete":
        return (
          <View style={styles.completeContent}>
            <Text style={styles.finalTitle}>🚀 Ready to Transform?</Text>
            <Text style={styles.finalSubtitle}>
              Your personalized program is about to be generated based on your
              preferences!
            </Text>
            <View style={styles.finalCTA}>
              <Text style={styles.finalCTAIcon}>⚡</Text>
              <Text style={styles.finalCTAText}>
                Let's create your perfect training plan
              </Text>
            </View>
          </View>
        );

      default:
        return <Text style={styles.stepSubtitle}>Step content not found</Text>;
    }
  };

  // --- Render Views Based on Phase ---

  if (showProgramView && generatedProgramData) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Program</Text>
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inlineProgram}>
            <Text style={styles.inlineProgramName}>
              {generatedProgramData.programName}
            </Text>
            <Text style={styles.inlineProgramDescription}>
              {generatedProgramData.overview}
            </Text>
            <View style={styles.programStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {generatedProgramData.totalWeeks}
                </Text>
                <Text style={styles.statLabel}>Weeks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {generatedProgramData.weeklyStructure.length}
                </Text>
                <Text style={styles.statLabel}>Days/Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {generatedProgramData.weeklyStructure.reduce(
                    (total: number, day: any) => total + day.exercises.length,
                    0,
                  )}
                </Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
            </View>
          </View>
          {generatedProgramData.weeklyStructure.map(
            (day: any, index: number) => (
              <View key={index} style={styles.workoutCard}>
                <Text style={styles.workoutName}>{day.name}</Text>
                <Text style={styles.workoutDuration}>
                  {day.estimatedDuration} min
                </Text>
                {day.exercises.map((exercise: any, exerciseIndex: number) => (
                  <View key={exerciseIndex} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} sets × {exercise.reps} reps
                    </Text>
                  </View>
                ))}
              </View>
            ),
          )}
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => setWizardCompleted()}
            activeOpacity={1}
          >
            <Text style={styles.finishButtonText}>Finish Setup</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (isNavigatingToProgram) return null;

  if (showCheckProgramButton) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.checkProgramContainer}>
          <View style={styles.checkProgramContent}>
            <Text style={styles.checkProgramEmoji}>🎉</Text>
            <Text style={styles.checkProgramTitle}>Program Generated!</Text>
            <Text style={styles.checkProgramSubtitle}>
              Your custom Push/Pull/Legs routine is ready
            </Text>
            <View style={styles.checkProgramStats}>
              <View style={styles.checkProgramStat}>
                <Text style={styles.checkProgramStatNumber}>
                  {preferences.programDurationWeeks}
                </Text>
                <Text style={styles.checkProgramStatLabel}>Weeks</Text>
              </View>
              <View style={styles.checkProgramStat}>
                <Text style={styles.checkProgramStatNumber}>
                  {preferences.trainingDaysPerWeek}
                </Text>
                <Text style={styles.checkProgramStatLabel}>Days/Week</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkProgramButton}
            onPress={() => {
              setShowCheckProgramButton(false);
              setShowProgramView(true);
            }}
            activeOpacity={1}
          >
            <Text style={styles.checkProgramButtonText}>
              Check Your Program
            </Text>
            <Icon name="arrow-right" size={20} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewLaterButton}
            onPress={() => setWizardCompleted()}
            activeOpacity={1}
          >
            <Text style={styles.viewLaterButtonText}>
              View Later in Programs Tab
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (phase === "generating") {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={[styles.content, styles.contentContainer]}>
          <Text style={styles.generatingIcon}>⚡</Text>
          <Text style={styles.stepTitle}>Creating Your Custom Program</Text>
          <Text style={styles.generatingDescription}>
            We're analyzing your preferences and building a personalized{" "}
            {preferences.programDurationWeeks || 12}-week workout plan just for
            you
          </Text>
          <Text style={styles.stepSubtitle}>
            {generationStep || "Initializing..."}
          </Text>
          <View style={styles.loadingProgressContainer}>
            <View style={styles.loadingProgressBar}>
              <View
                style={[
                  styles.loadingProgressFill,
                  { width: `${generationProgress * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (phase === "subscription" && generatedProgramData) {
    return (
      <SubscriptionScreen
        onSubscribed={handleSubscriptionComplete}
        onSkip={handleSubscriptionSkip}
        showSkipOption={false}
        programPreview={generatedProgramData}
      />
    );
  }

  if (phase === "complete") return null;

  if (currentStep < 0 || currentStep >= steps.length) {
    return (
      <LinearGradient
        colors={[colors.dark, colors.darkGray]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.stepCounter}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const step = steps[currentStep];
  const progress = (currentStep + 1) / steps.length;

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
      <View style={{ flex: 1, overflow: "hidden" }}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentStep}
            from={{ opacity: 0, translateX: direction * 300 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -direction * 300 }}
            transition={{ type: "timing", duration: 300 }}
            style={{ flex: 1, width: "100%" }}
          >
            <ScrollView
              key={scrollKey}
              style={styles.scrollContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={
                  step.subtitle
                    ? styles.stepHeader
                    : styles.stepHeaderNoSubtitle
                }
              >
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.subtitle ? (
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                ) : null}
                <Text
                  style={[
                    styles.stepValidationError,
                    { opacity: validationError ? 1 : 0 },
                  ]}
                >
                  {validationError || " "}
                </Text>
              </View>
              {renderStepContent()}
            </ScrollView>
          </MotiView>
        </AnimatePresence>
      </View>
      <View style={styles.bottomNavigationContainer}>
        {currentStep > 0 ? (
          <TouchableOpacity
            onPress={() => paginate(-1)}
            style={styles.backButton}
            activeOpacity={1}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1
              ? "Generate My Program! 💪"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
