-- Migration: Add fresher field to users table
-- Run this in your Supabase SQL editor

-- Add is_fresher column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_fresher BOOLEAN DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_fresher ON users(is_fresher);

-- Update existing users to have is_fresher = false by default
UPDATE users SET is_fresher = false WHERE is_fresher IS NULL;