-- Migration: Add profile picture column to user_profiles table
-- Date: 2024-12-19

ALTER TABLE user_profiles ADD COLUMN profile_picture TEXT;
