-- Migration to create company profile tables
-- Run this in your Supabase SQL editor

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    founded_year INTEGER,
    website VARCHAR(255),
    description TEXT,
    mission_statement TEXT,
    company_values TEXT[],
    headquarters_address TEXT,
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(100),
    headquarters_country VARCHAR(100),
    headquarters_pin_code VARCHAR(20),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    benefits TEXT[],
    perks TEXT[],
    work_culture TEXT,
    remote_work_policy TEXT,
    diversity_inclusion TEXT,
    auto_mails_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create company_offices table
CREATE TABLE IF NOT EXISTS company_offices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
    office_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT false,
    office_type VARCHAR(50) DEFAULT 'branch',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_gallery table
CREATE TABLE IF NOT EXISTS company_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_caption TEXT,
    image_type VARCHAR(50) DEFAULT 'other',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_offices_company_id ON company_offices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_gallery_company_id ON company_gallery(company_id);
CREATE INDEX IF NOT EXISTS idx_company_gallery_order ON company_gallery(company_id, order_index);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON company_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_offices_updated_at ON company_offices;
CREATE TRIGGER update_company_offices_updated_at 
    BEFORE UPDATE ON company_offices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_gallery_updated_at ON company_gallery;
CREATE TRIGGER update_company_gallery_updated_at 
    BEFORE UPDATE ON company_gallery 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_gallery ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_profiles
DROP POLICY IF EXISTS "Users can view own company profile" ON company_profiles;
CREATE POLICY "Users can view own company profile" ON company_profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own company profile" ON company_profiles;
CREATE POLICY "Users can insert own company profile" ON company_profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own company profile" ON company_profiles;
CREATE POLICY "Users can update own company profile" ON company_profiles
    FOR UPDATE USING (true);

-- Create RLS policies for company_offices
DROP POLICY IF EXISTS "Users can manage company offices" ON company_offices;
CREATE POLICY "Users can manage company offices" ON company_offices
    FOR ALL USING (true);

-- Create RLS policies for company_gallery
DROP POLICY IF EXISTS "Users can manage company gallery" ON company_gallery;
CREATE POLICY "Users can manage company gallery" ON company_gallery
    FOR ALL USING (true);
