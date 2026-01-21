# Seed Exercises Guide

This guide explains how to populate your exercises table with the 36 strength exercises from your PPL program.

## Prerequisites

Before running the seed script, make sure you have:

1. ✅ **Applied the RLS policy** (run `npm run db:apply-rls` first)
2. ✅ **Set up your environment variables** in `.env` file

## Required Environment Variables

Your `.env` file must contain:

```bash
# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Important:** The service role key is required because it bypasses RLS. Get it from:
- Supabase Dashboard → Settings → API → `service_role` key (secret)

## Run the Seed Script

```bash
npm run db:seed-exercises
```

Or directly:

```bash
npx tsx scripts/seed-exercises.ts
```

## What It Does

The script will:

1. 🔍 Load the 36 exercises from `constants/exercise-database.ts`
2. 🎯 Filter to only the exercises used in your PPL program
3. 📥 Insert them into the `public.exercises` table
4. 🔄 Upsert (update if exists, insert if new) to avoid duplicates

## Expected Output

```bash
🌱 Seeding exercises table...

📋 Found 36 exercises to seed

📥 Inserting exercises into database...

✅ Successfully seeded 36 exercises!

📊 Exercises by category:
   Arms: 2 exercises
   Back: 6 exercises
   Chest: 3 exercises
   Legs: 12 exercises
   Shoulders: 13 exercises

🎉 Seed completed successfully!
```

## The 36 Exercises

### Push Day - Chest Focus (6)
1. Barbell Bench Press
2. Incline Dumbbell Press
3. Dumbbell Flyes
4. Overhead Press
5. Lateral Raises
6. Tricep Pushdowns

### Push Day - Shoulder Focus (6)
1. Incline Barbell Bench Press
2. Seated Dumbbell Press
3. Cable Flyes
4. Arnold Press
5. Front Raises
6. Overhead Tricep Extension

### Pull Day - Back Width Focus (6)
1. Deadlift
2. Pull-ups
3. Barbell Row
4. Lat Pulldown
5. Face Pulls
6. Barbell Curl

### Pull Day - Back Thickness Focus (6)
1. Rack Pulls
2. Chin-ups
3. Dumbbell Row
4. Cable Row
5. Rear Delt Flyes
6. Hammer Curl

### Leg Day - Quad Focus (6)
1. Barbell Squat
2. Leg Press
3. Walking Lunges
4. Romanian Deadlift
5. Leg Curl
6. Calf Raise

### Leg Day - Hamstring Focus (6)
1. Front Squat
2. Bulgarian Split Squat
3. Hack Squat
4. Stiff Leg Deadlift
5. Seated Leg Curl
6. Seated Calf Raise

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
-- Check count
SELECT COUNT(*) as total_exercises FROM public.exercises;

-- View all exercises
SELECT id, name, category, target_muscle 
FROM public.exercises 
ORDER BY category, name;

-- Count by category
SELECT category, COUNT(*) as count 
FROM public.exercises 
GROUP BY category 
ORDER BY category;
```

You should see 36 exercises total.

## Re-running the Seed

The script uses `upsert`, so you can safely run it multiple times:
- Existing exercises will be updated
- New exercises will be inserted
- No duplicates will be created

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"
- Make sure you've added the service role key to your `.env` file
- Get it from Supabase Dashboard → Settings → API

### Error: "relation 'public.exercises' does not exist"
- The exercises table hasn't been created yet
- Run: `npm run db:apply-rls` first to apply the schema

### Warning: "Expected 36 exercises, but found X"
- Some exercises in `exercises-list.txt` may not match `exercise-database.ts`
- Check the console output to see which exercises were found
- You may need to update the mapping in `seed-exercises.ts`

## Next Steps

After seeding:
1. ✅ Verify exercises are in the database (SQL query above)
2. ✅ Test reading exercises in your app
3. ✅ Users can now build custom workouts with these exercises!
