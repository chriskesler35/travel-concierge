-- Comprehensive fix for ALL missing columns in journeys table
-- This addresses both "estimated_drive_time" and "waypoints" column errors
-- Run this in Supabase SQL Editor to fix all column issues

-- Add missing columns to journeys table
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS estimated_drive_time INTEGER,
ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the new columns
COMMENT ON COLUMN journeys.estimated_drive_time IS 'Estimated driving time in minutes for driving/motorcycle/RV trip types';
COMMENT ON COLUMN journeys.waypoints IS 'Array of waypoints/stops for route-based trips (driving, motorcycle, RV)';

-- Optional: Add indexes for performance if needed
-- CREATE INDEX IF NOT EXISTS idx_journeys_waypoints ON journeys USING gin(waypoints);

-- Note: The AdminPanel.jsx references 'created_date' but should use 'created_at' 
-- This is a code bug, not a missing column. The fix is in the code, not the database.

-- Verify columns exist (this query should return both columns)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'journeys' 
  AND column_name IN ('estimated_drive_time', 'waypoints')
ORDER BY column_name;