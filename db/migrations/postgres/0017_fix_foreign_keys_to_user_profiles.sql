-- ============================================
-- Fix Foreign Keys to Reference user_profiles
-- ============================================
-- The foreign keys were referencing auth.users but should reference user_profiles

-- Fix workout_templates foreign key
ALTER TABLE public.workout_templates 
  DROP CONSTRAINT IF EXISTS workout_templates_user_id_fkey;

ALTER TABLE public.workout_templates 
  ADD CONSTRAINT workout_templates_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Fix workout_sessions foreign key
ALTER TABLE public.workout_sessions 
  DROP CONSTRAINT IF EXISTS workout_sessions_user_id_fkey;

ALTER TABLE public.workout_sessions 
  ADD CONSTRAINT workout_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign keys updated to reference user_profiles';
END $$;
