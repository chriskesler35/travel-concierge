-- ====================================================================
-- Travel Concierge - Fix Trigger Issues
-- Run this if you're getting "Database error saving new user"
-- ====================================================================

-- First, let's clean up any conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;

-- Drop the old functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_profile();
DROP FUNCTION IF EXISTS handle_new_user_complete();

-- Create a simple, working function
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if both tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_usage_stats' AND table_schema = 'public') THEN
        
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
            'free',
            'user'
        ) ON CONFLICT (id) DO NOTHING; -- Don't fail if user already exists

        -- Create user usage stats
        INSERT INTO user_usage_stats (user_id, journeys_created, journeys_limit, is_premium)
        VALUES (NEW.id, 0, 5, false)
        ON CONFLICT (user_id) DO NOTHING; -- Don't fail if already exists

        RAISE NOTICE 'Created user profile and stats for: %', NEW.email;
    ELSE
        RAISE WARNING 'Tables do not exist - skipping user profile creation for: %', NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW; -- Don't fail the auth signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Test the setup
SELECT 'Fixed trigger setup completed. Try logging in now!' as result;