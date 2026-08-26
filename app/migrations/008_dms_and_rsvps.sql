-- 1. Create Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text,
  image text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Event RSVPs Table (with Ticket Type)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going', -- 'going', 'not_going'
  ticket_type text DEFAULT 'free', -- 'free', 'paid'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 3. Enable Realtime for the new tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, notifications, direct_messages, event_rsvps;
commit;
