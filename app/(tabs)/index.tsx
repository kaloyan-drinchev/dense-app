import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/store/workout-store';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/helpers';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileSetup } from '@/components/ProfileSetup';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile, userProgress, activeProgram, programs } =
    useWorkoutStore();
  const [showProfileSetup, setShowProfileSetup] = useState(!userProfile);

  useEffect(() => {
    if (!userProfile) {
      setShowProfileSetup(true);
    }
  }, [userProfile]);

  if (showProfileSetup) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ProfileSetup onComplete={() => setShowProfileSetup(false)} />
      </SafeAreaView>
    );
  }

  const handleProgramSelect = () => {
    router.push('/programs');
  };

  const handleContinueWorkout = () => {
    if (activeProgram && userProgress) {
      const weekId = activeProgram.weeks[userProgress.currentWeek - 1].id;
      router.push(`/program/week/${weekId}`);
    }
  };

  const getNextWorkout = () => {
    if (!activeProgram || !userProgress) return null;

    const currentWeek = activeProgram.weeks[userProgress.currentWeek - 1];
    if (!currentWeek) return null;

    // Find the first incomplete workout in the current week
    return currentWeek.workouts.find((workout) => !workout.isCompleted);
  };

  const nextWorkout = getNextWorkout();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey, {userProfile?.name || 'there'}!
          </Text>
          <Text style={styles.date}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {activeProgram && userProgress ? (
          <>
            <View style={styles.activeProgram}>
              <LinearGradient
                colors={[
                  activeProgram.type === 'bulking'
                    ? 'rgba(58, 81, 153, 0.8)'
                    : 'rgba(44, 120, 115, 0.8)',
                  'rgba(26, 26, 46, 0.9)',
                ]}
                style={styles.programGradient}
              >
                <View style={styles.programHeader}>
                  <Text style={styles.programTitle}>{activeProgram.name}</Text>
                  <View style={styles.programBadge}>
                    <Text style={styles.programBadgeText}>
                      {activeProgram.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.programProgress}>
                  <Text style={styles.progressText}>
                    Week {userProgress.currentWeek} of {activeProgram.duration}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${
                            (userProgress.currentWeek /
                              activeProgram.duration) *
                            100
                          }%`,
                          backgroundColor:
                            activeProgram.type === 'bulking'
                              ? colors.primary
                              : '#2C7873',
                        },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueWorkout}
                >
                  <Text style={styles.continueButtonText}>
                    Continue Program
                  </Text>
                  <Icon name="arrow-right" size={16} color={colors.white} />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {nextWorkout && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Next Workout</Text>
                </View>

                <TouchableOpacity
                  style={styles.nextWorkout}
                  onPress={() =>
                    router.push(`/program/workout/${nextWorkout.id}`)
                  }
                >
                  <View style={styles.workoutIcon}>
                    <MaterialIcon
                      name="fitness-center"
                      size={24}
                      color={colors.white}
                    />
                  </View>

                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{nextWorkout.name}</Text>
                    <Text style={styles.workoutFocus}>
                      {nextWorkout.focusArea}
                    </Text>
                    <View style={styles.workoutMeta}>
                      <Text style={styles.workoutMetaText}>
                        {nextWorkout.exercises.length} exercises
                      </Text>
                      {nextWorkout.cardio && (
                        <Text style={styles.workoutMetaText}>
                          + {nextWorkout.cardio.duration} min cardio
                        </Text>
                      )}
                    </View>
                  </View>

                  <Icon name="arrow-right" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Stats</Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Icon name="calendar" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.statValue}>
                    {userProgress.completedWorkouts.length}
                  </Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <MaterialIcon
                      name="emoji-events"
                      size={20}
                      color={colors.secondary}
                    />
                  </View>
                  <Text style={styles.statValue}>
                    {userProgress.currentWeek}
                  </Text>
                  <Text style={styles.statLabel}>Week</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <WeightIcon size={20} color={colors.success} />
                  </View>
                  <Text style={styles.statValue}>
                    {userProgress.weightLog.length > 0
                      ? userProgress.weightLog[
                          userProgress.weightLog.length - 1
                        ].weight
                      : userProfile?.weight || 0}
                  </Text>
                  <Text style={styles.statLabel}>Weight (kg)</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noProgramContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=2787&auto=format&fit=crop',
              }}
              style={styles.noProgramImage}
            />
            <Text style={styles.noProgramTitle}>Ready to get started?</Text>
            <Text style={styles.noProgramText}>
              Choose a 12-week program to begin your fitness journey
            </Text>
            <TouchableOpacity
              style={styles.chooseProgramButton}
              onPress={handleProgramSelect}
            >
              <Text style={styles.chooseProgramButtonText}>
                Choose a Program
              </Text>
              <Icon name="arrow-right" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const WeightIcon = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>⚖️</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.lightGray,
  },
  activeProgram: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: colors.darkGray,
  },
  programGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  programBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  programBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  programProgress: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.white,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  nextWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 14,
    color: colors.lighterGray,
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutMetaText: {
    fontSize: 12,
    color: colors.lightGray,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  noProgramContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noProgramImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  noProgramTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  noProgramText: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  chooseProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  chooseProgramButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
