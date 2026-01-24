/**
 * Exercise Media Mapping
 * Maps exercise names to their thumbnail and video URLs in Supabase storage
 */

const BASE_THUMBNAIL_URL = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/';
const BASE_VIDEO_URL = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/';
const DEFAULT_IMAGE = `${BASE_THUMBNAIL_URL}default-image.jpg`;

export const exerciseMediaMap: Record<string, { thumbnail: string; video?: string }> = {
  'Arnold Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}Arnold%20Press.jpg`,
    video: `${BASE_VIDEO_URL}Arnold%20Press.mov`
  },
  'Barbell Bench Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}Barbell%20Bench%20press.jpg`,
    video: `${BASE_VIDEO_URL}Barbell%20bench%20press.mov`
  },
  'Incline Barbell Bench Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}Barbell%20incline%20bench%20press.jpg`,
    video: `${BASE_VIDEO_URL}Barbell%20incline%20bench%20press.mov`
  },
  'Bulgarian Split Squats': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bulgarian%20Split%20Squat%20Smith%20Machine_.jpg`,
    video: `${BASE_VIDEO_URL}Bulgarian%20Split%20Squat%20Smith%20Machine_.mov`
  },
  'Cable Flyes': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20chest%20fly_.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20chest%20fly_.mov`
  },
  'Face Pulls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Face%20Pulls.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20Face%20Pulls.mov`
  },
  'Lateral Raises': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Lateral%20Raise.jpg`
  },
  'Overhead Tricep Extension': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Triceps%20Overhead%20Extension.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20Triceps%20Overhead%20Extension.mov`
  },
  'Tricep Pushdowns': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Triceps%20Pushdown.PNG`,
    video: `${BASE_VIDEO_URL}Cable%20Triceps%20Pushdown.mov`
  },
  'Calf Raises': {
    thumbnail: `${BASE_THUMBNAIL_URL}Calve%20Raises%20Smith%20Machine_.jpg`,
    video: `${BASE_VIDEO_URL}Calve%20Raises%20Smith%20Machine_.mov`
  },
  'Seated Calf Raises': {
    thumbnail: `${BASE_THUMBNAIL_URL}Calve%20Raises%20Smith%20Machine_.jpg`,
    video: `${BASE_VIDEO_URL}Calve%20Raises%20Smith%20Machine_.mov`
  },
  'Front Raises': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20Front%20Shoulder%20Raise.jpg`,
    video: `${BASE_VIDEO_URL}DB%20Front%20Shoulder%20Raise.mov`
  },
  'Incline Dumbbell Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20incline%20chest%20press.jpg`,
    video: `${BASE_VIDEO_URL}DB%20incline%20Chest%20press.mov`
  },
  'Rear Delt Flyes': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20Rear%20Delt%20Fly%20Prone_.jpg`,
    video: `${BASE_VIDEO_URL}DB%20Rear%20Delt%20Fly%20Prone_.mov`
  },
  'Dumbbell Shoulder Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20shoulder%20press.jpg`,
    video: `${BASE_VIDEO_URL}DB%20shoulder%20press.mov`
  },
  'Deadlift': {
    thumbnail: `${BASE_THUMBNAIL_URL}Deadlift%20BB.jpg`,
    video: `${BASE_VIDEO_URL}Deadlift%20BB.mov`
  },
  'Leg Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Hamstring%20Curls%20Machine.jpg`,
    video: `${BASE_VIDEO_URL}Hamstring%20Curls%20Machine.mov`
  },
  'Seated Leg Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Hamstring%20Curls%20Machine.jpg`,
    video: `${BASE_VIDEO_URL}Hamstring%20Curls%20Machine.mov`
  },
  'Leg Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}Leg%20Extension%20Machine.jpg`,
    video: `${BASE_VIDEO_URL}Leg%20Extension%20Machine.mov`
  },
  'Walking Lunges': {
    thumbnail: `${BASE_THUMBNAIL_URL}Legs%20DB%20Walking%20Lunges.jpg`,
    video: `${BASE_VIDEO_URL}Legs%20DB%20Walking%20Lunges.mov`
  },
  'Legs DB Walking Lunges': {
    thumbnail: `${BASE_THUMBNAIL_URL}Legs%20DB%20Walking%20Lunges.jpg`,
    video: `${BASE_VIDEO_URL}Legs%20DB%20Walking%20Lunges.mov`
  },
  'DB Bench Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20incline%20chest%20press.jpg`, 
    video: `${BASE_VIDEO_URL}DB%20incline%20Chest%20press.mov`
  },
  'Dumbbell Bench Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}Barbell%20Bench%20press.jpg`, 
    video: `${BASE_VIDEO_URL}Barbell%20bench%20press.mov`
  },
  'Cable Lateral Raise': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Lateral%20Raise.jpg`
  },
  'Lateral Raises Machine': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Lateral%20Raise.jpg`
  },
  'Z Bar Bicep Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bicep%20-%20Z%20bar%20Bicep%20Curls.png`,
    video: `${BASE_VIDEO_URL}Bicep%20-%20Z%20bar%20Bicep%20Curls.mov`
  },
  'DB Bicep Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bicep%20Curls%20DB.png`,
    video: `${BASE_VIDEO_URL}Bicep%20Curls%20DB.mov`
  },
  'Dumbbell Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bicep%20Curls%20DB.png`,
    video: `${BASE_VIDEO_URL}Bicep%20Curls%20DB.mov`
  },
  'Preacher Curls Z Bar': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bicep%20-%20Preacher%20curls%20Z%20bar.png`,
    video: `${BASE_VIDEO_URL}Bicep%20-%20Preacher%20curls%20Z%20bar.mov`
  },
  'Hammer Curls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bicep-%20Hammer%20Curls.png`,
    video: `${BASE_VIDEO_URL}Bicep-Hammer%20Curls.mov`
  },
  'Leg Extension Machine': {
    thumbnail: `${BASE_THUMBNAIL_URL}Leg%20Extension%20Machine.jpg`,
    video: `${BASE_VIDEO_URL}Leg%20Extension%20Machine.mov`
  },
  'DB Incline Chest Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20incline%20chest%20press.jpg`,
    video: `${BASE_VIDEO_URL}DB%20incline%20Chest%20press.mov`
  },
  'Cable Chest Fly': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20chest%20fly_.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20chest%20fly_.mov`
  },
  'Cable Triceps Pushdown': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Triceps%20Pushdown.PNG`,
    video: `${BASE_VIDEO_URL}Cable%20Triceps%20Pushdown.mov`
  },
  'Cable Triceps Overhead Extension': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Triceps%20Overhead%20Extension.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20Triceps%20Overhead%20Extension.mov`
  },
  'Deadlift BB': {
    thumbnail: `${BASE_THUMBNAIL_URL}Deadlift%20BB.jpg`,
    video: `${BASE_VIDEO_URL}Deadlift%20BB.mov`
  },
  'Cable Face Pulls': {
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Face%20Pulls.jpg`,
    video: `${BASE_VIDEO_URL}Cable%20Face%20Pulls.mov`
  },
  'DB Rear Delt Fly Prone': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20Rear%20Delt%20Fly%20Prone_.jpg`,
    video: `${BASE_VIDEO_URL}DB%20Rear%20Delt%20Fly%20Prone_.mov`
  },
  'Bulgarian Split Squat Smith Machine': {
    thumbnail: `${BASE_THUMBNAIL_URL}Bulgarian%20Split%20Squat%20Smith%20Machine_.jpg`,
    video: `${BASE_VIDEO_URL}Bulgarian%20Split%20Squat%20Smith%20Machine_.mov`
  },
  'Hamstring Curls Machine': {
    thumbnail: `${BASE_THUMBNAIL_URL}Hamstring%20Curls%20Machine.jpg`,
    video: `${BASE_VIDEO_URL}Hamstring%20Curls%20Machine.mov`
  },
  'Calve Raises Smith Machine': {
    thumbnail: `${BASE_THUMBNAIL_URL}Calve%20Raises%20Smith%20Machine_.jpg`,
    video: `${BASE_VIDEO_URL}Calve%20Raises%20Smith%20Machine_.mov`
  },
  'DB Shoulder Press': {
    thumbnail: `${BASE_THUMBNAIL_URL}DB%20shoulder%20press.jpg`,
    video: `${BASE_VIDEO_URL}DB%20shoulder%20press.mov`
  },
};

/**
 * Get media URLs for an exercise by name
 * Returns default image if exercise not found
 * Performs case-insensitive matching
 */
export function getExerciseMedia(exerciseName: string): { thumbnail: string; video?: string } {
  // First, try exact match
  let media = exerciseMediaMap[exerciseName];
  if (media) {
    return media;
  }

  // Try case-insensitive match
  const normalizedName = exerciseName.toLowerCase().trim();
  const matchingKey = Object.keys(exerciseMediaMap).find(
    key => key.toLowerCase().trim() === normalizedName
  );

  if (matchingKey) {
    media = exerciseMediaMap[matchingKey];
    if (media) {
      return media;
    }
  }

  // Return default image for exercises without custom media
  // console.warn(`⚠️ [ExerciseMedia] No media found for: "${exerciseName}"`);
  return {
    thumbnail: DEFAULT_IMAGE
  };
}
