-- Run this in the Supabase SQL Editor to update your schema for the new features.

-- 1. Update the 'users' table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS "affinityProfile" JSONB;

-- 2. Update the 'events' table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profit_share_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profit_share_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_level TEXT,
ADD COLUMN IF NOT EXISTS cohost_community_ids TEXT[],
ADD COLUMN IF NOT EXISTS meeting_point TEXT,
ADD COLUMN IF NOT EXISTS itinerary TEXT,
ADD COLUMN IF NOT EXISTS what_to_bring TEXT;

-- 3. Update the 'communities' table for the reporting/flagging feature
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS guidelines TEXT[];
