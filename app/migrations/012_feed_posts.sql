-- 1. Create Feed Posts Table
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

-- 2. Add feed_posts to Realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, notifications, direct_messages, event_rsvps, feed_posts;
commit;
