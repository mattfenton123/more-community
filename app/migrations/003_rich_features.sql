-- ============================================================
-- Migration 003: Rich Community Features
-- Reactions, Pinned Messages, Polls, Photo Gallery
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Message Reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id text NOT NULL,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- 2. Pinned Messages flag
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

-- 3. Polls
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  channel text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id),
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id)
);

-- 4. Community Photo Gallery
CREATE TABLE IF NOT EXISTS public.community_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  uploaded_by text NOT NULL REFERENCES public.users(id),
  url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions, polls, poll_votes, community_photos;
