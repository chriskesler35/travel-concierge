# Fix for Missing estimated_drive_time Column

## Problem
Getting error: `Could not find the 'estimated_drive_time' column of 'journeys' in the schema cache`

## Solution
The `estimated_drive_time` column is missing from the journeys table. Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS estimated_drive_time INTEGER;

COMMENT ON COLUMN journeys.estimated_drive_time IS 'Estimated driving time in minutes for driving/motorcycle/RV trip types';
```

## Steps:
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" 
3. Create a new query and paste the SQL above
4. Click "Run" to execute

## What this column does:
- Stores estimated driving time in minutes
- Used for trip types: driving, motorcycle, rv_trip  
- NULL for other trip types or when not calculated
- Referenced in JourneyDetails.jsx and Plan.jsx for driving time constraints

After running this SQL, the itinerary generation should work correctly.