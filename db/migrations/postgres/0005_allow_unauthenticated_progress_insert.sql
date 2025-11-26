-- Allow unauthenticated inserts for user_progress (for first-time setup)
-- This is needed because users don't have auth.uid() during initial progress creation

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;

-- Create a new policy that allows inserts without authentication
-- This allows progress creation during first-time setup before authentication is set up
CREATE POLICY "Allow unauthenticated user progress insert"
  ON user_progress
  FOR INSERT
  WITH CHECK (true);

