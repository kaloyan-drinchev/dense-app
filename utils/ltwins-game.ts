// L Twins Guessing Game Logic and Points Management
import { userProfileService } from '@/db/services';
import { getLTwinsData, hasLTwinsData } from '@/constants/ltwins-data';

// Re-export for convenience
export { getLTwinsData, hasLTwinsData } from '@/constants/ltwins-data';

export interface LTwinsGuess {
  sets: number;
  reps: number;
  weight: number;
}

export interface LTwinsGameResult {
  isCorrect: boolean;
  pointsEarned: number;
  totalPoints: number;
  feedback: {
    type: 'correct' | 'close' | 'wayoff';
    message: string;
  };
}

export interface LTwinsPointsHistory {
  timestamp: string;
  exerciseName: string;
  pointsEarned: number;
  guess: LTwinsGuess;
  actual: LTwinsGuess;
}

const MAX_POINTS = 1000;
const PERFECT_SCORE_POINTS = 10;

/**
 * Calculate accuracy percentage for a single field
 */
function calculateAccuracy(guess: number, actual: number): number {
  if (actual === 0) return guess === 0 ? 100 : 0;
  
  const diff = Math.abs(guess - actual);
  const percentOff = (diff / actual) * 100;
  
  // Perfect match = 100%, within 5% = 90%, within 10% = 80%, etc.
  if (percentOff === 0) return 100;
  if (percentOff <= 5) return 90;
  if (percentOff <= 10) return 80;
  if (percentOff <= 15) return 70;
  if (percentOff <= 20) return 60;
  if (percentOff <= 30) return 50;
  return Math.max(0, 50 - percentOff);
}

/**
 * Calculate total accuracy and points earned
 */
export function calculateGuessScore(
  guess: LTwinsGuess,
  actual: LTwinsGuess
): { totalAccuracy: number; pointsEarned: number } {
  // Calculate accuracy for each field
  const setsAccuracy = calculateAccuracy(guess.sets, actual.sets);
  const repsAccuracy = calculateAccuracy(guess.reps, actual.reps);
  const weightAccuracy = calculateAccuracy(guess.weight, actual.weight);

  // Average accuracy across all three fields
  const totalAccuracy = (setsAccuracy + repsAccuracy + weightAccuracy) / 3;

  // Calculate points (max 10 points per guess)
  const pointsEarned = Math.round((totalAccuracy / 100) * PERFECT_SCORE_POINTS);

  return { totalAccuracy, pointsEarned };
}

/**
 * Get feedback message based on accuracy
 */
export function getFeedback(totalAccuracy: number, pointsEarned: number): {
  type: 'correct' | 'close' | 'wayoff';
  message: string;
} {
  if (totalAccuracy === 100) {
    return {
      type: 'correct',
      message: `🎯 PERFECT! You nailed it! +${pointsEarned} points!`,
    };
  } else if (totalAccuracy >= 70) {
    return {
      type: 'close',
      message: `🔥 Close! +${pointsEarned} points. Try again?`,
    };
  } else {
    return {
      type: 'wayoff',
      message: `💪 Way off! +${pointsEarned} points. Keep training!`,
    };
  }
}

/**
 * Process a user's guess and update their points
 */
export async function processLTwinsGuess(
  userId: string,
  exerciseName: string,
  guess: LTwinsGuess
): Promise<LTwinsGameResult> {
  try {
    // Get actual L Twins data for this exercise
    const actualData = getLTwinsData(exerciseName);
    const actual: LTwinsGuess = {
      sets: actualData.sets,
      reps: actualData.reps,
      weight: actualData.weight,
    };

    // Calculate score
    const { totalAccuracy, pointsEarned } = calculateGuessScore(guess, actual);
    const feedback = getFeedback(totalAccuracy, pointsEarned);
    const isCorrect = totalAccuracy === 100;

    // Get current user points
    const currentUser = await userProfileService.getById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const currentPoints = currentUser.ltwinsPoints || 0;
    const newTotalPoints = Math.min(currentPoints + pointsEarned, MAX_POINTS);

    // Update points history
    let pointsHistory: LTwinsPointsHistory[] = [];
    if (currentUser.ltwinsPointsHistory) {
      try {
        pointsHistory = JSON.parse(currentUser.ltwinsPointsHistory);
      } catch {
        pointsHistory = [];
      }
    }

    // Add new entry to history
    pointsHistory.push({
      timestamp: new Date().toISOString(),
      exerciseName,
      pointsEarned,
      guess,
      actual,
    });

    // Keep only last 100 entries to avoid bloat
    if (pointsHistory.length > 100) {
      pointsHistory = pointsHistory.slice(-100);
    }

    // Update database
    await userProfileService.update(userId, {
      ltwinsPoints: newTotalPoints,
      ltwinsPointsHistory: JSON.stringify(pointsHistory),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ L Twins guess processed: +${pointsEarned} points (Total: ${newTotalPoints}/${MAX_POINTS})`);

    return {
      isCorrect,
      pointsEarned,
      totalPoints: newTotalPoints,
      feedback,
    };
  } catch (error) {
    console.error('❌ Failed to process L Twins guess:', error);
    throw error;
  }
}

/**
 * Get user's current L Twins points
 */
export async function getUserLTwinsPoints(userId: string): Promise<number> {
  try {
    const user = await userProfileService.getById(userId);
    return user?.ltwinsPoints || 0;
  } catch (error) {
    console.error('❌ Failed to get user L Twins points:', error);
    return 0;
  }
}

/**
 * Get user's L Twins points history
 */
export async function getUserLTwinsPointsHistory(
  userId: string
): Promise<LTwinsPointsHistory[]> {
  try {
    const user = await userProfileService.getById(userId);
    if (!user?.ltwinsPointsHistory) return [];
    
    return JSON.parse(user.ltwinsPointsHistory);
  } catch (error) {
    console.error('❌ Failed to get user L Twins points history:', error);
    return [];
  }
}

/**
 * Check if L Twins game is enabled for user
 */
export async function isLTwinsGameEnabled(userId: string): Promise<boolean> {
  try {
    const user = await userProfileService.getById(userId);
    return user?.ltwinsGameEnabled === 1;
  } catch (error) {
    console.error('❌ Failed to check L Twins game status:', error);
    return true; // Default to enabled
  }
}

/**
 * Toggle L Twins game on/off for user
 */
export async function toggleLTwinsGame(userId: string, enabled: boolean): Promise<void> {
  try {
    await userProfileService.update(userId, {
      ltwinsGameEnabled: enabled ? 1 : 0,
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ L Twins game ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to toggle L Twins game:', error);
    throw error;
  }
}

/**
 * Get chart data for points history (for visualization)
 */
export function getPointsChartData(history: LTwinsPointsHistory[]): {
  labels: string[];
  data: number[];
  cumulativePoints: number[];
} {
  if (history.length === 0) {
    return { labels: [], data: [], cumulativePoints: [] };
  }

  const labels: string[] = [];
  const data: number[] = [];
  const cumulativePoints: number[] = [];
  let runningTotal = 0;

  // Take last 10 entries for chart
  const recentHistory = history.slice(-10);

  recentHistory.forEach((entry, index) => {
    const date = new Date(entry.timestamp);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    
    labels.push(label);
    data.push(entry.pointsEarned);
    
    runningTotal += entry.pointsEarned;
    cumulativePoints.push(runningTotal);
  });

  return { labels, data, cumulativePoints };
}

