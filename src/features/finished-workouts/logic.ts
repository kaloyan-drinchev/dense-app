import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService, wizardResultsService } from '@/db/services';

export type CompletedEntry = {
  date: string; // ISO
  workoutIndex: number;
  workoutName?: string;
  duration?: number; // in seconds
  percentageSuccess?: number; // completion percentage
  totalVolume?: number; // total volume lifted in kg
  caloriesBurned?: number; // calories burned (for cardio workouts)
  sessionId?: string; // NEW: Reference to workout_sessions table
  exercises?: Array<{
    name: string;
    sets: number;
    completedSets: number;
    totalReps: number;
    totalVolume: number;
    caloriesBurned?: number;
  }>;
};

export const useFinishedWorkoutsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<CompletedEntry[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalVolumeLifted, setTotalVolumeLifted] = useState(0);

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

  const handleBack = () => {
    router.back();
  };

  const handleEntryPress = (item: CompletedEntry) => {
    router.push(
      `/finished-workouts-detail?date=${encodeURIComponent(item.date)}&workoutName=${encodeURIComponent(item.workoutName || 'workout')}` as any
    );
  };

  return {
    loading,
    entries,
    totalVolumeLifted,
    handleBack,
    handleEntryPress,
  };
};