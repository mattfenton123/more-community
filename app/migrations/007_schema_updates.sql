-- 1. Restore tags to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g., 'event_match'
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Realtime for notifications
begin;
  -- Remove existing publication to recreate
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, notifications;
commit;
