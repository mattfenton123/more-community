-- ============================================================
-- Migration 005: RLS Policies and Auth Triggers
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_photos ENABLE ROW LEVEL SECURITY;

-- 2. Create Public Read Policies (Anyone authenticated can read public data)
-- For a true production app with private groups, this would be restricted.
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Public Read Messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public Read Memberships" ON public.community_memberships FOR SELECT USING (true);
CREATE POLICY "Public Read Reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Public Read Polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Public Read Poll Votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Public Read Photos" ON public.community_photos FOR SELECT USING (true);

-- 3. Create Write Policies based on auth.uid()
-- Users can update their own profile
CREATE POLICY "Update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

-- Users can insert messages if they are the author
CREATE POLICY "Insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- Users can join communities
CREATE POLICY "Insert own memberships" ON public.community_memberships FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Delete own memberships" ON public.community_memberships FOR DELETE USING (auth.uid()::text = user_id);

-- Community Leaders can update community info
CREATE POLICY "Leaders update community" ON public.communities FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_memberships.community_id = communities.id 
    AND community_memberships.user_id = auth.uid()::text 
    AND community_memberships.role = 'Leader'
  )
);

-- Users can create communities (we'll need a trigger or transaction to also make them leader)
CREATE POLICY "Insert communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Auth User Trigger (Auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar, role, joined, bio)
  VALUES (
    NEW.id::text, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150'),
    'Member',
    'Joined ' || to_char(NOW(), 'Mon YYYY'),
    ''
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
