CREATE TABLE IF NOT EXISTS "custom_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ingredients" jsonb,
	"nutrition" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"food_entries" jsonb,
	"total_calories" real DEFAULT 0,
	"total_protein" real DEFAULT 0,
	"total_carbs" real DEFAULT 0,
	"total_fat" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"duration" integer,
	"difficulty" text,
	"type" text,
	"image" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"last_pulled_at" timestamp,
	"last_pushed_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sync_status_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"profile_picture" text,
	"age" integer,
	"weight" real,
	"height" real,
	"target_weight" real,
	"body_fat" real,
	"goal" text,
	"ltwins_points" integer DEFAULT 0,
	"ltwins_points_history" jsonb,
	"ltwins_game_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"current_week" integer DEFAULT 1,
	"current_workout" integer DEFAULT 1,
	"start_date" timestamp,
	"completed_workouts" jsonb,
	"weekly_weights" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_wizard_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"motivation" jsonb,
	"squat_kg" real,
	"bench_kg" real,
	"deadlift_kg" real,
	"training_experience" text,
	"body_fat_level" text,
	"tdee_data" jsonb,
	"age" integer,
	"gender" text,
	"weight" real,
	"height" real,
	"activity_level" text,
	"goal" text,
	"training_days_per_week" integer,
	"preferred_training_days" jsonb,
	"muscle_priorities" jsonb,
	"pump_work_preference" text,
	"recovery_profile" text,
	"program_duration_weeks" integer,
	"primary_goal" text,
	"target_weight" real,
	"timeframe" text,
	"fitness_level" text,
	"workout_frequency" text,
	"preferred_workout_length" text,
	"preferred_workout_types" jsonb,
	"available_equipment" jsonb,
	"workout_location" text,
	"weaknesses" jsonb,
	"injuries" jsonb,
	"focus_muscle" text,
	"suggested_programs" jsonb,
	"generated_split" jsonb,
	"completed_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
