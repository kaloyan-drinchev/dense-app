// Use the new centralized exercise media map
import { getExerciseMedia } from '@/lib/exercise-media-map';

export const getExerciseVideoUrl = (exerciseName: string): string => {
  const media = getExerciseMedia(exerciseName);
  return media.video || 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/placeholder.mp4';
};

export const getExerciseThumbnailUrl = (exerciseName: string): string => {
  const media = getExerciseMedia(exerciseName);
  return media.thumbnail;
};
