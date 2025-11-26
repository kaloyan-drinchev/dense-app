-- Migration: Allow unauthenticated updates to user_progress
-- This is needed during initial setup before authentication is implemented

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "user_progress_update_policy" ON user_progress;

-- Create new policy allowing updates for unauthenticated users or matching user_id
CREATE POLICY "user_progress_update_policy" ON user_progress
  FOR UPDATE
  USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid() IS NULL OR auth.uid()::text = user_id::text);

