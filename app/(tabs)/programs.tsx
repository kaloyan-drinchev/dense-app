import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutCacheStore } from "@/store/workout-cache-store";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { LoadingState } from '@/components/LoadingState';
import { wizardResultsService } from '@/db/services';

export default function ProgramsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, isCacheValid } = useWorkoutCacheStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loading, setLoading] = useState(!cachedProgram || !cachedProgress);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(3);

  // Use separate refs to prevent multiple simultaneous calls for each function
  const isLoadingProgramRef = useRef(false);
  const isLoadingProgressRef = useRef(false);

  // Load generated program - wrapped in useCallback to prevent stale closures
  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgramRef.current) {
      return;
    }

    try {
      isLoadingProgramRef.current = true;
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      // Cast to any for legacy property access
      const legacyResults = wizardResults as any;
      
      console.log('🔍 Programs tab - Wizard results:', wizardResults ? 'Found' : 'Not found');
      console.log('🔍 Programs tab - Has generatedSplit:', !!legacyResults?.generatedSplit);
      
      if (!wizardResults) {
        console.log('⚠️ Programs tab - No wizard results found for user');
        return;
      }
      
      if (legacyResults.generatedSplit) {
        try {
          // Handle both string and object types
          const program = typeof legacyResults.generatedSplit === 'string' 
            ? JSON.parse(legacyResults.generatedSplit)
            : legacyResults.generatedSplit;
          
          console.log('🔍 Programs tab - Program parsed:', program?.programName || 'Unknown');
          
          // Create a better program title based on muscle priorities
          if (legacyResults.musclePriorities) {
            try {
              const priorities = typeof legacyResults.musclePriorities === 'string'
                ? JSON.parse(legacyResults.musclePriorities)
                : legacyResults.musclePriorities;
              const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              program.displayTitle = `${priorityText} Focus`;
            } catch (e) {
              console.error('Failed to parse muscle priorities:', e);
            }
          }
          
          setGeneratedProgram(program);
          // Update cache
          const { setWorkoutData } = useWorkoutCacheStore.getState();
          setWorkoutData({ generatedProgram: program });
          console.log('✅ Programs tab - Program loaded successfully:', program.programName || program.displayTitle);
        } catch (parseError) {
          console.error('❌ Failed to parse generatedSplit:', parseError);
          console.error('Raw generatedSplit type:', typeof legacyResults.generatedSplit);
          console.error('Raw generatedSplit:', legacyResults.generatedSplit);
        }
      } else {
        console.log('⚠️ Programs tab - No generatedSplit found in wizard results');
        console.log('Wizard results keys:', Object.keys(wizardResults));
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    } finally {
      isLoadingProgramRef.current = false;
      // Loading state is managed by loadAllData, not here
    }
  }, [user?.id]);

  // Load user progress - wrapped in useCallback to prevent stale closures
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;

    // Prevent multiple simultaneous calls of this specific function
    if (isLoadingProgressRef.current) {
      return;
    }

    try {
      isLoadingProgressRef.current = true;
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        // Update cache
        const { setWorkoutData } = useWorkoutCacheStore.getState();
        setWorkoutData({ userProgressData: progress });
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      isLoadingProgressRef.current = false;
      // Loading state is managed by loadAllData, not here
    }
  }, [user?.id]);

  // Coordinated loading function that ensures loading state is managed correctly
  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Use cached data immediately if available
    const cache = useWorkoutCacheStore.getState();
    if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
      setGeneratedProgram(cache.generatedProgram);
      setUserProgressData(cache.userProgressData);
      setLoading(false);
      
      // Check cache age to decide if background refresh is needed
      const cacheAge = cache.lastUpdated 
        ? Date.now() - cache.lastUpdated 
        : Infinity;
      if (cacheAge < 60000) {
        return; // Cache is fresh (< 1 minute) - skip refresh
      }
      
      // Cache is stale (>= 1 minute) - refresh in background WITHOUT showing loading spinner
      Promise.allSettled([
        loadGeneratedProgram(),
        loadUserProgress()
      ]).then((results) => {
        // Check for any failed promises
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.error('❌ Failed to refresh cached data:', failures.map(f => (f as PromiseRejectedResult).reason));
        }
      });
      return; // Don't set loading to true - keep showing cached data
    }

    // No valid cache - show loading spinner and load fresh data
    setLoading(true);
    
    // Load both in parallel
    const programPromise = loadGeneratedProgram();
    const progressPromise = loadUserProgress();
    
    // Wait for both to complete
    await Promise.allSettled([programPromise, progressPromise]);
    
    // Set loading to false after both complete
    setLoading(false);
  }, [user?.id, loadGeneratedProgram, loadUserProgress]);

  // Load generated program and progress on mount
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id, loadAllData]);

  // Reload when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
        // Use cache if valid, otherwise reload
        if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
          setGeneratedProgram(cache.generatedProgram);
          setUserProgressData(cache.userProgressData);
          setLoading(false);
        } else {
          loadAllData();
        }
      }
    }, [user?.id, loadAllData])
  );

  // Helper function to get completed workouts count
  const getCompletedWorkoutsCount = () => {
    try {
      if (!userProgressData?.completedWorkouts) return 0;
      
      // Handle both array (from JSONB) and string (from JSON) types
      const completedRaw = userProgressData.completedWorkouts;
      let completed: any[] = [];
      
      if (Array.isArray(completedRaw)) {
        // Already an array (from Supabase JSONB)
        completed = completedRaw;
      } else if (typeof completedRaw === 'string') {
        // Parse JSON string
        completed = JSON.parse(completedRaw);
      } else {
        // Unknown type, return 0
        return 0;
      }
      
      return Array.isArray(completed) ? completed.length : 0;
    } catch {
      return 0;
    }
  };

  // Save training days preference
  const handleSavePreference = async () => {
    try {
      // Update the training schedule in the generated program
      const updatedProgram = {
        ...generatedProgram,
        trainingSchedule: Array(selectedDays).fill('').map((_, idx) => 
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx]
        ).filter(Boolean),
      };
      
      setGeneratedProgram(updatedProgram);
      
      // Update cache
      const { setWorkoutData } = useWorkoutCacheStore.getState();
      setWorkoutData({ generatedProgram: updatedProgram });
      
      setShowEditModal(false);
      console.log('✅ Training days updated to:', selectedDays);
    } catch (error) {
      console.error('❌ Failed to save preference:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Current Program Progress Banner */}
        {generatedProgram && userProgressData && (
          <View style={styles.progressBanner}>
            <LinearGradient
              colors={['#000000', '#0A0A0A']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Push Pull Legs Program</Text>
                <Text style={styles.bannerProgramName}>
                  {getCompletedWorkoutsCount()} workouts completed
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/single-program-view')}
              >
                <Text style={styles.bannerButtonText}>View Details</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Training Preferences */}
        {generatedProgram && (
          <View style={styles.preferencesContainer}>
            <View style={styles.preferencesHeader}>
              <Text style={styles.preferencesTitle}>Training Preferences</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setSelectedDays(generatedProgram.trainingSchedule?.length || 3);
                  setShowEditModal(true);
                }}
              >
                <Icon name="edit-2" size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIconContainer}>
                <Icon name="calendar" size={24} color={colors.primary} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Training Days Per Week</Text>
                <Text style={styles.preferenceValue}>
                  {generatedProgram.trainingSchedule?.length || 3} days
                </Text>
              </View>
            </View>

            <View style={styles.preferenceSeparator} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIconContainer}>
                <Icon name="target" size={24} color={colors.primary} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Fitness Goal</Text>
                <Text style={styles.preferenceValue}>
                  {generatedProgram.goal || 'Muscle Building'}
                </Text>
              </View>
            </View>
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
        {!loading && !generatedProgram && (
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

      {/* Edit Preferences Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Training Days Per Week</Text>
              <Text style={styles.modalSubtitle}>
                How many days per week do you want to train?
              </Text>

              <View style={styles.daysOptions}>
                {[3, 4, 5, 6].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayOption,
                      selectedDays === days && styles.dayOptionSelected,
                    ]}
                    onPress={() => setSelectedDays(days)}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        selectedDays === days && styles.dayOptionTextSelected,
                      ]}
                    >
                      {days}
                    </Text>
                    <Text
                      style={[
                        styles.dayOptionLabel,
                        selectedDays === days && styles.dayOptionLabelSelected,
                      ]}
                    >
                      days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSavePreference}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  // Preferences Styles
  preferencesContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  preferencesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  preferencesTitle: {
    ...typography.h5,
    color: colors.white,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: 8,
  },
  editButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  preferenceSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  preferenceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 4,
  },
  preferenceValue: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.darkGray,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  daysOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dayOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayOptionSelected: {
    backgroundColor: 'rgba(132, 204, 22, 0.15)',
    borderColor: colors.primary,
  },
  dayOptionText: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 4,
  },
  dayOptionTextSelected: {
    color: colors.primary,
  },
  dayOptionLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  dayOptionLabelSelected: {
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...typography.button,
    color: colors.white,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
});