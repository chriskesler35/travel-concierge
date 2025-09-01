-- Travel Concierge Database Schema for Supabase
-- This file contains all the tables needed for the Travel Concierge application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- =================================================================
-- CORE TABLES
-- =================================================================

-- 1. JOURNEYS TABLE - Core travel plans/trips
CREATE TABLE journeys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by TEXT, -- Email address for legacy support
    
    -- Basic journey info
    destination TEXT NOT NULL,
    origin TEXT,
    traveling_type TEXT DEFAULT 'destination' CHECK (
        traveling_type IN ('destination', 'ski_trip', 'rv_trip', 'driving', 'motorcycle')
    ),
    type TEXT DEFAULT 'adventure', -- Trip vibe/purpose
    status TEXT DEFAULT 'planning' CHECK (
        status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')
    ),
    
    -- Dates and travelers
    start_date DATE,
    end_date DATE,
    preferred_duration INTEGER DEFAULT 3,
    travelers INTEGER DEFAULT 2,
    
    -- Trip preferences
    budget_range TEXT DEFAULT 'mid-range' CHECK (
        budget_range IN ('budget', 'mid-range', 'luxury', 'ultra-luxury')
    ),
    notes TEXT,
    stops_of_interest TEXT,
    ski_days INTEGER DEFAULT 0,
    
    -- Flight information
    add_flight BOOLEAN DEFAULT FALSE,
    flight_details JSONB, -- {origin, destination, class}
    
    -- Accommodation preferences
    preferences JSONB, -- Complex nested preferences object
    accommodation_booked BOOLEAN DEFAULT FALSE,
    accommodation_details TEXT,
    
    -- Itinerary data
    itinerary_proposals JSONB, -- Array of generated itinerary proposals
    itinerary_proposals_generated BOOLEAN DEFAULT FALSE,
    confirmed_itinerary JSONB, -- The selected/confirmed itinerary
    
    -- Sharing
    shares JSONB DEFAULT '[]'::jsonb, -- Array of {email, permissions}
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Admin/system fields
    ai_generation_completed BOOLEAN DEFAULT FALSE,
    generation_errors TEXT[],
    validation_errors TEXT[]
);

-- Add indexes
CREATE INDEX idx_journeys_user_id ON journeys(user_id);
CREATE INDEX idx_journeys_created_at ON journeys(created_at);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_traveling_type ON journeys(traveling_type);
CREATE INDEX idx_journeys_destination ON journeys USING gin(to_tsvector('english', destination));

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journeys_updated_at
    BEFORE UPDATE ON journeys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================

-- 2. FEEDBACK TABLE - User feedback and reviews
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    
    -- Feedback content
    type TEXT DEFAULT 'general' CHECK (
        type IN ('bug_report', 'feature_request', 'general', 'complaint', 'praise')
    ),
    subject TEXT,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Related entities
    journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
    page_url TEXT,
    
    -- Status and admin fields
    status TEXT DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'resolved', 'closed')
    ),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_journey_id ON feedback(journey_id);

-- Updated at trigger
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================

-- 3. DISCOUNT_CODES TABLE - Promotional codes
CREATE TABLE discount_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Code details
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'percentage' CHECK (
        type IN ('percentage', 'fixed_amount', 'free_trial')
    ),
    value DECIMAL(10,2), -- Percentage (0-100) or fixed amount
    
    -- Usage constraints
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Applicable to
    applicable_plans TEXT[] DEFAULT '{}', -- Array of plan types
    minimum_purchase_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Admin fields
    created_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Add indexes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX idx_discount_codes_valid ON discount_codes(valid_from, valid_until);

-- Updated at trigger
CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================

-- 4. USER_USAGE_STATS TABLE - Track user limits and usage
CREATE TABLE user_usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Journey limits
    journeys_created INTEGER DEFAULT 0,
    journeys_limit INTEGER DEFAULT 5, -- Free tier limit
    
    -- AI usage
    ai_requests_made INTEGER DEFAULT 0,
    ai_requests_limit INTEGER DEFAULT 20,
    
    -- Premium status
    is_premium BOOLEAN DEFAULT FALSE,
    premium_since TIMESTAMPTZ,
    premium_until TIMESTAMPTZ,
    
    -- Subscription info
    subscription_id TEXT,
    subscription_status TEXT,
    
    -- Usage period (resets monthly)
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month')
);

-- Add indexes
CREATE INDEX idx_user_usage_user_id ON user_usage_stats(user_id);
CREATE INDEX idx_user_usage_premium ON user_usage_stats(is_premium);

-- Updated at trigger
CREATE TRIGGER update_user_usage_stats_updated_at
    BEFORE UPDATE ON user_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================

-- 5. AIRPORTS TABLE - Airport data for lookups
CREATE TABLE airports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    iata_code CHAR(3) UNIQUE NOT NULL,
    icao_code CHAR(4),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code CHAR(2),
    region TEXT,
    coordinates POINT, -- PostGIS point for lat/lng
    timezone TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes
CREATE INDEX idx_airports_iata ON airports(iata_code);
CREATE INDEX idx_airports_icao ON airports(icao_code);
CREATE INDEX idx_airports_city ON airports USING gin(to_tsvector('english', city));
CREATE INDEX idx_airports_name ON airports USING gin(to_tsvector('english', name));
CREATE INDEX idx_airports_country ON airports(country);

-- =================================================================

-- 6. CONVERSATION_HISTORY TABLE - AI Assistant chat history
CREATE TABLE conversation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- User relationship
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL, -- Groups messages in a conversation
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Context
    journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
    function_name TEXT, -- AI function that was called
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX idx_conversation_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_id ON conversation_history(conversation_id);
CREATE INDEX idx_conversation_created_at ON conversation_history(created_at);
CREATE INDEX idx_conversation_journey_id ON conversation_history(journey_id);

-- =================================================================

-- 7. FILE_UPLOADS TABLE - Track uploaded files
CREATE TABLE file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- User and journey context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    
    -- File details
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase storage
    
    -- Processing status
    status TEXT DEFAULT 'uploaded' CHECK (
        status IN ('uploaded', 'processing', 'processed', 'error')
    ),
    processing_result JSONB,
    error_message TEXT
);

-- Add indexes
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_journey_id ON file_uploads(journey_id);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);

-- =================================================================
-- ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- JOURNEYS policies
CREATE POLICY "Users can view their own journeys" ON journeys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own journeys" ON journeys
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own journeys" ON journeys
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own journeys" ON journeys
    FOR DELETE USING (user_id = auth.uid());

-- FEEDBACK policies
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- USER_USAGE_STATS policies
CREATE POLICY "Users can view their own usage stats" ON user_usage_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage stats" ON user_usage_stats
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert usage stats" ON user_usage_stats
    FOR INSERT WITH CHECK (true);

-- CONVERSATION_HISTORY policies
CREATE POLICY "Users can view their own conversations" ON conversation_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON conversation_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- FILE_UPLOADS policies
CREATE POLICY "Users can view their own uploads" ON file_uploads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload their own files" ON file_uploads
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- AIRPORTS - public read access
CREATE POLICY "Anyone can view airports" ON airports FOR SELECT USING (true);

-- DISCOUNT_CODES - public read for active codes
CREATE POLICY "Anyone can view active discount codes" ON discount_codes 
    FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- =================================================================
-- FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function to create user usage stats when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO user_usage_stats (user_id, journeys_created, journeys_limit)
    VALUES (NEW.id, 0, 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create usage stats for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- =================================================================
-- SAMPLE DATA (Optional)
-- =================================================================

-- Insert some popular airports
INSERT INTO airports (iata_code, icao_code, name, city, country, country_code) VALUES
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US'),
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US'),
('LHR', 'EGLL', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB'),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR'),
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'JP'),
('DEN', 'KDEN', 'Denver International Airport', 'Denver', 'United States', 'US'),
('SLC', 'KSLC', 'Salt Lake City International Airport', 'Salt Lake City', 'United States', 'US'),
('ASE', 'KASE', 'Aspen/Pitkin County Airport', 'Aspen', 'United States', 'US');

-- Insert sample discount codes
INSERT INTO discount_codes (code, description, type, value, max_uses, valid_until) VALUES
('WELCOME20', 'Welcome discount for new users', 'percentage', 20.00, 1000, NOW() + INTERVAL '6 months'),
('PREMIUM50', '50% off first premium month', 'percentage', 50.00, 500, NOW() + INTERVAL '3 months'),
('FREETRIAL', 'Free 7-day trial', 'free_trial', 0.00, 10000, NOW() + INTERVAL '1 year');

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE journeys IS 'Core travel plans and itineraries created by users';
COMMENT ON TABLE feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON TABLE discount_codes IS 'Promotional discount codes for premium features';
COMMENT ON TABLE user_usage_stats IS 'Track user limits and premium status';
COMMENT ON TABLE airports IS 'Airport data for flight booking and lookups';
COMMENT ON TABLE conversation_history IS 'AI assistant chat history and conversations';
COMMENT ON TABLE file_uploads IS 'Track files uploaded by users (itineraries, images, etc.)';

-- =================================================================
-- END OF SCHEMA
-- =================================================================