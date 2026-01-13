-- ============================================
-- Disable RLS for Custom Auth
-- ============================================
-- Since the app uses custom auth (user_profiles, not auth.users),
-- we need to disable RLS on workout tables.
-- Security is handled at the application layer.

-- Disable RLS on all workout-related tables
ALTER TABLE public.workout_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they are no longer needed)
DROP POLICY IF EXISTS "Users can read system templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can read template exercises" ON public.template_exercises;
DROP POLICY IF EXISTS "Users can read own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can manage own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can read own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can manage own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can read own session sets" ON public.session_sets;
DROP POLICY IF EXISTS "Users can manage own session sets" ON public.session_sets;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS disabled for custom auth. Security handled at application layer.';
END $$;
