/**
 * Workout Session Types
 * 
 * Type definitions for the Template/Session architecture
 */

// ============================================
// TEMPLATES (Read-Only Definitions)
// ============================================

export interface WorkoutTemplate {
  id: string;
  user_id: string | null; // NULL = system template
  name: string;
  category: string | null; // 'push', 'pull', 'legs', 'cardio', 'custom'
  type: string | null; // 'push-a', 'push-b', 'pull-a', 'pull-b', 'leg-a', 'leg-b'
  estimated_duration: number | null; // minutes
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string | null; // e.g., "10", "8-12", "12-15"
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: TemplateExercise[];
}

// ============================================
// SESSIONS (Read-Write Execution)
// ============================================

export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExerciseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null; // NULL for manual/cardio
  workout_name: string;
  workout_type: string | null; // 'push-a', 'manual', 'cardio', etc.
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string; // Denormalized for history
  sort_order: number;
  status: ExerciseStatus; // Auto-calculated from sets
  target_sets: number | null;
  target_reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionExerciseWithSets extends SessionExercise {
  sets: SessionSet[];
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: SessionExerciseWithSets[];
}

// ============================================
// UI/DISPLAY TYPES
// ============================================

export interface WorkoutSummary {
  sessionId: string;
  workoutName: string;
  date: string;
  duration: number; // seconds
  totalVolume: number; // kg
  exerciseCount: number;
  completedExerciseCount: number;
}
