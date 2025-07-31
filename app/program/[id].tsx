import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWorkoutStore } from '@/store/workout-store';
import { colors } from '@/constants/colors';
import { WeekCard } from '@/components/WeekCard';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { programs, startProgram, userProgress } = useWorkoutStore();

  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Program not found</Text>
      </View>
    );
  }

  const isProgramActive = userProgress && userProgress.programId === program.id;

  const handleStartProgram = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (userProgress && userProgress.programId !== program.id) {
      Alert.alert(
        'Switch Programs?',
        'You already have a program in progress. Starting a new program will reset your current progress.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Switch',
            onPress: () => {
              startProgram(program.id);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
            },
          },
        ]
      );
    } else {
      startProgram(program.id);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleWeekPress = (weekId: string) => {
    router.push(`/program/week/${weekId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: program.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.imageContent}>
            <View style={styles.programBadge}>
              <Text style={styles.programBadgeText}>
                {program.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.programTitle}>{program.name}</Text>
            <Text style={styles.programDuration}>
              {program.duration} Weeks • 5 Workouts/Week
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Program Overview</Text>
            <Text style={styles.description}>{program.description}</Text>

            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <Icon name="calendar" size={24} color={colors.primary} />
                <Text style={styles.infoValue}>{program.duration}</Text>
                <Text style={styles.infoLabel}>Weeks</Text>
              </View>

              <View style={styles.infoCard}>
                <MaterialIcon
                  name="fitness-center"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.infoValue}>5</Text>
                <Text style={styles.infoLabel}>Days/Week</Text>
              </View>

              <View style={styles.infoCard}>
                <Icon name="clock" size={24} color={colors.primary} />
                <Text style={styles.infoValue}>
                  {program.type === 'cutting' ? '~80' : '~60'}
                </Text>
                <Text style={styles.infoLabel}>Min/Workout</Text>
              </View>
            </View>

            {!isProgramActive ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartProgram}
              >
                <Icon name="play" size={20} color={colors.white} />
                <Text style={styles.startButtonText}>Start Program</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() =>
                  handleWeekPress(
                    program.weeks[userProgress.currentWeek - 1].id
                  )
                }
              >
                <Text style={styles.continueButtonText}>Continue Program</Text>
                <Icon name="arrow-right" size={20} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {isProgramActive && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Progress</Text>

              {program.weeks.map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  onPress={() => handleWeekPress(week.id)}
                  isActive={userProgress.currentWeek === week.weekNumber}
                />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Program Details</Text>

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Training Split</Text>
              <View style={styles.splitList}>
                <View style={styles.splitItem}>
                  <View style={styles.splitDay}>
                    <Text style={styles.splitDayText}>Day 1</Text>
                  </View>
                  <Text style={styles.splitName}>Chest & Triceps</Text>
                </View>
                <View style={styles.splitItem}>
                  <View style={styles.splitDay}>
                    <Text style={styles.splitDayText}>Day 2</Text>
                  </View>
                  <Text style={styles.splitName}>Back & Biceps</Text>
                </View>
                <View style={styles.splitItem}>
                  <View style={styles.splitDay}>
                    <Text style={styles.splitDayText}>Day 3</Text>
                  </View>
                  <Text style={styles.splitName}>Legs</Text>
                </View>
                <View style={styles.splitItem}>
                  <View style={styles.splitDay}>
                    <Text style={styles.splitDayText}>Day 4</Text>
                  </View>
                  <Text style={styles.splitName}>Shoulders & Abs</Text>
                </View>
                <View style={styles.splitItem}>
                  <View style={styles.splitDay}>
                    <Text style={styles.splitDayText}>Day 5</Text>
                  </View>
                  <Text style={styles.splitName}>Arms & Calves</Text>
                </View>
              </View>
            </View>

            {program.type === 'cutting' && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Cardio</Text>
                <Text style={styles.detailText}>
                  This program includes 20 minutes of stair master cardio after
                  each workout session to maximize fat burning while preserving
                  muscle mass.
                </Text>
              </View>
            )}

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Progressive Overload</Text>
              <Text style={styles.detailText}>
                This program implements progressive overload by{' '}
                {program.type === 'bulking'
                  ? 'gradually increasing weight and decreasing reps as you progress through the weeks.'
                  : 'maintaining challenging weights while decreasing rest periods to increase workout intensity.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const Clock = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>⏱️</Text>
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
  errorText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 24,
  },
  imageContainer: {
    height: 240,
    width: '100%',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  programBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  programBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  programTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  programDuration: {
    fontSize: 16,
    color: colors.lighterGray,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.lighterGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  detailCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: colors.lighterGray,
    lineHeight: 24,
  },
  splitList: {
    gap: 12,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitDay: {
    width: 60,
    height: 30,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  splitDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  splitName: {
    fontSize: 16,
    color: colors.white,
  },
});
