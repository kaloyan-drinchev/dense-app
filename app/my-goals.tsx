import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService } from '@/db/services';
import { motivationOptions, trainingExperienceOptions, musclePriorityOptions } from '@/constants/wizard.constants';

export default function MyGoalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [wizardData, setWizardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWizardData = async () => {
      try {
        if (user?.id) {
          const data = await wizardResultsService.getByUserId(user.id);
          console.log('🎯 Loaded wizard data:', data);
          console.log('🔍 TDEE data string:', data?.tdeeData);
          setWizardData(data);
        }
      } catch (error) {
        console.log('Failed to load wizard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWizardData();
  }, [user?.id]);

  const parseTdeeData = (tdeeDataString: string | null) => {
    if (!tdeeDataString) return null;
    try {
      const parsed = JSON.parse(tdeeDataString);
      console.log('📊 Parsed TDEE data:', parsed);
      
      // Ensure all values are valid numbers
      // Handle both 'calories' and 'adjustedCalories' field names
      const calories = parsed.calories || parsed.adjustedCalories;
      return {
        calories: isNaN(Number(calories)) ? 0 : Number(calories),
        protein: isNaN(Number(parsed.protein)) ? 0 : Number(parsed.protein),
        carbs: isNaN(Number(parsed.carbs)) ? 0 : Number(parsed.carbs),
        fat: isNaN(Number(parsed.fat)) ? 0 : Number(parsed.fat),
        bmr: isNaN(Number(parsed.bmr)) ? 0 : Number(parsed.bmr),
        tdee: isNaN(Number(parsed.tdee)) ? 0 : Number(parsed.tdee)
      };
    } catch (error) {
      console.error('❌ Error parsing TDEE data:', error);
      return null;
    }
  };

  const parseMotivation = (motivationString: string | null) => {
    if (!motivationString) return [];
    try {
      return JSON.parse(motivationString);
    } catch {
      return [];
    }
  };

  const parseMusclePriorities = (prioritiesString: string | null) => {
    if (!prioritiesString) return [];
    try {
      return JSON.parse(prioritiesString);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your goals...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!wizardData) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Goals</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.noDataText}>No goals data found. Complete the setup wizard first.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const tdeeData = parseTdeeData(wizardData.tdeeData);
  const motivations = parseMotivation(wizardData.motivation);
  const musclePriorities = parseMusclePriorities(wizardData.musclePriorities);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Goals</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Motivation Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>✨</Text>
                <Text style={styles.cardTitle}>What Brings You to DENSE</Text>
              </View>
              <View style={styles.motivationTags}>
                {motivations.map((motivationId: string) => {
                  const motivation = motivationOptions.find(o => o.id === motivationId);
                  return motivation ? (
                    <View key={motivationId} style={styles.motivationTag}>
                      <Text style={styles.motivationTagEmoji}>{motivation.emoji}</Text>
                      <Text style={styles.motivationTagText}>{motivation.label}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>

            {/* Training Schedule Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💪</Text>
                <Text style={styles.cardTitle}>Training Schedule</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.trainingInfoGrid}>
                  <View style={styles.trainingInfoItem}>
                    <Text style={styles.trainingInfoNumber}>{wizardData.trainingDaysPerWeek}</Text>
                    <Text style={styles.trainingInfoLabel}>Days/Week</Text>
                  </View>
                  <View style={styles.trainingInfoItem}>
                    <Text style={styles.trainingInfoNumber}>{wizardData.programDurationWeeks}</Text>
                    <Text style={styles.trainingInfoLabel}>Weeks</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Nutrition Targets Card - Only show if TDEE data exists */}
            {tdeeData && (
              <View style={styles.preferenceCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>🍎</Text>
                  <Text style={styles.cardTitle}>Nutrition Targets</Text>
                </View>
                <View style={styles.tdeeCardContent}>
                  <View style={styles.calorieTargetSection}>
                    <Text style={styles.calorieTargetNumber}>
                      {tdeeData.calories > 0 ? Math.round(tdeeData.calories) : 'Not set'}
                    </Text>
                    <Text style={styles.calorieTargetLabel}>Daily Calories</Text>
                  </View>
                  {tdeeData.calories > 0 && (
                    <View style={styles.macrosGrid}>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{Math.round(tdeeData.protein)}g</Text>
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{Math.round(tdeeData.carbs)}g</Text>
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{Math.round(tdeeData.fat)}g</Text>
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Your Goal Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎯</Text>
                <Text style={styles.cardTitle}>Your Goal</Text>
              </View>
              <View style={styles.goalDisplay}>
                <Text style={styles.goalText}>
                  {wizardData.goal?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Experience & Focus Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💪</Text>
                <Text style={styles.cardTitle}>Experience & Focus</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.experienceRow}>
                  <Text style={styles.experienceLabel}>Level:</Text>
                  <Text style={styles.experienceValue}>
                    {trainingExperienceOptions.find(o => o.id === wizardData.trainingExperience)?.label}
                  </Text>
                </View>
                <View style={styles.focusSection}>
                  <Text style={styles.focusLabel}>Priority Muscles:</Text>
                  <View style={styles.muscleTagsContainer}>
                    {musclePriorities.map((priority: string) => {
                      const muscle = musclePriorityOptions.find(o => o.id === priority);
                      return muscle ? (
                        <View key={priority} style={styles.muscleTag}>
                          <Text style={styles.muscleTagText}>{muscle.label}</Text>
                        </View>
                      ) : null;
                    })}
                  </View>
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
                  <Text style={styles.statValue}>{wizardData.age}</Text>
                  <Text style={styles.statLabel}>Years Old</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{wizardData.weight}</Text>
                  <Text style={styles.statLabel}>kg</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{wizardData.height}</Text>
                  <Text style={styles.statLabel}>cm</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {wizardData.gender === 'male' ? '♂️' : '♀️'}
                  </Text>
                  <Text style={styles.statLabel}>
                    {wizardData.gender === 'male' ? 'Male' : 'Female'}
                  </Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  noDataText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  preferenceCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.white,
  },
  cardContent: {
    gap: 12,
  },
  motivationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  motivationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  motivationTagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  motivationTagText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '600',
  },
  trainingInfoGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  trainingInfoItem: {
    alignItems: 'center',
  },
  trainingInfoNumber: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  trainingInfoLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  tdeeCardContent: {
    gap: 16,
  },
  calorieTargetSection: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.dark,
    borderRadius: 12,
  },
  calorieTargetNumber: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 36,
  },
  calorieTargetLabel: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  macroLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  goalDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceLabel: {
    ...typography.body,
    color: colors.lightGray,
  },
  experienceValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  focusSection: {
    gap: 8,
  },
  focusLabel: {
    ...typography.body,
    color: colors.lightGray,
  },
  muscleTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    backgroundColor: colors.dark,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  muscleTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
});
