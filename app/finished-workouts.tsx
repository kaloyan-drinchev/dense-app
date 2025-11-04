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
import { formatDuration } from '@/utils/format-duration';

type CompletedEntry = {
  date: string; // ISO
  workoutIndex: number;
  workoutName?: string;
  duration?: number; // in seconds
  percentageSuccess?: number; // completion percentage
};

export default function FinishedWorkoutsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<CompletedEntry[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const progress = await userProgressService.getByUserId(user.id);
        if (progress?.completedWorkouts) {
          let arr: CompletedEntry[] = [];
          try { 
            const completedData = JSON.parse(progress.completedWorkouts as unknown as string) || [];
            console.log('🔍 Finished workouts raw data:', completedData);
            
            // Filter only detailed workout objects (not calendar entries)
            console.log('🔍 Checking each item:');
            completedData.forEach((item: any, index: number) => {
              console.log(`Item ${index}:`, item, 'Type:', typeof item);
              if (typeof item === 'object') {
                console.log(`  - has date: ${!!item.date}`);
                console.log(`  - has workoutIndex: ${item.workoutIndex !== undefined}`);
                console.log(`  - has workoutName: ${!!item.workoutName}`);
              }
            });
            
            arr = completedData.filter((item: any) => 
              typeof item === 'object' && 
              item.date && 
              (item.workoutIndex !== undefined || item.workoutName)
            );
            console.log('🔍 Filtered workout entries:', arr);
            
            arr.sort((a, b) => (a.date < b.date ? 1 : -1));
            setEntries(arr);
          } catch { 
            arr = []; 
            setEntries([]);
          }
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
  }, [user?.id]);

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
              <Text style={styles.debugText}>No finished workouts yet</Text>
            </View>
          ) : (
            entries.map((item, idx) => {
              const workout = program?.weeklyStructure?.[item.workoutIndex];
              return (
                <TouchableOpacity
                  key={`${item.date}-${idx}`}
                  style={styles.entryCard}
                  onPress={() => router.push(`/finished-workouts-detail?date=${encodeURIComponent(item.date)}&workoutIndex=${item.workoutIndex}` as any)}
                >
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryTitle}>
                      {workout?.name || item.workoutName || `Day ${item.workoutIndex + 1}: Workout`}
                    </Text>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entrySubtitle}>{new Date(item.date).toLocaleString()}</Text>
                      <View style={styles.percentageBadge}>
                        <Text style={styles.percentageBadgeText}>{item.percentageSuccess}%</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryRight}>
                    <Icon name="arrow-right" size={18} color={colors.black} />
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
  debugText: { ...typography.bodySmall, color: colors.secondary, textAlign: 'center', marginTop: 8 },
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
  percentageBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentageBadgeText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: {
    ...typography.timerSmall,
    color: colors.primary,
  },
  metaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    ...typography.timerSmall,
    color: colors.primary,
    fontWeight: '600',
  },
  entryRight: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...typography.timerTiny, color: colors.white },
});


