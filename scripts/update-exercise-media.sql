-- Update exercises with video URLs and thumbnail URLs
-- Base URLs for Supabase storage
-- https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/
-- https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/

-- First, set default image for all exercises
UPDATE public.exercises
SET 
  thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/default-image.jpg',
  video_url = NULL
WHERE thumbnail_url IS NULL OR thumbnail_url = '';

-- Update exercises with actual media
UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Arnold%20Press.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Arnold%20Press.mov' WHERE name = 'Arnold Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Barbell%20Bench%20press.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Barbell%20bench%20press.mov' WHERE name = 'Barbell Bench Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Barbell%20incline%20bench%20press.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Barbell%20incline%20bench%20press.mov' WHERE name = 'Incline Barbell Bench Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Bulgarian%20Split%20Squat%20Smith%20Machine_.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Bulgarian%20Split%20Squat%20Smith%20Machine_.mov' WHERE name = 'Bulgarian Split Squats';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Cable%20chest%20fly_.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Cable%20chest%20fly_.mov' WHERE name = 'Cable Flyes';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Cable%20Face%20Pulls.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Cable%20Face%20Pulls.mov' WHERE name = 'Face Pulls';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Cable%20Lateral%20Raise.jpg' WHERE name = 'Lateral Raises';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Cable%20Triceps%20Overhead%20Extension.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Cable%20Triceps%20Overhead%20Extension.mov' WHERE name = 'Overhead Tricep Extension';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Cable%20Triceps%20Pushdown.mov', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Cable%20Triceps%20Pushdown.mov' WHERE name = 'Tricep Pushdowns';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Calve%20Raises%20Smith%20Machine_.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Calve%20Raises%20Smith%20Machine_.mov' WHERE name = 'Calf Raises';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/DB%20Front%20Shoulder%20Raise.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/DB%20Front%20Shoulder%20Raise.mov' WHERE name = 'Front Raises';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/DB%20incline%20chest%20press.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/DB%20incline%20Chest%20press.mov' WHERE name = 'Incline Dumbbell Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/DB%20Rear%20Delt%20Fly%20Prone_.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/DB%20Rear%20Delt%20Fly%20Prone_.mov' WHERE name = 'Rear Delt Flyes';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/DB%20shoulder%20press.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/DB%20shoulder%20press.mov' WHERE name = 'Dumbbell Shoulder Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Deadlift%20BB.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Deadlift%20BB.mov' WHERE name = 'Deadlift';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Hamstring%20Curls%20Machine.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Hamstring%20Curls%20Machine.mov' WHERE name IN ('Leg Curls', 'Seated Leg Curls');

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Leg%20Extension%20Machine.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Leg%20Extension%20Machine.mov' WHERE name = 'Leg Press';

UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Legs%20DB%20Walking%20Lunges.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Legs%20DB%20Walking%20Lunges.mov' WHERE name = 'Walking Lunges';

-- Update Seated Calf Raises to use same image as Calf Raises
UPDATE public.exercises SET thumbnail_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-thumbnails/Calve%20Raises%20Smith%20Machine_.jpg', video_url = 'https://eiihwogvlqiegnqjcidr.supabase.co/storage/v1/object/public/exercise-videos/Calve%20Raises%20Smith%20Machine_.mov' WHERE name = 'Seated Calf Raises';
