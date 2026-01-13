import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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
  totalVolume?: number; // total volume lifted in kg
  caloriesBurned?: number; // calories burned (for cardio workouts)
  exercises?: Array<{
    name: string;
    sets: number;
    completedSets: number;
    totalReps: number;
    totalVolume: number;
    caloriesBurned?: number;
  }>;
};

export default function FinishedWorkoutsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<CompletedEntry[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalVolumeLifted, setTotalVolumeLifted] = useState(0);

  // No more week grouping - just show workouts sorted by date

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
            // Handle both string (JSON) and array (JSONB) types
            const completedData = Array.isArray(progress.completedWorkouts)
              ? progress.completedWorkouts
              : (typeof progress.completedWorkouts === 'string' 
                  ? JSON.parse(progress.completedWorkouts) 
                  : []);
            
            // Filter only detailed workout objects (not calendar entries)
            arr = completedData.filter((item: any) => 
              typeof item === 'object' && 
              item.date && 
              (item.workoutIndex !== undefined || item.workoutName)
            );
            
            arr.sort((a, b) => (a.date < b.date ? 1 : -1));
            setEntries(arr);
            
            // Calculate total volume lifted all time
            const totalVolume = arr.reduce((sum, entry) => sum + (entry.totalVolume || 0), 0);
            setTotalVolumeLifted(totalVolume);
          } catch { 
            arr = []; 
            setEntries([]);
            setTotalVolumeLifted(0);
          }
        } else {
          setEntries([]);
          setTotalVolumeLifted(0);
        }
        const wiz = await wizardResultsService.getByUserId(user.id);
        // Cast to any to access legacy field (generatedSplit)
        const legacyWiz = wiz as any;
        if (legacyWiz?.generatedSplit) {
          // Handle both string (JSON) and object (JSONB) types
          try { 
            setProgram(typeof legacyWiz.generatedSplit === 'string' 
              ? JSON.parse(legacyWiz.generatedSplit) 
              : legacyWiz.generatedSplit); 
          } catch {}
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading workouts...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.debugText}>No finished workouts yet</Text>
            </View>
          ) : (
            <>
              {/* Total Volume Stats */}
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Icon name="trending-up" size={24} color={colors.secondary} />
                  <Text style={styles.statsTitle}>Your Lifting Stats</Text>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {totalVolumeLifted >= 1000 
                        ? `${(totalVolumeLifted / 1000).toFixed(1)}t` 
                        : `${Math.round(totalVolumeLifted)}kg`}
                    </Text>
                    <Text style={styles.statLabel}>Total Volume Lifted</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{entries.length}</Text>
                    <Text style={styles.statLabel}>Workouts Completed</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {entries.length > 0 
                        ? `${Math.round(totalVolumeLifted / entries.length)}kg`
                        : '0kg'}
                    </Text>
                    <Text style={styles.statLabel}>Avg per Workout</Text>
                  </View>
                </View>
              </View>
              
              {/* Workout History */}
              <Text style={styles.sectionTitle}>Workout History</Text>
              
              {/* NEW: Simple list, no week grouping */}
              {entries.map((item, idx) => {
                // Format: "Dec 17, 2024 - Push Day A"
                const dateObj = new Date(item.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                const workoutName = item.workoutName || 'Workout';
                
              return (
                <TouchableOpacity
                  key={`${item.date}-${idx}`}
                  style={styles.entryCard}
                    onPress={() => router.push(`/finished-workouts-detail?date=${encodeURIComponent(item.date)}&workoutName=${encodeURIComponent(item.workoutName || 'workout')}` as any)}
                >
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryTitle}>
                        {formattedDate} - {workoutName}
                    </Text>
                    <View style={styles.entryMeta}>
                        <View style={styles.metaBadges}>
                          {/* Show volume for strength workouts */}
                          {item.totalVolume !== undefined && item.totalVolume !== null && item.totalVolume > 0 && (
                            <View style={styles.volumeBadge}>
                              <Icon name="trending-up" size={12} color={colors.secondary} />
                              <Text style={styles.volumeBadgeText}>
                                {item.totalVolume >= 1000 
                                  ? `${(item.totalVolume / 1000).toFixed(1)}t` 
                                  : `${Math.round(item.totalVolume)}kg`}
                              </Text>
                            </View>
                          )}
                          {/* Show duration for cardio workouts */}
                          {item.duration !== undefined && item.duration !== null && item.duration > 0 && (
                            <View style={styles.volumeBadge}>
                              <Icon name="clock" size={12} color={colors.primary} />
                              <Text style={styles.volumeBadgeText}>
                                {item.duration} min
                              </Text>
                            </View>
                          )}
                          {/* Show calories for cardio workouts */}
                          {item.caloriesBurned !== undefined && item.caloriesBurned !== null && item.caloriesBurned > 0 && (
                            <View style={styles.volumeBadge}>
                              <Icon name="zap" size={12} color={colors.secondary} />
                              <Text style={styles.volumeBadgeText}>
                                {Math.round(item.caloriesBurned)} cal
                              </Text>
                            </View>
                          )}
                          {/* Show success percentage for strength workouts */}
                          {item.percentageSuccess !== undefined && item.percentageSuccess !== null && item.workoutIndex !== -2 && (
                      <View style={styles.percentageBadge}>
                              <Text style={styles.percentageBadgeText}>
                                {item.percentageSuccess}%
                              </Text>
                            </View>
                          )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryRight}>
                    <Icon name="arrow-right" size={18} color={colors.black} />
                  </View>
                </TouchableOpacity>
              );
              })}
            </>
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
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: { 
    ...typography.body, 
    color: colors.lightGray, 
    marginTop: 16,
  },
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
  statsCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.mediumGray,
    marginHorizontal: 8,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  volumeBadgeText: {
    ...typography.caption,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
});


