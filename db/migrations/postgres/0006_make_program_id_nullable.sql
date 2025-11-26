-- Make program_id nullable in user_progress table
-- This allows users to have progress without a program assigned yet

ALTER TABLE user_progress 
  ALTER COLUMN program_id DROP NOT NULL;

