import { eq, and } from 'drizzle-orm';
import { db } from './client';
import {
  userProfiles,
  programs,
  userProgress,
  dailyLogs,
  customMeals,
  userWizardResults,
  syncStatus,
  type UserProfile,
  type NewUserProfile,
  type Program,
  type NewProgram,
  type UserProgress,
  type NewUserProgress,
  type DailyLog,
  type NewDailyLog,
  type CustomMeal,
  type NewCustomMeal,
  type UserWizardResults,
  type NewUserWizardResults,
  type SyncStatus,
} from './schema';
import { generateId } from '@/utils/helpers';

// User Profile Operations
export const userProfileService = {
  async create(profile: Omit<NewUserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const newProfile: NewUserProfile = {
      id: generateId(),
      ...profile,
    };
    
    const result = await db.insert(userProfiles).values(newProfile).returning();
    return result[0];
  },

  async getById(id: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return result[0];
  },

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const result = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(userProfiles.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(userProfiles).where(eq(userProfiles.id, id));
  },

  async getAll(): Promise<UserProfile[]> {
    return await db.select().from(userProfiles);
  },

  async deleteAll(): Promise<void> {
    await db.delete(userProfiles);
  },
};

// Programs Operations
export const programService = {
  async create(program: Omit<NewProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> {
    const newProgram: NewProgram = {
      id: generateId(),
      ...program,
    };
    
    const result = await db.insert(programs).values(newProgram).returning();
    return result[0];
  },

  async getById(id: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.id, id));
    return result[0];
  },

  async getAll(): Promise<Program[]> {
    return await db.select().from(programs);
  },

  async update(id: string, updates: Partial<Program>): Promise<Program | undefined> {
    const result = await db
      .update(programs)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(programs.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  },

  async bulkInsert(programList: Omit<NewProgram, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Program[]> {
    const newPrograms = programList.map(program => ({
      id: generateId(),
      ...program,
    }));
    
    return await db.insert(programs).values(newPrograms).returning();
  },

  async deleteAll(): Promise<void> {
    await db.delete(programs);
  },
};

// User Progress Operations
export const userProgressService = {
  async create(progress: Omit<NewUserProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProgress> {
    const newProgress: NewUserProgress = {
      id: generateId(),
      ...progress,
    };
    
    const result = await db.insert(userProgress).values(newProgress).returning();
    return result[0];
  },

  async getByUserId(userId: string): Promise<UserProgress | undefined> {
    const result = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return result[0];
  },

  async getByUserAndProgram(userId: string, programId: string): Promise<UserProgress | undefined> {
    const result = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.programId, programId)));
    return result[0];
  },

  async update(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const result = await db
      .update(userProgress)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(userProgress.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(userProgress).where(eq(userProgress.id, id));
  },

  async deleteAll(): Promise<void> {
    await db.delete(userProgress);
  },

  // --- Exercise Set Tracking helpers stored in userProgress.weeklyWeights JSON ---
  // Structure:
  // weeklyWeights JSON := {
  //   exerciseLogs: {
  //     [exerciseId: string]: Array<{
  //       date: string; // YYYY-MM-DD
  //       unit: 'kg' | 'lb';
  //       sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>
  //     }>
  //   }
  // }

  async getWeeklyWeightsByUserId(userId: string): Promise<any> {
    const progress = await this.getByUserId(userId);
    if (!progress) return {};
    
    console.log(`🔍 RAW DATABASE - weeklyWeights field type:`, typeof progress.weeklyWeights);
    console.log(`🔍 RAW DATABASE - weeklyWeights raw value:`, progress.weeklyWeights);
    
    try {
      const parsed = progress.weeklyWeights ? JSON.parse(progress.weeklyWeights as unknown as string) : {};
      
      // FIX: Ensure data is always an object, never an array
      if (Array.isArray(parsed)) {
        console.log(`🔍 RAW DATABASE - CORRUPTION DETECTED! Found array instead of object. Returning empty object.`);
        return {};
      }
      
      console.log(`🔍 RAW DATABASE - After JSON.parse:`, parsed);
      console.log(`🔍 RAW DATABASE - Parsed type:`, typeof parsed);
      return parsed;
    } catch (error) {
      console.error(`🔍 RAW DATABASE - JSON parse failed:`, error);
      console.log(`🔍 RAW DATABASE - Returning empty object due to parse error`);
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
    // Return the most recent by date
    const sorted = [...sessions].sort((a, b) => (a.date > b.date ? 1 : -1));
    return sorted[sorted.length - 1];
  },

  async getTodayExerciseSession(userId: string, exerciseId: string, dateISO?: string): Promise<
    | { date: string; unit: 'kg' | 'lb'; sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }> }
    | null
  > {
    const today = (dateISO || new Date().toISOString()).slice(0, 10); // YYYY-MM-DD
    const data = await this.getWeeklyWeightsByUserId(userId);
    
    console.log(`🔍 Raw weeklyWeights data:`, data);
    console.log(`🔍 Exercise logs keys:`, Object.keys(data?.exerciseLogs || {}));
    console.log(`🔍 Looking for exerciseId: "${exerciseId}"`);
    
    const sessions = data?.exerciseLogs?.[exerciseId] as any[] | undefined;
    console.log(`🔍 Sessions for ${exerciseId}:`, sessions);
    
    if (!sessions || sessions.length === 0) {
      console.log(`🔍 No sessions found for ${exerciseId}`);
      return null;
    }
    
    // Find today's session specifically
    const todaySession = sessions.find(session => session.date === today);
    console.log(`🔍 Looking for today's session (${today}) for ${exerciseId}:`, !!todaySession);
    console.log(`🔍 Available sessions dates:`, sessions.map(s => ({ date: s.date, setsCount: s.sets?.length || 0 })));
    
    if (todaySession) {
      console.log(`✅ Found today's session:`, { date: todaySession.date, unit: todaySession.unit, setsCount: todaySession.sets?.length || 0 });
    }
    
    return todaySession || null;
  },

  async upsertTodayExerciseSession(
    userId: string,
    exerciseId: string,
    payload: { unit: 'kg' | 'lb'; sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }> },
    dateISO?: string
  ): Promise<void> {
    console.log(`💾 SAVE DEBUG - Starting upsert for ${exerciseId}`);
    
    let progress = await this.getByUserId(userId);
    if (!progress) {
      console.log(`💾 SAVE DEBUG - No progress found, creating new record`);
      // Create a minimal default progress row if none exists
      const created = await this.create({
        userId,
        programId: 'ai-generated-program',
        currentWeek: 1,
        currentWorkout: 1,
        startDate: new Date().toISOString(),
        completedWorkouts: '[]',
        weeklyWeights: '{}',
      } as any);
      progress = created || (await this.getByUserId(userId));
      if (!progress) {
        console.log(`💾 SAVE DEBUG - Failed to create progress record`);
        return;
      }
    }

    const today = (dateISO || new Date().toISOString()).slice(0, 10); // YYYY-MM-DD
    console.log(`💾 SAVE DEBUG - Today's date: ${today}`);
    
    let data: any = {};
    try {
      console.log(`💾 SAVE DEBUG - Raw weeklyWeights from DB:`, progress.weeklyWeights);
      console.log(`💾 SAVE DEBUG - Raw weeklyWeights type:`, typeof progress.weeklyWeights);
      
      const parsed = progress.weeklyWeights ? JSON.parse(progress.weeklyWeights as unknown as string) : {};
      
      // FIX: Ensure data is always an object, never an array
      if (Array.isArray(parsed)) {
        console.log(`💾 SAVE DEBUG - CORRUPTION DETECTED! Database contains array instead of object. Fixing...`);
        data = {}; // Reset to empty object
      } else {
        data = parsed;
      }
      
      console.log(`💾 SAVE DEBUG - Final data after array fix:`, data);
      console.log(`💾 SAVE DEBUG - Final data type:`, typeof data);
      console.log(`💾 SAVE DEBUG - Is final data an array?:`, Array.isArray(data));
      console.log(`💾 SAVE DEBUG - Current data keys:`, Object.keys(data));
    } catch (error) {
      console.log(`💾 SAVE DEBUG - Failed to parse weeklyWeights, starting fresh:`, error);
      data = {};
    }

    if (!data.exerciseLogs) {
      console.log(`💾 SAVE DEBUG - Creating exerciseLogs object`);
      data.exerciseLogs = {};
    }
    if (!data.exerciseLogs[exerciseId]) {
      console.log(`💾 SAVE DEBUG - Creating sessions array for ${exerciseId}`);
      data.exerciseLogs[exerciseId] = [];
    }

    const sessions: any[] = data.exerciseLogs[exerciseId];
    const idx = sessions.findIndex((s) => s.date === today);
    const newSession = { date: today, unit: payload.unit, sets: payload.sets };
    
    console.log(`💾 SAVE DEBUG - Session index: ${idx}, Sessions before: ${sessions.length}`);
    
    if (idx >= 0) {
      console.log(`💾 SAVE DEBUG - Updating existing session at index ${idx}`);
      sessions[idx] = newSession;
    } else {
      console.log(`💾 SAVE DEBUG - Adding new session`);
      sessions.push(newSession);
    }

    console.log(`💾 SAVE DEBUG - Sessions after: ${sessions.length}`);
    console.log(`💾 SAVE DEBUG - Final data keys:`, Object.keys(data.exerciseLogs));
    console.log(`💾 SAVE DEBUG - Data object before stringify:`, data);
    console.log(`💾 SAVE DEBUG - Data object type:`, typeof data);
    console.log(`💾 SAVE DEBUG - Is data an array?:`, Array.isArray(data));
    console.log(`💾 SAVE DEBUG - Data.exerciseLogs type:`, typeof data.exerciseLogs);
    console.log(`💾 SAVE DEBUG - Data.exerciseLogs keys:`, Object.keys(data.exerciseLogs || {}));
    
    const stringified = JSON.stringify(data);
    console.log(`💾 SAVE DEBUG - JSON.stringify result:`, stringified.substring(0, 200) + '...');
    console.log(`💾 SAVE DEBUG - JSON.stringify length:`, stringified.length);

    try {
      await this.update(progress.id, { weeklyWeights: JSON.stringify(data) });
      console.log(`💾 SAVE DEBUG - Database update completed successfully`);
      
      // Verify the save worked
      const verifyProgress = await this.getByUserId(userId);
      if (verifyProgress?.weeklyWeights) {
        const verifyData = JSON.parse(verifyProgress.weeklyWeights as string);
        console.log(`💾 SAVE DEBUG - Verification - Exercise keys:`, Object.keys(verifyData?.exerciseLogs || {}));
        console.log(`💾 SAVE DEBUG - Verification - ${exerciseId} sessions:`, verifyData?.exerciseLogs?.[exerciseId]?.length || 0);
      }
    } catch (error) {
      console.error(`💾 SAVE DEBUG - Database update failed:`, error);
      throw error;
    }
  },
};

// Daily Logs Operations
export const dailyLogService = {
  async create(log: Omit<NewDailyLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyLog> {
    const newLog: NewDailyLog = {
      id: generateId(),
      ...log,
    };
    
    const result = await db.insert(dailyLogs).values(newLog).returning();
    return result[0];
  },

  async getByUserAndDate(userId: string, date: string): Promise<DailyLog | undefined> {
    const result = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, date)));
    return result[0];
  },

  async update(id: string, updates: Partial<DailyLog>): Promise<DailyLog | undefined> {
    const result = await db
      .update(dailyLogs)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(dailyLogs.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(dailyLogs).where(eq(dailyLogs.id, id));
  },

  async getByUserId(userId: string): Promise<DailyLog[]> {
    return await db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId));
  },

  async deleteAll(): Promise<void> {
    await db.delete(dailyLogs);
  },
};

// Custom Meals Operations
export const customMealService = {
  async create(meal: Omit<NewCustomMeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomMeal> {
    const newMeal: NewCustomMeal = {
      id: generateId(),
      ...meal,
    };
    
    const result = await db.insert(customMeals).values(newMeal).returning();
    return result[0];
  },

  async getById(id: string): Promise<CustomMeal | undefined> {
    const result = await db.select().from(customMeals).where(eq(customMeals.id, id));
    return result[0];
  },

  async getByUserId(userId: string): Promise<CustomMeal[]> {
    return await db.select().from(customMeals).where(eq(customMeals.userId, userId));
  },

  async update(id: string, updates: Partial<CustomMeal>): Promise<CustomMeal | undefined> {
    const result = await db
      .update(customMeals)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(customMeals.id, id))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(customMeals).where(eq(customMeals.id, id));
  },

  async deleteAll(): Promise<void> {
    await db.delete(customMeals);
  },
};

// Wizard Results Operations
export const wizardResultsService = {
  async create(wizardData: Omit<NewUserWizardResults, 'id' | 'completedAt' | 'updatedAt'>): Promise<UserWizardResults> {
    const newWizardResults: NewUserWizardResults = {
      id: generateId(),
      ...wizardData,
    };
    
    const result = await db.insert(userWizardResults).values(newWizardResults).returning();
    return result[0];
  },

  async getByUserId(userId: string): Promise<UserWizardResults | undefined> {
    const result = await db.select().from(userWizardResults).where(eq(userWizardResults.userId, userId));
    return result[0];
  },

  async update(id: string, updates: Partial<UserWizardResults>): Promise<UserWizardResults | undefined> {
    const result = await db
      .update(userWizardResults)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(userWizardResults.id, id))
      .returning();
    return result[0];
  },

  async updateByUserId(userId: string, updates: Partial<UserWizardResults>): Promise<UserWizardResults | undefined> {
    const result = await db
      .update(userWizardResults)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(userWizardResults.userId, userId))
      .returning();
    return result[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(userWizardResults).where(eq(userWizardResults.id, id));
  },

  async hasCompletedWizard(userId: string): Promise<boolean> {
    const result = await this.getByUserId(userId);
    return !!result;
  },

  async deleteAll(): Promise<void> {
    await db.delete(userWizardResults);
  },
};

// Sync Status Operations
export const syncStatusService = {
  async getSyncStatus(tableName: string): Promise<SyncStatus | undefined> {
    const result = await db.select().from(syncStatus).where(eq(syncStatus.tableName, tableName));
    return result[0];
  },

  async updateSyncStatus(tableName: string, updates: Partial<SyncStatus>): Promise<void> {
    const existing = await this.getSyncStatus(tableName);
    
    if (existing) {
      await db
        .update(syncStatus)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(syncStatus.tableName, tableName));
    } else {
      await db.insert(syncStatus).values({
        id: generateId(),
        tableName,
        ...updates,
      });
    }
  },

  async getAllSyncStatus(): Promise<SyncStatus[]> {
    return await db.select().from(syncStatus);
  },
};