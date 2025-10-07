import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Types for PR tracking
export interface ExerciseSet {
  weightKg: number;
  reps: number;
  isCompleted: boolean;
}

export interface ExerciseSession {
  date: string; // YYYY-MM-DD
  sets: ExerciseSet[];
}

export interface ExerciseLogs {
  [exerciseId: string]: ExerciseSession[];
}

export interface PersonalRecord {
  type: 'weight' | 'reps' | 'volume' | '1rm';
  value: number;
  date: string;
  previousValue?: number;
  sets?: ExerciseSet[]; // The sets that achieved this PR
}

export interface ExercisePRs {
  [exerciseId: string]: {
    maxWeight: PersonalRecord | null;
    maxReps: PersonalRecord | null; 
    maxVolume: PersonalRecord | null;
    estimated1RM: PersonalRecord | null;
    lastWorkout?: ExerciseSession;
  };
}

// Calculate estimated 1RM using Epley formula
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

// Calculate total volume for a workout (weight × reps × sets)
export const calculateWorkoutVolume = (sets: ExerciseSet[]): number => {
  return sets.reduce((total, set) => {
    if (set.isCompleted && set.weightKg > 0 && set.reps > 0) {
      return total + (set.weightKg * set.reps);
    }
    return total;
  }, 0);
};

// Get the best set from a workout (highest weight, then highest reps)
export const getBestSet = (sets: ExerciseSet[]): ExerciseSet | null => {
  const completedSets = sets.filter(set => set.isCompleted && set.weightKg > 0 && set.reps > 0);
  if (completedSets.length === 0) return null;
  
  return completedSets.reduce((best, current) => {
    // Prioritize weight, then reps
    if (current.weightKg > best.weightKg) return current;
    if (current.weightKg === best.weightKg && current.reps > best.reps) return current;
    return best;
  });
};

// Analyze exercise logs to find all PRs
export const analyzeExercisePRs = (exerciseLogs: ExerciseLogs): ExercisePRs => {
  const allPRs: ExercisePRs = {};
  
  Object.entries(exerciseLogs).forEach(([exerciseId, sessions]) => {
    if (!sessions || !Array.isArray(sessions)) return;
    
    let maxWeight: PersonalRecord | null = null;
    let maxReps: PersonalRecord | null = null;
    let maxVolume: PersonalRecord | null = null;
    let estimated1RM: PersonalRecord | null = null;
    let lastWorkout: ExerciseSession | undefined;
    
    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedSessions.forEach(session => {
      if (!session.sets || !Array.isArray(session.sets)) return;
      
      const completedSets = session.sets.filter(set => set.isCompleted && set.weightKg > 0 && set.reps > 0);
      if (completedSets.length === 0) return;
      
      // Track last workout
      lastWorkout = session;
      
      // Check for weight PR (highest single weight)
      const heaviestSet = completedSets.reduce((heaviest, current) => 
        current.weightKg > heaviest.weightKg ? current : heaviest
      );
      
      if (!maxWeight || heaviestSet.weightKg > maxWeight.value) {
        maxWeight = {
          type: 'weight',
          value: heaviestSet.weightKg,
          date: session.date,
          previousValue: maxWeight?.value,
          sets: [heaviestSet]
        };
      }
      
      // Check for rep PR (highest reps at any weight)
      const mostRepsSet = completedSets.reduce((most, current) => 
        current.reps > most.reps ? current : most
      );
      
      if (!maxReps || mostRepsSet.reps > maxReps.value) {
        maxReps = {
          type: 'reps',
          value: mostRepsSet.reps,
          date: session.date,
          previousValue: maxReps?.value,
          sets: [mostRepsSet]
        };
      }
      
      // Check for volume PR (total volume for the session)
      const sessionVolume = calculateWorkoutVolume(completedSets);
      
      if (!maxVolume || sessionVolume > maxVolume.value) {
        maxVolume = {
          type: 'volume',
          value: sessionVolume,
          date: session.date,
          previousValue: maxVolume?.value,
          sets: completedSets
        };
      }
      
      // Check for estimated 1RM PR
      const best1RM = completedSets.reduce((best, current) => {
        const current1RM = calculate1RM(current.weightKg, current.reps);
        const best1RM = calculate1RM(best.weightKg, best.reps);
        return current1RM > best1RM ? current : best;
      });
      
      const estimated1RMValue = calculate1RM(best1RM.weightKg, best1RM.reps);
      
      if (!estimated1RM || estimated1RMValue > estimated1RM.value) {
        estimated1RM = {
          type: '1rm',
          value: estimated1RMValue,
          date: session.date,
          previousValue: estimated1RM?.value,
          sets: [best1RM]
        };
      }
    });
    
    allPRs[exerciseId] = {
      maxWeight,
      maxReps,
      maxVolume,
      estimated1RM,
      lastWorkout
    };
    
  });
  
  return allPRs;
};

// Check if a new workout achieved any PRs
export const checkForNewPRs = (
  exerciseId: string,
  newSets: ExerciseSet[],
  existingPRs: ExercisePRs
): PersonalRecord[] => {
  const completedSets = newSets.filter(set => set.isCompleted && set.weightKg > 0 && set.reps > 0);
  if (completedSets.length === 0) return [];
  
  const newPRs: PersonalRecord[] = [];
  const today = new Date().toISOString().split('T')[0];
  const currentPRs = existingPRs[exerciseId];
  
  // Check weight PR
  const heaviestSet = completedSets.reduce((heaviest, current) => 
    current.weightKg > heaviest.weightKg ? current : heaviest
  );
  
  if (!currentPRs?.maxWeight || heaviestSet.weightKg > currentPRs.maxWeight.value) {
    console.log(`🏆 NEW WEIGHT PR! ${exerciseId}: ${heaviestSet.weightKg}kg (was ${currentPRs?.maxWeight?.value || 'no previous record'})`);
    newPRs.push({
      type: 'weight',
      value: heaviestSet.weightKg,
      date: today,
      previousValue: currentPRs?.maxWeight?.value,
      sets: [heaviestSet]
    });
  }
  
  // Check rep PR
  const mostRepsSet = completedSets.reduce((most, current) => 
    current.reps > most.reps ? current : most
  );
  
  if (!currentPRs?.maxReps || mostRepsSet.reps > currentPRs.maxReps.value) {
    newPRs.push({
      type: 'reps',
      value: mostRepsSet.reps,
      date: today,
      previousValue: currentPRs?.maxReps?.value,
      sets: [mostRepsSet]
    });
  }
  
  // Check volume PR
  const sessionVolume = calculateWorkoutVolume(completedSets);
  
  if (!currentPRs?.maxVolume || sessionVolume > currentPRs.maxVolume.value) {
    newPRs.push({
      type: 'volume',
      value: sessionVolume,
      date: today,
      previousValue: currentPRs?.maxVolume?.value,
      sets: completedSets
    });
  }
  
  // Check 1RM PR
  const best1RM = completedSets.reduce((best, current) => {
    const current1RM = calculate1RM(current.weightKg, current.reps);
    const best1RM = calculate1RM(best.weightKg, best.reps);
    return current1RM > best1RM ? current : best;
  });
  
  const estimated1RMValue = calculate1RM(best1RM.weightKg, best1RM.reps);
  
  if (!currentPRs?.estimated1RM || estimated1RMValue > currentPRs.estimated1RM.value) {
    newPRs.push({
      type: '1rm',
      value: estimated1RMValue,
      date: today,
      previousValue: currentPRs?.estimated1RM?.value,
      sets: [best1RM]
    });
  }
  
  return newPRs;
};

// Show PR achievement notification
export const showPRNotification = (exerciseName: string, prs: PersonalRecord[]): void => {
  if (prs.length === 0) return;
  
  // Haptic feedback for celebration
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  const formatPR = (pr: PersonalRecord): string => {
    switch (pr.type) {
      case 'weight':
        const improvement = pr.previousValue ? `(+${(pr.value - pr.previousValue).toFixed(1)}kg)` : '';
        return `🏋️ Weight PR: ${pr.value}kg ${improvement}`;
      case 'reps':
        const repImprovement = pr.previousValue ? `(+${pr.value - pr.previousValue} reps)` : '';
        return `🔥 Rep PR: ${pr.value} reps ${repImprovement}`;
      case 'volume':
        const volumeImprovement = pr.previousValue ? `(+${(pr.value - pr.previousValue).toFixed(1)}kg)` : '';
        return `💪 Volume PR: ${pr.value.toFixed(1)}kg ${volumeImprovement}`;
      case '1rm':
        const rmImprovement = pr.previousValue ? `(+${(pr.value - pr.previousValue).toFixed(1)}kg)` : '';
        return `👑 Est. 1RM PR: ${pr.value.toFixed(1)}kg ${rmImprovement}`;
      default:
        return '';
    }
  };
  
  if (prs.length === 1) {
    Alert.alert(
      '🎉 New Personal Record!',
      `${exerciseName}\n\n${formatPR(prs[0])}\n\nAmazing work! Keep pushing those limits! 💪`,
      [{ text: 'Hell Yeah! 🔥', style: 'default' }]
    );
  } else {
    const prList = prs.map(formatPR).join('\n');
    Alert.alert(
      '🔥 MULTIPLE PRS!',
      `${exerciseName}\n\n${prList}\n\nYou're absolutely crushing it! This is incredible progress! 🚀`,
      [{ text: 'LET\'S GO! 🎯', style: 'default' }]
    );
  }
};

// Get suggestions for beating previous workout
export const getBeatLastWorkoutSuggestions = (
  exerciseId: string,
  currentPRs: ExercisePRs
): string[] => {
  const suggestions: string[] = [];
  const exercisePRs = currentPRs[exerciseId];
  
  if (!exercisePRs?.lastWorkout) {
    suggestions.push('💪 First time doing this exercise - establish your baseline!');
    return suggestions;
  }
  
  const lastSets = exercisePRs.lastWorkout.sets.filter(set => 
    set.isCompleted && set.weightKg > 0 && set.reps > 0
  );
  
  if (lastSets.length === 0) {
    suggestions.push('🎯 Beat your previous attempt - focus on completing all sets!');
    return suggestions;
  }
  
  const bestLastSet = getBestSet(lastSets);
  if (bestLastSet) {
    // Suggest weight increase
    const suggestedWeight = Math.round((bestLastSet.weightKg + 2.5) * 2) / 2; // Round to nearest 0.5
    const currentWeight = Math.round(bestLastSet.weightKg * 2) / 2; // Round to nearest 0.5
    suggestions.push(`🏋️ Try ${suggestedWeight}kg (was ${currentWeight}kg)`);
    
    // Suggest rep increase
    if (bestLastSet.reps < 12) {
      suggestions.push(`🔥 Try ${bestLastSet.reps + 1} reps (was ${bestLastSet.reps})`);
    }
    
    // Suggest volume increase
    const lastVolume = calculateWorkoutVolume(lastSets);
    suggestions.push(`💪 Beat ${Math.round(lastVolume)}kg total volume`);
  }
  
  return suggestions;
};

// Format PR for display
export const formatPRDisplay = (pr: PersonalRecord): string => {
  switch (pr.type) {
    case 'weight':
      return `${pr.value}kg`;
    case 'reps':
      return `${pr.value} reps`;
    case 'volume':
      return `${pr.value.toFixed(1)}kg`;
    case '1rm':
      return `${pr.value.toFixed(1)}kg (est)`;
    default:
      return '';
  }
};

// Get PR trend (improving, declining, stable)
export const getPRTrend = (exerciseId: string, exerciseLogs: ExerciseLogs, prType: 'weight' | 'volume' | '1rm' = 'weight'): 'up' | 'down' | 'stable' => {
  const sessions = exerciseLogs[exerciseId];
  if (!sessions || sessions.length < 2) return 'stable';
  
  // Get last 3 workouts
  const recentSessions = sessions.slice(-3).filter(s => 
    s.sets && s.sets.some(set => set.isCompleted && set.weightKg > 0 && set.reps > 0)
  );
  
  if (recentSessions.length < 2) return 'stable';
  
  const values = recentSessions.map(session => {
    const completedSets = session.sets.filter(set => set.isCompleted && set.weightKg > 0 && set.reps > 0);
    switch (prType) {
      case 'weight':
        return Math.max(...completedSets.map(s => s.weightKg));
      case 'volume':
        return calculateWorkoutVolume(completedSets);
      case '1rm':
        const bestSet = getBestSet(completedSets);
        return bestSet ? calculate1RM(bestSet.weightKg, bestSet.reps) : 0;
      default:
        return 0;
    }
  });
  
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  
  if (latest > previous * 1.05) return 'up'; // 5% improvement threshold
  if (latest < previous * 0.95) return 'down'; // 5% decline threshold
  return 'stable';
};
