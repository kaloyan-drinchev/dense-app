import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';

export const useFinishedWorkoutDetailLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { date, workoutName } = useLocalSearchParams<{ date: string; workoutName: string }>();
  
  const [workout, setWorkout] = useState<any>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, any[]>>({});
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [cardioEntries, setCardioEntries] = useState<any[]>([]);
  const [workoutPercentage, setWorkoutPercentage] = useState<number | null>(null);
  const [userWeight, setUserWeight] = useState<number>(70);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        // First, load the completed workout entry to get exercise data
        const progress = await userProgressService.getByUserId(user.id);
        let workoutEntry = null;
        
        if (progress?.completedWorkouts && date) {
          try {
            const completedData = Array.isArray(progress.completedWorkouts)
              ? progress.completedWorkouts
              : (typeof progress.completedWorkouts === 'string'
                  ? JSON.parse(progress.completedWorkouts)
                  : []);
            
            const normalizedWorkoutName = workoutName 
              ? String(workoutName).toLowerCase().trim()
              : '';
            
            workoutEntry = completedData.find((item: any) => {
              if (typeof item !== 'object' || !item.date) return false;
              const dateMatch = new Date(item.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
              if (!dateMatch) return false;
              const itemWorkoutName = item.workoutName 
                ? String(item.workoutName).toLowerCase().trim()
                : '';
              return itemWorkoutName === normalizedWorkoutName;
            });
          } catch (err) {
            console.error('Error parsing completed workouts:', err);
          }
        }
        
        // Load workout template based on workoutName
        if (workoutName && typeof workoutName === 'string') {
          const lowerName = workoutName.toLowerCase();
          let workoutType = '';
          
          if (lowerName.startsWith('cardio:') || lowerName.startsWith('manual:')) {
            const exercisesFromEntry = workoutEntry?.exercises || [];
            
            setWorkout({
              id: 'cardio-manual',
              name: workoutName,
              type: lowerName.startsWith('manual:') ? 'manual' : 'cardio',
              category: lowerName.startsWith('manual:') ? 'manual' : 'cardio',
              estimatedDuration: 0,
              exercises: exercisesFromEntry,
            } as any);
          } else {
            // Match by focus keywords
            if (lowerName.includes('push') && lowerName.includes('chest')) workoutType = 'push-a';
            else if (lowerName.includes('push') && lowerName.includes('shoulder')) workoutType = 'push-b';
            else if (lowerName.includes('pull') && lowerName.includes('width')) workoutType = 'pull-a';
            else if (lowerName.includes('pull') && lowerName.includes('thickness')) workoutType = 'pull-b';
            else if (lowerName.includes('leg') && lowerName.includes('quad')) workoutType = 'leg-a';
            else if (lowerName.includes('leg') && lowerName.includes('hamstring')) workoutType = 'leg-b';
            // Backward compatibility
            else if (lowerName.includes('push') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) workoutType = 'push-a';
            else if (lowerName.includes('push') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) workoutType = 'push-b';
            else if (lowerName.includes('pull') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) workoutType = 'pull-a';
            else if (lowerName.includes('pull') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) workoutType = 'pull-b';
            else if (lowerName.includes('leg') && (lowerName.includes('day a') || lowerName.endsWith(' a'))) workoutType = 'leg-a';
            else if (lowerName.includes('leg') && (lowerName.includes('day b') || lowerName.endsWith(' b'))) workoutType = 'leg-b';
            
            if (workoutType) {
              const { getWorkoutTemplate } = await import('@/lib/workout-templates');
              const workoutTemplate = getWorkoutTemplate(workoutType);
              if (workoutTemplate) {
                setWorkout(workoutTemplate);
              }
            }
          }
        }
        
        // Load User Weight
        const wiz = await wizardResultsService.getByUserId(user.id);
        if (wiz?.weight) {
          setUserWeight(wiz.weight);
        }
        
        // Load Progress Logs
        if (progress?.weeklyWeights) {
          try {
            const ww = typeof progress.weeklyWeights === 'string'
              ? JSON.parse(progress.weeklyWeights)
              : progress.weeklyWeights;
            setExerciseLogs(ww.exerciseLogs || {});
            
            if (date && ww.customExercises) {
              const dateKey = String(date).slice(0, 10);
              setCustomExercises(ww.customExercises[dateKey] || []);
            }
            
            if (date && ww.cardioEntries) {
              const dateKey = String(date).slice(0, 10);
              setCardioEntries(ww.cardioEntries[dateKey] || []);
            }
          } catch {}
        }
        
        // Load Entry Stats
        if (workoutEntry) {
          if (workoutEntry.percentageSuccess !== undefined) {
            setWorkoutPercentage(workoutEntry.percentageSuccess);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, date, workoutName]);

  // Calculate Stats
  useEffect(() => {
    if (!workout || !date) return;
    
    const dateKey = String(date).slice(0, 10);
    const completedExercises: Array<{ 
      name: string; 
      sets: number;
      setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
    }> = [];
    
    // Standard Exercises
    workout.exercises?.forEach((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      const sessions = exerciseLogs[exId] || [];
      const sessionForDay = sessions.find((s: any) => s.date === dateKey);
      const sets = typeof ex.sets === 'number' ? ex.sets : 3;
      
      if (sessionForDay?.sets && sessionForDay.sets.length > 0) {
        completedExercises.push({
          name: ex.name,
          sets: sets,
          setsData: sessionForDay.sets
        });
      } else {
        completedExercises.push({ name: ex.name, sets: sets });
      }
    });
    
    // Custom Exercises
    customExercises.forEach((ex: any) => {
      const exId = ex.id;
      const sessions = exerciseLogs[exId] || [];
      const sessionForDay = sessions.find((s: any) => s.date === dateKey);
      const sets = typeof ex.sets === 'number' ? ex.sets : 3;
      
      if (sessionForDay?.sets && sessionForDay.sets.length > 0) {
        completedExercises.push({
          name: ex.name,
          sets: sets,
          setsData: sessionForDay.sets
        });
      } else {
        completedExercises.push({ name: ex.name, sets: sets });
      }
    });
    
    const exerciseCalories = completedExercises.length > 0 
      ? calculateWorkoutCalories(completedExercises, userWeight)
      : 0;
    
    const cardioCalories = cardioEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.calories || 0);
    }, 0);
    
    setTotalCalories(exerciseCalories + cardioCalories);
  }, [workout, exerciseLogs, customExercises, cardioEntries, date, userWeight]);

  const handleBack = () => router.back();
  const dateKey = String(date || '').slice(0, 10);

  return {
    loading,
    workout,
    workoutPercentage,
    totalCalories,
    date,
    dateKey,
    exerciseLogs,
    customExercises,
    cardioEntries,
    handleBack
  };
};