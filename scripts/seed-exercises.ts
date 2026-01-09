/**
 * Seed Exercises Script
 * 
 * Populates the exercises table with the 36 strength exercises used in the PPL program
 * Uses the service role key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js';
import { exerciseDatabase } from '../constants/exercise-database';

// Load environment variables
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  // dotenv not installed, assume env vars are set
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.error('   Set these in your .env file');
  process.exit(1);
}

// The 36 exercises from your PPL program (from exercises-list.txt)
const PPL_EXERCISE_NAMES = [
  // Push Day - Chest Focus
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Dumbbell Flyes',
  'Overhead Press',
  'Lateral Raises',
  'Tricep Pushdowns',
  // Push Day - Shoulder Focus
  'Incline Barbell Bench Press',
  'Seated Dumbbell Press', // Listed as "Dumbbell Shoulder Press" in exercises-list.txt
  'Cable Flyes',
  'Arnold Press',
  'Front Raises',
  'Overhead Tricep Extension',
  // Pull Day - Back Width Focus
  'Deadlift',
  'Pull-ups',
  'Barbell Row',
  'Lat Pulldown',
  'Face Pulls',
  'Barbell Curl',
  // Pull Day - Back Thickness Focus
  'Rack Pulls',
  'Chin-ups', // Listed as "Weighted Chin-Ups" in exercises-list.txt
  'Dumbbell Row',
  'Cable Row', // Listed as "Seated Cable Rows" in exercises-list.txt
  'Rear Delt Flyes',
  'Hammer Curl',
  // Leg Day - Quad Focus
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Romanian Deadlift',
  'Leg Curl',
  'Calf Raise', // Multiple variants exist
  // Leg Day - Hamstring Focus
  'Front Squat',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Stiff Leg Deadlift',
  'Seated Leg Curl',
  'Seated Calf Raise',
];

async function seedExercises() {
  console.log('🌱 Seeding exercises table...\n');
  
  // Create admin client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    // Filter exercise database to only include the 36 PPL exercises
    const pplExercises = exerciseDatabase.filter(ex => 
      PPL_EXERCISE_NAMES.some(name => 
        ex.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(ex.name.toLowerCase())
      )
    );
    
    console.log(`📋 Found ${pplExercises.length} exercises to seed\n`);
    
    if (pplExercises.length !== 36) {
      console.warn(`⚠️  Warning: Expected 36 exercises, but found ${pplExercises.length}`);
      console.warn('   Some exercises may not match between exercises-list.txt and exercise-database.ts');
    }
    
    // Transform to match database schema
    const exercisesToInsert = pplExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      target_muscle: ex.targetMuscle,
      equipment: null, // Can be added later
      difficulty: null, // Can be added later
      instructions: null, // Can be added later
      video_url: null, // Can be added later
      thumbnail_url: null, // Can be added later
    }));
    
    // Insert exercises (upsert to avoid duplicates)
    console.log('📥 Inserting exercises into database...\n');
    
    const { data, error } = await supabase
      .from('exercises')
      .upsert(exercisesToInsert, {
        onConflict: 'id',
        ignoreDuplicates: false, // Update if exists
      })
      .select();
    
    if (error) {
      console.error('❌ Error inserting exercises:', error);
      process.exit(1);
    }
    
    console.log(`✅ Successfully seeded ${data?.length || exercisesToInsert.length} exercises!\n`);
    
    // List seeded exercises by category
    const categories = Array.from(new Set(pplExercises.map(ex => ex.category)));
    console.log('📊 Exercises by category:');
    for (const category of categories.sort()) {
      const count = pplExercises.filter(ex => ex.category === category).length;
      console.log(`   ${category}: ${count} exercises`);
    }
    
    console.log('\n🎉 Seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    process.exit(1);
  }
}

seedExercises();
