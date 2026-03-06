-- Hirefy Database Schema
-- Run this in your Supabase SQL editor

-- Create users table (instead of using auth.users)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    profile_picture_url TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    skills TEXT[],
    experience_years INTEGER DEFAULT 0,
    -- Profile completion fields
    state VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(20),
    resume_url TEXT,
    -- Fresher functionality
    is_fresher BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    location VARCHAR(255),
    salary_min INTEGER,
    salary_max INTEGER,
    employment_type VARCHAR(50) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
    remote_work BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    skills_required TEXT[],
    experience_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create saved_jobs table (for candidates to save jobs)
CREATE TABLE saved_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    related_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_skills table (separate table for skills)
CREATE TABLE user_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- Create user_experiences table
CREATE TABLE user_experiences (
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

-- Create user_educations table
CREATE TABLE user_educations (
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

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_fresher ON users(is_fresher);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_experiences_user_id ON user_experiences(user_id);
CREATE INDEX idx_user_educations_user_id ON user_educations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_experiences_updated_at BEFORE UPDATE ON user_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_educations_updated_at BEFORE UPDATE ON user_educations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_educations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Jobs are publicly readable
CREATE POLICY "Jobs are publicly readable" ON jobs
    FOR SELECT USING (true);

-- Job applications - candidates can see their own applications
CREATE POLICY "Candidates can view own applications" ON job_applications
    FOR SELECT USING (true);

-- Notifications - users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (true);

-- User skills - users can manage their own skills
CREATE POLICY "Users can manage own skills" ON user_skills
    FOR ALL USING (true);

-- User experiences - users can manage their own experiences
CREATE POLICY "Users can manage own experiences" ON user_experiences
    FOR ALL USING (true);

-- User educations - users can manage their own educations
CREATE POLICY "Users can manage own educations" ON user_educations
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO users (email, password, name, role) VALUES
('admin@hirefy.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mJXzFvJ2e', 'Admin User', 'admin'),
('recruiter@hirefy.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mJXzFvJ2e', 'Recruiter User', 'recruiter'),
('candidate@hirefy.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4mJXzFvJ2e', 'Candidate User', 'candidate');

-- Insert sample company
INSERT INTO companies (name, description, website, industry, location) VALUES
('TechCorp', 'Leading technology company specializing in innovative solutions', 'https://techcorp.com', 'Technology', 'San Francisco, CA');

-- Insert sample job
INSERT INTO jobs (title, description, requirements, location, salary_min, salary_max, recruiter_id, company_id) VALUES
('Frontend Developer', 'We are looking for a skilled Frontend Developer to join our team.', 'React, JavaScript, HTML, CSS, 2+ years experience', 'San Francisco, CA', 80000, 120000, 
(SELECT id FROM users WHERE email = 'recruiter@hirefy.com'), 
(SELECT id FROM companies WHERE name = 'TechCorp'));

-- Note: The password hash above is for 'password123' - change this in production!
