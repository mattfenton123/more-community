-- 1. Update Messages Table (add image column)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image text;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text,
  joined text,
  bio text,
  avatar text
);

-- 3. Create Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  cover_image text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  image text,
  attendees integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Community Memberships Table
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member', -- 'Member', 'Leader', 'Co-Leader'
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo text NOT NULL,
  url text NOT NULL,
  tier text NOT NULL, -- 'Headline', 'Community', 'Event'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Sponsorship Assignments Table
CREATE TABLE IF NOT EXISTS public.sponsorship_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  target_id text NOT NULL, -- can be community_id or event_id
  target_type text NOT NULL, -- 'community' or 'event'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for all tables so the app can sync live
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, sponsors, sponsorship_assignments;
commit;

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_assignments ENABLE ROW LEVEL SECURITY;

-- Create SELECT-only policies (Read-only for clients, mutations handled by Server Actions)
CREATE POLICY "Allow public read access on messages" ON public.messages FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on communities" ON public.communities FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on events" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on channels" ON public.channels FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on community_memberships" ON public.community_memberships FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on sponsors" ON public.sponsors FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on sponsorship_assignments" ON public.sponsorship_assignments FOR SELECT TO public USING (true);
