import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWorkoutStore } from "@/store/workout-store";
import { colors } from "@/constants/colors";
import { ProgramCard } from "@/components/ProgramCard";

export default function ProgramsScreen() {
  const router = useRouter();
  const { programs, setActiveProgram, startProgram, userProgress } = useWorkoutStore();

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
          <Text style={styles.title}>Choose Your Program</Text>
          <Text style={styles.subtitle}>
            Select a 12-week program that matches your fitness goals
          </Text>
        </View>

        <View style={styles.programsContainer}>
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onPress={() => handleProgramPress(program.id)}
            />
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Our Programs</Text>
          <Text style={styles.infoText}>
            Both programs follow a traditional "bro split" targeting different muscle groups each day.
            Each workout is designed to be completed in about 1 hour.
          </Text>
          
          <View style={styles.programInfo}>
            <Text style={styles.programInfoTitle}>Mass Builder</Text>
            <Text style={styles.programInfoText}>
              • Focus on progressive overload{"\n"}
              • Heavier weights, lower reps as you progress{"\n"}
              • Designed to maximize muscle growth and strength{"\n"}
              • Optimal for caloric surplus diet
            </Text>
          </View>
          
          <View style={styles.programInfo}>
            <Text style={styles.programInfoTitle}>Shred Master</Text>
            <Text style={styles.programInfoText}>
              • Maintain strength while losing fat{"\n"}
              • Shorter rest periods for increased calorie burn{"\n"}
              • 20 minutes of stair master cardio after each workout{"\n"}
              • Optimal for caloric deficit diet
            </Text>
          </View>
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