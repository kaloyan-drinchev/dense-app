CREATE TABLE `custom_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`ingredients` text,
	`nutrition` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`food_entries` text,
	`total_calories` real DEFAULT 0,
	`total_protein` real DEFAULT 0,
	`total_carbs` real DEFAULT 0,
	`total_fat` real DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`duration` integer,
	`difficulty` text,
	`type` text,
	`image` text,
	`data` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `sync_status` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`last_pulled_at` text,
	`last_pushed_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_status_table_name_unique` ON `sync_status` (`table_name`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`profile_picture` text,
	`age` integer,
	`weight` real,
	`height` real,
	`target_weight` real,
	`body_fat` real,
	`goal` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_id` text NOT NULL,
	`current_week` integer DEFAULT 1,
	`current_workout` integer DEFAULT 1,
	`start_date` text,
	`completed_workouts` text,
	`weekly_weights` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `user_wizard_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`squat_kg` real,
	`bench_kg` real,
	`deadlift_kg` real,
	`training_experience` text,
	`body_fat_level` text,
	`training_days_per_week` integer,
	`preferred_training_days` text,
	`muscle_priorities` text,
	`pump_work_preference` text,
	`recovery_profile` text,
	`program_duration_weeks` integer,
	`primary_goal` text,
	`target_weight` real,
	`timeframe` text,
	`fitness_level` text,
	`workout_frequency` text,
	`preferred_workout_length` text,
	`preferred_workout_types` text,
	`available_equipment` text,
	`workout_location` text,
	`weaknesses` text,
	`injuries` text,
	`focus_muscle` text,
	`suggested_programs` text,
	`generated_split` text,
	`completed_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
