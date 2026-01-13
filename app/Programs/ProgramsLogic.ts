import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutCacheStore } from "@/store/workout-cache-store";

export const useProgramsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { generatedProgram: cachedProgram, userProgressData: cachedProgress, isCacheValid } = useWorkoutCacheStore();
  
  // State
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loading, setLoading] = useState(!cachedProgram || !cachedProgress);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(3);

  // Refs
  const isLoadingProgramRef = useRef(false);
  const isLoadingProgressRef = useRef(false);

  // --- Data Loading Logic ---

  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) return;
    if (isLoadingProgramRef.current) return;

    try {
      isLoadingProgramRef.current = true;
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      if (!wizardResults) {
        console.log('⚠️ Programs tab - No wizard results found');
        return;
      }
      
      // Cast to any to access legacy fields (generatedSplit, musclePriorities)
      const legacyResults = wizardResults as any;
      
      if (legacyResults?.generatedSplit) {
        try {
          const program = typeof legacyResults.generatedSplit === 'string' 
            ? JSON.parse(legacyResults.generatedSplit)
            : legacyResults.generatedSplit;
          
          // Legacy Title Logic
          if (legacyResults?.musclePriorities) {
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
          const { setWorkoutData } = useWorkoutCacheStore.getState();
          setWorkoutData({ generatedProgram: program });
        } catch (parseError) {
          console.error('❌ Failed to parse generatedSplit:', parseError);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load generated program:', error);
    } finally {
      isLoadingProgramRef.current = false;
    }
  }, [user?.id]);

  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    if (isLoadingProgressRef.current) return;

    try {
      isLoadingProgressRef.current = true;
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        const { setWorkoutData } = useWorkoutCacheStore.getState();
        setWorkoutData({ userProgressData: progress });
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    } finally {
      isLoadingProgressRef.current = false;
    }
  }, [user?.id]);

  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const cache = useWorkoutCacheStore.getState();
    if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
      setGeneratedProgram(cache.generatedProgram);
      setUserProgressData(cache.userProgressData);
      setLoading(false);
      
      const cacheAge = cache.lastUpdated ? Date.now() - cache.lastUpdated : Infinity;
      if (cacheAge < 60000) return;
      
      Promise.allSettled([loadGeneratedProgram(), loadUserProgress()]).then((results) => {
        // Optional: log failures
      });
      return;
    }

    setLoading(true);
    await Promise.allSettled([loadGeneratedProgram(), loadUserProgress()]);
    setLoading(false);
  }, [user?.id, loadGeneratedProgram, loadUserProgress]);

  // --- Effects ---

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id, loadAllData]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
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

  // --- Helpers ---

  const getCompletedWorkoutsCount = () => {
    try {
      if (!userProgressData?.completedWorkouts) return 0;
      const completedRaw = userProgressData.completedWorkouts;
      let completed: any[] = [];
      
      if (Array.isArray(completedRaw)) {
        completed = completedRaw;
      } else if (typeof completedRaw === 'string') {
        completed = JSON.parse(completedRaw);
      } else {
        return 0;
      }
      return Array.isArray(completed) ? completed.length : 0;
    } catch {
      return 0;
    }
  };

  const handleSavePreference = async () => {
    try {
      const updatedProgram = {
        ...generatedProgram,
        trainingSchedule: Array(selectedDays).fill('').map((_, idx) => 
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx]
        ).filter(Boolean),
      };
      
      setGeneratedProgram(updatedProgram);
      const { setWorkoutData } = useWorkoutCacheStore.getState();
      setWorkoutData({ generatedProgram: updatedProgram });
      
      setShowEditModal(false);
    } catch (error) {
      console.error('❌ Failed to save preference:', error);
    }
  };

  return {
    router,
    user,
    generatedProgram,
    userProgressData,
    loading,
    showEditModal,
    selectedDays,
    setShowEditModal,
    setSelectedDays,
    getCompletedWorkoutsCount,
    handleSavePreference
  };
};