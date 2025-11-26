-- Allow unauthenticated inserts for user_wizard_results (for first-time setup)
-- This is needed because users don't have auth.uid() during wizard completion

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own wizard results" ON user_wizard_results;

-- Create a new policy that allows inserts without authentication
-- This allows wizard completion during first-time setup before authentication is set up
CREATE POLICY "Allow unauthenticated wizard results insert"
  ON user_wizard_results
  FOR INSERT
  WITH CHECK (true);

