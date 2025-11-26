-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wizard_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_PROFILES Policies
-- ============================================
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid()::text = id::text);

-- ============================================
-- PROGRAMS Policies
-- ============================================
-- Everyone can view programs (they're shared/public)
CREATE POLICY "Anyone can view programs"
  ON programs
  FOR SELECT
  USING (true);

-- Only authenticated users can insert programs (for now - later restrict to admins)
CREATE POLICY "Authenticated users can insert programs"
  ON programs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update programs (for now - later restrict to admins)
CREATE POLICY "Authenticated users can update programs"
  ON programs
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete programs (for now - later restrict to admins)
CREATE POLICY "Authenticated users can delete programs"
  ON programs
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- USER_PROGRESS Policies
-- ============================================
-- Users can only view their own progress
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own progress
CREATE POLICY "Users can delete own progress"
  ON user_progress
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- DAILY_LOGS Policies
-- ============================================
-- Users can only view their own logs
CREATE POLICY "Users can view own logs"
  ON daily_logs
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON daily_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own logs
CREATE POLICY "Users can update own logs"
  ON daily_logs
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs"
  ON daily_logs
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- CUSTOM_MEALS Policies
-- ============================================
-- Users can only view their own meals
CREATE POLICY "Users can view own meals"
  ON custom_meals
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own meals
CREATE POLICY "Users can insert own meals"
  ON custom_meals
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own meals
CREATE POLICY "Users can update own meals"
  ON custom_meals
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own meals
CREATE POLICY "Users can delete own meals"
  ON custom_meals
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- USER_WIZARD_RESULTS Policies
-- ============================================
-- Users can only view their own wizard results
CREATE POLICY "Users can view own wizard results"
  ON user_wizard_results
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own wizard results
CREATE POLICY "Users can insert own wizard results"
  ON user_wizard_results
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own wizard results
CREATE POLICY "Users can update own wizard results"
  ON user_wizard_results
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can delete their own wizard results
CREATE POLICY "Users can delete own wizard results"
  ON user_wizard_results
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- SYNC_STATUS Policies
-- ============================================
-- System table - allow authenticated users to read/write
-- This is used for tracking sync state, so users need access
CREATE POLICY "Authenticated users can view sync status"
  ON sync_status
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sync status"
  ON sync_status
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sync status"
  ON sync_status
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sync status"
  ON sync_status
  FOR DELETE
  USING (auth.role() = 'authenticated');

