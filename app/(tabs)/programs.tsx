import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { LoadingState } from '@/components/LoadingState';

export default function ProgramsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load generated program and progress
  useEffect(() => {
    loadGeneratedProgram();
    loadUserProgress();
  }, [user?.id]);

  const loadGeneratedProgram = async () => {
    if (!user?.id) return;

    try {
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (wizardResults?.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit);
        
        // Create a better program title based on muscle priorities
        if (wizardResults.musclePriorities) {
          const priorities = JSON.parse(wizardResults.musclePriorities);
          const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          program.displayTitle = `${priorityText} Focus`;
        }
        
        setGeneratedProgram(program);
      }
    } catch (error) {
      console.error('Failed to load generated program:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user?.id) return;

    try {
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      setUserProgressData(progress);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  // Helper function to get completed workouts count
  const getCompletedWorkoutsCount = () => {
    try {
      const completed = userProgressData?.completedWorkouts ? JSON.parse(userProgressData.completedWorkouts) : [];
      return Array.isArray(completed) ? completed.length : 0;
    } catch {
      return 0;
    }
  };



  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Program</Text>
          <Text style={styles.subtitle}>Track your current training progress</Text>
        </View>

        {/* Current Program Progress Banner */}
        {userProgressData && generatedProgram && (
          <View style={styles.progressBanner}>
            <LinearGradient
              colors={['#000000', '#0A0A0A']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Your Current Program</Text>
                <Text style={styles.bannerProgramName}>{generatedProgram.displayTitle || generatedProgram.programName}</Text>
                <Text style={styles.bannerProgress}>Week {userProgressData?.currentWeek || 1}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/single-program-view')}
              >
                <Text style={styles.bannerButtonText}>View Program</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Training Schedule */}
        {generatedProgram && generatedProgram.trainingSchedule && (
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleTitle}>Your Training Schedule</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleColumn}>
                <Text style={styles.scheduleLabel}>Workout Days:</Text>
                <Text style={styles.scheduleText}>
                  {generatedProgram.trainingSchedule.map((day: string) => 
                    day.charAt(0).toUpperCase() + day.slice(1)
                  ).join(', ')}
                </Text>
              </View>
              <View style={styles.scheduleColumn}>
                <Text style={styles.scheduleLabel}>Rest Days:</Text>
                <Text style={styles.scheduleText}>
                  {generatedProgram.restDays && generatedProgram.restDays.length > 0 
                    ? generatedProgram.restDays.map((day: string) => 
                        day.charAt(0).toUpperCase() + day.slice(1)
                      ).join(', ')
                    : 'Active Recovery'
                  }
                </Text>
              </View>
            </View>
            <Text style={styles.scheduleNote}>
              💡 This is your suggested schedule. You can train on any day if needed!
            </Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState 
            text="Loading your program..." 
            showSkeleton={true} 
            skeletonType="banner" 
          />
        )}

        {/* Placeholder for when no program is active */}
        {!loading && (!userProgressData || !generatedProgram) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Program</Text>
            <Text style={styles.emptyText}>
              {!user?.id 
                ? "Please restart the app to load your profile."
                : "Complete the setup wizard to generate your personalized training program."
              }
            </Text>
          </View>
        )}


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 32,      // Keep bottom unchanged
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.lighterGray,
  },
  // Progress Banner Styles
  progressBanner: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerGradient: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  bannerProgramName: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 6,
  },
  bannerProgress: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButtonText: {
    ...typography.bodySmall,
    color: colors.black,
  },
  // Schedule Styles
  scheduleContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  scheduleTitle: {
    ...typography.h5,
    color: colors.white,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  scheduleColumn: {
    flex: 1,
  },
  scheduleLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  scheduleText: {
    ...typography.body,
    color: colors.white,
    lineHeight: 20,
  },
  scheduleNote: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});