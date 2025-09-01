-- ====================================================================
-- Travel Concierge - Setup Admin User
-- Run this AFTER you've logged in with Google OAuth to make yourself admin
-- ====================================================================

-- First, check what user ID you have by logging in and running:
-- SELECT auth.uid(), auth.email();

-- Then update this query with your actual email and run it:
-- Replace 'your-email@gmail.com' with your actual email address

UPDATE users 
SET 
    role = 'admin',
    subscription_tier = 'premium',
    subscription_status = 'active',
    full_name = 'Admin User'  -- Update this to your preferred name
WHERE email = 'your-email@gmail.com';  -- Replace with your actual email

-- Also update the user_usage_stats to give yourself premium limits
UPDATE user_usage_stats 
SET 
    is_premium = true,
    premium_since = NOW(),
    premium_until = NOW() + INTERVAL '1 year',
    journeys_limit = 9999,
    ai_requests_limit = 9999
WHERE user_id = (
    SELECT id FROM users WHERE email = 'your-email@gmail.com'  -- Replace with your actual email
);

-- Verify the changes
SELECT 
    u.email,
    u.full_name,
    u.role,
    u.subscription_tier,
    u.subscription_status,
    uus.is_premium,
    uus.journeys_limit,
    uus.ai_requests_limit
FROM users u
LEFT JOIN user_usage_stats uus ON u.id = uus.user_id
WHERE u.email = 'your-email@gmail.com';  -- Replace with your actual email

-- ====================================================================
-- Alternative: If you know your user ID, you can use it directly:
-- ====================================================================

-- UPDATE users 
-- SET 
--     role = 'admin',
--     subscription_tier = 'premium',
--     subscription_status = 'active'
-- WHERE id = 'your-user-id-uuid-here';

-- UPDATE user_usage_stats 
-- SET 
--     is_premium = true,
--     premium_since = NOW(),
--     premium_until = NOW() + INTERVAL '1 year',
--     journeys_limit = 9999,
--     ai_requests_limit = 9999
-- WHERE user_id = 'your-user-id-uuid-here';