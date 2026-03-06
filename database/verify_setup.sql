-- Verification Script: Check if all required tables and columns exist
-- Run this in your Supabase SQL editor to verify the setup

-- 1. Check if all required tables exist
SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ All required tables exist'
        ELSE '❌ Missing tables: ' || (4 - COUNT(*))::text
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'user_skills', 'user_experiences', 'user_educations');

-- 2. Check if users table has all required columns
SELECT 
    'Users Table Columns' as check_type,
    CASE 
        WHEN COUNT(*) >= 12 THEN '✅ All required columns exist in users table'
        ELSE '❌ Missing columns in users table'
    END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'email', 'name', 'phone', 'state', 'city', 'country', 'pin_code', 'resume_url', 'is_fresher', 'created_at', 'updated_at');

-- 3. Check specific is_fresher column
SELECT 
    'Fresher Column Check' as check_type,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ is_fresher column exists with correct type'
        ELSE '❌ is_fresher column missing or incorrect type'
    END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name = 'is_fresher'
    AND data_type = 'boolean';

-- 4. Show current users and their fresher status
SELECT 
    'Current Users' as info_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_fresher = true THEN 1 END) as fresher_count,
    COUNT(CASE WHEN is_fresher = false THEN 1 END) as experienced_count
FROM users;

-- 5. List all columns in users table for verification
SELECT 
    'Users Table Structure' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check if indexes exist
SELECT 
    'Indexes Check' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ Required indexes exist'
        ELSE '❌ Missing indexes'
    END as status
FROM pg_indexes 
WHERE tablename = 'users' 
    AND indexname LIKE '%fresher%';

-- 7. Test a simple update to verify permissions
DO $$
BEGIN
    -- Try to update a user's fresher status (this should work)
    UPDATE users SET is_fresher = is_fresher WHERE id = (SELECT id FROM users LIMIT 1);
    RAISE NOTICE '✅ Update permissions working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Update permissions issue: %', SQLERRM;
END
$$;