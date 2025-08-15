import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";
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
              colors={['rgba(76, 175, 80, 0.8)', 'rgba(56, 142, 60, 0.9)']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Your Current Program</Text>
                <Text style={styles.bannerProgramName}>{generatedProgram.displayTitle || generatedProgram.programName}</Text>
                <Text style={styles.bannerProgress}>Week {userProgressData?.currentWeek || 1} • {userProgressData?.completedWorkouts?.length || 0} completed</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/single-program-view')}
              >
                <Text style={styles.bannerButtonText}>View Program</Text>
                <Icon name="arrow-right" size={16} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  bannerProgramName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 6,
  },
  bannerProgress: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  emptyState: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});