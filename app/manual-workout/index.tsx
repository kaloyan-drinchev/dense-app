import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useManualWorkoutLogic } from "./logic";

export default function ManualWorkoutScreen() {
  const {
    workoutName,
    setWorkoutName,
    exercises,
    saving,
    showExercisePicker,
    setShowExercisePicker,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedExercises,
    filteredExercises,
    CATEGORIES,
    handleToggleExercise,
    handleAddSelectedExercises,
    handleRemoveExercise,
    handleStartWorkout,
    closePicker,
    handleBack,
  } = useManualWorkoutLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title with Back Button */}
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Manual Workout</Text>
          </View>

          {/* Workout Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Workout Name</Text>
            <TextInput
              style={styles.input}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g., Morning Workout, Upper Body, etc."
              placeholderTextColor={colors.lightGray}
            />
          </View>

          {/* Exercises List */}
          <View style={styles.section}>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(exercise.id)}
                    style={styles.removeButton}
                  >
                    <Icon name="trash-2" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add Exercise Button */}
            <TouchableOpacity
              style={styles.openPickerButton}
              onPress={() => setShowExercisePicker(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus-circle" size={20} color={colors.primary} />
              <Text style={styles.openPickerButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Exercise Picker Bottom Sheet */}
        <Modal
          visible={showExercisePicker}
          transparent={false}
          animationType="slide"
          onRequestClose={closePicker}
        >
          <SafeAreaView style={styles.bottomSheetContainer}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={closePicker}
                style={styles.closeButton}
              >
                <Icon name="arrow-left" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>
                {selectedExercises.length > 0
                  ? `${selectedExercises.length} Selected`
                  : "Select Exercises"}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Content Section with darkGray background */}
            <View style={styles.contentSection}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Icon name="search" size={18} color={colors.lightGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={colors.lightGray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Icon name="x-circle" size={18} color={colors.lightGray} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryChipsContainer}
                contentContainerStyle={styles.categoryChipsContent}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category &&
                        styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Exercise List */}
              <ScrollView
                style={styles.exerciseList}
                contentContainerStyle={styles.exerciseListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredExercises.length === 0 ? (
                  <View style={styles.emptyExerciseList}>
                    <Icon name="search" size={48} color={colors.lightGray} />
                    <Text style={styles.emptyExerciseText}>
                      No exercises found
                    </Text>
                    <Text style={styles.emptyExerciseSubtext}>
                      Try adjusting your search or category filter
                    </Text>
                  </View>
                ) : (
                  filteredExercises.map((exercise) => {
                    const isSelected = selectedExercises.some(
                      (e) => e.id === exercise.id
                    );

                    return (
                      <TouchableOpacity
                        key={exercise.id}
                        style={[
                          styles.exerciseItem,
                          isSelected && styles.exerciseItemSelected,
                        ]}
                        onPress={() => handleToggleExercise(exercise)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.exerciseItemContent}>
                          <Text style={styles.exerciseItemName}>
                            {exercise.name}
                          </Text>
                          <Text style={styles.exerciseItemMuscle}>
                            {exercise.targetMuscle} • {exercise.category}
                          </Text>
                        </View>
                        <Icon
                          name={isSelected ? "check-circle" : "circle"}
                          size={24}
                          color={isSelected ? colors.primary : colors.lightGray}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Floating Add Button */}
              {selectedExercises.length > 0 && (
                <View style={styles.floatingButtonContainer}>
                  <TouchableOpacity
                    style={styles.floatingAddButton}
                    onPress={handleAddSelectedExercises}
                    activeOpacity={0.8}
                  >
                    <Icon name="check" size={20} color={colors.black} />
                    <Text style={styles.floatingAddButtonText}>
                      Add {selectedExercises.length} Exercise
                      {selectedExercises.length > 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Save Button */}
        {exercises.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleStartWorkout}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <>
                  <Icon name="play" size={20} color={colors.black} />
                  <Text style={styles.saveButtonText}>Create Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
