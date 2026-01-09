-- ============================================
-- EXERCISES Table - Row Level Security
-- ============================================
-- Enable RLS on exercises table
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow everyone to READ exercises (needed for users to build custom workouts)
CREATE POLICY "Allow public read access to exercises" 
ON public.exercises 
FOR SELECT 
TO public 
USING (true);

-- No INSERT/UPDATE/DELETE policies
-- Only admins with service role key can modify exercises
-- Users can only view exercises to use in their custom workouts
