-- Migration to add missing profile fields to users table
-- Run this in your Supabase SQL editor

-- Add missing profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Create user_skills table (separate table for skills)
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- Create user_experiences table
CREATE TABLE IF NOT EXISTS user_experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_role VARCHAR(255) NOT NULL,
    years_of_work VARCHAR(50),
    start_date DATE,
    end_date DATE,
    currently_working BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_educations table
CREATE TABLE IF NOT EXISTS user_educations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    degree VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    currently_studying BOOLEAN DEFAULT false,
    gpa VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON user_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_educations_user_id ON user_educations(user_id);

-- Create triggers for updated_at on new tables
-- Drop existing triggers first if they exist
DROP TRIGGER IF EXISTS update_user_experiences_updated_at ON user_experiences;
DROP TRIGGER IF EXISTS update_user_educations_updated_at ON user_educations;

CREATE TRIGGER update_user_experiences_updated_at 
    BEFORE UPDATE ON user_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_educations_updated_at 
    BEFORE UPDATE ON user_educations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_educations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Users can view own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can insert own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can update own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can delete own skills" ON user_skills;

DROP POLICY IF EXISTS "Users can view own experiences" ON user_experiences;
DROP POLICY IF EXISTS "Users can insert own experiences" ON user_experiences;
DROP POLICY IF EXISTS "Users can update own experiences" ON user_experiences;
DROP POLICY IF EXISTS "Users can delete own experiences" ON user_experiences;

DROP POLICY IF EXISTS "Users can view own educations" ON user_educations;
DROP POLICY IF EXISTS "Users can insert own educations" ON user_educations;
DROP POLICY IF EXISTS "Users can update own educations" ON user_educations;
DROP POLICY IF EXISTS "Users can delete own educations" ON user_educations;

-- Create policies for user_skills
CREATE POLICY "Users can view own skills" ON user_skills
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own skills" ON user_skills
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own skills" ON user_skills
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own skills" ON user_skills
    FOR DELETE USING (true);

-- Create policies for user_experiences
CREATE POLICY "Users can view own experiences" ON user_experiences
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own experiences" ON user_experiences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own experiences" ON user_experiences
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own experiences" ON user_experiences
    FOR DELETE USING (true);

-- Create policies for user_educations
CREATE POLICY "Users can view own educations" ON user_educations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own educations" ON user_educations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own educations" ON user_educations
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own educations" ON user_educations
    FOR DELETE USING (true);

-- Remove the old skills column from users table if it exists (it was TEXT[])
-- Note: This will delete existing skills data, but since we're using the new table structure
-- ALTER TABLE users DROP COLUMN IF EXISTS skills;
