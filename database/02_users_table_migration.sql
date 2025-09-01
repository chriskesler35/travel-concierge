-- ====================================================================
-- Travel Concierge - Users Profile Table Migration
-- Add this to your Supabase SQL Editor to add user profiles and roles
-- ====================================================================

-- ====================================================================
-- TABLE: users (User profiles and roles - extends auth.users)
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
    
    -- Subscription information (extends user_usage_stats)
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
-- INDEXES for Performance
-- ====================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- System can insert user profiles
CREATE POLICY "System can insert user profiles" ON users
    FOR INSERT WITH CHECK (true);

-- Admins can view all users (for admin panel)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ====================================================================
-- TRIGGERS AND FUNCTIONS
-- ====================================================================

-- Updated at trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile for new auth users
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

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
-- SAMPLE ADMIN USER (Replace with your actual email)
-- ====================================================================

-- This will be run later once you're authenticated
-- INSERT INTO users (id, email, full_name, role, subscription_tier) 
-- SELECT 
--     auth.uid(), 
--     'your-email@example.com', 
--     'Admin User', 
--     'admin', 
--     'premium'
-- WHERE auth.uid() IS NOT NULL;

-- ====================================================================
-- UPDATE user_usage_stats to work with new users table
-- ====================================================================

-- Add foreign key constraint to link user_usage_stats with users table
-- (Optional - keeps existing functionality working)
-- ALTER TABLE user_usage_stats ADD CONSTRAINT fk_user_usage_stats_users 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ====================================================================
-- COMPLETED - User profiles are ready!
-- ====================================================================

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Login with Google OAuth to create your auth user
-- 3. Update your user record to have admin role and premium subscription
-- 4. Test the authentication flow

COMMENT ON TABLE users IS 'User profiles with roles and subscription information';