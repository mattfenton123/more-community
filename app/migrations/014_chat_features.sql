-- Migration 014: Chat Features Expansion (Read Receipts)
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    community_id VARCHAR, -- Nullable if it's a DM
    channel_id VARCHAR, -- The channel name or target user ID for DMs
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, community_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own read receipts" ON public.chat_read_receipts
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own read receipts" ON public.chat_read_receipts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own read receipts" ON public.chat_read_receipts
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Add to publications for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_read_receipts;
