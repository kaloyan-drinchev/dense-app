import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService, wizardResultsService } from '@/db/services';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { Feather as Icon } from '@expo/vector-icons';

type CompletedEntry = {
  date: string; // ISO
  workoutIndex: number;
  workoutName?: string;
  duration?: number; // in seconds
};

export default function FinishedWorkoutsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<CompletedEntry[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds === 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.completedWorkouts) {
          let arr: CompletedEntry[] = [];
          try { arr = JSON.parse(progress.completedWorkouts as unknown as string) || []; } catch { arr = []; }
          arr.sort((a, b) => (a.date < b.date ? 1 : -1));
          setEntries(arr);
        } else {
          setEntries([]);
        }
        const wiz = await wizardResultsService.getByUserId(user.id);
        if (wiz?.generatedSplit) {
          try { setProgram(JSON.parse(wiz.generatedSplit)); } catch {}
        }
      } catch (e) {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finished Workouts</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No finished workouts yet</Text>
            </View>
          ) : (
            entries.map((item, idx) => {
              const workout = program?.weeklyStructure?.[item.workoutIndex];
              return (
                <TouchableOpacity
                  key={`${item.date}-${idx}`}
                  style={styles.entryCard}
                  onPress={() => router.push(`/finished-workouts-detail?date=${encodeURIComponent(item.date)}&workoutIndex=${item.workoutIndex}`)}
                >
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryTitle}>{`Day ${item.workoutIndex + 1} - ${workout?.name || item.workoutName || 'Workout'}`}</Text>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entrySubtitle}>{new Date(item.date).toLocaleString()}</Text>
                      {item.duration && (
                        <View style={styles.durationContainer}>
                          <Icon name="clock" size={12} color={colors.primary} />
                          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.entryRight}>
                    <Icon name="arrow-right" size={18} color={colors.white} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  headerTitle: { ...typography.h4, color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 24 },
  centerBox: { padding: 24, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.white },
  emptyText: { ...typography.body, color: colors.lightGray },
  entryCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLeft: { flex: 1 },
  entryTitle: { ...typography.body, color: colors.white, fontWeight: 'bold' },
  entryMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 4 
  },
  entrySubtitle: { ...typography.bodySmall, color: colors.lighterGray },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(58, 81, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    ...typography.timerSmall,
    color: colors.primary,
  },
  entryRight: {
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { ...typography.timerTiny, color: colors.white },
});


