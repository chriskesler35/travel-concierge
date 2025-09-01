-- ====================================================================
-- Travel Concierge - Complete Database Migration
-- Run this ONCE in your Supabase SQL Editor to set up everything
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE: users (User profiles and roles - MUST BE FIRST)
-- ====================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Profile information
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    
    -- Role and permissions
    role TEXT DEFAULT 'user' CHECK (
        role IN ('user', 'admin', 'moderator', 'support')
    ),
    
    -- Subscription information
    subscription_tier TEXT DEFAULT 'free' CHECK (
        subscription_tier IN ('free', 'premium', 'enterprise')
    ),
    subscription_status TEXT DEFAULT 'active' CHECK (
        subscription_status IN ('active', 'cancelled', 'expired', 'suspended')
    ),
    
    -- Profile settings
    preferences JSONB DEFAULT '{}'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    
    -- Activity tracking
    last_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE
);

-- ====================================================================
-- TABLE: user_usage_stats (Track user limits and premium status)
-- ====================================================================
CREATE TABLE user_usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    journeys_created INTEGER DEFAULT 0,
    journeys_limit INTEGER DEFAULT 5,
    
    ai_requests_made INTEGER DEFAULT 0,
    ai_requests_limit INTEGER DEFAULT 20,
    
    is_premium BOOLEAN DEFAULT FALSE,
    premium_since TIMESTAMPTZ,
    premium_until TIMESTAMPTZ,
    
    subscription_id TEXT,
    subscription_status TEXT,
    
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month')
);

-- ====================================================================
-- TABLE: journeys (Main travel plans)
-- ====================================================================
CREATE TABLE journeys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- User relationship  
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_by TEXT, -- Email for legacy support
    
    -- Core journey data
    destination TEXT NOT NULL,
    origin TEXT,
    traveling_type TEXT DEFAULT 'destination',
    type TEXT DEFAULT 'adventure',
    status TEXT DEFAULT 'planning',
    
    -- Dates and details
    start_date DATE,
    end_date DATE, 
    preferred_duration INTEGER DEFAULT 3,
    travelers INTEGER DEFAULT 2,
    budget_range TEXT DEFAULT 'mid-range',
    notes TEXT,
    stops_of_interest TEXT,
    ski_days INTEGER DEFAULT 0,
    
    -- Flight info
    add_flight BOOLEAN DEFAULT FALSE,
    flight_details JSONB,
    
    -- Preferences and accommodation
    preferences JSONB,
    accommodation_booked BOOLEAN DEFAULT FALSE,
    accommodation_details TEXT,
    
    -- Generated itineraries
    itinerary_proposals JSONB,
    itinerary_proposals_generated BOOLEAN DEFAULT FALSE,
    confirmed_itinerary JSONB,
    
    -- Sharing
    shares JSONB DEFAULT '[]'::jsonb,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- System fields
    ai_generation_completed BOOLEAN DEFAULT FALSE,
    generation_errors TEXT[],
    validation_errors TEXT[]
);

-- ====================================================================
-- TABLE: feedback (User feedback and support)
-- ====================================================================
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT,
    
    type TEXT DEFAULT 'general',
    subject TEXT,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
    page_url TEXT,
    
    status TEXT DEFAULT 'open',
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id)
);

-- ====================================================================
-- TABLE: discount_codes (Promotional codes)
-- ====================================================================
CREATE TABLE discount_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'percentage',
    value DECIMAL(10,2),
    
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    applicable_plans TEXT[] DEFAULT '{}',
    minimum_purchase_amount DECIMAL(10,2) DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    notes TEXT
);

-- ====================================================================
-- TABLE: airports (Airport lookup data)
-- ====================================================================
CREATE TABLE airports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    iata_code CHAR(3) UNIQUE NOT NULL,
    icao_code CHAR(4),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code CHAR(2),
    region TEXT,
    timezone TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- ====================================================================
-- TABLE: conversation_history (AI chat history)
-- ====================================================================
CREATE TABLE conversation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
    function_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ====================================================================
-- TABLE: file_uploads (Track uploaded files)
-- ====================================================================
CREATE TABLE file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    
    status TEXT DEFAULT 'uploaded',
    processing_result JSONB,
    error_message TEXT
);

-- ====================================================================
-- INDEXES for Performance
-- ====================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- Journeys indexes
CREATE INDEX idx_journeys_user_id ON journeys(user_id);
CREATE INDEX idx_journeys_created_at ON journeys(created_at);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_traveling_type ON journeys(traveling_type);

-- Other critical indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_airports_iata ON airports(iata_code);
CREATE INDEX idx_conversation_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_id ON conversation_history(conversation_id);
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_user_usage_user_id ON user_usage_stats(user_id);

-- ====================================================================
-- FUNCTIONS AND TRIGGERS
-- ====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
    BEFORE UPDATE ON journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_stats_updated_at
    BEFORE UPDATE ON user_usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
    -- Create user profile
    INSERT INTO users (
        id, 
        email, 
        full_name,
        email_verified,
        subscription_tier,
        role
    ) VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email_confirmed_at IS NOT NULL,
        COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );

    -- Create user usage stats
    INSERT INTO user_usage_stats (user_id, journeys_created, journeys_limit)
    VALUES (NEW.id, 0, 5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup - creates both profile and usage stats
CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- Function to increment journey count
CREATE OR REPLACE FUNCTION increment_journey_count()
RETURNS trigger AS $$
BEGIN
    UPDATE user_usage_stats 
    SET journeys_created = journeys_created + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment journey count when journey is created
CREATE TRIGGER on_journey_created
    AFTER INSERT ON journeys
    FOR EACH ROW EXECUTE FUNCTION increment_journey_count();

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    IF user_uuid IS NOT NULL THEN
        UPDATE users 
        SET 
            last_active_at = NOW(),
            login_count = CASE 
                WHEN last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '1 hour' 
                THEN login_count + 1 
                ELSE login_count 
            END,
            last_login_at = CASE 
                WHEN last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '1 hour' 
                THEN NOW() 
                ELSE last_login_at 
            END
        WHERE id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System can insert user profiles" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- USER_USAGE_STATS policies
CREATE POLICY "Users can view their own usage stats" ON user_usage_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage stats" ON user_usage_stats
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert usage stats" ON user_usage_stats
    FOR INSERT WITH CHECK (true);

-- JOURNEYS policies
CREATE POLICY "Users can manage their own journeys" ON journeys
    USING (user_id = auth.uid());

-- FEEDBACK policies  
CREATE POLICY "Users can manage their own feedback" ON feedback
    USING (user_id = auth.uid());

-- CONVERSATION policies
CREATE POLICY "Users can manage their own conversations" ON conversation_history
    USING (user_id = auth.uid());

-- FILE_UPLOADS policies
CREATE POLICY "Users can manage their own files" ON file_uploads
    USING (user_id = auth.uid());

-- Public read policies
CREATE POLICY "Anyone can view airports" ON airports FOR SELECT USING (true);
CREATE POLICY "Anyone can view active discount codes" ON discount_codes 
    FOR SELECT USING (is_active = true);

-- ====================================================================
-- SAMPLE DATA
-- ====================================================================

-- Insert popular airports
INSERT INTO airports (iata_code, icao_code, name, city, country, country_code) VALUES
('LAX', 'KLAX', 'Los Angeles International', 'Los Angeles', 'United States', 'US'),
('JFK', 'KJFK', 'John F. Kennedy International', 'New York', 'United States', 'US'),
('LHR', 'EGLL', 'London Heathrow', 'London', 'United Kingdom', 'GB'),
('CDG', 'LFPG', 'Charles de Gaulle', 'Paris', 'France', 'FR'),
('DEN', 'KDEN', 'Denver International', 'Denver', 'United States', 'US'),
('SLC', 'KSLC', 'Salt Lake City International', 'Salt Lake City', 'United States', 'US'),
('ASE', 'KASE', 'Aspen/Pitkin County', 'Aspen', 'United States', 'US'),
('SEA', 'KSEA', 'Seattle-Tacoma International', 'Seattle', 'United States', 'US'),
('SFO', 'KSFO', 'San Francisco International', 'San Francisco', 'United States', 'US'),
('ORD', 'KORD', 'Chicago O''Hare International', 'Chicago', 'United States', 'US');

-- Insert sample discount codes  
INSERT INTO discount_codes (code, description, type, value, max_uses, valid_until) VALUES
('WELCOME20', 'Welcome discount for new users', 'percentage', 20.00, 1000, NOW() + INTERVAL '6 months'),
('PREMIUM50', '50% off first premium month', 'percentage', 50.00, 500, NOW() + INTERVAL '3 months');

-- ====================================================================
-- COMPLETED - Your database is ready!
-- ====================================================================

-- Next steps after running this migration:
-- 1. Try logging in with Google OAuth
-- 2. Your user profile will be created automatically
-- 3. Run this query to make yourself admin (replace your-email@gmail.com):
--    UPDATE users SET role = 'admin', subscription_tier = 'premium' WHERE email = 'your-email@gmail.com';
--    UPDATE user_usage_stats SET is_premium = true, journeys_limit = 9999, ai_requests_limit = 9999 WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');

COMMENT ON TABLE users IS 'User profiles with roles and subscription information';
COMMENT ON TABLE journeys IS 'Core travel plans and itineraries created by users';
COMMENT ON TABLE feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON TABLE user_usage_stats IS 'Track user limits and premium status';