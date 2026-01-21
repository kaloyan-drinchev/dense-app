# Apply Exercises RLS Policy

This guide explains how to apply the Row Level Security (RLS) policy for the `exercises` table.

## What This Does

- ✅ Enables RLS on the `public.exercises` table
- ✅ Allows **everyone** to READ exercises (needed for users to build custom workouts)
- ❌ Prevents users from creating/modifying/deleting exercises
- ✅ Only admins (with service role key) can manage exercises

## Option 1: Run the Migration Script (Recommended)

```bash
# Make sure you have DATABASE_URL set in your .env file
npm run apply-rls
# or
npx tsx scripts/apply-rls-policies.ts
```

This will apply all migration files including the new `0010_exercises_rls.sql`.

## Option 2: Apply Directly in Supabase Dashboard

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `db/migrations/postgres/0010_exercises_rls.sql`
3. Paste and run it

The SQL is:

```sql
-- Enable RLS on exercises table
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow everyone to READ exercises (needed for users to build custom workouts)
CREATE POLICY "Allow public read access to exercises" 
ON public.exercises 
FOR SELECT 
TO public 
USING (true);
```

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'exercises';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'exercises';
```

You should see:
- `rowsecurity = true`
- One policy: "Allow public read access to exercises" for SELECT

## What Changed

1. **Created**: `db/migrations/postgres/0010_exercises_rls.sql` - RLS policy migration
2. **Updated**: `scripts/apply-rls-policies.ts` - Added migration to the list
3. **Updated**: `db/schema-postgres.ts` - Added exercises table definition

## Security Model

Now your exercises table follows this security model:

| Action | Allowed For | Notes |
|--------|-------------|-------|
| SELECT (Read) | Everyone (public) | Users need to see exercises to build workouts |
| INSERT | Admin only | Only you can add exercises via service role key |
| UPDATE | Admin only | Only you can modify exercises |
| DELETE | Admin only | Only you can delete exercises |

Users can create custom workouts using these exercises, but cannot modify the exercise library itself.

## Seed the Exercises Table

After applying the RLS policy, you need to populate the exercises table with the 36 strength exercises:

```bash
npm run db:seed-exercises
# or
npx tsx scripts/seed-exercises.ts
```

This will:
- Load the 36 exercises from your exercise database that match your PPL program
- Insert them into the `public.exercises` table
- Use the service role key (admin access) to bypass RLS during seeding

The seed script will show you how many exercises were seeded and break them down by category.
