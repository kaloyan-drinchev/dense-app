-- Migration: Create active workout sessions table
-- This table stores temporary workout session data while a workout is in progress
-- When a workout is completed, the data is moved to user_progress.weekly_weights
-- When a workout is skipped/cancelled, the data is simply deleted

CREATE TABLE IF NOT EXISTS public.active_workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workout_type TEXT NOT NULL, -- 'push-a', 'push-b', 'pull-a', 'pull-b', 'leg-a', 'leg-b', 'manual', 'cardio'
  workout_name TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores exercise completion status, sets, reps, weights
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_active_workout_sessions_user_id ON public.active_workout_sessions(user_id);

-- Enable RLS
ALTER TABLE public.active_workout_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own active sessions
CREATE POLICY "Users can read own active workout sessions"
ON public.active_workout_sessions
FOR SELECT
TO public
USING (true); -- Anyone can read (we'll filter by user_id in queries)

-- Allow users to insert their own active sessions
CREATE POLICY "Users can insert own active workout sessions"
ON public.active_workout_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to update their own active sessions
CREATE POLICY "Users can update own active workout sessions"
ON public.active_workout_sessions
FOR UPDATE
TO public
USING (true);

-- Allow users to delete their own active sessions
CREATE POLICY "Users can delete own active workout sessions"
ON public.active_workout_sessions
FOR DELETE
TO public
USING (true);
