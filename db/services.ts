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