import { useNutritionStore } from '@/store/nutrition-store';

let midnightTimer: NodeJS.Timeout | null = null;

// Calculate milliseconds until next midnight
const getMillisecondsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight
  return midnight.getTime() - now.getTime();
};

// Set up automatic logging at midnight
export const startMidnightLogger = () => {
  // Clear any existing timer
  if (midnightTimer) {
    clearTimeout(midnightTimer);
  }

  const runMidnightLog = () => {
    console.log('🕛 Running midnight auto-log check...');
    
    // Get the store and run auto-logging
    const { autoLogUnloggedMeals } = useNutritionStore.getState();
    autoLogUnloggedMeals();
    
    // Schedule next midnight check (24 hours from now)
    midnightTimer = setTimeout(runMidnightLog, 24 * 60 * 60 * 1000);
  };

  // Calculate time until next midnight and schedule first run
  const msUntilMidnight = getMillisecondsUntilMidnight();
  console.log(`🕛 Scheduling midnight auto-log in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  
  midnightTimer = setTimeout(runMidnightLog, msUntilMidnight);
};

// Stop the midnight logger
export const stopMidnightLogger = () => {
  if (midnightTimer) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
    console.log('🕛 Midnight auto-log stopped');
  }
};

// Also run auto-log check when app starts (in case app was closed at midnight)
export const checkForUnloggedMeals = () => {
  console.log('🕛 Checking for unlogged meals on app start...');
  const { autoLogUnloggedMeals } = useNutritionStore.getState();
  autoLogUnloggedMeals();
};
