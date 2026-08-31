-- Migration to support Ideas in the feed
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'post';
