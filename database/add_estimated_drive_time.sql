-- Add missing estimated_drive_time column to journeys table
-- This column is used to store the estimated driving time for driving/motorcycle/RV trips

ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS estimated_drive_time INTEGER;

-- Add a comment to explain the column
COMMENT ON COLUMN journeys.estimated_drive_time IS 'Estimated driving time in minutes for driving/motorcycle/RV trip types';

-- Update existing schema file documentation
-- The estimated_drive_time column stores the estimated time for driving between origin and destination
-- Used for trip types: driving, motorcycle, rv_trip
-- Value is in minutes, NULL for non-driving trip types or when not calculated