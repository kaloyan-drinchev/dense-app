-- Migration: Add Powerlifting Stats to User Profiles
-- Add squat_kg, bench_kg, deadlift_kg columns and computed total_lifted_kg

-- Add columns to user_profiles if they don't exist
DO $$ 
BEGIN
  -- Add squat_kg column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'squat_kg'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN squat_kg NUMERIC DEFAULT 0;
  END IF;

  -- Add bench_kg column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'bench_kg'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bench_kg NUMERIC DEFAULT 0;
  END IF;

  -- Add deadlift_kg column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'deadlift_kg'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deadlift_kg NUMERIC DEFAULT 0;
  END IF;

  -- Add computed total_lifted_kg column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'total_lifted_kg'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN total_lifted_kg NUMERIC 
    GENERATED ALWAYS AS (COALESCE(squat_kg, 0) + COALESCE(bench_kg, 0) + COALESCE(deadlift_kg, 0)) STORED;
  END IF;

END $$;
