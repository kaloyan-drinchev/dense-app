// Comprehensive exercise database for custom exercise selection
// Organized by muscle group for better searchability

export interface ExerciseData {
  id: string;
  name: string;
  category: string;
  targetMuscle: string;
}

export const exerciseDatabase: ExerciseData[] = [
  // CHEST EXERCISES
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'incline-barbell-bench', name: 'Incline Barbell Bench Press', category: 'Chest', targetMuscle: 'Upper Chest' },
  { id: 'decline-barbell-bench', name: 'Decline Barbell Bench Press', category: 'Chest', targetMuscle: 'Lower Chest' },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'Chest', targetMuscle: 'Upper Chest' },
  { id: 'decline-dumbbell-press', name: 'Decline Dumbbell Press', category: 'Chest', targetMuscle: 'Lower Chest' },
  { id: 'dumbbell-flyes', name: 'Dumbbell Flyes', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'incline-dumbbell-flyes', name: 'Incline Dumbbell Flyes', category: 'Chest', targetMuscle: 'Upper Chest' },
  { id: 'cable-flyes', name: 'Cable Flyes', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'low-cable-flyes', name: 'Low Cable Flyes', category: 'Chest', targetMuscle: 'Upper Chest' },
  { id: 'high-cable-flyes', name: 'High Cable Flyes', category: 'Chest', targetMuscle: 'Lower Chest' },
  { id: 'chest-dips', name: 'Chest Dips', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'push-ups', name: 'Push-ups', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'wide-grip-push-ups', name: 'Wide Grip Push-ups', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'diamond-push-ups', name: 'Diamond Push-ups', category: 'Chest', targetMuscle: 'Inner Chest' },
  { id: 'pec-deck-machine', name: 'Pec Deck Machine', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'machine-chest-press', name: 'Machine Chest Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'landmine-press', name: 'Landmine Press', category: 'Chest', targetMuscle: 'Chest' },
  
  // BACK EXERCISES
  { id: 'deadlift', name: 'Deadlift', category: 'Back', targetMuscle: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'pendlay-row', name: 'Pendlay Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'dumbbell-row', name: 'Dumbbell Row', category: 'Back', targetMuscle: 'Back' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'pull-ups', name: 'Pull-ups', category: 'Back', targetMuscle: 'Lats' },
  { id: 'chin-ups', name: 'Chin-ups', category: 'Back', targetMuscle: 'Lats' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', targetMuscle: 'Lats' },
  { id: 'wide-grip-pulldown', name: 'Wide Grip Lat Pulldown', category: 'Back', targetMuscle: 'Lats' },
  { id: 'close-grip-pulldown', name: 'Close Grip Lat Pulldown', category: 'Back', targetMuscle: 'Lats' },
  { id: 'cable-row', name: 'Cable Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'single-arm-row', name: 'Single Arm Dumbbell Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'seal-row', name: 'Seal Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'inverted-row', name: 'Inverted Row', category: 'Back', targetMuscle: 'Back' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'Back', targetMuscle: 'Rear Delts' },
  { id: 'shrugs', name: 'Barbell Shrugs', category: 'Back', targetMuscle: 'Traps' },
  { id: 'dumbbell-shrugs', name: 'Dumbbell Shrugs', category: 'Back', targetMuscle: 'Traps' },
  { id: 'rack-pulls', name: 'Rack Pulls', category: 'Back', targetMuscle: 'Back' },
  
  // SHOULDER EXERCISES
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', targetMuscle: 'Shoulders' },
  { id: 'military-press', name: 'Military Press', category: 'Shoulders', targetMuscle: 'Shoulders' },
  { id: 'seated-dumbbell-press', name: 'Seated Dumbbell Press', category: 'Shoulders', targetMuscle: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Shoulders', targetMuscle: 'Shoulders' },
  { id: 'lateral-raises', name: 'Lateral Raises', category: 'Shoulders', targetMuscle: 'Side Delts' },
  { id: 'cable-lateral-raises', name: 'Cable Lateral Raises', category: 'Shoulders', targetMuscle: 'Side Delts' },
  { id: 'front-raises', name: 'Front Raises', category: 'Shoulders', targetMuscle: 'Front Delts' },
  { id: 'rear-delt-flyes', name: 'Rear Delt Flyes', category: 'Shoulders', targetMuscle: 'Rear Delts' },
  { id: 'upright-row', name: 'Upright Row', category: 'Shoulders', targetMuscle: 'Shoulders' },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', category: 'Shoulders', targetMuscle: 'Shoulders' },
  
  // ARMS - BICEPS
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'concentration-curl', name: 'Concentration Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'cable-curl', name: 'Cable Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', category: 'Arms', targetMuscle: 'Biceps' },
  { id: 'spider-curl', name: 'Spider Curl', category: 'Arms', targetMuscle: 'Biceps' },
  
  // ARMS - TRICEPS
  { id: 'close-grip-bench', name: 'Close Grip Bench Press', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'tricep-dips', name: 'Tricep Dips', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'rope-pushdown', name: 'Rope Pushdown', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'overhead-extension', name: 'Overhead Tricep Extension', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'skull-crushers', name: 'Skull Crushers', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'kickbacks', name: 'Tricep Kickbacks', category: 'Arms', targetMuscle: 'Triceps' },
  { id: 'diamond-push-up-tricep', name: 'Diamond Push-ups (Triceps)', category: 'Arms', targetMuscle: 'Triceps' },
  
  // LEGS - QUADS
  { id: 'squat', name: 'Barbell Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'front-squat', name: 'Front Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'hack-squat', name: 'Hack Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'walking-lunges', name: 'Walking Lunges', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'box-squat', name: 'Box Squat', category: 'Legs', targetMuscle: 'Quads' },
  
  // LEGS - HAMSTRINGS
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'glute-ham-raise', name: 'Glute Ham Raise', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'good-mornings', name: 'Good Mornings', category: 'Legs', targetMuscle: 'Hamstrings' },
  
  // LEGS - GLUTES
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'Legs', targetMuscle: 'Glutes' },
  { id: 'glute-bridge', name: 'Glute Bridge', category: 'Legs', targetMuscle: 'Glutes' },
  { id: 'cable-kickbacks', name: 'Cable Kickbacks', category: 'Legs', targetMuscle: 'Glutes' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', category: 'Legs', targetMuscle: 'Glutes' },
  
  // LEGS - CALVES
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', category: 'Legs', targetMuscle: 'Calves' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'Legs', targetMuscle: 'Calves' },
  { id: 'donkey-calf-raise', name: 'Donkey Calf Raise', category: 'Legs', targetMuscle: 'Calves' },
  
  // CORE/ABS
  { id: 'plank', name: 'Plank', category: 'Core', targetMuscle: 'Abs' },
  { id: 'side-plank', name: 'Side Plank', category: 'Core', targetMuscle: 'Obliques' },
  { id: 'crunches', name: 'Crunches', category: 'Core', targetMuscle: 'Abs' },
  { id: 'bicycle-crunches', name: 'Bicycle Crunches', category: 'Core', targetMuscle: 'Abs' },
  { id: 'russian-twists', name: 'Russian Twists', category: 'Core', targetMuscle: 'Obliques' },
  { id: 'leg-raises', name: 'Leg Raises', category: 'Core', targetMuscle: 'Lower Abs' },
  { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', category: 'Core', targetMuscle: 'Lower Abs' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', category: 'Core', targetMuscle: 'Abs' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'Core', targetMuscle: 'Abs' },
  { id: 'cable-crunch', name: 'Cable Crunch', category: 'Core', targetMuscle: 'Abs' },
  { id: 'decline-situps', name: 'Decline Sit-ups', category: 'Core', targetMuscle: 'Abs' },
  { id: 'hollow-hold', name: 'Hollow Hold', category: 'Core', targetMuscle: 'Abs' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'Core', targetMuscle: 'Abs' },
  
  // OLYMPIC LIFTS & COMPOUND
  { id: 'clean', name: 'Power Clean', category: 'Olympic', targetMuscle: 'Full Body' },
  { id: 'clean-and-jerk', name: 'Clean and Jerk', category: 'Olympic', targetMuscle: 'Full Body' },
  { id: 'snatch', name: 'Snatch', category: 'Olympic', targetMuscle: 'Full Body' },
  { id: 'hang-clean', name: 'Hang Clean', category: 'Olympic', targetMuscle: 'Full Body' },
  { id: 'farmers-walk', name: "Farmer's Walk", category: 'Compound', targetMuscle: 'Full Body' },
  { id: 'turkish-getup', name: 'Turkish Get-up', category: 'Compound', targetMuscle: 'Full Body' },
  { id: 'burpees', name: 'Burpees', category: 'Compound', targetMuscle: 'Full Body' },
  
  // FOREARMS
  { id: 'wrist-curl', name: 'Wrist Curl', category: 'Forearms', targetMuscle: 'Forearms' },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', category: 'Forearms', targetMuscle: 'Forearms' },
  { id: 'wrist-roller', name: 'Wrist Roller', category: 'Forearms', targetMuscle: 'Forearms' },
  { id: 'dead-hang', name: 'Dead Hang', category: 'Forearms', targetMuscle: 'Forearms' },
  
  // ADDITIONAL VARIATIONS
  { id: 'pause-squat', name: 'Pause Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'pause-bench', name: 'Pause Bench Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'tempo-squat', name: 'Tempo Squat', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'pin-press', name: 'Pin Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'floor-press', name: 'Floor Press', category: 'Chest', targetMuscle: 'Chest' },
  { id: 'split-stance-rdl', name: 'Split Stance RDL', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'deficit-deadlift', name: 'Deficit Deadlift', category: 'Back', targetMuscle: 'Back' },
  { id: 'snatch-grip-deadlift', name: 'Snatch Grip Deadlift', category: 'Back', targetMuscle: 'Back' },
  { id: 'band-pull-apart', name: 'Band Pull Apart', category: 'Back', targetMuscle: 'Rear Delts' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'Compound', targetMuscle: 'Glutes' },
  { id: 'pallof-press', name: 'Pallof Press', category: 'Core', targetMuscle: 'Abs' },
  { id: 'landmine-rotation', name: 'Landmine Rotation', category: 'Core', targetMuscle: 'Obliques' },
  { id: 'sled-push', name: 'Sled Push', category: 'Legs', targetMuscle: 'Quads' },
  { id: 'sled-pull', name: 'Sled Pull', category: 'Legs', targetMuscle: 'Hamstrings' },
  { id: 'battle-ropes', name: 'Battle Ropes', category: 'Cardio', targetMuscle: 'Full Body' },
  { id: 'box-jumps', name: 'Box Jumps', category: 'Plyometric', targetMuscle: 'Legs' },
  { id: 'medicine-ball-slam', name: 'Medicine Ball Slam', category: 'Plyometric', targetMuscle: 'Full Body' },
  
  // STRETCHING/MOBILITY
  { id: 'yoga-downward-dog', name: 'Downward Dog', category: 'Mobility', targetMuscle: 'Full Body' },
  { id: 'cat-cow-stretch', name: 'Cat-Cow Stretch', category: 'Mobility', targetMuscle: 'Back' },
  { id: 'pigeon-stretch', name: 'Pigeon Stretch', category: 'Mobility', targetMuscle: 'Hips' },
  { id: 'couch-stretch', name: 'Couch Stretch', category: 'Mobility', targetMuscle: 'Hip Flexors' },
];

// Helper function to search exercises
export const searchExercises = (query: string): ExerciseData[] => {
  if (!query || query.trim().length === 0) {
    return exerciseDatabase;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return exerciseDatabase.filter(exercise => 
    exercise.name.toLowerCase().includes(lowerQuery) ||
    exercise.category.toLowerCase().includes(lowerQuery) ||
    exercise.targetMuscle.toLowerCase().includes(lowerQuery)
  );
};

// Get exercise by ID
export const getExerciseById = (id: string): ExerciseData | undefined => {
  return exerciseDatabase.find(ex => ex.id === id);
};

