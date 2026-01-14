import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useNutritionStore } from '@/store/nutrition-store';
import { LoggedMealSession } from '@/types/nutrition';
import { Feather as Icon } from '@expo/vector-icons';
import { NutritionProgressCircle } from '@/components/NutritionProgressCircle';

type NutritionEntry = {
  id: string;
  date: string;
  timestamp: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entryCount: number;
  calorieGoal: number;
};

export default function NutritionHistoryScreen() {
  const router = useRouter();
  const { loggedMealSessions } = useNutritionStore();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNutritionHistory = () => {
      try {
        // Convert logged meal sessions to sorted array of entries
        const nutritionEntries: NutritionEntry[] = loggedMealSessions
          .map((session) => ({
            id: session.id,
            date: session.date,
            timestamp: session.timestamp,
            totalCalories: session.totalNutrition.calories,
            totalProtein: session.totalNutrition.protein,
            totalCarbs: session.totalNutrition.carbs,
            totalFat: session.totalNutrition.fat,
            entryCount: session.entries.length,
            calorieGoal: session.calorieGoal,
          }))
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // Sort by timestamp (newest first)

        setEntries(nutritionEntries);
      } catch (error) {
        console.error('Error loading nutrition history:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadNutritionHistory();
  }, [loggedMealSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const getCaloriePercentage = (consumed: number, goal: number) => {
    return Math.round((consumed / goal) * 100);
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition History</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No nutrition data logged yet</Text>
              <Text style={styles.emptySubtext}>Start logging your meals to see your nutrition history!</Text>
            </View>
          ) : (
            entries.map((entry, idx) => {
              const caloriePercentage = getCaloriePercentage(entry.totalCalories, entry.calorieGoal);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => router.push(`/nutrition-detail?sessionId=${encodeURIComponent(entry.id)}` as any)}
                >
                  <View style={styles.entryLeft}>
                    <View style={styles.entryHeader}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                        <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                      </View>
                      <View style={styles.entryCountBadge}>
                        <Text style={styles.entryCountText}>{entry.entryCount} items</Text>
                      </View>
                    </View>
                    
                    <View style={styles.nutritionSummary}>
                      <View style={styles.calorieRow}>
                        <Text style={styles.calorieText}>
                          {entry.totalCalories} / {entry.calorieGoal} cal
                        </Text>
                      </View>
                      
                      <View style={styles.macroRow}>
                        <View style={styles.macroItems}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>P</Text>
                            <Text style={styles.macroValue}>{entry.totalProtein}g</Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>C</Text>
                            <Text style={styles.macroValue}>{entry.totalCarbs}g</Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>F</Text>
                            <Text style={styles.macroValue}>{entry.totalFat}g</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.entryCenter}>
                    <NutritionProgressCircle percentage={caloriePercentage} />
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
  centerBox: { 
    padding: 24, 
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: { ...typography.body, color: colors.white },
  emptyText: { 
    ...typography.h4, 
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: { 
    ...typography.body, 
    color: colors.lightGray,
    textAlign: 'center',
  },
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
  entryCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateTimeContainer: {
    alignItems: 'flex-start',
  },
  entryDate: { 
    ...typography.h4, 
    color: colors.white,
    fontWeight: 'bold',
  },
  entryTime: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginTop: 2,
  },
  entryCountBadge: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryCountText: {
    ...typography.caption,
    color: colors.lightGray,
    fontWeight: '600',
  },
  nutritionSummary: {
    gap: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  macroItems: {
    flexDirection: 'row',
    gap: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  macroValue: {
    ...typography.bodySmall,
    color: colors.white,
  },
  entryRight: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
