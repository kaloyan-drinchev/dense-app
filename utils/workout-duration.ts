/**
 * Ensures workout duration is within acceptable range (45-60 minutes)
 * Simple fix for legacy workouts with too short durations
 */
export const ensureMinimumDuration = (duration?: number): number => {
  if (!duration || duration < 45) {
    return 45; // Set minimum to 45 minutes
  } else if (duration > 60) {
    return 60; // Cap at 60 minutes
  }
  
  return duration;
};
