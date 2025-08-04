import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workout-store";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";
import { ProgramCard } from "@/components/ProgramCard";

export default function ProgramsScreen() {
  const router = useRouter();
  const { programs, setActiveProgram, startProgram, userProgress } = useWorkoutStore();
  const { user } = useAuthStore();
  const [userRecommendedPrograms, setUserRecommendedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's recommended programs from wizard results
  useEffect(() => {
    const fetchUserRecommendations = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { wizardResultsService } = await import('@/db/services');
        const wizardResults = await wizardResultsService.getByUserId(user.email);
        
        if (wizardResults?.suggestedPrograms) {
          const recommendedIds = JSON.parse(wizardResults.suggestedPrograms);
          setUserRecommendedPrograms(recommendedIds);
        }
      } catch (error) {
        console.error('Failed to fetch user recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecommendations();
  }, [user?.email]);

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