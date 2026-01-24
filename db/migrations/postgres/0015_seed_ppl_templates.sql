-- ============================================
-- Seed PPL Workout Templates
-- ============================================
-- This migration populates the database with system PPL templates
-- Updated with new exercise selection (2 sets per exercise)

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
  -- PUSH DAY A - Chest Priority
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Push - Chest Priority', 'push', 'push-a', 30)
  RETURNING id INTO v_push_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_push_a_id, 'barbell-bench-press', 1, 2, '5-8', 120, 'Compound movement. Focus on controlled descent and explosive push.'),
  (v_push_a_id, 'incline-dumbbell-press', 2, 2, '8-10', 90, 'Set bench to 30-45 degrees. Full range of motion.'),
  (v_push_a_id, 'cable-flyes', 3, 2, '12-15', 60, 'Maintain tension throughout. Squeeze chest at peak contraction.'),
  (v_push_a_id, 'dumbbell-shoulder-press', 4, 2, '8-10', 90, 'Press dumbbells together at top. Full range of motion.'),
  (v_push_a_id, 'lateral-raises', 5, 2, '12-15', 60, 'Control the weight. Lead with elbows, not hands.'),
  (v_push_a_id, 'tricep-pushdowns', 6, 2, '10-15', 60, 'Keep elbows tucked. Full extension at bottom.');

  RAISE NOTICE 'Created Push Day A template (Chest Priority)';

  -- ============================================
  -- PUSH DAY B - Shoulder Priority
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Push - Shoulder Priority', 'push', 'push-b', 30)
  RETURNING id INTO v_push_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_push_b_id, 'dumbbell-shoulder-press', 1, 2, '6-9', 120, 'Press dumbbells together at top. Full range of motion.'),
  (v_push_b_id, 'arnold-press', 2, 2, '8-10', 90, 'Rotate palms as you press. Slow and controlled.'),
  (v_push_b_id, 'cable-lateral-raises', 3, 2, '12-15', 60, 'Control the weight. Lead with elbows, not hands.'),
  (v_push_b_id, 'dumbbell-bench-press', 4, 2, '8-10', 90, 'Press dumbbells together at top. Full range of motion.'),
  (v_push_b_id, 'cable-flyes', 5, 2, '12-15', 60, 'Maintain tension throughout. Squeeze chest at peak contraction.'),
  (v_push_b_id, 'overhead-tricep-extension', 6, 2, '10-15', 60, 'Keep elbows pointing forward. Full stretch at bottom.');

  RAISE NOTICE 'Created Push Day B template (Shoulder Priority)';

  -- ============================================
  -- PULL DAY A - Back Priority
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Pull - Back Priority', 'pull', 'pull-a', 25)
  RETURNING id INTO v_pull_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_pull_a_id, 'deadlift', 1, 2, '4-6', 120, 'King of back exercises. Keep back neutral, drive through heels.'),
  (v_pull_a_id, 'face-pulls', 2, 2, '12-15', 60, 'Pull rope to face. External rotation at end.'),
  (v_pull_a_id, 'rear-delt-flyes', 3, 2, '12-15', 60, 'Bent over or on incline bench. Lead with elbows.'),
  (v_pull_a_id, 'z-bar-curls', 4, 2, '8-12', 90, 'Keep elbows stable. Full contraction at top.'),
  (v_pull_a_id, 'dumbbell-curls', 5, 2, '10-12', 60, 'Supinate wrists at top. Control the negative.');

  RAISE NOTICE 'Created Pull Day A template (Back Priority)';

  -- ============================================
  -- PULL DAY B - Biceps Emphasis
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Pull - Biceps Emphasis', 'pull', 'pull-b', 25)
  RETURNING id INTO v_pull_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_pull_b_id, 'deadlift', 1, 2, '5-7', 120, 'King of back exercises. Keep back neutral, drive through heels.'),
  (v_pull_b_id, 'face-pulls', 2, 2, '10-12', 60, 'Pull rope to face. External rotation at end.'),
  (v_pull_b_id, 'rear-delt-flyes', 3, 2, '12-15', 60, 'Bent over or on incline bench. Lead with elbows.'),
  (v_pull_b_id, 'preacher-curls', 4, 2, '8-12', 90, 'Strict form. Full stretch at bottom.'),
  (v_pull_b_id, 'hammer-curls', 5, 2, '10-12', 60, 'Neutral grip. Hits brachialis and brachioradialis.');

  RAISE NOTICE 'Created Pull Day B template (Biceps Emphasis)';

  -- ============================================
  -- LEG DAY A - Quad Priority
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Legs - Quad Priority', 'legs', 'leg-a', 30)
  RETURNING id INTO v_leg_a_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_leg_a_id, 'bulgarian-split-squats', 1, 2, '6-10', 120, 'Rear foot elevated. Balance and control. Count per leg.'),
  (v_leg_a_id, 'leg-extension', 2, 2, '10-15', 90, 'Full extension at top. Squeeze quads.'),
  (v_leg_a_id, 'leg-curls', 3, 2, '10-15', 60, 'Lying or seated. Full contraction at top.'),
  (v_leg_a_id, 'walking-lunges', 4, 2, '10-12', 60, 'Step far enough forward. Keep torso upright. Count per leg.'),
  (v_leg_a_id, 'calf-raises', 5, 2, '10-15', 60, 'Full stretch at bottom, squeeze at top. Pause at peak.');

  RAISE NOTICE 'Created Leg Day A template (Quad Priority)';

  -- ============================================
  -- LEG DAY B - Hamstring/Glute Priority
  -- ============================================
  INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
  VALUES (gen_random_uuid(), NULL, 'Legs - Hamstring/Glute Priority', 'legs', 'leg-b', 30)
  RETURNING id INTO v_leg_b_id;

  INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes) VALUES
  (v_leg_b_id, 'leg-curls', 1, 2, '8-12', 120, 'Lying or seated. Full contraction at top.'),
  (v_leg_b_id, 'walking-lunges', 2, 2, '10-12', 90, 'Step far enough forward. Keep torso upright. Count per leg.'),
  (v_leg_b_id, 'bulgarian-split-squats', 3, 2, '8-10', 90, 'Rear foot elevated. Balance and control. Count per leg.'),
  (v_leg_b_id, 'leg-extension', 4, 2, '12-15', 60, 'Full extension at top. Squeeze quads.'),
  (v_leg_b_id, 'calf-raises', 5, 2, '12-15', 60, 'Full stretch at bottom, squeeze at top. Pause at peak.');

  RAISE NOTICE 'Created Leg Day B template (Hamstring/Glute Priority)';

  RAISE NOTICE '✅ PPL templates seeded successfully!';
  RAISE NOTICE 'Created 6 workout templates with 2 sets per exercise';
END $$;
