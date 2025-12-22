export interface WorkoutAvailability {
  canStartWorkout: boolean;
  isCompletedToday: boolean;
  nextAvailableDate: string | null;
  currentWorkoutName: string | null;
  nextWorkoutName: string | null;
  motivationalMessage: string;
}

/**
 * Check if user can start a workout today based on completion status
 * UPDATED: Always allows workouts - no more one workout per day restriction
 */
export const checkWorkoutAvailability = async (
  userId: string,
  generatedProgram: any,
  userProgressData: any
): Promise<WorkoutAvailability> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Import here to avoid circular dependency
    const { getWorkoutCompletionData } = await import('./workout-completion-tracker');
    const completionData = await getWorkoutCompletionData(userId);
    
    // Check if today's workout was completed (for display purposes only)
    const isCompletedToday = completionData.completedDates.includes(today);
    
    // Get current and next workout info
    const currentWorkout = getCurrentWorkout(generatedProgram, userProgressData);
    const nextWorkout = getNextWorkout(generatedProgram, userProgressData);
    
    // Always allow starting workouts - users can do multiple workouts per day
    return {
      canStartWorkout: true,
      isCompletedToday: isCompletedToday,
      nextAvailableDate: null,
      currentWorkoutName: currentWorkout?.name || null,
      nextWorkoutName: nextWorkout?.name || null,
      motivationalMessage: isCompletedToday 
        ? "Great work today! Ready for another session? 💪" 
        : "Ready to crush today's workout! 💪"
    };
  } catch (error) {
    console.error('Failed to check workout availability:', error);
    // Default to allowing workout if check fails
    return {
      canStartWorkout: true,
      isCompletedToday: false,
      nextAvailableDate: null,
      currentWorkoutName: null,
      nextWorkoutName: null,
      motivationalMessage: "Ready to workout! 💪"
    };
  }
};

/**
 * Get current workout based on progress
 */
function getCurrentWorkout(generatedProgram: any, userProgressData: any) {
  if (!generatedProgram?.weeklyStructure || !userProgressData) return null;
  
  const currentWorkoutIndex = (userProgressData.currentWorkout - 1) % generatedProgram.weeklyStructure.length;
  return generatedProgram.weeklyStructure[currentWorkoutIndex] || null;
}

/**
 * Get next workout in sequence
 */
function getNextWorkout(generatedProgram: any, userProgressData: any) {
  if (!generatedProgram?.weeklyStructure || !userProgressData) return null;
  
  // currentWorkout is already pointing to the next workout we should do
  const nextWorkoutIndex = userProgressData.currentWorkout - 1; // -1 because array is 0-indexed
  return generatedProgram.weeklyStructure[nextWorkoutIndex] || null;
}

/**
 * Get a motivational message for completed workouts
 */
function getMotivationalMessage(): string {
  const messages = [
    "🔥 Amazing work today! Your body is building strength as we speak. Come back tomorrow for more gains!",
    "💪 You crushed it today! Rest up and let those muscles grow. Tomorrow's workout will be even better!",
    "⚡ Beast mode activated! You've earned this rest. Tomorrow we continue the journey to greatness!",
    "🚀 Incredible session today! Your dedication is paying off. See you tomorrow for the next challenge!",
    "🏆 Another workout conquered! Recovery is when the magic happens. Tomorrow's workout awaits!",
    "💯 Outstanding effort today! Your future self is thanking you. Rest up, champion - tomorrow we go again!",
    "🔥 You're on fire! Today's work is done, tomorrow's gains are loading. Come back recharged and ready!",
    "⭐ Stellar performance today! Your consistency is your superpower. Tomorrow's workout will be epic!"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format date for display (e.g., "Tomorrow", "Monday", etc.)
 */
export function formatAvailabilityDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  // Normalize dates to compare only date part
  const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (normalizeDate(date).getTime() === normalizeDate(tomorrow).getTime()) {
    return 'Tomorrow';
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
}
