import React from 'react';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';
import { useProgressLogic } from './logic';
import { colors } from '@/constants/colors';

import { WorkoutProgressCharts } from '@/components/WorkoutProgressCharts';
import { WeightTracker } from '@/components/WeightTracker';

export default function ProgressScreen() {
  const {
    userProfile,
    generatedProgram,
    userProgressData,
    wizardData,
    progressData,
    isLoading
  } = useProgressLogic();

  if (isLoading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading progress data...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!generatedProgram && !userProgressData) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Progress Data</Text>
            <Text style={styles.emptyText}>
              Start your first workout to track progress
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Track your consistency</Text>
          </View>

          {/* Workout Progress Charts - only show if we have data */}
          {generatedProgram && (
            <WorkoutProgressCharts
              currentWeek={progressData.currentWeek}
              currentDay={progressData.currentDay}
              totalWeeks={progressData.totalWeeks}
              daysPerWeek={progressData.daysPerWeek}
            />
          )}

          {/* Weight Progress Section - always show */}
          <View style={styles.section}>
            <WeightTracker
              targetWeight={userProfile?.['targetWeight'] as number | undefined}
              initialWeight={wizardData?.weight}
            />
          </View>

          {/* Debug info at bottom if needed */}
          {!generatedProgram && (
            <View style={styles.section}>
              <Text style={styles.emptyText}>
                Complete your workout program setup to see workout progress charts
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}