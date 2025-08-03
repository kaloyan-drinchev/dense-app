import { sql } from 'drizzle-orm';
import { int, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

// User Profile Table
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  age: int('age'),
  weight: real('weight'),
  height: real('height'),
  goal: text('goal'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
});

// Programs Table
export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  duration: int('duration'), // weeks
  difficulty: text('difficulty'),
  type: text('type'),
  image: text('image'),
  data: text('data'), // JSON string of program structure
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
});

// User Progress Table
export const userProgress = sqliteTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  programId: text('program_id').notNull(),
  currentWeek: int('current_week').default(1),
  currentWorkout: int('current_workout').default(1),
  startDate: text('start_date'),
  completedWorkouts: text('completed_workouts'), // JSON array of workout IDs
  weeklyWeights: text('weekly_weights'), // JSON object
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
});

// Daily Nutrition Logs Table
export const dailyLogs = sqliteTable('daily_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  foodEntries: text('food_entries'), // JSON array of food entries
  totalCalories: real('total_calories').default(0),
  totalProtein: real('total_protein').default(0),
  totalCarbs: real('total_carbs').default(0),
  totalFat: real('total_fat').default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
});

// Custom Meals Table
export const customMeals = sqliteTable('custom_meals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  ingredients: text('ingredients'), // JSON array
  nutrition: text('nutrition'), // JSON object with calories, protein, etc.
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
});

// User Onboarding/Wizard Results Table
export const userWizardResults = sqliteTable('user_wizard_results', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  
  // Fitness Goals
  primaryGoal: text('primary_goal'), // 'lose_weight', 'gain_muscle', 'get_stronger', 'improve_endurance'
  targetWeight: real('target_weight'),
  timeframe: text('timeframe'), // '3_months', '6_months', '1_year'
  
  // Current Fitness Level
  fitnessLevel: text('fitness_level'), // 'beginner', 'intermediate', 'advanced'
  workoutFrequency: text('workout_frequency'), // '2_3_times', '4_5_times', '6_7_times'
  preferredWorkoutLength: text('preferred_workout_length'), // '30_min', '45_min', '60_min', '90_min'
  
  // Preferences
  preferredWorkoutTypes: text('preferred_workout_types'), // JSON array: ['strength', 'cardio', 'hiit', 'yoga']
  availableEquipment: text('available_equipment'), // JSON array: ['dumbbells', 'barbell', 'resistance_bands']
  workoutLocation: text('workout_location'), // 'home', 'gym', 'both'
  
  // Weaknesses/Focus Areas
  weaknesses: text('weaknesses'), // JSON array: ['upper_body', 'lower_body', 'core', 'cardio']
  injuries: text('injuries'), // JSON array: ['knee', 'back', 'shoulder', 'none']
  focusMuscle: text('focus_muscle'), // Primary muscle group focus: 'chest', 'back', 'shoulders'
  
  // Program Suggestions (will be filled based on results)
  suggestedPrograms: text('suggested_programs'), // JSON array of program IDs
  
  completedAt: text('completed_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Sync Status Table - tracks last sync times for each table
export const syncStatus = sqliteTable('sync_status', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull().unique(),
  lastPulledAt: text('last_pulled_at'),
  lastPushedAt: text('last_pushed_at'),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Type exports
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;

export type CustomMeal = typeof customMeals.$inferSelect;
export type NewCustomMeal = typeof customMeals.$inferInsert;

export type UserWizardResults = typeof userWizardResults.$inferSelect;
export type NewUserWizardResults = typeof userWizardResults.$inferInsert;

export type SyncStatus = typeof syncStatus.$inferSelect;
export type NewSyncStatus = typeof syncStatus.$inferInsert;