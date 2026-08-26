-- Migration 010: Community Verification and Additional Fields
-- Description: Adds verification status and social handle fields to the communities table

-- 1. Add new columns to the communities table
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_group TEXT,
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS cost TEXT DEFAULT 'Free';

-- 2. Update existing communities to ensure default values
UPDATE communities 
SET verified = false 
WHERE verified IS NULL;

UPDATE communities 
SET activity_level = 'Active' 
WHERE activity_level IS NULL;

UPDATE communities 
SET cost = 'Free' 
WHERE cost IS NULL;

-- 3. (Optional) If RLS is enabled, ensure policies allow inserting these new fields.
-- Assuming standard service role usage bypassing RLS, no policy changes are strictly necessary here.
