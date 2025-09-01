-- ====================================================================
-- Travel Concierge - Database Diagnostic Check
-- Run this to see what's currently in your database
-- ====================================================================

-- Check if tables exist
SELECT 'users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'user_usage_stats' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_usage_stats' AND table_schema = 'public') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'journeys' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journeys' AND table_schema = 'public') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check what triggers exist on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- Check what functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';

-- Check if there are any existing users in the users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Users table exists. Current count: %', (SELECT COUNT(*) FROM users);
        
        -- Show any existing users (without sensitive data)
        PERFORM (SELECT string_agg(email || ' (role: ' || role || ', tier: ' || subscription_tier || ')', ', ') FROM users);
        IF FOUND THEN
            RAISE NOTICE 'Existing users: %', (SELECT string_agg(email || ' (role: ' || role || ', tier: ' || subscription_tier || ')', ', ') FROM users);
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist!';
    END IF;
END $$;

-- Check user_usage_stats count
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_usage_stats' AND table_schema = 'public') THEN
        RAISE NOTICE 'user_usage_stats table exists. Current count: %', (SELECT COUNT(*) FROM user_usage_stats);
    ELSE
        RAISE NOTICE 'user_usage_stats table does not exist!';
    END IF;
END $$;

SELECT 'Diagnostic check completed' as result;