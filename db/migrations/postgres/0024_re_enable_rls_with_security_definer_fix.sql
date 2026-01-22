-- ============================================
-- Re-enable RLS for Workout Tables
-- ============================================
-- This migration re-enables RLS that was disabled in 0022
-- Policies work correctly with SECURITY DEFINER functions

-- Re-enable RLS on all workout tables
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS re-enabled for workout tables';
  RAISE NOTICE '✅ Security restored - users can only access their own workout data';
  RAISE NOTICE '✅ SECURITY DEFINER functions bypass RLS correctly';
END $$;
