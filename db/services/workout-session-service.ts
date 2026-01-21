/**
 * Workout Session Service
 * 
 * Manages workout sessions using the Template/Session architecture:
 * - Templates: Read-only workout definitions
 * - Sessions: Active/completed workout instances
 */

import { supabase } from '@/config/supabase';
import type {
  WorkoutTemplate,
  TemplateExercise,
  WorkoutSession,
  SessionExercise,
  SessionSet,
  SessionExerciseWithSets,
} from '@/types/workout-session';

export const workoutSessionService = {
  /**
   * Get all workout templates (system + user's own)
   */
  async getTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to get templates:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get system templates by type (for PPL workouts)
   */
  async getSystemTemplate(type: string): Promise<WorkoutTemplate | null> {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .is('user_id', null)
      .eq('type', type)
      .single();

    if (error) {
      console.error(`❌ Failed to get system template ${type}:`, error);
      return null;
    }

    return data;
  },

  /**
   * Get template with exercises
   */
  async getTemplateWithExercises(templateId: string): Promise<{
    template: WorkoutTemplate;
    exercises: TemplateExercise[];
  } | null> {
    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('❌ Failed to get template:', templateError);
      return null;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });

    if (exercisesError) {
      console.error('❌ Failed to get template exercises:', exercisesError);
      return null;
    }

    return { template, exercises: exercises || [] };
  },

  /**
   * Start a new workout session from a template
   * This calls the RPC function that creates the session + exercises + sets
   */
  async startWorkoutSession(userId: string, templateId: string): Promise<string | null> {
    console.log(`🏋️ Starting workout session from template ${templateId}`);

    const { data, error} = await supabase
      .rpc('start_workout_session', {
        p_user_id: userId,
        p_template_id: templateId,
      });

    if (error) {
      console.error('❌ Failed to start workout session:', error);
      throw error;
    }

    console.log(`✅ Workout session created: ${data}`);
    return data; // Returns session ID
  },

  /**
   * Start a manual or cardio workout session (no template)
   * Creates session + exercises + default sets
   */
  async startManualWorkoutSession(
    userId: string, 
    workoutName: string, 
    workoutType: string, // 'manual' or 'cardio'
    exercises: Array<{
      id: string;
      name: string;
      targetSets?: number;
      targetReps?: string;
      restSeconds?: number;
      isCardio?: boolean;
    }>
  ): Promise<string | null> {
    console.log(`🏋️ Starting ${workoutType} workout session:`, workoutName);

    try {
      // 1. Create workout session (no template)
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          template_id: null, // NULL for manual/cardio
          workout_name: workoutName,
          workout_type: workoutType,
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError || !session) {
        console.error('❌ Failed to create workout session:', sessionError);
        throw sessionError;
      }

      console.log('✅ Workout session created:', session.id);

      // 2. Create session exercises
      const sessionExercises = exercises.map((ex, index) => ({
        session_id: session.id,
        exercise_id: ex.id,
        exercise_name: ex.name,
        sort_order: index + 1,
        status: 'NOT_STARTED' as const,
        target_sets: ex.targetSets || 3,
        target_reps: ex.targetReps || '10',
        rest_seconds: ex.restSeconds || 60,
        notes: ex.isCardio ? 'Cardio exercise' : null,
      }));

      const { data: insertedExercises, error: exercisesError } = await supabase
        .from('session_exercises')
        .insert(sessionExercises)
        .select();

      if (exercisesError || !insertedExercises) {
        console.error('❌ Failed to create session exercises:', exercisesError);
        throw exercisesError;
      }

      console.log('✅ Created exercises:', insertedExercises.length);

      // 3. Create default sets for each exercise (3 sets with default values)
      const defaultSets: any[] = [];
      insertedExercises.forEach((exercise) => {
        const targetSets = exercise.target_sets || 3;
        for (let i = 1; i <= targetSets; i++) {
          defaultSets.push({
            session_exercise_id: exercise.id,
            set_number: i,
            weight_kg: 10, // Default weight
            reps: 10, // Default reps
            is_completed: false,
          });
        }
      });

      const { error: setsError } = await supabase
        .from('session_sets')
        .insert(defaultSets);

      if (setsError) {
        console.error('❌ Failed to create default sets:', setsError);
        throw setsError;
      }

      console.log('✅ Created default sets:', defaultSets.length);
      console.log('✅ Manual workout session fully initialized:', session.id);

      return session.id;
    } catch (error) {
      console.error('❌ Failed to start manual workout session:', error);
      throw error;
    }
  },

  /**
   * Get active workout session (status = IN_PROGRESS)
   */
  async getActiveSession(userId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'IN_PROGRESS')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Failed to get active session:', error);
      return null;
    }

    return data;
  },

  /**
   * Get session with exercises and sets
   */
  async getSessionWithExercises(sessionId: string): Promise<{
    session: WorkoutSession;
    exercises: (SessionExercise & { sets: SessionSet[] })[];
  } | null> {
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Failed to get session:', sessionError);
      return null;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });

    if (exercisesError) {
      console.error('❌ Failed to get session exercises:', exercisesError);
      return null;
    }

    // Get sets for each exercise
    const exercisesWithSets = await Promise.all(
      (exercises || []).map(async (exercise) => {
        const { data: sets, error: setsError } = await supabase
          .from('session_sets')
          .select('*')
          .eq('session_exercise_id', exercise.id)
          .order('set_number', { ascending: true });

        if (setsError) {
          console.error('❌ Failed to get sets:', setsError);
          return { ...exercise, sets: [] };
        }

        return { ...exercise, sets: sets || [] };
      })
    );

    return { session, exercises: exercisesWithSets };
  },

  /**
   * Update a session set
   */
  async updateSet(setId: string, updates: Partial<SessionSet>): Promise<boolean> {
    const { error } = await supabase
      .from('session_sets')
      .update(updates)
      .eq('id', setId);

    if (error) {
      console.error('❌ Failed to update set:', error);
      return false;
    }

    return true;
  },

  /**
   * Update session exercise status
   */
  async updateExerciseStatus(sessionId: string, exerciseId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'): Promise<boolean> {
    const { error } = await supabase
      .from('session_exercises')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('exercise_id', exerciseId);

    if (error) {
      console.error('❌ Failed to update exercise status:', error);
      return false;
    }

    console.log(`✅ Exercise ${exerciseId} status updated to ${status}`);
    return true;
  },

  /**
   * Complete a workout session
   */
  async completeSession(sessionId: string, durationSeconds: number, totalVolumeKg: number): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        total_volume_kg: totalVolumeKg,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Failed to complete session:', error);
      return false;
    }

    console.log(`✅ Session ${sessionId} completed`);
    return true;
  },

  /**
   * Cancel a workout session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'CANCELLED',
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Failed to cancel session:', error);
      return false;
    }

    console.log(`✅ Session ${sessionId} cancelled`);
    return true;
  },

  /**
   * Get workout history (completed sessions)
   */
  async getWorkoutHistory(userId: string, limit: number = 20): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to get workout history:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Delete a workout session (and all related data via CASCADE)
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Failed to delete session:', error);
      return false;
    }

    return true;
  },
};
