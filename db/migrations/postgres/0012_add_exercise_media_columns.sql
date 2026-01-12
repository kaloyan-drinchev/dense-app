-- Add thumbnail_url and video_url columns to exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.exercises.thumbnail_url IS 'URL to exercise thumbnail image in Supabase storage';
COMMENT ON COLUMN public.exercises.video_url IS 'URL to exercise video in Supabase storage';
