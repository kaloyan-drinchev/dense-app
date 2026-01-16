import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather as Icon } from '@expo/vector-icons';

import { styles } from './styles';
import { useNutritionLogic } from './logic';
import { colors } from '@/constants/colors';

import { NutritionProgressCharts } from '@/components/NutritionProgressCharts';
import { DailyMacroTargets } from '@/components/DailyMacroTargets';
import { MealSection } from '@/components/MealSection';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function NutritionScreen() {
  const {
    router,
    dailyLog,
    entriesByMeal,
    nutritionGoals,
    workoutCalories,
    showDeleteConfirmation,
    entryToDelete,
    setShowDeleteConfirmation,
    setEntryToDelete,
    handleRemoveEntry,
    confirmRemoveEntry,
    handleLogDaily,
    navigateToAddFood
  } = useNutritionLogic();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Daily Macro Targets */}
        <DailyMacroTargets nutritionGoals={nutritionGoals} />

        {/* Today's Workout Calories */}
        {workoutCalories !== null && (
          <View style={styles.workoutCaloriesCard}>
            <View style={styles.workoutCaloriesHeader}>
              <Icon name="zap" size={20} color={colors.primary} />
              <Text style={styles.workoutCaloriesTitle}>Today's Workout</Text>
            </View>
            {workoutCalories > 0 ? (
              <>
                <Text style={styles.workoutCaloriesValue}>~{workoutCalories} calories burned</Text>
                <Text style={styles.workoutCaloriesNote}>
                  Estimated calories from completed exercises and cardio
                </Text>
              </>
            ) : (
              <Text style={styles.workoutCaloriesNote}>
                Complete exercises to see calories burned
              </Text>
            )}
          </View>
        )}

        <NutritionProgressCharts dailyLog={dailyLog} />

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={navigateToAddFood}
            activeOpacity={1}
          >
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Add Foods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/allowed-foods')}
            activeOpacity={1}
          >
            <Icon name="list" size={18} color={colors.white} />
            <Text style={styles.quickActionText}>Allowed Foods</Text>
          </TouchableOpacity>
        </View>

        {/* Meal Entries Display */}
        {Object.keys(entriesByMeal).length > 0 ? (
          <>
            {entriesByMeal.breakfast && (
              <MealSection
                mealType="breakfast"
                entries={entriesByMeal.breakfast}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.breakfast.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.brunch && (
              <MealSection
                mealType="brunch"
                entries={entriesByMeal.brunch}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.brunch.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.lunch && (
              <MealSection
                mealType="lunch"
                entries={entriesByMeal.lunch}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.lunch.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal['pre-workout'] && (
              <MealSection
                mealType="pre-workout"
                entries={entriesByMeal['pre-workout']}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal['pre-workout'].find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal['post-workout'] && (
              <MealSection
                mealType="post-workout"
                entries={entriesByMeal['post-workout']}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal['post-workout'].find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.dinner && (
              <MealSection
                mealType="dinner"
                entries={entriesByMeal.dinner}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.dinner.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}

            {entriesByMeal.snack && (
              <MealSection
                mealType="snack"
                entries={entriesByMeal.snack}
                onRemoveEntry={(entryId) => {
                  const entry = entriesByMeal.snack.find(e => e.id === entryId);
                  handleRemoveEntry(entryId, entry?.name || 'Unknown item');
                }}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.aiChatTip}>
              <Icon name="message-circle" size={16} color={colors.primary} />
              <Text style={styles.aiChatTipText}>
                For pre-workout and pump recipes ask the AI chat
              </Text>
            </View>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptyText}>
              Add meal recipes using the "Add Foods" button above
            </Text>
          </View>
        )}

        {/* Daily Actions */}
        <View style={styles.dailyActions}>
          {Object.keys(entriesByMeal).length > 0 && (
            <TouchableOpacity
              style={styles.logDayButton}
              onPress={handleLogDaily}
              activeOpacity={1}
            >
              <Icon name="check-circle" size={18} color={colors.black} />
              <Text style={styles.logDayButtonText}>Log Selected Meals</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dailyActionButton}
            onPress={() => router.push('/nutrition-history')}
            activeOpacity={1}
          >
            <Icon name="calendar" size={18} color={colors.primary} />
            <Text style={styles.dailyActionText}>See Previous Nutrition</Text>
            <Icon name="arrow-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setEntryToDelete(null);
        }}
        title="Delete Food Entry"
        message={`Are you sure you want to remove "${entryToDelete?.entryName}" from your meal log? This action cannot be undone.`}
        iconName="trash-2"
        iconColor={colors.error}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setShowDeleteConfirmation(false);
              setEntryToDelete(null);
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmRemoveEntry,
          },
        ]}
      />
    </SafeAreaView>
  );
}