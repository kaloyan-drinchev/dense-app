import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workout-store";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";
import { ProgramCard } from "@/components/ProgramCard";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';

export default function ProgramsScreen() {
  const router = useRouter();
  const { programs, setActiveProgram, startProgram, userProgress } = useWorkoutStore();
  const { user } = useAuthStore();
  const [userRecommendedPrograms, setUserRecommendedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);

  // Load generated program and progress
  useEffect(() => {
    loadGeneratedProgram();
    loadUserProgress();
  }, [user?.email]);

  const loadGeneratedProgram = async () => {
    if (!user?.email) return;

    try {
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.email);
      
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

      // Also load recommended programs for fallback
      if (wizardResults?.suggestedPrograms) {
        const recommendedIds = JSON.parse(wizardResults.suggestedPrograms);
        setUserRecommendedPrograms(recommendedIds);
      }
    } catch (error) {
      console.error('Failed to load generated program:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user?.email) return;

    try {
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.email);
      setUserProgressData(progress);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  // Filter programs to show only recommended ones
  const displayPrograms = userRecommendedPrograms.length > 0 
    ? programs.filter(program => userRecommendedPrograms.includes(program.id))
    : programs;

  const handleProgramPress = (programId: string) => {
    // If user already has a program in progress, just view it
    if (userProgress && userProgress.programId === programId) {
      router.push(`/program/${programId}`);
      return;
    }
    
    // Otherwise, set as active and navigate to details
    setActiveProgram(programId);
    router.push(`/program/${programId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {userRecommendedPrograms.length > 0 ? 'Your Recommended Program' : 'Choose Your Program'}
          </Text>
          <Text style={styles.subtitle}>
            {userRecommendedPrograms.length > 0 
              ? 'Based on your wizard answers, this program is perfect for your goals'
              : 'Select a 12-week program that matches your fitness goals'
            }
          </Text>
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
                <Text style={styles.bannerProgress}>Week {userProgressData.currentWeek} • Workout {userProgressData.currentWorkout}</Text>
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

        <View style={styles.programsContainer}>
          {displayPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onPress={() => handleProgramPress(program.id)}
            />
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            {userRecommendedPrograms.length > 0 ? 'About Your Program' : 'About Our Programs'}
          </Text>
          <Text style={styles.infoText}>
            {userRecommendedPrograms.length > 0 
              ? 'Your personalized 12-week muscle-focused training plan combines targeted muscle work with full-body development. Each workout is designed to be completed in about 1 hour with progressive overload principles.'
              : 'All programs are 12-week muscle-focused training plans that combine targeted muscle work with full-body development. Each workout is designed to be completed in about 1 hour with progressive overload principles.'
            }
          </Text>
          
          {userRecommendedPrograms.length > 0 ? (
            // Show only the recommended program info
            displayPrograms.map((program) => (
              <View key={program.id} style={styles.programInfo}>
                <Text style={styles.programInfoTitle}>{program.name}</Text>
                <Text style={styles.programInfoText}>
                  {program.id === 'chest-focus-program' && (
                    '• Specialized chest development with supporting muscles\n• Heavy compound movements + isolation work\n• Progressive rep schemes from 8-6-3 reps\n• Build massive chest size and pressing strength'
                  )}
                  {program.id === 'back-focus-program' && (
                    '• Complete posterior chain development\n• Pulling power and back width focus\n• Deadlifts, rows, and pull-up variations\n• Create the V-taper and thick back muscles'
                  )}
                  {program.id === 'shoulders-focus-program' && (
                    '• 3D shoulder development (front, side, rear)\n• Military press and overhead strength\n• High-volume shoulder isolation work\n• Build boulder shoulders and pressing power'
                  )}
                </Text>
              </View>
            ))
          ) : (
            // Show all programs info if no recommendations
            <>
              <View style={styles.programInfo}>
                <Text style={styles.programInfoTitle}>Chest Domination</Text>
                <Text style={styles.programInfoText}>
                  • Specialized chest development with supporting muscles{"\n"}
                  • Heavy compound movements + isolation work{"\n"}
                  • Progressive rep schemes from 8-6-3 reps{"\n"}
                  • Build massive chest size and pressing strength
                </Text>
              </View>
              
              <View style={styles.programInfo}>
                <Text style={styles.programInfoTitle}>Back Builder Elite</Text>
                <Text style={styles.programInfoText}>
                  • Complete posterior chain development{"\n"}
                  • Pulling power and back width focus{"\n"}
                  • Deadlifts, rows, and pull-up variations{"\n"}
                  • Create the V-taper and thick back muscles
                </Text>
              </View>

              <View style={styles.programInfo}>
                <Text style={styles.programInfoTitle}>Shoulder Sculptor</Text>
                <Text style={styles.programInfoText}>
                  • 3D shoulder development (front, side, rear){"\n"}
                  • Military press and overhead strength{"\n"}
                  • High-volume shoulder isolation work{"\n"}
                  • Build boulder shoulders and pressing power
                </Text>
              </View>
            </>
          )}
        </View>
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
  programsContainer: {
    marginBottom: 32,
  },
  infoSection: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.lighterGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  programInfo: {
    marginBottom: 16,
  },
  programInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  programInfoText: {
    fontSize: 14,
    color: colors.lighterGray,
    lineHeight: 22,
  },
});