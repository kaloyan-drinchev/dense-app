import { sql } from 'drizzle-orm';
import { pgTable, text, integer, real, jsonb, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

// User Profile Table
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Optional - for future cloud sync
  profilePicture: text('profile_picture'), // Base64 encoded image or file path
  age: integer('age'),
  weight: real('weight'),
  height: real('height'),
  targetWeight: real('target_weight'),
  bodyFat: real('body_fat'),
  goal: text('goal'),
  // L Twins Game Points
  ltwinsPoints: integer('ltwins_points').default(0), // Points from L Twins guessing game
  ltwinsPointsHistory: jsonb('ltwins_points_history'), // JSON array of point gains with timestamps
  ltwinsGameEnabled: boolean('ltwins_game_enabled').default(true), // Boolean instead of integer
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

// Programs Table
export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  duration: integer('duration'), // weeks
  difficulty: text('difficulty'),
  type: text('type'),
  image: text('image'),
  data: jsonb('data'), // JSON object of program structure
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

// User Progress Table
export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Will reference auth.users.id
  programId: uuid('program_id'), // Nullable - users might not have a program assigned yet
  currentWeek: integer('current_week').default(1),
  currentWorkout: integer('current_workout').default(1),
  startDate: timestamp('start_date'),
  completedWorkouts: jsonb('completed_workouts'), // JSON array of workout IDs
  weeklyWeights: jsonb('weekly_weights'), // JSON object
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

// Daily Nutrition Logs Table
export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Will reference auth.users.id
  date: text('date').notNull(), // YYYY-MM-DD format
  foodEntries: jsonb('food_entries'), // JSON array of food entries
  totalCalories: real('total_calories').default(0),
  totalProtein: real('total_protein').default(0),
  totalCarbs: real('total_carbs').default(0),
  totalFat: real('total_fat').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

// Custom Meals Table
export const customMeals = pgTable('custom_meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Will reference auth.users.id
  name: text('name').notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients'), // JSON array
  nutrition: jsonb('nutrition'), // JSON object with calories, protein, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

// User Onboarding/Wizard Results Table - DENSE V1 9-Step Onboarding
export const userWizardResults = pgTable('user_wizard_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // Will reference auth.users.id
  
  // Step 1: What brings you to DENSE? (multiple selections)
  motivation: jsonb('motivation'), // JSON array of user's motivations: ["build_muscle", "get_stronger", etc.]
  
  // Step 3: Current Strength Starting Point
  squatKg: real('squat_kg'), // User's current squat weight in kg
  benchKg: real('bench_kg'), // User's current bench press weight in kg
  deadliftKg: real('deadlift_kg'), // User's current deadlift weight in kg
  
  // Step 4: Training Experience
  trainingExperience: text('training_experience'), // 'new', '6_18_months', '2_plus_years'
  
  // Step 5: Body Fat Estimate (legacy - now using TDEE calculation)
  bodyFatLevel: text('body_fat_level'), // 'lean_10_14', 'athletic_15_18', 'average_18_22', 'high_22_plus'
  
  // Step 5: TDEE Calculation (new fields)
  tdeeData: jsonb('tdee_data'), // JSON object with BMR, TDEE, calories, macros
  age: integer('age'),
  gender: text('gender'), // 'male', 'female'
  weight: real('weight'), // in kg
  height: real('height'), // in cm
  activityLevel: text('activity_level'), // 'sedentary', 'lightly_active', etc.
  goal: text('goal'), // 'lose_weight', 'maintain_weight', 'gain_weight'
  
  // Step 6: Weekly Schedule
  trainingDaysPerWeek: integer('training_days_per_week'), // 3, 4, 5, 6, or 7
  preferredTrainingDays: jsonb('preferred_training_days'), // JSON array: ['monday', 'tuesday', 'wednesday', ...]
  
  // Step 7: Muscle Group Prioritization (max 3)
  musclePriorities: jsonb('muscle_priorities'), // JSON array: ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings_glutes', 'calves', 'abs']
  
  // Step 8: Pump Work Preference
  pumpWorkPreference: text('pump_work_preference'), // 'yes_love_burn', 'maybe_sometimes', 'no_minimal'
  
  // Step 9: Recovery Profile
  recoveryProfile: text('recovery_profile'), // 'fast_recovery', 'need_more_rest', 'not_sure'
  
  // Step 10: Program Duration
  programDurationWeeks: integer('program_duration_weeks'), // 4, 8, or 12
  
  // Legacy fields (keeping for backward compatibility)
  primaryGoal: text('primary_goal'), // 'lose_weight', 'gain_muscle', 'get_stronger', 'improve_endurance'
  targetWeight: real('target_weight'),
  timeframe: text('timeframe'), // '3_months', '6_months', '1_year'
  fitnessLevel: text('fitness_level'), // 'beginner', 'intermediate', 'advanced'
  workoutFrequency: text('workout_frequency'), // '2_3_times', '4_5_times', '6_7_times'
  preferredWorkoutLength: text('preferred_workout_length'), // '30_min', '45_min', '60_min', '90_min'
  preferredWorkoutTypes: jsonb('preferred_workout_types'), // JSON array: ['strength', 'cardio', 'hiit', 'yoga']
  availableEquipment: jsonb('available_equipment'), // JSON array: ['dumbbells', 'barbell', 'resistance_bands']
  workoutLocation: text('workout_location'), // 'home', 'gym', 'both'
  weaknesses: jsonb('weaknesses'), // JSON array: ['upper_body', 'lower_body', 'core', 'cardio']
  injuries: jsonb('injuries'), // JSON array: ['knee', 'back', 'shoulder', 'none']
  focusMuscle: text('focus_muscle'), // Primary muscle group focus: 'chest', 'back', 'shoulders'
  
  // AI Program Generation Output
  suggestedPrograms: jsonb('suggested_programs'), // JSON array of program IDs
  generatedSplit: jsonb('generated_split'), // JSON object: generated Push/Pull/Legs split based on responses
  
  completedAt: timestamp('completed_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Sync Status Table - tracks last sync times for each table
export const syncStatus = pgTable('sync_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableName: text('table_name').notNull().unique(),
  lastPulledAt: timestamp('last_pulled_at'),
  lastPushedAt: timestamp('last_pushed_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
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

