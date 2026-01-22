-- ============================================
-- TEMPORARY: Disable RLS for Workout Tables
-- ============================================
-- Migration 0019 broke the app by enabling RLS
-- This temporarily disables it until we can fix the policies properly
--
-- TODO: Fix RLS policies to work correctly with SECURITY DEFINER functions

-- Disable RLS on all workout tables
ALTER TABLE public.workout_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets DISABLE ROW LEVEL SECURITY;

-- Keep the policies for when we re-enable RLS later
-- (Don't drop them, just disable RLS enforcement)

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS temporarily disabled for workout tables';
  RAISE NOTICE '⚠️  Security reduced - users can access all workout data';
  RAISE NOTICE '⚠️  This is a TEMPORARY fix - proper RLS will be implemented later';
  RAISE NOTICE '✅ App should work normally now';
END $$;
