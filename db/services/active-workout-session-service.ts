/**
 * Active Workout Session Service
 * 
 * Manages temporary workout session data while a workout is in progress.
 * Sessions are created when a workout starts and deleted when skipped/cancelled.
 * When a workout is completed, the session data is moved to permanent storage.
 */

import { supabase } from '@/config/supabase';

export interface ActiveSessionData {
  workoutTemplate?: any; // Full workout template (exercises with sets/reps/rest)
  exercises: {
    [exerciseId: string]: {
      completed: boolean;
      sets: Array<{
        setNumber: number;
        weightKg: number;
        reps: number;
        isCompleted: boolean;
      }>;
    };
  };
  startTime: string; // ISO timestamp
  lastUpdated: string; // ISO timestamp
}

export const activeWorkoutSessionService = {
  /**
   * Create a new active workout session
   */
  async create(userId: string, workoutType: string, workoutName: string): Promise<any> {
    try {
      console.log(`📝 [ActiveSession] Creating new session: ${workoutType} for user ${userId}`);
      
      const sessionData: ActiveSessionData = {
        exercises: {},
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('active_workout_sessions')
        .insert({
          user_id: userId,
          workout_type: workoutType,
          workout_name: workoutName,
          started_at: new Date().toISOString(),
          session_data: sessionData,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [ActiveSession] Error creating session:', error);
        throw error;
      }

      console.log(`✅ [ActiveSession] Session created:`, data.id);
      return data;
    } catch (error) {
      console.error('❌ [ActiveSession] Failed to create session:', error);
      throw error;
    }
  },

  /**
   * Get active session for a user
   */
  async getActive(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('active_workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no active session
          return null;
        }
        console.error('❌ [ActiveSession] Error fetching session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ [ActiveSession] Failed to get active session:', error);
      return null;
    }
  },

  /**
   * Update session data (exercise completion, sets, etc.)
   */
  async updateSessionData(sessionId: string, sessionData: ActiveSessionData): Promise<void> {
    try {
      sessionData.lastUpdated = new Date().toISOString();

      const { error } = await supabase
        .from('active_workout_sessions')
        .update({
          session_data: sessionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        console.error('❌ [ActiveSession] Error updating session:', error);
        throw error;
      }

      console.log(`✅ [ActiveSession] Session updated:`, sessionId);
    } catch (error) {
      console.error('❌ [ActiveSession] Failed to update session:', error);
      throw error;
    }
  },

  /**
   * Delete active session (on skip/cancel)
   */
  async delete(userId: string): Promise<void> {
    try {
      console.log(`🗑️ [ActiveSession] Deleting session for user ${userId}`);

      const { error } = await supabase
        .from('active_workout_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [ActiveSession] Error deleting session:', error);
        throw error;
      }

      console.log(`✅ [ActiveSession] Session deleted`);
    } catch (error) {
      console.error('❌ [ActiveSession] Failed to delete session:', error);
      throw error;
    }
  },

  /**
   * Delete all active sessions for a user (cleanup)
   */
  async deleteAll(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('active_workout_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [ActiveSession] Error deleting all sessions:', error);
        throw error;
      }

      console.log(`✅ [ActiveSession] All sessions deleted for user`);
    } catch (error) {
      console.error('❌ [ActiveSession] Failed to delete all sessions:', error);
      throw error;
    }
  },
};
