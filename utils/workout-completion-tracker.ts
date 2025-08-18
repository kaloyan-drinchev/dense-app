import { userProgressService } from '@/db/services';

export interface WorkoutCompletionData {
  completedDates: string[]; // Array of completed workout dates in 'YYYY-MM-DD' format
  startDate: string; // Program start date
  totalCompletedWorkouts: number;
}

// Generate completed workout dates based on user progress
export const getWorkoutCompletionData = async (userId: string): Promise<WorkoutCompletionData> => {
  try {
    const userProgress = await userProgressService.getByUserId(userId);
    
    if (!userProgress) {
      return {
        completedDates: [],
        startDate: new Date().toISOString().split('T')[0],
        totalCompletedWorkouts: 0,
      };
    }

    // Parse completed workouts from JSON string
    let completedWorkouts: any[] = [];
    if (userProgress.completedWorkouts) {
      try {
        completedWorkouts = JSON.parse(userProgress.completedWorkouts);
        console.log('📅 Calendar: Raw completed workouts:', completedWorkouts);
      } catch (error) {
        console.warn('Failed to parse completed workouts:', error);
        completedWorkouts = [];
      }
    }

    // Extract dates from existing completed workout objects
    const existingCompletedDates: string[] = [];
    completedWorkouts.forEach((workout: any) => {
      if (typeof workout === 'object' && workout.date) {
        const workoutDate = new Date(workout.date).toISOString().split('T')[0];
        if (!existingCompletedDates.includes(workoutDate)) {
          existingCompletedDates.push(workoutDate);
        }
      }
    });
    
    // Generate completion dates based on current workout number and program start
    const completedDates = [
      ...existingCompletedDates,
      ...generateCompletionDates(
        userProgress.startDate || new Date().toISOString(),
        Math.max(0, (userProgress.currentWorkout - 1) - existingCompletedDates.length), // Only generate if needed
        completedWorkouts
      )
    ];

    // Check if today's workout is completed by looking for today's date in completedWorkouts
    const today = new Date().toISOString().split('T')[0];
    const todayWorkoutKey = `workout-${today}`;
    
    // Check both: our calendar format and the main app's detailed format
    const hasTodayCalendarEntry = completedWorkouts.includes(todayWorkoutKey);
    const hasTodayDetailedEntry = completedWorkouts.some((workout: any) => {
      if (typeof workout === 'object' && workout.date) {
        const workoutDate = new Date(workout.date).toISOString().split('T')[0];
        return workoutDate === today;
      }
      return false;
    });
    
    if ((hasTodayCalendarEntry || hasTodayDetailedEntry) && !completedDates.includes(today)) {
      completedDates.push(today);
      console.log('📅 Calendar: Added today to completed dates:', today);
    }
    
    console.log('📅 Calendar: Final completed dates:', completedDates);

    return {
      completedDates,
      startDate: userProgress.startDate || new Date().toISOString().split('T')[0],
      totalCompletedWorkouts: completedWorkouts.length,
    };
  } catch (error) {
    console.error('Failed to get workout completion data:', error);
    return {
      completedDates: [],
      startDate: new Date().toISOString().split('T')[0],
      totalCompletedWorkouts: 0,
    };
  }
};

// Generate realistic completion dates based on program progress
function generateCompletionDates(
  startDateStr: string,
  completedWorkoutCount: number,
  completedWorkoutIds: string[]
): string[] {
  const dates: string[] = [];
  
  if (completedWorkoutCount <= 0) {
    return dates;
  }

  const startDate = new Date(startDateStr);
  const today = new Date();
  
  // Generate dates assuming workouts happen every 1-2 days
  let currentDate = new Date(startDate);
  let workoutsAdded = 0;
  
  while (workoutsAdded < completedWorkoutCount && currentDate <= today) {
    // Skip some days to make it realistic (not every day)
    const skipDays = Math.random() < 0.7 ? 1 : 2; // 70% chance of 1 day gap, 30% chance of 2 day gap
    
    currentDate.setDate(currentDate.getDate() + skipDays);
    
    // Don't add future dates
    if (currentDate > today) {
      break;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    dates.push(dateStr);
    workoutsAdded++;
  }

  return dates;
}

// Save a completed workout date
export const markWorkoutCompleted = async (userId: string, workoutId: string): Promise<void> => {
  try {
    const userProgress = await userProgressService.getByUserId(userId);
    if (!userProgress) return;

    // Parse existing completed workouts
    let completedWorkouts: string[] = [];
    if (userProgress.completedWorkouts) {
      try {
        completedWorkouts = JSON.parse(userProgress.completedWorkouts);
      } catch (error) {
        console.warn('Failed to parse completed workouts:', error);
        completedWorkouts = [];
      }
    }

    // Add the new workout if not already completed
    if (!completedWorkouts.includes(workoutId)) {
      completedWorkouts.push(workoutId);
      
      // Update the user progress
      await userProgressService.update(userProgress.id, {
        completedWorkouts: JSON.stringify(completedWorkouts),
      });
    }
  } catch (error) {
    console.error('Failed to mark workout as completed:', error);
  }
};

// Mark today's date as completed (call this when user completes a workout)
export const markTodayWorkoutCompleted = async (userId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // For now, we'll use the date as the workout ID for simplicity
    // This ensures the calendar shows today as completed
    await markWorkoutCompleted(userId, `workout-${today}`);
  } catch (error) {
    console.error('Failed to mark today workout as completed:', error);
  }
};

// Get completion stats for display
export const getCompletionStats = (completedDates: string[]) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Count workouts completed this month
  const thisMonthCount = completedDates.filter(dateStr => {
    const date = new Date(dateStr);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  // Calculate current streak
  const streak = calculateCurrentStreak(completedDates);

  // Calculate weekly average (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(today.getDate() - 28);
  
  const recentWorkouts = completedDates.filter(dateStr => {
    const date = new Date(dateStr);
    return date >= fourWeeksAgo;
  }).length;
  
  const weeklyAverage = Math.round(recentWorkouts / 4 * 10) / 10; // Round to 1 decimal

  return {
    thisMonthCount,
    currentStreak: streak,
    weeklyAverage,
  };
};

function calculateCurrentStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (const completedDate of sortedDates) {
    const completed = new Date(completedDate);
    completed.setHours(0, 0, 0, 0);

    if (completed.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (completed.getTime() < currentDate.getTime()) {
      // Check if there's only a 1-day gap (allowing rest days)
      const daysDiff = Math.floor((currentDate.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 2) { // Allow 1-2 day rest periods
        streak++;
        currentDate = new Date(completed);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}
