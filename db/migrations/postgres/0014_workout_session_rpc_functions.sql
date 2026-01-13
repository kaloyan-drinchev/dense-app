-- ============================================
-- RPC Functions for Workout Session Management
-- ============================================

-- ============================================
-- FUNCTION: Start Workout Session from Template
-- ============================================
-- This function creates a fresh workout session from a template.
-- It clones template exercises and creates empty sets with is_completed = FALSE.
-- This guarantees every workout starts from 0 (no pre-completed exercises).

CREATE OR REPLACE FUNCTION start_workout_session(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_session_id UUID;
  v_template_record RECORD;
  v_template_exercise RECORD;
  v_new_session_exercise_id UUID;
  v_set_number INT;
BEGIN
  -- 1. Get template details
  SELECT * INTO v_template_record
  FROM public.workout_templates
  WHERE id = p_template_id
  AND (user_id IS NULL OR user_id = p_user_id); -- Allow system or own templates
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  -- 2. Create the workout session (Status: IN_PROGRESS)
  INSERT INTO public.workout_sessions (
    user_id,
    template_id,
    workout_name,
    workout_type,
    status,
    started_at
  )
  VALUES (
    p_user_id,
    p_template_id,
    v_template_record.name,
    v_template_record.type,
    'IN_PROGRESS',
    now()
  )
  RETURNING id INTO v_new_session_id;

  -- 3. Loop through template exercises and clone them
  FOR v_template_exercise IN 
    SELECT * FROM public.template_exercises 
    WHERE template_id = p_template_id 
    ORDER BY sort_order
  LOOP
    -- Get exercise name for denormalization
    DECLARE
      v_exercise_name TEXT;
    BEGIN
      SELECT name INTO v_exercise_name
      FROM public.exercises
      WHERE id = v_template_exercise.exercise_id
      LIMIT 1;
      
      IF v_exercise_name IS NULL THEN
        v_exercise_name := v_template_exercise.exercise_id; -- Fallback
      END IF;

      -- 4. Create session exercise (Status: NOT_STARTED)
      INSERT INTO public.session_exercises (
        session_id,
        exercise_id,
        exercise_name,
        sort_order,
        status,
        target_sets,
        target_reps,
        rest_seconds,
        notes
      )
      VALUES (
        v_new_session_id,
        v_template_exercise.exercise_id,
        v_exercise_name,
        v_template_exercise.sort_order,
        'NOT_STARTED',
        v_template_exercise.target_sets,
        v_template_exercise.target_reps,
        v_template_exercise.rest_seconds,
        v_template_exercise.notes
      )
      RETURNING id INTO v_new_session_exercise_id;

      -- 5. Create empty sets (is_completed = FALSE by default)
      FOR v_set_number IN 1..v_template_exercise.target_sets LOOP
        INSERT INTO public.session_sets (
          session_exercise_id,
          set_number,
          weight_kg,
          reps,
          is_completed
        )
        VALUES (
          v_new_session_exercise_id,
          v_set_number,
          0,
          0,
          FALSE -- CRITICAL: Guarantees fresh start
        );
      END LOOP;
    END;
  END LOOP;

  -- Return the new session ID
  RETURN v_new_session_id;
END;
$$;

-- ============================================
-- FUNCTION: Start Manual Workout Session
-- ============================================
-- For manual/cardio workouts without a template

CREATE OR REPLACE FUNCTION start_manual_workout_session(
  p_user_id UUID,
  p_workout_name TEXT,
  p_workout_type TEXT,
  p_exercises JSONB -- Array of {exercise_id, exercise_name, target_sets, target_reps, rest_seconds}
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_session_id UUID;
  v_exercise JSONB;
  v_new_session_exercise_id UUID;
  v_set_number INT;
  v_sort_order INT := 1;
BEGIN
  -- 1. Create the workout session
  INSERT INTO public.workout_sessions (
    user_id,
    template_id,
    workout_name,
    workout_type,
    status,
    started_at
  )
  VALUES (
    p_user_id,
    NULL, -- No template for manual workouts
    p_workout_name,
    p_workout_type,
    'IN_PROGRESS',
    now()
  )
  RETURNING id INTO v_new_session_id;

  -- 2. Loop through exercises
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    -- 3. Create session exercise
    INSERT INTO public.session_exercises (
      session_id,
      exercise_id,
      exercise_name,
      sort_order,
      status,
      target_sets,
      target_reps,
      rest_seconds
    )
    VALUES (
      v_new_session_id,
      v_exercise->>'exercise_id',
      v_exercise->>'exercise_name',
      v_sort_order,
      'NOT_STARTED',
      COALESCE((v_exercise->>'target_sets')::INTEGER, 3),
      COALESCE(v_exercise->>'target_reps', '10'),
      COALESCE((v_exercise->>'rest_seconds')::INTEGER, 60)
    )
    RETURNING id INTO v_new_session_exercise_id;

    -- 4. Create empty sets
    FOR v_set_number IN 1..COALESCE((v_exercise->>'target_sets')::INTEGER, 3) LOOP
      INSERT INTO public.session_sets (
        session_exercise_id,
        set_number,
        weight_kg,
        reps,
        is_completed
      )
      VALUES (
        v_new_session_exercise_id,
        v_set_number,
        0,
        0,
        FALSE
      );
    END LOOP;

    v_sort_order := v_sort_order + 1;
  END LOOP;

  RETURN v_new_session_id;
END;
$$;

-- ============================================
-- FUNCTION: Complete Workout Session
-- ============================================

CREATE OR REPLACE FUNCTION complete_workout_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duration_seconds INTEGER;
  v_total_volume DECIMAL(10, 2);
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.workout_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Calculate duration
  SELECT 
    EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  INTO v_duration_seconds
  FROM public.workout_sessions
  WHERE id = p_session_id;

  -- Calculate total volume (sum of weight * reps for all completed sets)
  SELECT 
    COALESCE(SUM(weight_kg * reps), 0)
  INTO v_total_volume
  FROM public.session_sets ss
  JOIN public.session_exercises se ON se.id = ss.session_exercise_id
  WHERE se.session_id = p_session_id
  AND ss.is_completed = TRUE;

  -- Update session
  UPDATE public.workout_sessions
  SET 
    status = 'COMPLETED',
    completed_at = now(),
    duration_seconds = v_duration_seconds,
    total_volume_kg = v_total_volume,
    updated_at = now()
  WHERE id = p_session_id;
END;
$$;

-- ============================================
-- FUNCTION: Cancel Workout Session
-- ============================================

CREATE OR REPLACE FUNCTION cancel_workout_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.workout_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Update session status
  UPDATE public.workout_sessions
  SET 
    status = 'CANCELLED',
    updated_at = now()
  WHERE id = p_session_id;
END;
$$;

-- ============================================
-- FUNCTION: Get Active Session
-- ============================================

CREATE OR REPLACE FUNCTION get_active_workout_session(
  p_user_id UUID
)
RETURNS TABLE (
  session_id UUID,
  workout_name TEXT,
  workout_type TEXT,
  started_at TIMESTAMPTZ,
  exercise_count BIGINT,
  completed_exercise_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.workout_name,
    s.workout_type,
    s.started_at,
    COUNT(se.id) as exercise_count,
    COUNT(se.id) FILTER (WHERE se.status = 'COMPLETED') as completed_exercise_count
  FROM public.workout_sessions s
  LEFT JOIN public.session_exercises se ON se.session_id = s.id
  WHERE s.user_id = p_user_id
  AND s.status = 'IN_PROGRESS'
  GROUP BY s.id, s.workout_name, s.workout_type, s.started_at
  ORDER BY s.started_at DESC
  LIMIT 1;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION start_workout_session IS 'Creates a new workout session from a template with fresh, empty sets';
COMMENT ON FUNCTION start_manual_workout_session IS 'Creates a manual/cardio workout session without a template';
COMMENT ON FUNCTION complete_workout_session IS 'Marks a workout session as completed and calculates stats';
COMMENT ON FUNCTION cancel_workout_session IS 'Marks a workout session as cancelled';
COMMENT ON FUNCTION get_active_workout_session IS 'Gets the current active workout session for a user';
