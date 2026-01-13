-- ============================================
-- Seed PPL Workout Templates
-- ============================================
-- This migration populates the database with system PPL templates

DO $$
DECLARE
  v_push_a_id UUID;
  v_push_b_id UUID;
  v_pull_a_id UUID;
  v_pull_b_id UUID;
  v_leg_a_id UUID;
  v_leg_b_id UUID;
BEGIN
  -- Check if templates already exist
  IF EXISTS (SELECT 1 FROM public.workout_templates WHERE user_id IS NULL) THEN
    RAISE NOTICE 'System templates already exist. Skipping seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating PPL workout templates...';

  -- ============================================
  -- PUSH DAY A - Chest Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Push Day - Chest Focus', 'push', 'push-a', 45)
  RETURNING id INTO v_push_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_push_a_id, 'barbell-bench-press', 1, 4, '6-8', 120, 'Compound movement. Focus on controlled descent and explosive push.'),
  (v_push_a_id, 'incline-dumbbell-press', 2, 3, '8-10', 90, 'Set bench to 30-45 degrees. Full range of motion.'),
  (v_push_a_id, 'lateral-raises', 3, 3, '12-15', 60, 'Control the weight. Lead with elbows, not hands.'),
  (v_push_a_id, 'tricep-pushdowns', 4, 3, '10-12', 60, 'Keep elbows tucked. Full extension at bottom.');

  RAISE NOTICE 'Created Push Day A template';

  -- ============================================
  -- PUSH DAY B - Shoulder Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Push Day - Shoulder Focus', 'push', 'push-b', 60)
  RETURNING id INTO v_push_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_push_b_id, 'incline-barbell-bench-press', 1, 4, '6-8', 120, 'Set bench to 30 degrees. Drive through upper chest.'),
  (v_push_b_id, 'dumbbell-shoulder-press', 2, 4, '8-10', 90, 'Press dumbbells together at top. Full range of motion.'),
  (v_push_b_id, 'cable-flyes', 3, 3, '10-12', 60, 'Maintain tension throughout. Squeeze chest at peak contraction.'),
  (v_push_b_id, 'arnold-press', 4, 3, '8-10', 90, 'Rotate palms as you press. Slow and controlled.'),
  (v_push_b_id, 'front-raises', 5, 3, '12-15', 60, 'Raise to shoulder height. Control the descent.'),
  (v_push_b_id, 'tricep-dips', 6, 3, '8-10', 90, 'Bodyweight or weighted. Lean slightly forward for chest emphasis.');

  RAISE NOTICE 'Created Push Day B template';

  -- ============================================
  -- PULL DAY A - Back Width Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Pull Day - Back Width Focus', 'pull', 'pull-a', 30)
  RETURNING id INTO v_pull_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_pull_a_id, 'deadlift', 1, 4, '5-6', 120, 'King of back exercises. Keep back neutral, drive through heels.'),
  (v_pull_a_id, 'face-pulls', 2, 3, '15-20', 60, 'Pull rope to face. External rotation at end.');

  RAISE NOTICE 'Created Pull Day A template';

  -- ============================================
  -- PULL DAY B - Back Thickness Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Pull Day - Back Thickness Focus', 'pull', 'pull-b', 20)
  RETURNING id INTO v_pull_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_pull_b_id, 'rear-delt-flyes', 1, 3, '12-15', 60, 'Bent over or on incline bench. Lead with elbows.');

  RAISE NOTICE 'Created Pull Day B template';

  -- ============================================
  -- LEG DAY A - Quad Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Leg Day - Quad Focus', 'legs', 'leg-a', 45)
  RETURNING id INTO v_leg_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_leg_a_id, 'leg-press', 1, 3, '10-12', 90, 'Full range of motion. Controlled descent.'),
  (v_leg_a_id, 'walking-lunges', 2, 3, '12-15', 60, 'Step far enough forward. Keep torso upright.'),
  (v_leg_a_id, 'leg-curls', 3, 3, '10-12', 60, 'Lying or seated. Full contraction at top.'),
  (v_leg_a_id, 'calf-raises', 4, 4, '15-20', 60, 'Full stretch at bottom, squeeze at top. Pause at peak.');

  RAISE NOTICE 'Created Leg Day A template';

  -- ============================================
  -- LEG DAY B - Hamstring Focus
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Leg Day - Hamstring Focus', 'legs', 'leg-b', 40)
  RETURNING id INTO v_leg_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_leg_b_id, 'bulgarian-split-squats', 1, 3, '10-12', 90, 'Rear foot elevated. Balance and control.'),
  (v_leg_b_id, 'seated-leg-curls', 2, 3, '12-15', 60, 'Squeeze at contraction. Slow negative.'),
  (v_leg_b_id, 'seated-calf-raises', 3, 4, '15-20', 60, 'Targets soleus. Full range of motion.');

  RAISE NOTICE 'Created Leg Day B template';

  RAISE NOTICE '✅ PPL templates seeded successfully!';
  RAISE NOTICE 'Created 6 workout templates with exercises';
END $$;
