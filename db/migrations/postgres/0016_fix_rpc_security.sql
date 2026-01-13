-- ============================================
-- Fix RPC Function Security
-- ============================================
-- The function needs SECURITY DEFINER to bypass RLS
-- But we validate that the caller owns the user_id for security

DROP FUNCTION IF EXISTS start_workout_session(UUID, UUID);

CREATE OR REPLACE FUNCTION start_workout_session(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
  v_new_session_id UUID;
  v_template_record RECORD;
  v_temp_exercise RECORD;
  v_new_session_exercise_id UUID;
  v_exercise_name TEXT;
  i INT;
BEGIN
  -- SECURITY: Verify the caller is creating a session for themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create session for another user';
  END IF;

  -- 1. Get template info
  SELECT * INTO v_template_record
  FROM public.workout_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_id;
  END IF;

  -- 2. Create the overarching Session (Status: IN_PROGRESS)
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

  -- 3. Loop through every exercise in the Template
  FOR v_temp_exercise IN 
    SELECT * FROM public.template_exercises 
    WHERE template_id = p_template_id 
    ORDER BY sort_order
  LOOP
  
    -- Get exercise name from exercises table
    SELECT name INTO v_exercise_name
    FROM public.exercises
    WHERE id = v_temp_exercise.exercise_id;

    IF v_exercise_name IS NULL THEN
      v_exercise_name := v_temp_exercise.exercise_id; -- Fallback to ID
    END IF;

    -- 4. Create a fresh 'Session Exercise' (Status: NOT_STARTED)
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
      v_temp_exercise.exercise_id,
      v_exercise_name,
      v_temp_exercise.sort_order,
      'NOT_STARTED',
      v_temp_exercise.target_sets,
      v_temp_exercise.target_reps,
      v_temp_exercise.rest_seconds,
      v_temp_exercise.notes
    )
    RETURNING id INTO v_new_session_exercise_id;

    -- 5. Create fresh, empty sets (Checkboxes unchecked)
    -- We loop from 1 to the target_sets (e.g., 3 times)
    FOR i IN 1..v_temp_exercise.target_sets LOOP
      INSERT INTO public.session_sets (
        session_exercise_id,
        set_number,
        weight_kg,
        reps,
        is_completed
      )
      VALUES (
        v_new_session_exercise_id,
        i,
        0,
        0,
        FALSE -- GUARANTEES it is not completed
      );
    END LOOP;

  END LOOP;

  -- Return the ID so App can navigate to "Active Workout" screen
  RETURN v_new_session_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION start_workout_session(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION start_workout_session IS 'Creates a new workout session from a template with fresh state (SECURITY DEFINER to bypass RLS)';
