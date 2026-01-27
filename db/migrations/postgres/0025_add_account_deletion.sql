-- Migration: Add Foreign Key Constraints and Account Deletion RPC
-- This ensures proper cascade deletion when a user account is removed

-- Step 1: Add foreign key constraints with CASCADE delete to existing tables
-- (The workout tables already have these from migration 0013)

-- Add FK constraint for user_progress -> user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_progress_user_id_fkey'
  ) THEN
    ALTER TABLE user_progress
      ADD CONSTRAINT user_progress_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK constraint for user_wizard_results -> user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_wizard_results_user_id_fkey'
  ) THEN
    ALTER TABLE user_wizard_results
      ADD CONSTRAINT user_wizard_results_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK constraint for daily_logs -> user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_logs_user_id_fkey'
  ) THEN
    ALTER TABLE daily_logs
      ADD CONSTRAINT daily_logs_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK constraint for custom_meals -> user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_meals_user_id_fkey'
  ) THEN
    ALTER TABLE custom_meals
      ADD CONSTRAINT custom_meals_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Create the RPC function for account deletion
-- This function deletes the user's profile and all related data (via CASCADE)
CREATE OR REPLACE FUNCTION delete_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get the calling user's ID from the custom header or session
  -- For unauthenticated access, we'll use a parameter approach
  -- Since RLS is disabled, we need to be extra careful here
  
  -- This function should only be called with explicit user_id parameter
  -- but for now, we'll make it flexible for the custom auth system
  
  RAISE NOTICE 'delete_user_profile() called';
  
  -- For safety, return error if called without proper context
  RETURN json_build_object(
    'success', false,
    'error', 'This function requires a user_id parameter. Use delete_user_profile_by_id(user_id) instead.'
  );
END;
$$;

-- Step 3: Create the actual deletion function that takes user_id as parameter
CREATE OR REPLACE FUNCTION delete_user_profile_by_id(target_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  related_progress_count INTEGER;
  related_wizard_count INTEGER;
  related_logs_count INTEGER;
  related_meals_count INTEGER;
  related_sessions_count INTEGER;
BEGIN
  -- Validate input
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_id cannot be null'
    );
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Count related records before deletion (for logging)
  SELECT COUNT(*) INTO related_progress_count FROM user_progress WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO related_wizard_count FROM user_wizard_results WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO related_logs_count FROM daily_logs WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO related_meals_count FROM custom_meals WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO related_sessions_count FROM workout_sessions WHERE user_id = target_user_id;

  -- Delete the user profile (CASCADE will handle related records)
  DELETE FROM user_profiles WHERE id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the deletion
  RAISE NOTICE 'Deleted user profile: % (progress: %, wizard: %, logs: %, meals: %, sessions: %)',
    target_user_id, related_progress_count, related_wizard_count, related_logs_count, 
    related_meals_count, related_sessions_count;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'deleted_user_id', target_user_id,
    'related_records_deleted', json_build_object(
      'progress', related_progress_count,
      'wizard_results', related_wizard_count,
      'daily_logs', related_logs_count,
      'custom_meals', related_meals_count,
      'workout_sessions', related_sessions_count
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_user_profile_by_id(UUID) TO anon, authenticated;
