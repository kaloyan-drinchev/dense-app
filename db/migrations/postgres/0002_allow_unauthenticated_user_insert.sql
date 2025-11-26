-- Allow unauthenticated inserts for user_profiles (for first-time setup)
-- This is needed because users don't have auth.uid() during initial profile creation
-- We still restrict SELECT/UPDATE/DELETE to authenticated users

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create a new policy that allows inserts without authentication
-- This allows first-time user creation before authentication is set up
CREATE POLICY "Allow unauthenticated user profile insert"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

