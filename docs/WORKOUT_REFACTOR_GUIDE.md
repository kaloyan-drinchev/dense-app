# Workout System Refactoring Guide

## Overview

This refactoring implements a **clean separation between Workout Definitions (Templates) and Workout Execution (Sessions)**. This solves the state management issues where exercises were showing as "completed" when starting a fresh workout.

## Architecture

### Before (Old System)
- Mixed templates and state in `active_workout_sessions`
- Used JSON blobs for exercise data
- State contamination issues (exercises marked completed across workouts)

### After (New System)
```
Templates (Read-Only)          Sessions (Read-Write)
├── workout_templates          ├── workout_sessions
└── template_exercises         ├── session_exercises
                               └── session_sets
```

## Files Created

### 1. Database Migrations
- `db/migrations/postgres/0013_workout_refactor_templates_and_sessions.sql` - Schema
- `db/migrations/postgres/0014_workout_session_rpc_functions.sql` - RPC functions
- `db/migrations/postgres/0015_seed_ppl_workout_templates.sql` - PPL seed data

### 2. TypeScript Types
- `types/workout-session.ts` - All interfaces for new system

### 3. Services
- `db/services/workout-session-service.ts` - Complete service layer
- `db/services.ts` - Updated to export new service

## How to Apply

### Step 1: Run Migrations

In Supabase SQL Editor, run these 3 files in order:

```sql
-- 1. Create tables and triggers
\i db/migrations/postgres/0013_workout_refactor_templates_and_sessions.sql

-- 2. Create RPC functions
\i db/migrations/postgres/0014_workout_session_rpc_functions.sql

-- 3. Seed PPL templates
\i db/migrations/postgres/0015_seed_ppl_workout_templates.sql
```

Or copy-paste each file's contents into the SQL Editor.

### Step 2: Verify in Supabase

Check that tables exist:
```sql
SELECT * FROM public.workout_templates WHERE user_id IS NULL;
-- Should return 6 PPL templates
```

### Step 3: Update Frontend Code

The service is already exported. Import it like:

```typescript
import { workoutSessionService } from '@/db/services';
```

## Key Service Methods

### Starting Workouts

```typescript
// From a template (PPL workouts)
const sessionId = await workoutSessionService.startWorkoutFromTemplate(
  userId,
  'push-a-system'
);

// Manual workout
const sessionId = await workoutSessionService.startManualWorkout({
  user_id: userId,
  workout_name: 'Custom Workout',
  workout_type: 'manual',
  exercises: [
    {
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      target_sets: 3,
      target_reps: '10',
      rest_seconds: 60,
    },
  ],
});
```

### Getting Active Session

```typescript
const session = await workoutSessionService.getActiveSession(userId);
// Returns: WorkoutSessionWithExercises (full session data)
```

### Updating Sets

```typescript
await workoutSessionService.updateSet(setId, {
  weight_kg: 50,
  reps: 10,
  is_completed: true,
});
```

### Completing/Cancelling

```typescript
await workoutSessionService.completeSession(sessionId, userId);
await workoutSessionService.cancelSession(sessionId, userId);
```

### Getting History

```typescript
const history = await workoutSessionService.getWorkoutHistory(userId, 30);
// Returns completed sessions
```

## How It Solves the "Completed Exercise" Bug

### The Problem
Old system stored completion state globally, so when you started a workout:
- App checked: "Did user complete Bench Press?" ✅ Yes (from last week)
- Result: Exercise showed as completed on a fresh workout

### The Solution
Every time you start a workout, the RPC function creates **brand new rows**:

```sql
-- Creates fresh session
INSERT INTO workout_sessions (status) VALUES ('IN_PROGRESS');

-- Creates fresh exercises
INSERT INTO session_exercises (status) VALUES ('NOT_STARTED');

-- Creates fresh sets (is_completed = FALSE)
INSERT INTO session_sets (is_completed) VALUES (FALSE);
```

**It's physically impossible for these new rows to have data from last week.**

### Auto-Update Trigger
When a user checks a checkbox (updates a set), a trigger automatically updates the exercise status:

- **All unchecked** → Exercise status = `NOT_STARTED`
- **Some checked** → Exercise status = `IN_PROGRESS`
- **All checked** → Exercise status = `COMPLETED`

## Migration Strategy

### Option A: Gradual Migration (Recommended)
1. Keep old `active_workout_sessions` table
2. New workouts use new system
3. Existing active workouts can finish with old system
4. After 1-2 days, delete old table

### Option B: Clean Break
1. Run migrations
2. Cancel all active workouts: `UPDATE active_workout_sessions SET status = 'CANCELLED'`
3. Users start fresh

## PPL Templates in Database

The seed file creates 6 system templates:

| Template ID | Name | Category | Exercises |
|------------|------|----------|-----------|
| push-a-system | Push Day - Chest Focus | push | 4 |
| push-b-system | Push Day - Shoulder Focus | push | 6 |
| pull-a-system | Pull Day - Back Width Focus | pull | 2 |
| pull-b-system | Pull Day - Back Thickness Focus | pull | 1 |
| leg-a-system | Leg Day - Quad Focus | legs | 4 |
| leg-b-system | Leg Day - Hamstring Focus | legs | 3 |

## Next Steps

### Frontend Updates Needed:

1. **Home Screen (`app/(tabs)/index.tsx`)**
   - Replace `activeWorkoutSessionService` with `workoutSessionService`
   - Query active session for banner

2. **Workout Session Screen (`app/workout-session.tsx`)**
   - Call `startWorkoutFromTemplate()` on "Start Workout"
   - Load session data using `getActiveSession()`
   - Update sets using `updateSet()`

3. **Workout Exercise Tracker (`app/workout-exercise-tracker.tsx`)**
   - Read from `session_sets` table
   - Status is auto-calculated by trigger

4. **Finished Workouts (`app/finished-workouts.tsx`)**
   - Query `getWorkoutHistory()` instead of old structure

5. **Manual Workouts (`app/manual-workout.tsx`)**
   - Call `startManualWorkout()` with exercises

6. **Remove Old Code**
   - After migration, can delete `active-workout-session-service.ts`
   - Remove old `active_workout_sessions` table from database

## Testing Checklist

- [ ] Migrations run without errors
- [ ] 6 templates appear in database
- [ ] Can start workout from template
- [ ] Sets created with `is_completed = FALSE`
- [ ] Checking a set updates exercise status automatically
- [ ] Completing workout calculates duration & volume
- [ ] History shows completed workouts
- [ ] Manual workouts work
- [ ] Cardio workouts work
- [ ] No "pre-completed" exercises on fresh workouts

## Rollback Plan

If issues occur:

```sql
-- Rollback: Drop new tables
DROP TABLE IF EXISTS public.session_sets CASCADE;
DROP TABLE IF EXISTS public.session_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.template_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_templates CASCADE;
```

Then restore old system.

## Questions?

This is a major architectural change. If anything is unclear or needs adjustment, review the following files:

- Schema: `0013_workout_refactor_templates_and_sessions.sql`
- RPC Functions: `0014_workout_session_rpc_functions.sql`
- Service: `db/services/workout-session-service.ts`
- Types: `types/workout-session.ts`
