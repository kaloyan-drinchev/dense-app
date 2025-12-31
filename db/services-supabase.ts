/**
 * Database Services - Supabase Implementation
 * 
 * All database operations using Supabase REST API
 * Replaces SQLite-based services
 */

import { supabase, supabaseAdmin } from '@/config/supabase';
import type {
  UserProfile,
  NewUserProfile,
  Program,
  NewProgram,
  UserProgress,
  NewUserProgress,
  DailyLog,
  NewDailyLog,
  CustomMeal,
  NewCustomMeal,
  UserWizardResults,
  NewUserWizardResults,
  SyncStatus,
} from './schema-postgres';

// Helper to generate a proper UUID v4
function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers/Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Helper to get current user ID (lazy import to avoid circular dependency)
function getCurrentUserId(): string {
  try {
    // Lazy import to break circular dependency
    const { useAuthStore } = require('@/store/auth-store');
    const authStore = useAuthStore.getState();
    return authStore.user?.id || '';
  } catch {
    return '';
  }
}

// Helper to convert camelCase to snake_case for Supabase column names
function toSnakeCase(str: string): string {
  // Handle single-word keys (like 'id', 'name') - don't add underscore
  if (str === str.toLowerCase()) return str;
  // Convert camelCase to snake_case: updatedAt -> updated_at, weeklyWeights -> weekly_weights
  return str.replace(/[A-Z]/g, (letter, index) => {
    // Don't add underscore before first character
    return index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`;
  });
}

// Helper to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper to convert object keys from camelCase to snake_case (for inserts/updates)
function convertToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString(); // Convert Date to ISO string
  if (Array.isArray(obj)) return obj.map(convertToSnakeCase);
  // Handle primitive types (string, number, boolean) - don't convert
  if (typeof obj !== 'object') return obj;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = convertToSnakeCase(value);
  }
  return result;
}

// Helper to convert object keys from snake_case to camelCase (for responses)
function convertToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertToCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = convertToCamelCase(value);
  }
  return result;
}

// Helper to handle Supabase errors
function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`${operation} failed: ${error.message || 'Unknown error'}`);
}

// User Profile Operations
export const userProfileService = {
  async create(profile: (Omit<NewUserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) | NewUserProfile): Promise<UserProfile> {
    // Allow passing id directly (for first-time setup) or get from auth store
    const profileWithId = profile as any;
    let userId = profileWithId.id || getCurrentUserId();
    
    // If no ID provided, generate one
    if (!userId) {
      userId = generateUUID();
    }
    
    // Validate UUID format - if invalid, generate a new one (handles cached code issues)
    if (!isValidUUID(userId)) {
      console.warn(`⚠️ Invalid UUID format detected: "${userId}". Generating new UUID.`);
      console.warn(`   This usually means cached code is running. Please restart the app.`);
      userId = generateUUID();
    }
    
    // Remove id from profile if it exists (we'll set it explicitly)
    const { id: _, ...profileWithoutId } = profileWithId;
    
    const newProfile: NewUserProfile = {
      id: userId,
      ...profileWithoutId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert camelCase to snake_case for Supabase
    const profileForSupabase = convertToSnakeCase(newProfile);
    
    // Use regular client - RLS policy allows unauthenticated inserts for first-time setup
    // supabaseAdmin is only used if available (server-side), otherwise falls back to regular client
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('user_profiles')
      .insert(profileForSupabase)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create user profile');
    // Convert snake_case response back to camelCase
    return convertToCamelCase(data) as UserProfile;
  },

  async getById(id: string): Promise<UserProfile | undefined> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      handleSupabaseError(error, 'get user profile');
    }
    return data ? convertToCamelCase(data) as UserProfile : undefined;
  },

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const updateData = convertToSnakeCase({ ...updates, updatedAt: new Date() });
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'update user profile');
    return data ? convertToCamelCase(data) as UserProfile : undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete user profile');
  },

  async getAll(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) handleSupabaseError(error, 'get all user profiles');
    return data || [];
  },

  async deleteAll(): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) handleSupabaseError(error, 'delete all user profiles');
  },
};

// Programs Operations
export const programService = {
  async create(program: Omit<NewProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> {
    const newProgram: NewProgram = {
      id: generateUUID(),
      ...program,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const { data, error } = await supabase
      .from('programs')
      .insert(newProgram)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create program');
    return data;
  },

  async getById(id: string): Promise<Program | undefined> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get program');
    }
    return data || undefined;
  },

  async getAll(): Promise<Program[]> {
    const { data, error } = await supabase
      .from('programs')
      .select('*');
    
    if (error) handleSupabaseError(error, 'get all programs');
    return data || [];
  },

  async update(id: string, updates: Partial<Program>): Promise<Program | undefined> {
    const { data, error } = await supabase
      .from('programs')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'update program');
    return data || undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete program');
  },

  async bulkInsert(programList: Omit<NewProgram, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Program[]> {
    const newPrograms: NewProgram[] = programList.map(program => ({
      id: generateUUID(),
      ...program,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const { data, error } = await supabase
      .from('programs')
      .insert(newPrograms)
      .select();
    
    if (error) handleSupabaseError(error, 'bulk insert programs');
    return data || [];
  },

  async deleteAll(): Promise<void> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) handleSupabaseError(error, 'delete all programs');
  },
};

// User Progress Operations
export const userProgressService = {
  async create(progress: Omit<NewUserProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProgress> {
    const newProgress: NewUserProgress = {
      id: generateUUID(),
      ...progress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert camelCase to snake_case for Supabase
    const progressForSupabase = convertToSnakeCase(newProgress);
    
    const { data, error } = await supabase
      .from('user_progress')
      .insert(progressForSupabase)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create user progress');
    // Convert snake_case response back to camelCase
    return convertToCamelCase(data) as UserProgress;
  },

  async getByUserId(userId: string): Promise<UserProgress | undefined> {
    // Get the LATEST progress record if multiple exist (order by created_at DESC)
    // This fixes the issue where multiple progress records exist for the same user
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      handleSupabaseError(error, 'get user progress');
      return undefined;
    }
    
    // Return the first (latest) record
    if (!data || data.length === 0) return undefined;
    
    return convertToCamelCase(data[0]) as UserProgress;
  },

  async getByUserAndProgram(userId: string, programId: string): Promise<UserProgress | undefined> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get user progress by program');
    }
    return data || undefined;
  },

  async update(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    // Remove updatedAt from updates if present (we'll add it ourselves as updated_at)
    const { updatedAt: _ignored, ...updatesWithoutTimestamp } = updates;
    
    // Convert camelCase to snake_case for all fields
    const convertedUpdates = convertToSnakeCase(updatesWithoutTimestamp);
    
    // Explicitly add updated_at timestamp (already in snake_case)
    const updatesForSupabase = {
      ...convertedUpdates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_progress')
      .update(updatesForSupabase)
      .eq('id', id)
      .select();
    
    if (error) {
      // Handle the case where update returns zero rows
      if (error.code === 'PGRST116' || error.message?.includes('single')) {
        console.warn(`⚠️ userProgressService.update: No row found with id ${id}`);
        return undefined;
      }
      handleSupabaseError(error, 'update user progress');
    }
    
    // Handle case where no rows were updated
    if (!data || data.length === 0) {
      console.warn(`⚠️ userProgressService.update: Update affected zero rows for id ${id}`);
      return undefined;
    }
    
    // Return the first (and should be only) row
    return convertToCamelCase(data[0]) as UserProgress;
  },

  async getWeeklyWeightsByUserId(userId: string): Promise<any> {
    const progress = await this.getByUserId(userId);
    if (!progress) return {};
    
    try {
      const parsed = progress.weeklyWeights || {};
      if (Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (error) {
      return {};
    }
  },

  async getLastExerciseSession(userId: string, exerciseId: string): Promise<
    | { date: string; unit: 'kg' | 'lb'; sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }> }
    | null
  > {
    const data = await this.getWeeklyWeightsByUserId(userId);
    const sessions = data?.exerciseLogs?.[exerciseId] as any[] | undefined;
    if (!sessions || sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => (a.date > b.date ? 1 : -1));
    return sorted[sorted.length - 1];
  },

  async getTodayExerciseSession(userId: string, exerciseId: string, dateISO?: string): Promise<
    | { date: string; unit: 'kg' | 'lb'; sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }> }
    | null
  > {
    const today = (dateISO || new Date().toISOString()).slice(0, 10);
    const data = await this.getWeeklyWeightsByUserId(userId);
    const sessions = data?.exerciseLogs?.[exerciseId] as any[] | undefined;
    if (!sessions || sessions.length === 0) return null;
    
    // Simple: Just find session for today's date
    const todaySession = sessions.find(session => session.date === today);
    return todaySession || null;
  },

  async upsertTodayExerciseSession(
    userId: string,
    exerciseId: string,
    payload: { unit: 'kg' | 'lb'; sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }> },
    dateISO?: string
  ): Promise<void> {
    let progress = await this.getByUserId(userId);
    if (!progress) {
      const created = await this.create({
        userId,
        programId: null, // No program assigned yet
        currentWorkout: 'push-a', // Start with Push Day A
        lastCompletedWorkout: null,
        lastWorkoutDate: null,
        startDate: new Date(),
        completedWorkouts: [],
        weeklyWeights: {},
      } as any);
      progress = created || (await this.getByUserId(userId));
      if (!progress) {
        console.error('❌ Failed to create or retrieve user progress for userId:', userId);
        return;
      }
    }

    // Verify the progress ID exists before updating
    if (!progress.id) {
      console.error('❌ Progress object missing ID:', progress);
      return;
    }

    const today = (dateISO || new Date().toISOString()).slice(0, 10);
    let data: any = progress.weeklyWeights || {};
    
    // Parse if it's a string (JSONB can return as string or object)
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error('❌ Failed to parse weeklyWeights:', e);
        data = {};
      }
    }
    
    if (Array.isArray(data)) {
      data = {};
    }

    if (!data.exerciseLogs) {
      data.exerciseLogs = {};
    }
    if (!data.exerciseLogs[exerciseId]) {
      data.exerciseLogs[exerciseId] = [];
    }

    const sessions: any[] = data.exerciseLogs[exerciseId];
    
    // Find if we already have a session for today
    const idx = sessions.findIndex((s) => s.date === today);
    const newSession = { date: today, unit: payload.unit, sets: payload.sets };
    
    if (idx >= 0) {
      sessions[idx] = newSession;
    } else {
      sessions.push(newSession);
    }

    const updateResult = await this.update(progress.id, { weeklyWeights: data });
    if (!updateResult) {
      // If update failed, try to get fresh progress and retry once
      console.warn(`⚠️ Update failed for progress.id ${progress.id}, fetching fresh progress and retrying...`);
      const freshProgress = await this.getByUserId(userId);
      if (freshProgress && freshProgress.id) {
        console.log(`🔄 Retrying with fresh progress ID: ${freshProgress.id}`);
        const retryResult = await this.update(freshProgress.id, { weeklyWeights: data });
        if (!retryResult) {
          console.error('❌ Retry also failed - data not saved!');
          throw new Error(`Failed to save exercise data for ${exerciseId}`);
        } else {
          console.log('✅ Retry succeeded!');
        }
      } else {
        console.error('❌ Failed to get fresh progress for retry');
        throw new Error(`Could not retrieve progress record for user ${userId}`);
      }
    } else {
      console.log('✅ Initial update succeeded!');
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete user progress');
  },

  async getAll(): Promise<UserProgress[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'get all user progress');
    return data || [];
  },

  async deleteAll(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'delete all user progress');
  },
};

// Daily Logs Operations
export const dailyLogService = {
  async create(log: Omit<NewDailyLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyLog> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');
    
    const newLog: NewDailyLog = {
      id: generateUUID(),
      userId: userId,
      ...log,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert camelCase to snake_case for Supabase
    const logForSupabase = convertToSnakeCase(newLog);
    
    const { data, error } = await supabase
      .from('daily_logs')
      .insert(logForSupabase)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create daily log');
    return data;
  },

  async getByDate(date: string): Promise<DailyLog | undefined> {
    const userId = getCurrentUserId();
    if (!userId) return undefined;
    
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get daily log');
    }
    return data || undefined;
  },

  async getByUserAndDate(userId: string, date: string): Promise<DailyLog | undefined> {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get daily log');
    }
    return data || undefined;
  },

  async getByUserId(userId: string): Promise<DailyLog[]> {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) handleSupabaseError(error, 'get daily logs by user');
    return data || [];
  },

  async update(id: string, updates: Partial<DailyLog>): Promise<DailyLog | undefined> {
    const { data, error } = await supabase
      .from('daily_logs')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'update daily log');
    return data || undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete daily log');
  },


  async deleteAll(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'delete all daily logs');
  },
};

// Custom Meals Operations
export const customMealService = {
  async create(meal: Omit<NewCustomMeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomMeal> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated');
    
    const newMeal: NewCustomMeal = {
      id: generateUUID(),
      userId: userId,
      ...meal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert camelCase to snake_case for Supabase
    const mealForSupabase = convertToSnakeCase(newMeal);
    
    const { data, error } = await supabase
      .from('custom_meals')
      .insert(mealForSupabase)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create custom meal');
    return data;
  },

  async getById(id: string): Promise<CustomMeal | undefined> {
    const { data, error } = await supabase
      .from('custom_meals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get custom meal');
    }
    return data || undefined;
  },

  async getAll(): Promise<CustomMeal[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('custom_meals')
      .select('*')
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'get all custom meals');
    return data || [];
  },

  async update(id: string, updates: Partial<CustomMeal>): Promise<CustomMeal | undefined> {
    const { data, error } = await supabase
      .from('custom_meals')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'update custom meal');
    return data || undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_meals')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete custom meal');
  },

  async deleteAll(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const { error } = await supabase
      .from('custom_meals')
      .delete()
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'delete all custom meals');
  },
};

// Wizard Results Operations
export const wizardResultsService = {
  async create(wizardData: Omit<NewUserWizardResults, 'id' | 'completedAt' | 'updatedAt'>): Promise<UserWizardResults> {
    // Use userId from wizardData if provided, otherwise get from auth store
    const userId = wizardData.userId || getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated - userId is required');
    
    // Extract userId from wizardData to avoid duplication in spread
    const { userId: _ignored, ...wizardDataWithoutUserId } = wizardData;
    
    const newWizardResults: NewUserWizardResults = {
      id: generateUUID(),
      userId, // Use the userId we extracted (either from wizardData or auth store)
      ...wizardDataWithoutUserId, // Spread without userId to avoid override
      completedAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert camelCase to snake_case for Supabase
    const wizardForSupabase = convertToSnakeCase(newWizardResults);
    
    const { data, error } = await supabase
      .from('user_wizard_results')
      .insert(wizardForSupabase)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'create wizard results');
    // Convert snake_case response back to camelCase
    return convertToCamelCase(data) as UserWizardResults;
  },

  async getByUserId(userId: string): Promise<UserWizardResults | undefined> {
    const { data, error } = await supabase
      .from('user_wizard_results')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('🔍 Wizard results: No rows found for user_id:', userId);
        return undefined;
      }
      console.error('❌ Wizard results query error:', error);
      handleSupabaseError(error, 'get wizard results');
      return undefined;
    }
    
    if (!data) {
      console.log('🔍 Wizard results: Query returned no data for user_id:', userId);
      return undefined;
    }
    
    console.log('✅ Wizard results: Found for user_id:', userId, 'Has generatedSplit:', !!data.generated_split);
    return convertToCamelCase(data) as UserWizardResults;
  },

  async update(id: string, updates: Partial<UserWizardResults>): Promise<UserWizardResults | undefined> {
    const { data, error } = await supabase
      .from('user_wizard_results')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'update wizard results');
    return data || undefined;
  },

  async updateByUserId(userId: string, updates: Partial<UserWizardResults>): Promise<UserWizardResults | undefined> {
    const { data, error } = await supabase
      .from('user_wizard_results')
      .update({ ...updates, updatedAt: new Date() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Create if doesn't exist
        return await this.create(updates as any);
      }
      handleSupabaseError(error, 'update wizard results by user id');
    }
    return data || undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_wizard_results')
      .delete()
      .eq('id', id);
    
    if (error) handleSupabaseError(error, 'delete wizard results');
  },

  async hasCompletedWizard(userId: string): Promise<boolean> {
    // IMPORTANT: Just having wizard results doesn't mean wizard is completed
    // Wizard is only completed AFTER subscription flow is handled
    // This function should check if wizard results exist AND subscription was handled
    // For now, we'll rely on the auth store's hasCompletedWizard flag
    // which is set explicitly after subscription completion
    const result = await this.getByUserId(userId);
    // Don't auto-mark as completed just because results exist
    // Return false here - let the auth store manage completion status
    return false; // Always return false - completion is managed by auth store flag
  },

  async deleteAll(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const { error } = await supabase
      .from('user_wizard_results')
      .delete()
      .eq('user_id', userId);
    
    if (error) handleSupabaseError(error, 'delete all wizard results');
  },
};

// Sync Status Operations
export const syncStatusService = {
  async getSyncStatus(tableName: string): Promise<SyncStatus | undefined> {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('table_name', tableName)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      handleSupabaseError(error, 'get sync status');
    }
    return data || undefined;
  },

  async updateSyncStatus(tableName: string, updates: Partial<SyncStatus>): Promise<void> {
    const existing = await this.getSyncStatus(tableName);
    
    if (existing) {
      const { error } = await supabase
        .from('sync_status')
        .update({ ...updates, updatedAt: new Date() })
        .eq('table_name', tableName);
      
      if (error) handleSupabaseError(error, 'update sync status');
    } else {
      const { error } = await supabase
        .from('sync_status')
        .insert({
          table_name: tableName,
          ...updates,
          updatedAt: new Date(),
        });
      
      if (error) handleSupabaseError(error, 'create sync status');
    }
  },

  async getAllSyncStatus(): Promise<SyncStatus[]> {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*');
    
    if (error) handleSupabaseError(error, 'get all sync status');
    return data || [];
  },
};

