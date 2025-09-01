-- ====================================================================
-- Travel Concierge - Safe Database Migration (Checks for existing tables)
-- Run this in your Supabase SQL Editor - it will only create what's missing
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE: users (User profiles and roles - Only if it doesn't exist)
-- ====================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
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
        
        -- Users indexes
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_role ON users(role);
        CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
        CREATE INDEX idx_users_is_active ON users(is_active);
        CREATE INDEX idx_users_last_active ON users(last_active_at);
        
        RAISE NOTICE 'Created users table and indexes';
    ELSE
        RAISE NOTICE 'users table already exists, skipping';
    END IF;
END $$;

-- ====================================================================
-- Update user_usage_stats to reference users table (if needed)
-- ====================================================================
DO $$ 
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_usage_stats_user_id_fkey' 
        AND table_name = 'user_usage_stats'
    ) THEN
        -- First, we need to temporarily disable the existing constraint if any
        ALTER TABLE user_usage_stats DROP CONSTRAINT IF EXISTS user_usage_stats_user_id_fkey;
        
        -- Add the proper constraint to users table
        ALTER TABLE user_usage_stats ADD CONSTRAINT user_usage_stats_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Updated user_usage_stats foreign key constraint';
    ELSE
        RAISE NOTICE 'user_usage_stats foreign key already exists';
    END IF;
END $$;

-- ====================================================================
-- FUNCTIONS AND TRIGGERS (Drop and recreate to ensure they work)
-- ====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;

-- Apply updated_at trigger to users table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created users updated_at trigger';
    END IF;
END $$;

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS trigger AS $$
BEGIN
    -- Create user profile (only if users table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
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
    END IF;

    -- Create user usage stats (always exists)
    INSERT INTO user_usage_stats (user_id, journeys_created, journeys_limit)
    VALUES (NEW.id, 0, 5)
    ON CONFLICT (user_id) DO NOTHING; -- Don't fail if already exists

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_complete();

-- Function to update user activity (only if users table exists)
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    IF user_uuid IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
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
-- ROW LEVEL SECURITY POLICIES (Only if users table exists)
-- ====================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies first
        DROP POLICY IF EXISTS "Users can view their own profile" ON users;
        DROP POLICY IF EXISTS "Users can update their own profile" ON users;
        DROP POLICY IF EXISTS "System can insert user profiles" ON users;
        DROP POLICY IF EXISTS "Admins can view all users" ON users;
        
        -- Create policies
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
            
        RAISE NOTICE 'Created RLS policies for users table';
    END IF;
END $$;

-- ====================================================================
-- COMPLETED - Your database is now ready!
-- ====================================================================

-- What this migration did:
-- ✓ Created users table (if it didn't exist)
-- ✓ Updated triggers and functions to work properly
-- ✓ Set up RLS policies for security
-- ✓ Made sure existing data isn't affected

-- Next steps:
-- 1. Try logging in with Google OAuth
-- 2. Your user profile will be created automatically
-- 3. Run this to make yourself admin (replace your email):
--    UPDATE users SET role = 'admin', subscription_tier = 'premium' WHERE email = 'your-email@gmail.com';

SELECT 'Migration completed successfully! Your database is ready.' as status;