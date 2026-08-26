-- ============================================================
-- Migration 002: Auth, Events RSVP, Notifications, Location
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. User enhancements for onboarding
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_uid uuid;

-- 2. Event RSVPs
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going', -- 'going', 'interested', 'declined'
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'event_reminder', 'new_member', 'broadcast', 'rsvp'
  title text NOT NULL,
  body text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Location data for communities (for map view)
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS lng double precision;

-- 5. Update some communities with TW-area coordinates
UPDATE public.communities SET lat = 51.1322, lng = 0.2637 WHERE id = 'mindful-miles';
UPDATE public.communities SET lat = 51.1352, lng = 0.2587 WHERE id = 'tw-ramblers';
UPDATE public.communities SET lat = 51.1290, lng = 0.2710 WHERE id = 'a-z-challenge';
UPDATE public.communities SET lat = 51.1380, lng = 0.2530 WHERE id = 'tw-parkrun';
UPDATE public.communities SET lat = 51.1310, lng = 0.2680 WHERE id = 'tw-yoga-collective';
UPDATE public.communities SET lat = 51.1270, lng = 0.2760 WHERE id = 'kent-adventures';
UPDATE public.communities SET lat = 51.1340, lng = 0.2600 WHERE id = 'tw-good-neighbours';
UPDATE public.communities SET lat = 51.1300, lng = 0.2650 WHERE id = 'tw-interfaith-network';
UPDATE public.communities SET lat = 51.1360, lng = 0.2550 WHERE id = 'tw-creative-collective';
UPDATE public.communities SET lat = 51.1330, lng = 0.2620 WHERE id = 'yentw';

-- 6. Add new tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps, notifications;
