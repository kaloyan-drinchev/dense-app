// URLs hosted on Supabase Storage
// Replace with your actual Supabase project URL  
const SUPABASE_VIDEO_BASE_URL = "https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/";
const SUPABASE_THUMBNAIL_BASE_URL = "https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/";

export const getExerciseVideoUrl = (exerciseName: string): string => {
  // Convert exercise name to key format (lowercase, spaces to hyphens)
  const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '-');
  
  // Get video filename from mapping, fallback to barbell bench press
  const videoFileName = EXERCISE_VIDEO_MAP[exerciseKey] || 'barbell-bench-press.mp4';
  
  // Supabase Storage URL format: 
  // https://project.supabase.co/storage/v1/object/public/bucket/filename
  const fullUrl = `${SUPABASE_VIDEO_BASE_URL}${videoFileName}`;
  
  return fullUrl;
};

export const getExerciseThumbnailUrl = (exerciseName: string): string => {
  // Convert exercise name to key format (lowercase, spaces to hyphens)
  const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '-');
  
  // Get thumbnail filename from mapping, fallback to barbell bench press
  const thumbnailFileName = EXERCISE_THUMBNAIL_MAP[exerciseKey] || 'barbell-bench-press.png';
  
  // Supabase Storage URL format: 
  // https://project.supabase.co/storage/v1/object/public/bucket/filename
  const fullUrl = `${SUPABASE_THUMBNAIL_BASE_URL}${thumbnailFileName}`;
  
  return fullUrl;
};

// Exercise video mapping - Update this as you add new videos
export const EXERCISE_VIDEO_MAP: Record<string, string> = {
  // ✅ COMPLETED VIDEOS
  'barbell-bench-press': 'barbell-bench-press.mp4',
  
  // 🔄 PHASE 1: Core Compounds (Priority)
  'back-squat': 'barbell-bench-press.mp4', // TODO: Replace with back-squat.mp4
  'conventional-deadlift': 'barbell-bench-press.mp4', // TODO: Replace with conventional-deadlift.mp4
  'overhead-barbell-press': 'barbell-bench-press.mp4', // TODO: Replace with overhead-barbell-press.mp4
  'barbell-rows': 'barbell-bench-press.mp4', // TODO: Replace with barbell-rows.mp4
  'pull-ups': 'barbell-bench-press.mp4', // TODO: Replace with pull-ups.mp4
  'romanian-deadlift': 'barbell-bench-press.mp4', // TODO: Replace with romanian-deadlift.mp4
  'dumbbell-bench-press': 'barbell-bench-press.mp4', // TODO: Replace with dumbbell-bench-press.mp4
  
  // 🔄 PHASE 2: Popular Isolation (Add as you create videos)
  'lateral-raises': 'barbell-bench-press.mp4', // TODO: Replace with lateral-raises.mp4
  'dumbbell-bicep-curls': 'barbell-bench-press.mp4', // TODO: Replace with dumbbell-bicep-curls.mp4
  'tricep-pushdowns': 'barbell-bench-press.mp4', // TODO: Replace with tricep-pushdowns.mp4
  'leg-press': 'barbell-bench-press.mp4', // TODO: Replace with leg-press.mp4
  'lat-pulldowns': 'barbell-bench-press.mp4', // TODO: Replace with lat-pulldowns.mp4
  'cable-flyes': 'barbell-bench-press.mp4', // TODO: Replace with cable-flyes.mp4
  
  // 🔄 ALL OTHER EXERCISES (All use placeholder for now)
  // Add new videos here as you create them
};

// Exercise thumbnail mapping - Update this as you add new thumbnails
export const EXERCISE_THUMBNAIL_MAP: Record<string, string> = {
  // ✅ COMPLETED THUMBNAILS
  'barbell-bench-press': 'barbell-bench-press.png',
  
  // 🔄 PHASE 1: Core Compounds (Priority)
  'back-squat': 'barbell-bench-press.png', // TODO: Replace with back-squat.png
  'conventional-deadlift': 'barbell-bench-press.png', // TODO: Replace with conventional-deadlift.png
  'overhead-barbell-press': 'barbell-bench-press.png', // TODO: Replace with overhead-barbell-press.png
  'barbell-rows': 'barbell-bench-press.png', // TODO: Replace with barbell-rows.png
  'pull-ups': 'barbell-bench-press.png', // TODO: Replace with pull-ups.png
  'romanian-deadlift': 'barbell-bench-press.png', // TODO: Replace with romanian-deadlift.png
  'dumbbell-bench-press': 'barbell-bench-press.png', // TODO: Replace with dumbbell-bench-press.png
  
  // 🔄 PHASE 2: Popular Isolation (Add as you create thumbnails)
  'lateral-raises': 'barbell-bench-press.png', // TODO: Replace with lateral-raises.png
  'dumbbell-bicep-curls': 'barbell-bench-press.png', // TODO: Replace with dumbbell-bicep-curls.png
  'tricep-pushdowns': 'barbell-bench-press.png', // TODO: Replace with tricep-pushdowns.png
  'leg-press': 'barbell-bench-press.png', // TODO: Replace with leg-press.png
  'lat-pulldowns': 'barbell-bench-press.png', // TODO: Replace with lat-pulldowns.png
  'cable-flyes': 'barbell-bench-press.png', // TODO: Replace with cable-flyes.png
  
  // 🔄 ALL OTHER EXERCISES (All use placeholder for now)
  // Add new thumbnails here as you create them
};
