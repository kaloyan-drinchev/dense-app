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
    thumbnail: `${BASE_THUMBNAIL_URL}Cable%20Triceps%20Pushdown.mov`,
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
};

/**
 * Get media URLs for an exercise by name
 * Returns default image if exercise not found
 */
export function getExerciseMedia(exerciseName: string): { thumbnail: string; video?: string } {
  const media = exerciseMediaMap[exerciseName];
  if (media) {
    return media;
  }
  // Return default image for exercises without custom media
  return {
    thumbnail: DEFAULT_IMAGE
  };
}
