-- ============================================
-- Workout System Refactor: Templates & Sessions
-- ============================================
-- This migration creates a clean separation between:
-- 1. Templates (workout definitions - read-only)
-- 2. Sessions (workout execution - read-write)

-- ============================================
-- PART 1: WORKOUT TEMPLATES (Definitions)
-- ============================================

-- Workout Templates: System defaults (PPL) + User manual templates
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system template
  name TEXT NOT NULL,
  category TEXT, -- 'push', 'pull', 'legs', 'cardio', 'custom'
  type TEXT, -- 'push-a', 'push-b', 'pull-a', 'pull-b', 'leg-a', 'leg-b', 'cardio', 'manual'
  estimated_duration INTEGER, -- minutes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Template Exercises: The exercises in a template (plan)
CREATE TABLE IF NOT EXISTS public.template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL, -- References exercises table (name-based ID)
  sort_order INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps TEXT, -- e.g., "10", "8-12", "12-15"
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_type ON public.workout_templates(type);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON public.template_exercises(template_id);

-- ============================================
-- PART 2: WORKOUT SESSIONS (Execution)
-- ============================================

-- Workout Sessions: Active and completed workouts
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL, -- NULL for manual/cardio
  workout_name TEXT NOT NULL,
  workout_type TEXT, -- 'push-a', 'pull-b', 'manual', 'cardio', etc.
  status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_volume_kg DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session Exercises: Exercises in a workout session
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL, -- References exercises table
  exercise_name TEXT NOT NULL, -- Denormalized for history
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED
  target_sets INTEGER,
  target_reps TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session Sets: Individual sets in an exercise
CREATE TABLE IF NOT EXISTS public.session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(6, 2) DEFAULT 0,
  reps INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON public.workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_status ON public.workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON public.session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_sets_session_exercise_id ON public.session_sets(session_exercise_id);

-- ============================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

-- Templates: Users can read system templates (user_id IS NULL) + their own
CREATE POLICY "Users can read system and own templates"
  ON public.workout_templates FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can create own templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.workout_templates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.workout_templates FOR DELETE
  USING (user_id = auth.uid());

-- Template Exercises: Follow template access
CREATE POLICY "Users can read template exercises"
  ON public.template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND (t.user_id IS NULL OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own template exercises"
  ON public.template_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
    )
  );

-- Sessions: Users can only access their own
CREATE POLICY "Users can read own sessions"
  ON public.workout_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.workout_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Session Exercises: Follow session access
CREATE POLICY "Users can read own session exercises"
  ON public.session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own session exercises"
  ON public.session_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id
      AND s.user_id = auth.uid()
    )
  );

-- Session Sets: Follow session exercise access
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

CREATE POLICY "Users can manage own session sets"
  ON public.session_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions s ON s.id = se.session_id
      WHERE se.id = session_exercise_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================
-- PART 4: AUTO-UPDATE TRIGGERS
-- ============================================

-- Function: Auto-update exercise status based on sets
CREATE OR REPLACE FUNCTION update_session_exercise_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_sets INTEGER;
  v_completed_sets INTEGER;
BEGIN
  -- Count total and completed sets for this exercise
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = TRUE)
  INTO v_total_sets, v_completed_sets
  FROM public.session_sets
  WHERE session_exercise_id = COALESCE(NEW.session_exercise_id, OLD.session_exercise_id);

  -- Update exercise status
  UPDATE public.session_exercises
  SET 
    status = CASE
      WHEN v_completed_sets = 0 THEN 'NOT_STARTED'
      WHEN v_completed_sets >= v_total_sets THEN 'COMPLETED'
      ELSE 'IN_PROGRESS'
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.session_exercise_id, OLD.session_exercise_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update exercise status when sets change
DROP TRIGGER IF EXISTS trigger_update_exercise_status ON public.session_sets;
CREATE TRIGGER trigger_update_exercise_status
  AFTER INSERT OR UPDATE OR DELETE ON public.session_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_session_exercise_status();

-- Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update timestamps
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_exercises_updated_at
  BEFORE UPDATE ON public.session_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_sets_updated_at
  BEFORE UPDATE ON public.session_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.workout_templates IS 'Workout definitions - system defaults (PPL) and user custom templates';
COMMENT ON TABLE public.template_exercises IS 'Exercises in a workout template - the plan/blueprint';
COMMENT ON TABLE public.workout_sessions IS 'Workout execution instances - active and completed workouts';
COMMENT ON TABLE public.session_exercises IS 'Exercises in a workout session - actual workout data';
COMMENT ON TABLE public.session_sets IS 'Individual sets performed in an exercise';

COMMENT ON COLUMN public.workout_templates.user_id IS 'NULL = system template, UUID = user custom template';
COMMENT ON COLUMN public.workout_sessions.status IS 'NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED';
COMMENT ON COLUMN public.session_exercises.status IS 'NOT_STARTED, IN_PROGRESS, COMPLETED - auto-calculated from sets';
