import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { Feather as Icon } from '@expo/vector-icons';

export default function FinishedWorkoutsDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { date, workoutIndex } = useLocalSearchParams<{ date: string; workoutIndex: string }>();
  const [program, setProgram] = useState<any>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const wiz = await wizardResultsService.getByUserId(user.id);
        if (wiz?.generatedSplit) {
          try { setProgram(JSON.parse(wiz.generatedSplit)); } catch {}
        }
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.weeklyWeights) {
          try {
            const ww = JSON.parse(progress.weeklyWeights as unknown as string);
            setExerciseLogs(ww.exerciseLogs || {});
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const workout = program?.weeklyStructure?.[parseInt(workoutIndex || '0', 10)];
  const dateKey = String(date || '').slice(0, 10);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{workout?.name || 'Finished Workout'}</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.dateText}>{new Date(String(date)).toLocaleString()}</Text>
          {workout?.exercises?.map((ex: any, i: number) => {
            const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
            const sessions = exerciseLogs[exId] || [];
            const sessionForDay = sessions.find((s: any) => s.date === dateKey);
            return (
              <View key={i} style={{ marginTop: 8 }}>
                <ExerciseTracker
                  exercise={{
                    id: exId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTime: ex.restSeconds || 60,
                    targetMuscle: ex.targetMuscle || 'General',
                  }}
                  exerciseKey={exId}
                  readOnly
                  presetSession={sessionForDay ? { unit: sessionForDay.unit || 'kg', sets: sessionForDay.sets || [] } : undefined}
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: { marginRight: 16, padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 24 },
  dateText: { color: colors.lighterGray, marginBottom: 8 },
});


