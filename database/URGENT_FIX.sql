-- URGENT FIX: Run this immediately in Supabase SQL Editor
-- This will fix the "is_fresher column not found" error

-- Step 1: Add the is_fresher column to users table
ALTER TABLE users ADD COLUMN is_fresher BOOLEAN DEFAULT false;

-- Step 2: Update all existing users to have is_fresher = false
UPDATE users SET is_fresher = false;

-- Step 3: Create an index for performance
CREATE INDEX idx_users_is_fresher ON users(is_fresher);

-- Step 4: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name = 'is_fresher';

-- Step 5: Test with a sample query
SELECT id, name, email, is_fresher FROM users LIMIT 3;