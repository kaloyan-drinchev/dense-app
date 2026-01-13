/**
 * Seed PPL (Push/Pull/Legs) Workout Templates
 * 
 * This script populates the database with system workout templates.
 * Run with: npm run db:seed-templates
 */

import { supabase } from './supabase-client';

// PPL Workout Templates
const PPL_TEMPLATES = [
  // PUSH DAY A - Chest Focus
  {
    name: 'Push Day - Chest Focus',
    type: 'push-a',
    category: 'push',
    estimated_duration: 45,
    exercises: [
      { exercise_id: 'barbell-bench-press', sort_order: 1, target_sets: 4, target_reps: '6-8', rest_seconds: 120, notes: 'Compound movement. Focus on controlled descent and explosive push.' },
      { exercise_id: 'incline-dumbbell-press', sort_order: 2, target_sets: 3, target_reps: '8-10', rest_seconds: 90, notes: 'Set bench to 30-45 degrees. Full range of motion.' },
      { exercise_id: 'lateral-raises', sort_order: 3, target_sets: 3, target_reps: '12-15', rest_seconds: 60, notes: 'Control the weight. Lead with elbows, not hands.' },
      { exercise_id: 'tricep-pushdowns', sort_order: 4, target_sets: 3, target_reps: '10-12', rest_seconds: 60, notes: 'Keep elbows tucked. Full extension at bottom.' },
    ],
  },

  // PUSH DAY B - Shoulder Focus
  {
    name: 'Push Day - Shoulder Focus',
    type: 'push-b',
    category: 'push',
    estimated_duration: 60,
    exercises: [
      { exercise_id: 'incline-barbell-bench-press', sort_order: 1, target_sets: 4, target_reps: '6-8', rest_seconds: 120, notes: 'Set bench to 30 degrees. Drive through upper chest.' },
      { exercise_id: 'dumbbell-shoulder-press', sort_order: 2, target_sets: 4, target_reps: '8-10', rest_seconds: 90, notes: 'Press dumbbells together at top. Full range of motion.' },
      { exercise_id: 'cable-flyes', sort_order: 3, target_sets: 3, target_reps: '10-12', rest_seconds: 60, notes: 'Maintain tension throughout. Squeeze chest at peak contraction.' },
      { exercise_id: 'arnold-press', sort_order: 4, target_sets: 3, target_reps: '8-10', rest_seconds: 90, notes: 'Rotate palms as you press. Slow and controlled.' },
      { exercise_id: 'front-raises', sort_order: 5, target_sets: 3, target_reps: '12-15', rest_seconds: 60, notes: 'Raise to shoulder height. Control the descent.' },
      { exercise_id: 'tricep-dips', sort_order: 6, target_sets: 3, target_reps: '8-10', rest_seconds: 90, notes: 'Bodyweight or weighted. Lean slightly forward for chest emphasis.' },
    ],
  },

  // PULL DAY A - Back Width Focus
  {
    name: 'Pull Day - Back Width Focus',
    type: 'pull-a',
    category: 'pull',
    estimated_duration: 30,
    exercises: [
      { exercise_id: 'deadlift', sort_order: 1, target_sets: 4, target_reps: '5-6', rest_seconds: 120, notes: 'King of back exercises. Keep back neutral, drive through heels.' },
      { exercise_id: 'face-pulls', sort_order: 2, target_sets: 3, target_reps: '15-20', rest_seconds: 60, notes: 'Pull rope to face. External rotation at end.' },
    ],
  },

  // PULL DAY B - Back Thickness Focus
  {
    name: 'Pull Day - Back Thickness Focus',
    type: 'pull-b',
    category: 'pull',
    estimated_duration: 20,
    exercises: [
      { exercise_id: 'rear-delt-flyes', sort_order: 1, target_sets: 3, target_reps: '12-15', rest_seconds: 60, notes: 'Bent over or on incline bench. Lead with elbows.' },
    ],
  },

  // LEG DAY A - Quad Focus
  {
    name: 'Leg Day - Quad Focus',
    type: 'leg-a',
    category: 'legs',
    estimated_duration: 45,
    exercises: [
      { exercise_id: 'leg-press', sort_order: 1, target_sets: 3, target_reps: '10-12', rest_seconds: 90, notes: 'Full range of motion. Controlled descent.' },
      { exercise_id: 'walking-lunges', sort_order: 2, target_sets: 3, target_reps: '12-15', rest_seconds: 60, notes: 'Step far enough forward. Keep torso upright.' },
      { exercise_id: 'leg-curls', sort_order: 3, target_sets: 3, target_reps: '10-12', rest_seconds: 60, notes: 'Lying or seated. Full contraction at top.' },
      { exercise_id: 'calf-raises', sort_order: 4, target_sets: 4, target_reps: '15-20', rest_seconds: 60, notes: 'Full stretch at bottom, squeeze at top. Pause at peak.' },
    ],
  },

  // LEG DAY B - Hamstring Focus
  {
    name: 'Leg Day - Hamstring Focus',
    type: 'leg-b',
    category: 'legs',
    estimated_duration: 40,
    exercises: [
      { exercise_id: 'bulgarian-split-squats', sort_order: 1, target_sets: 3, target_reps: '10-12', rest_seconds: 90, notes: 'Rear foot elevated. Balance and control.' },
      { exercise_id: 'seated-leg-curls', sort_order: 2, target_sets: 3, target_reps: '12-15', rest_seconds: 60, notes: 'Squeeze at contraction. Slow negative.' },
      { exercise_id: 'seated-calf-raises', sort_order: 3, target_sets: 4, target_reps: '15-20', rest_seconds: 60, notes: 'Targets soleus. Full range of motion.' },
    ],
  },
];

async function seedTemplates() {
  console.log('🌱 Starting PPL template seeding...\n');

  try {
    // 1. Check if templates already exist
    const { data: existing, error: checkError } = await supabase
      .from('workout_templates')
      .select('type')
      .is('user_id', null); // System templates have NULL user_id

    if (checkError) {
      console.error('❌ Error checking existing templates:', checkError);
      throw checkError;
    }

    const existingTypes = existing?.map((t: any) => t.type) || [];
    
    if (existingTypes.length > 0) {
      console.log(`⚠️  Found ${existingTypes.length} existing system templates`);
      console.log(`   Types: ${existingTypes.join(', ')}\n`);
      console.log('⚠️  Skipping seed (templates already exist)');
      console.log('   To re-seed, first delete existing templates from the database.\n');
      return;
    }

    // 2. Insert templates and exercises
    for (const template of PPL_TEMPLATES) {
      console.log(`📝 Creating template: ${template.name}`);

      // Insert template
      const { data: newTemplate, error: templateError } = await supabase
        .from('workout_templates')
        .insert({
          user_id: null, // NULL = system template
          name: template.name,
          type: template.type,
          category: template.category,
          estimated_duration: template.estimated_duration,
        })
        .select()
        .single();

      if (templateError) {
        console.error(`   ❌ Failed to create template: ${templateError.message}`);
        throw templateError;
      }

      console.log(`   ✅ Template created: ${newTemplate.id}`);

      // Insert exercises
      console.log(`   📋 Adding ${template.exercises.length} exercises...`);
      
      for (const exercise of template.exercises) {
        const { error: exerciseError } = await supabase
          .from('template_exercises')
          .insert({
            template_id: newTemplate.id,
            ...exercise,
          });

        if (exerciseError) {
          console.error(`      ❌ Failed to add exercise: ${exerciseError.message}`);
          throw exerciseError;
        }

        console.log(`      ✅ ${exercise.exercise_id} (${exercise.target_sets}x${exercise.target_reps})`);
      }

      console.log('');
    }

    console.log('✅ PPL templates seeded successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   - ${PPL_TEMPLATES.length} workout templates created`);
    console.log(`   - ${PPL_TEMPLATES.reduce((sum, t) => sum + t.exercises.length, 0)} total exercises configured`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedTemplates };
