-- ============================================
-- Seed PPL Workout Templates
-- ============================================
-- This seeds the database with the 6 system PPL workout templates.
-- user_id = NULL indicates these are system templates (not user-created).

-- Delete existing templates if re-running (IDEMPOTENT)
DELETE FROM public.template_exercises WHERE template_id IN (
  SELECT id FROM public.workout_templates WHERE user_id IS NULL
);
DELETE FROM public.workout_templates WHERE user_id IS NULL;

-- ============================================
-- PUSH DAY A - Chest Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('push-a-system', NULL, 'Push Day - Chest Focus', 'push', 'push-a', 45);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('push-a-system', 'barbell-bench-press', 1, 4, '6-8', 120, 'Compound movement. Focus on controlled descent and explosive push.'),
  ('push-a-system', 'incline-dumbbell-press', 2, 3, '8-10', 90, 'Set bench to 30-45 degrees. Full range of motion.'),
  ('push-a-system', 'lateral-raises', 3, 3, '12-15', 60, 'Control the weight. Lead with elbows, not hands.'),
  ('push-a-system', 'tricep-pushdowns', 4, 3, '10-12', 60, 'Keep elbows tucked. Full extension at bottom.');

-- ============================================
-- PUSH DAY B - Shoulder Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('push-b-system', NULL, 'Push Day - Shoulder Focus', 'push', 'push-b', 60);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('push-b-system', 'incline-barbell-bench-press', 1, 4, '6-8', 120, 'Set bench to 30 degrees. Drive through upper chest.'),
  ('push-b-system', 'dumbbell-shoulder-press', 2, 4, '8-10', 90, 'Press dumbbells together at top. Full range of motion.'),
  ('push-b-system', 'cable-flyes', 3, 3, '10-12', 60, 'Maintain tension throughout. Squeeze chest at peak contraction.'),
  ('push-b-system', 'arnold-press', 4, 3, '8-10', 90, 'Rotate palms as you press. Slow and controlled.'),
  ('push-b-system', 'front-raises', 5, 3, '12-15', 60, 'Raise to shoulder height. Control the descent.'),
  ('push-b-system', 'overhead-tricep-extension', 6, 3, '10-12', 60, 'Keep elbows pointing forward. Full stretch at bottom.');

-- ============================================
-- PULL DAY A - Back Width Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('pull-a-system', NULL, 'Pull Day - Back Width Focus', 'pull', 'pull-a', 30);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('pull-a-system', 'deadlift', 1, 4, '5-6', 120, 'King of back exercises. Keep back neutral, drive through heels.'),
  ('pull-a-system', 'face-pulls', 2, 3, '15-20', 60, 'Pull rope to face. External rotation at end.');

-- ============================================
-- PULL DAY B - Back Thickness Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('pull-b-system', NULL, 'Pull Day - Back Thickness Focus', 'pull', 'pull-b', 20);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('pull-b-system', 'rear-delt-flyes', 1, 3, '12-15', 60, 'Bent over or on incline bench. Lead with elbows.');

-- ============================================
-- LEG DAY A - Quad Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('leg-a-system', NULL, 'Leg Day - Quad Focus', 'legs', 'leg-a', 45);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('leg-a-system', 'leg-press', 1, 3, '10-12', 90, 'Full range of motion. Controlled descent.'),
  ('leg-a-system', 'walking-lunges', 2, 3, '12-15', 60, 'Step far enough forward. Keep torso upright.'),
  ('leg-a-system', 'leg-curls', 3, 3, '10-12', 60, 'Lying or seated. Full contraction at top.'),
  ('leg-a-system', 'calf-raises', 4, 4, '15-20', 60, 'Full stretch at bottom, squeeze at top. Pause at peak.');

-- ============================================
-- LEG DAY B - Hamstring Focus
-- ============================================

INSERT INTO public.workout_templates (id, user_id, name, category, type, estimated_duration)
VALUES ('leg-b-system', NULL, 'Leg Day - Hamstring Focus', 'legs', 'leg-b', 40);

INSERT INTO public.template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
VALUES
  ('leg-b-system', 'bulgarian-split-squats', 1, 3, '10-12', 90, 'Rear foot elevated. Balance and control.'),
  ('leg-b-system', 'seated-leg-curls', 2, 3, '12-15', 60, 'Squeeze at contraction. Slow negative.'),
  ('leg-b-system', 'seated-calf-raises', 3, 4, '15-20', 60, 'Targets soleus. Full range of motion.');

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all templates were created:
-- SELECT t.name, COUNT(te.id) as exercise_count
-- FROM public.workout_templates t
-- LEFT JOIN public.template_exercises te ON te.template_id = t.id
-- WHERE t.user_id IS NULL
-- GROUP BY t.id, t.name
-- ORDER BY t.type;
