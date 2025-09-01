# Travel Concierge Database Schema

This directory contains the database schema and migration files for the Travel Concierge application, designed for Supabase PostgreSQL.

## Quick Setup

1. **Run the migration in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor"
   - Copy and paste the contents of `01_initial_migration.sql`
   - Click "Run" to execute

2. **Verify the setup:**
   - Check "Table Editor" to see all tables were created
   - Verify Row Level Security policies are active

## Database Tables Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `journeys` | Main travel plans and itineraries | Full journey data, itinerary proposals, sharing |
| `feedback` | User feedback and support requests | Rating system, admin workflow |
| `discount_codes` | Promotional codes for premium features | Usage tracking, expiration dates |
| `user_usage_stats` | Track user limits and premium status | Journey limits, AI usage, subscription status |

### Supporting Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `airports` | Airport lookup data | IATA codes, city/country info |
| `conversation_history` | AI assistant chat logs | Conversation threading, context |
| `file_uploads` | Track uploaded files | Storage paths, processing status |

## Key Features

### 🔒 Security
- **Row Level Security (RLS)** enabled on all user tables
- Users can only access their own data
- Public read access for airports and active discount codes
- Secure foreign key relationships

### 🚀 Performance  
- Optimized indexes on frequently queried columns
- Text search indexes for destinations and airports
- Efficient JSONB storage for complex data

### 🔄 Data Integrity
- Foreign key constraints with appropriate CASCADE/SET NULL
- Check constraints for enum-like fields
- Automatic timestamp updates with triggers
- User usage stats automatically created on signup

## Table Details

### journeys
The core table storing all travel plans with these key fields:

**Basic Info:**
- `destination`, `origin` - Travel locations
- `traveling_type` - Type of trip (destination, ski_trip, rv_trip, driving, motorcycle)
- `status` - Current status (planning, confirmed, in_progress, completed)
- `start_date`, `end_date`, `travelers` - Trip logistics

**Complex Data (JSONB):**
- `itinerary_proposals` - Array of AI-generated itinerary options
- `confirmed_itinerary` - User's selected final itinerary  
- `flight_details` - Flight booking information
- `preferences` - User travel preferences and requirements
- `shares` - Array of users the journey is shared with

### user_usage_stats
Tracks user limits and premium status:
- `journeys_created` / `journeys_limit` - Journey creation tracking
- `ai_requests_made` / `ai_requests_limit` - AI usage limits
- `is_premium`, `premium_since`, `premium_until` - Subscription status

### feedback
User feedback system with:
- Multiple feedback types (bug_report, feature_request, general, etc.)
- Star ratings (1-5)
- Admin workflow (open, in_progress, resolved, closed)
- Journey context linking

## Row Level Security Policies

All tables have RLS policies that ensure:
- Users can only see/modify their own data
- Public data (airports, active discount codes) is readable by all
- System operations (like creating user stats) work correctly

## Sample Data

The migration includes:
- **10 popular airports** for flight booking
- **2 sample discount codes** for testing promotions
- All tables are ready for production use

## Usage with Supabase Auth

The schema integrates seamlessly with Supabase Auth:
- `user_id` fields reference `auth.users(id)`
- New user trigger automatically creates usage stats
- RLS policies use `auth.uid()` for user identification

## Next Steps

After running the migration:

1. **Configure your app's Supabase client** with the project URL and anon key
2. **Set up OAuth providers** in Supabase Auth settings  
3. **Create a storage bucket** for file uploads if needed
4. **Customize discount codes** and airport data as needed
5. **Test the authentication flow** with your frontend

## Maintenance

- Monitor the `user_usage_stats` table for usage patterns
- Regularly clean up old `conversation_history` records
- Archive completed journeys older than 1 year
- Update airport data periodically

## Support

If you encounter any issues with the database setup:
1. Check the Supabase logs for error messages
2. Verify all foreign key relationships are intact
3. Ensure RLS policies aren't blocking legitimate operations
4. Review the sample queries in the SQL files