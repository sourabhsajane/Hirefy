-- Complete Migration: Add all required fields and tables for fresher functionality
-- Run this in your Supabase SQL editor

-- 1. Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS is_fresher BOOLEAN DEFAULT false;

-- 2. Create user_skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- 3. Create user_experiences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_role VARCHAR(255) NOT NULL,
    years_of_work VARCHAR(50),
    start_date DATE,
    end_date DATE,
    currently_working BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_educations table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_educations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    degree VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    currently_studying BOOLEAN DEFAULT false,
    gpa VARCHAR(10),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_fresher ON users(is_fresher);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON user_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_educations_user_id ON user_educations(user_id);

-- 6. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at on new tables
DO $$
BEGIN
    -- Check if trigger exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_experiences_updated_at') THEN
        CREATE TRIGGER update_user_experiences_updated_at 
        BEFORE UPDATE ON user_experiences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_educations_updated_at') THEN
        CREATE TRIGGER update_user_educations_updated_at 
        BEFORE UPDATE ON user_educations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- 8. Enable Row Level Security on new tables
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_educations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for new tables
DO $$
BEGIN
    -- User skills policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_skills' AND policyname = 'Users can manage own skills') THEN
        CREATE POLICY "Users can manage own skills" ON user_skills FOR ALL USING (true);
    END IF;
    
    -- User experiences policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_experiences' AND policyname = 'Users can manage own experiences') THEN
        CREATE POLICY "Users can manage own experiences" ON user_experiences FOR ALL USING (true);
    END IF;
    
    -- User educations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_educations' AND policyname = 'Users can manage own educations') THEN
        CREATE POLICY "Users can manage own educations" ON user_educations FOR ALL USING (true);
    END IF;
END
$$;

-- 10. Update existing users to have is_fresher = false by default
UPDATE users SET is_fresher = false WHERE is_fresher IS NULL;

-- 11. Verify the migration
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_fresher = true THEN 1 END) as fresher_users,
    COUNT(CASE WHEN is_fresher = false THEN 1 END) as experienced_users
FROM users;

-- 12. Show table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'user_skills', 'user_experiences', 'user_educations')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;