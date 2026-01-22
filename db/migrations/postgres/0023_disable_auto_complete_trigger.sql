-- Disable automatic exercise completion trigger
-- This trigger was auto-marking exercises as COMPLETED when all sets were checked,
-- but exercises should ONLY be marked as COMPLETED when user explicitly clicks "Complete Exercise" button

-- Drop the trigger (keep the function in case we need it later)
DROP TRIGGER IF EXISTS trigger_update_exercise_status ON public.session_sets;

-- The function update_session_exercise_status() still exists but is no longer called automatically
-- Exercise status will now ONLY be updated via explicit calls to workoutSessionService.updateExerciseStatus()
