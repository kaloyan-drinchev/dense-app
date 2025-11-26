-- Allow unauthenticated SELECT for user_wizard_results (for first-time setup)
-- This is needed because users don't have auth.uid() during initial wizard retrieval

-- Drop the existing select policy
DROP POLICY IF EXISTS "Users can view own wizard results" ON user_wizard_results;

-- Create a new policy that allows SELECT without authentication
-- This allows wizard retrieval during first-time setup before authentication is set up
CREATE POLICY "Users can view own wizard results or unauthenticated read"
  ON user_wizard_results
  FOR SELECT
  USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text);

