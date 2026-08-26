-- =========================================================================
-- MASTER MIGRATION UPDATE
-- Copy and paste this ENTIRE file into the Supabase SQL Editor and hit "Run".
-- This applies all missing tables and columns from the recent features.
-- =========================================================================

-- 1. Create Direct Messages Table (from 008)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text,
  image text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Event RSVPs Table (from 008)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going', -- 'going', 'not_going'
  ticket_type text DEFAULT 'free', -- 'free', 'paid'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 3. Add Community Verification & Extra Fields (from 010)
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_group TEXT,
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS cost TEXT DEFAULT 'Free';

UPDATE communities SET verified = false WHERE verified IS NULL;
UPDATE communities SET activity_level = 'Active' WHERE activity_level IS NULL;
UPDATE communities SET cost = 'Free' WHERE cost IS NULL;

-- 4. Create Feed Posts Table (from 012)
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  media text,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Realtime for all tables (re-run to include the new tables)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, notifications, direct_messages, event_rsvps, feed_posts;
commit;
