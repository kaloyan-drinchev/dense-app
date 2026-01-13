import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { calculateWorkoutProgress } from '@/utils/progress-calculator';

export const useProgressLogic = () => {
  const { user } = useAuthStore();
  const { userProfile } = useWorkoutStore();
  const { 
    generatedProgram: cachedProgram, 
    userProgressData: cachedProgress, 
    isCacheValid 
  } = useWorkoutCacheStore();
  
  // State
  const [generatedProgram, setGeneratedProgram] = useState<any>(cachedProgram);
  const [loadingProgram, setLoadingProgram] = useState(!cachedProgram);
  
  const [userProgressData, setUserProgressData] = useState<any>(cachedProgress);
  const [loadingProgress, setLoadingProgress] = useState(!cachedProgress);
  
  const [wizardData, setWizardData] = useState<any>(null);
  const [loadingWizard, setLoadingWizard] = useState(false);

  // Refs
  const isLoadingProgramRef = useRef(false);
  const isLoadingProgressRef = useRef(false);
  const isLoadingWizardRef = useRef(false);

  // --- Logic ---

  const loadGeneratedProgram = useCallback(async () => {
    if (!user?.id) return;
    if (isLoadingProgramRef.current) return;
    
    try {
      isLoadingProgramRef.current = true;
      setLoadingProgram(true);
      
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      // Cast to any to access legacy fields (generatedSplit, musclePriorities)
      const legacyResults = wizardResults as any;
      
      if (legacyResults?.generatedSplit) {
        const program = typeof legacyResults.generatedSplit === 'string'
          ? JSON.parse(legacyResults.generatedSplit)
          : legacyResults.generatedSplit;
        
        if (legacyResults?.musclePriorities) {
          const priorities = typeof legacyResults.musclePriorities === 'string'
            ? JSON.parse(legacyResults.musclePriorities)
            : legacyResults.musclePriorities;
          const priorityText = priorities.slice(0, 2).join(' & ').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          program.displayTitle = `${priorityText} Focus`;
        }
        
        setGeneratedProgram(program);
        useWorkoutCacheStore.getState().setWorkoutData({ generatedProgram: program });
      }
    } catch (error) {
      console.error('❌ Progress: Error loading generated program:', error);
    } finally {
      isLoadingProgramRef.current = false;
      setLoadingProgram(false);
    }
  }, [user?.id]);

  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    if (isLoadingProgressRef.current) return;
    
    try {
      isLoadingProgressRef.current = true;
      setLoadingProgress(true);
      
      const { userProgressService } = await import('@/db/services');
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress) {
        setUserProgressData(progress);
        useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: progress });
      }
    } catch (error) {
      console.error('❌ Progress: Error loading user progress:', error);
    } finally {
      isLoadingProgressRef.current = false;
      setLoadingProgress(false);
    }
  }, [user?.id]);

  const loadWizardData = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (isLoadingWizardRef.current) return;
    
    try {
      isLoadingWizardRef.current = true;
      if (showLoading) setLoadingWizard(true);
      
      const { wizardResultsService } = await import('@/db/services');
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      
      setWizardData(wizardResults);
    } catch (error) {
      console.error('❌ Progress: Error loading wizard data:', error);
    } finally {
      isLoadingWizardRef.current = false;
      if (showLoading) setLoadingWizard(false);
    }
  }, [user?.id]);

  // --- Effects ---

  useEffect(() => {
    if (user?.id) {
      // Check Cache
      if (cachedProgram && cachedProgress && isCacheValid()) {
        setGeneratedProgram(cachedProgram);
        setUserProgressData(cachedProgress);
        setLoadingProgram(false);
        setLoadingProgress(false);
        setLoadingWizard(false); 
        
        const cacheAge = useWorkoutCacheStore.getState().lastUpdated 
          ? Date.now() - (useWorkoutCacheStore.getState().lastUpdated || 0)
          : Infinity;

        // Background Refresh
        if (cacheAge < 60000) {
          loadWizardData(false).catch(() => {});
          return;
        }
        
        Promise.allSettled([
          loadGeneratedProgram(),
          loadUserProgress(),
          loadWizardData(false)
        ]).then((results) => {
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) console.error('❌ Refresh failed');
        });
        return;
      }

      // No Cache - Load All
      loadGeneratedProgram();
      loadUserProgress();
      loadWizardData();
    } else {
      setLoadingProgram(false);
      setLoadingProgress(false);
      setLoadingWizard(false);
    }
  }, [user?.id, loadGeneratedProgram, loadUserProgress, loadWizardData]);

  // Focus Effect
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const cache = useWorkoutCacheStore.getState();
        if (cache.generatedProgram && cache.userProgressData && cache.isCacheValid()) {
          setGeneratedProgram(cache.generatedProgram);
          setUserProgressData(cache.userProgressData);
          setLoadingProgram(false);
          setLoadingProgress(false);
          setLoadingWizard(false);
          loadWizardData(false).catch(() => {});
        } else {
          loadGeneratedProgram();
          loadUserProgress();
          loadWizardData(true);
        }
      } else {
        setLoadingProgram(false);
        setLoadingProgress(false);
        setLoadingWizard(false);
      }
    }, [user?.id, loadGeneratedProgram, loadUserProgress, loadWizardData])
  );

  // Derived
  const progressData = useMemo(() => {
    return calculateWorkoutProgress(generatedProgram, userProgressData);
  }, [generatedProgram, userProgressData]);

  const isLoading = loadingProgram || loadingProgress || loadingWizard;

  return {
    userProfile,
    generatedProgram,
    userProgressData,
    wizardData,
    progressData,
    isLoading
  };
};