-- ============================================================
-- Migration 018: Chat Threading
-- Add parent_id to support threads in messages and direct_messages
-- Add missing table for direct_message_reactions
-- ============================================================

-- 1. Add parent_id to public.messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;

-- 2. Add parent_id to public.direct_messages
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE;

-- 3. Create direct_message_reactions table
CREATE TABLE IF NOT EXISTS public.direct_message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Enable realtime for the new reactions tables if not already done
DO $$
BEGIN
  -- message_reactions might already be in publication, but we can try adding
  alter publication supabase_realtime add table public.message_reactions;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  alter publication supabase_realtime add table public.direct_message_reactions;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
