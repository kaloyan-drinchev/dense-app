-- Allow unauthenticated SELECT for user_profiles (for first-time setup)
-- This allows reading the profile immediately after creation before authentication
-- Note: This is a temporary measure until proper authentication is implemented

-- Drop the existing select policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create a new policy that allows SELECT:
-- 1. For authenticated users viewing their own profile (auth.uid()::text = id::text)
-- 2. For unauthenticated users (auth.uid() IS NULL) - needed for first-time setup
-- TODO: Tighten security once authentication is fully implemented
CREATE POLICY "Users can view own profile or unauthenticated read"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() IS NULL OR auth.uid()::text = id::text);

