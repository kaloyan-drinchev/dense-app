-- Allow unauthenticated SELECT for user_progress (for first-time setup)
-- This is needed because users don't have auth.uid() during initial progress retrieval

-- Drop the existing select policy
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;

-- Create a new policy that allows SELECT without authentication
-- This allows progress retrieval during first-time setup before authentication is set up
CREATE POLICY "Users can view own progress or unauthenticated read"
  ON user_progress
  FOR SELECT
  USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text);

