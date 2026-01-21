# Workout System Refactoring - Migration Guide

## 🎯 Goal
Separate **Workout Definitions** (templates) from **Workout Execution** (sessions) to fix state management issues where completed exercises incorrectly show as completed in new workouts.

## ✅ Files Created

### 1. Database Migrations
- `db/migrations/postgres/0013_workout_refactor_templates_and_sessions.sql`
  - Creates: `workout_templates`, `template_exercises`, `workout_sessions`, `session_exercises`, `session_sets`
  - RLS policies for all tables
  - Auto-update triggers for exercise status

- `db/migrations/postgres/0014_rpc_start_workout_session.sql`
  - RPC function to start a workout (creates fresh session from template)

### 2. Service Layer
- `db/services/workout-session-service.ts`
  - Full CRUD for templates and sessions
  - Methods: `getTemplates()`, `startWorkoutSession()`, `getActiveSession()`, `completeSession()`, etc.

### 3. Type Definitions
- `types/workout-session.ts`
  - TypeScript interfaces for all new tables
  - Clear separation between templates and sessions

### 4. Seed Script
- `scripts/seed-ppl-templates.ts`
  - Populates system PPL templates into database
  - Run with: `npm run db:seed-templates`

## 🚀 Migration Steps

### Step 1: Run Database Migrations
```bash
# In Supabase SQL Editor, run in this order:
1. db/migrations/postgres/0013_workout_refactor_templates_and_sessions.sql
2. db/migrations/postgres/0014_rpc_start_workout_session.sql
```

### Step 2: Seed PPL Templates
```bash
npm run db:seed-templates
```

### Step 3: Test the System
1. Open app and verify templates load
2. Start a workout → should create new session
3. Complete exercises → status should update correctly
4. Complete workout → session status = COMPLETED
5. Start same workout again → should be fresh (0/3 sets, not completed)

## 📊 New Architecture

### Templates (Read-Only)
```
workout_templates
├── template_exercises
    └── references exercises (name, thumbnail, video)
```

### Sessions (Read-Write)
```
workout_sessions
├── session_exercises
    └── session_sets (is_completed = false by default)
```

## 🔑 Key Features

### 1. Fresh Start Every Time
- When you start a workout, `start_workout_session()` creates **NEW** rows
- All `is_completed` flags are `FALSE` by default
- Impossible to have "completed from last week" because rows are brand new

### 2. Auto-Status Updates
- When user checks a set → trigger recalculates exercise status
- 0 completed = NOT_STARTED
- Some completed = IN_PROGRESS
- All completed = COMPLETED

### 3. Unified History
- No separate "finished workouts" table
- History = query `workout_sessions WHERE status = 'COMPLETED'`

## 🎯 Next Steps (TODO)

### Frontend Refactoring Needed:
1. **Update `workout-session.tsx`**:
   - Remove old `userProgressData` logic
   - Call `workoutSessionService.startWorkoutSession()` on "Start Workout"
   - Load session data via `getSessionWithExercises()`
   - Update sets via `updateSet()`

2. **Update `ExerciseTracker.tsx`**:
   - Accept `sessionExerciseId` and `sessionSets` props
   - Save directly to `session_sets` table (not old progress structure)

3. **Update `app/(tabs)/index.tsx`**:
   - Load active session via `getActiveSession()`
   - Show correct completed sets from `session_exercises`

4. **Update `finished-workouts.tsx`**:
   - Query `workout_sessions WHERE status = 'COMPLETED'`
   - Show session history

5. **Manual Workouts**:
   - Create template on-the-fly with `user_id` set
   - Start session immediately
   - Template is one-time (or can be saved for reuse)

6. **Cardio Workouts**:
   - Create cardio template with single exercise
   - Same session flow as regular workouts
   - Timer displayed alongside

## 🗑️ Old Tables to Deprecate (After Migration)
- `user_progress.weeklyWeights.exerciseLogs` (replaced by `session_sets`)
- `active_workout_sessions.session_data` (replaced by proper tables)

## 🔍 Testing Checklist
- [ ] Start PPL workout → creates session
- [ ] Complete set → checkbox works, status updates
- [ ] Complete exercise → moves to next exercise
- [ ] Complete workout → saves to history
- [ ] Start same workout again → fresh state (0 completed)
- [ ] Manual workout → creates template + session
- [ ] Cardio workout → single exercise with timer
- [ ] Cancel workout → session status = CANCELLED
- [ ] View history → shows all completed sessions
- [ ] Skip workout → doesn't affect history

---

**Status**: Database migrations ready, service layer created, types defined.
**Next**: Update UI components to use new architecture.
