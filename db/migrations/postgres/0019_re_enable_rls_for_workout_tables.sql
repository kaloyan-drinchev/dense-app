-- ============================================
-- Re-enable RLS for Workout Tables
-- ============================================
-- This migration fixes the security misconfiguration where:
-- 1. Policies exist but RLS is disabled (causing Supabase warnings)
-- 2. Tables were using auth.users, so RLS should be enabled
--
-- The previous migration (0018) incorrectly disabled RLS claiming
-- "custom auth", but the tables actually use auth.users(id) foreign keys.

-- ============================================
-- STEP 1: Drop any orphaned policies from migration 0018
-- ============================================

-- Drop any remaining policies that might exist
DROP POLICY IF EXISTS "Users can read system templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can read template exercises" ON public.template_exercises;
DROP POLICY IF EXISTS "Users can read own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can manage own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can read own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can manage own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can read own session sets" ON public.session_sets;
DROP POLICY IF EXISTS "Users can manage own session sets" ON public.session_sets;

-- Drop all policies from migration 0013 (these might still exist)
DROP POLICY IF EXISTS "Users can read system and own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.workout_templates;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can manage own template exercises" ON public.template_exercises;
DROP POLICY IF EXISTS "Users can manage own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can read own session sets" ON public.session_sets;
DROP POLICY IF EXISTS "Users can manage own session sets" ON public.session_sets;

-- ============================================
-- STEP 2: Re-enable RLS on all workout tables
-- ============================================

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create clean, working RLS policies
-- ============================================

-- ============================================
-- WORKOUT_TEMPLATES Policies
-- ============================================
-- Users can read:
--   - System templates (user_id IS NULL)
--   - Their own templates (user_id = auth.uid())
CREATE POLICY "Users can read system and own templates"
  ON public.workout_templates FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own templates (not system templates)
CREATE POLICY "Users can update own templates"
  ON public.workout_templates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own templates (not system templates)
CREATE POLICY "Users can delete own templates"
  ON public.workout_templates FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TEMPLATE_EXERCISES Policies
-- ============================================
-- Users can read exercises from templates they can access
CREATE POLICY "Users can read template exercises"
  ON public.template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND (t.user_id IS NULL OR t.user_id = auth.uid())
    )
  );

-- Users can manage exercises in their own templates
CREATE POLICY "Users can create template exercises"
  ON public.template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update template exercises"
  ON public.template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete template exercises"
  ON public.template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT_SESSIONS Policies
-- ============================================
-- Users can only access their own workout sessions
CREATE POLICY "Users can read own sessions"
  ON public.workout_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.workout_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- SESSION_EXERCISES Policies
-- ============================================
-- Users can access exercises in their own sessions
CREATE POLICY "Users can read own session exercises"
  ON public.session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own session exercises"
  ON public.session_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session exercises"
  ON public.session_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session exercises"
  ON public.session_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================
-- SESSION_SETS Policies
-- ============================================
-- Users can access sets in their own session exercises
CREATE POLICY "Users can read own session sets"
  ON public.session_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own session sets"
  ON public.session_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session sets"
  ON public.session_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session sets"
  ON public.session_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: Grant necessary permissions
-- ============================================
-- Ensure authenticated users can access these tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_sets TO authenticated;

-- ============================================
-- Success notification
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS re-enabled for workout tables';
  RAISE NOTICE '✅ All policies recreated and cleaned up';
  RAISE NOTICE '✅ Security configuration fixed - Supabase warnings should be resolved';
END $$;
