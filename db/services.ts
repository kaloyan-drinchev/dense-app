/**
 * Database Services - Supabase Implementation
 * 
 * This file re-exports all services from services-supabase.ts
 * SQLite has been removed - all operations now use Supabase
 */

export {
  userProfileService,
  programService,
  userProgressService,
  dailyLogService,
  customMealService,
  wizardResultsService,
  syncStatusService,
  activeWorkoutSessionService,
} from './services-supabase';

// Re-export types from PostgreSQL schema
export type {
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
