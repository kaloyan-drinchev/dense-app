import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { programService } from '@/db/services';
import { PROGRAMS } from '@/mocks/programs';

export default function ProgramView() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        // Try to find program in mocks first
        const mockProgram = PROGRAMS.find(p => p.id === id);
        
        if (mockProgram) {
          setProgram(mockProgram);
        } else {
          // Fallback to database if needed
          const dbProgram = await programService.getById(id as string);
          setProgram(dbProgram);
        }
      } catch (error) {
        console.error('Failed to load program:', error);
      }
      setLoading(false);
    };

    if (id) {
      loadProgram();
    }
  }, [id]);

  const getProgramIcon = (focusArea: string) => {
    switch (focusArea) {
      case 'chest': return 'zap';
      case 'back': return 'shield';
      case 'shoulders': return 'trending-up';
      default: return 'target';
    }
  };

  const getProgramColor = (focusArea: string) => {
    switch (focusArea) {
      case 'chest': return colors.primary;
      case 'back': return colors.secondary;
      case 'shoulders': return colors.success;
      default: return colors.primary;
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading program...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!program) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Program not found</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const programIcon = getProgramIcon(program.focusArea || program.type);
  const programColor = getProgramColor(program.focusArea || program.type);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Program Details</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Program Hero */}
          <View style={styles.heroSection}>
            <View style={[styles.programIcon, { backgroundColor: programColor + '20' }]}>
              <Icon name={programIcon as any} size={40} color={programColor} />
            </View>
            
            <Text style={styles.programTitle}>{program.name}</Text>
            <Text style={styles.programDuration}>🕐 {program.duration} weeks</Text>
            <Text style={styles.programDescription}>{program.description}</Text>
          </View>

          {/* Program Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Program Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="target" size={20} color={colors.primary} />
                <Text style={styles.statLabel}>Focus Area</Text>
                <Text style={styles.statValue}>{program.focusArea || program.type}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="calendar" size={20} color={colors.secondary} />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{program.duration} weeks</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="trending-up" size={20} color={colors.success} />
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>Intermediate</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="zap" size={20} color={colors.warning} />
                <Text style={styles.statLabel}>Workouts</Text>
                <Text style={styles.statValue}>{program.weeks?.[0]?.workouts?.length || 5}/week</Text>
              </View>
            </View>
          </View>

          {/* Weekly Structure */}
          {program.weeks && program.weeks[0] && (
            <View style={styles.structureSection}>
              <Text style={styles.sectionTitle}>Weekly Structure</Text>
              <View style={styles.weeklyStructure}>
                {program.weeks[0].workouts.map((workout: any, index: number) => (
                  <View key={workout.id} style={styles.workoutDay}>
                    <View style={styles.dayNumber}>
                      <Text style={styles.dayNumberText}>{workout.day}</Text>
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      <Text style={styles.workoutFocus}>{workout.focusArea}</Text>
                      <Text style={styles.exerciseCount}>
                        {workout.exercises?.length || 0} exercises
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Sample Exercises */}
          {program.weeks?.[0]?.workouts?.[0]?.exercises && (
            <View style={styles.exercisesSection}>
              <Text style={styles.sectionTitle}>Sample Exercises</Text>
              <Text style={styles.sectionSubtitle}>From your first workout</Text>
              <View style={styles.exercisesList}>
                {program.weeks[0].workouts[0].exercises.slice(0, 4).map((exercise: any, index: number) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Icon name="activity" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseSpecs}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    </View>
                    <Text style={styles.exerciseMuscle}>{exercise.targetMuscle}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: programColor }]}
              onPress={() => {
                // Navigate to main app
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.startButtonText}>Start This Program</Text>
              <Icon name="arrow-right" size={20} color={colors.white} />
            </TouchableOpacity>
            
            <Text style={styles.ctaNote}>
              Ready to transform your {program.focusArea || program.type}? Let's begin your journey!
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  programIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  programTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  programDuration: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  programDescription: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  structureSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  weeklyStructure: {
    gap: 12,
  },
  workoutDay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  exerciseCount: {
    fontSize: 12,
    color: colors.lightGray,
  },
  exercisesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  exerciseSpecs: {
    fontSize: 12,
    color: colors.lightGray,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  ctaSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  ctaNote: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});