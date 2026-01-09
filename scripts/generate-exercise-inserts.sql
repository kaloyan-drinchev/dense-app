-- Insert 36 PPL Exercises into exercises table
-- Run this in Supabase SQL Editor if the seed script fails

INSERT INTO public.exercises (id, name, category, target_muscle) VALUES
-- Push Day - Chest Focus
('barbell-bench-press', 'Barbell Bench Press', 'Chest', 'Chest'),
('incline-dumbbell-press', 'Incline Dumbbell Press', 'Chest', 'Upper Chest'),
('dumbbell-flyes', 'Dumbbell Flyes', 'Chest', 'Chest'),
('overhead-press', 'Overhead Press', 'Shoulders', 'Shoulders'),
('lateral-raises', 'Lateral Raises', 'Shoulders', 'Side Delts'),
('tricep-pushdown', 'Tricep Pushdown', 'Arms', 'Triceps'),

-- Push Day - Shoulder Focus
('incline-barbell-bench', 'Incline Barbell Bench Press', 'Chest', 'Upper Chest'),
('seated-dumbbell-press', 'Seated Dumbbell Press', 'Shoulders', 'Shoulders'),
('cable-flyes', 'Cable Flyes', 'Chest', 'Chest'),
('arnold-press', 'Arnold Press', 'Shoulders', 'Shoulders'),
('front-raises', 'Front Raises', 'Shoulders', 'Front Delts'),
('overhead-extension', 'Overhead Tricep Extension', 'Arms', 'Triceps'),

-- Pull Day - Back Width Focus
('deadlift', 'Deadlift', 'Back', 'Back'),
('pull-ups', 'Pull-ups', 'Back', 'Lats'),
('barbell-row', 'Barbell Row', 'Back', 'Back'),
('lat-pulldown', 'Lat Pulldown', 'Back', 'Lats'),
('face-pulls', 'Face Pulls', 'Back', 'Rear Delts'),
('barbell-curl', 'Barbell Curl', 'Arms', 'Biceps'),

-- Pull Day - Back Thickness Focus
('rack-pulls', 'Rack Pulls', 'Back', 'Back'),
('chin-ups', 'Chin-ups', 'Back', 'Lats'),
('dumbbell-row', 'Dumbbell Row', 'Back', 'Back'),
('cable-row', 'Cable Row', 'Back', 'Back'),
('rear-delt-flyes', 'Rear Delt Flyes', 'Shoulders', 'Rear Delts'),
('hammer-curl', 'Hammer Curl', 'Arms', 'Biceps'),

-- Leg Day - Quad Focus
('squat', 'Barbell Squat', 'Legs', 'Quads'),
('leg-press', 'Leg Press', 'Legs', 'Quads'),
('walking-lunges', 'Walking Lunges', 'Legs', 'Quads'),
('romanian-deadlift', 'Romanian Deadlift', 'Legs', 'Hamstrings'),
('leg-curl', 'Leg Curl', 'Legs', 'Hamstrings'),
('standing-calf-raise', 'Standing Calf Raise', 'Legs', 'Calves'),

-- Leg Day - Hamstring Focus
('front-squat', 'Front Squat', 'Legs', 'Quads'),
('bulgarian-split-squat', 'Bulgarian Split Squat', 'Legs', 'Quads'),
('hack-squat', 'Hack Squat', 'Legs', 'Quads'),
('stiff-leg-deadlift', 'Stiff Leg Deadlift', 'Legs', 'Hamstrings'),
('seated-leg-curl', 'Seated Leg Curl', 'Legs', 'Hamstrings'),
('seated-calf-raise', 'Seated Calf Raise', 'Legs', 'Calves')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  target_muscle = EXCLUDED.target_muscle,
  updated_at = NOW();
