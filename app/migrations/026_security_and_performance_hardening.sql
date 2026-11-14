-- ============================================================
-- Migration 026: Security & Performance Hardening
-- Synced on live (xasaxxjxxkdruuqbrcmf) and demo (nkyithbhufwgwnbxvqqu)
-- - Locks search_path on SECURITY DEFINER function handle_new_user()
-- - Enables RLS and policies on direct_message_reactions + reviews insert
-- - Wraps auth.uid() calls in (select auth.uid()) to eliminate initplan overhead
-- - Adds covering indexes for all foreign keys
-- ============================================================

-- 1. Function search_path hardening
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users (id, name, avatar, role, joined, bio)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    'Member',
    'Joined ' || pg_catalog.to_char(pg_catalog.now(), 'Mon YYYY'),
    'New here.'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2. Missing RLS + policies for direct_message_reactions (from 018)
ALTER TABLE public.direct_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reactions on their direct messages" ON public.direct_message_reactions;
CREATE POLICY "Users can view reactions on their direct messages" ON public.direct_message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.direct_messages dm
      WHERE dm.id = direct_message_reactions.message_id
        AND (dm.sender_id = (select auth.uid())::text OR dm.receiver_id = (select auth.uid())::text)
    )
  );

DROP POLICY IF EXISTS "Users can react to their direct messages" ON public.direct_message_reactions;
CREATE POLICY "Users can react to their direct messages" ON public.direct_message_reactions
  FOR INSERT WITH CHECK (
    (select auth.uid())::text = user_id
    AND EXISTS (
      SELECT 1 FROM public.direct_messages dm
      WHERE dm.id = direct_message_reactions.message_id
        AND (dm.sender_id = (select auth.uid())::text OR dm.receiver_id = (select auth.uid())::text)
    )
  );

DROP POLICY IF EXISTS "Users can remove their own direct message reactions" ON public.direct_message_reactions;
CREATE POLICY "Users can remove their own direct message reactions" ON public.direct_message_reactions
  FOR DELETE USING ((select auth.uid())::text = user_id);

-- 3. Reviews insert policy & sponsors policy normalization
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on reviews" ON public.reviews;
CREATE POLICY "Allow public read access on reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on reviews" ON public.reviews;
CREATE POLICY "Allow authenticated insert on reviews" ON public.reviews
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Allow public read access on sponsors" ON public.sponsors;
CREATE POLICY "Allow public read access on sponsors" ON public.sponsors
  FOR SELECT USING (true);

ALTER TABLE public.sponsorship_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on sponsorship_assignments" ON public.sponsorship_assignments;
DROP POLICY IF EXISTS "Allow public read access on sponsorship_assignments" ON public.sponsorship_assignments;
CREATE POLICY "Allow public read access on sponsorship_assignments" ON public.sponsorship_assignments
  FOR SELECT USING (true);

-- 4. RLS auth_rls_initplan hardening: wrap auth.uid() in (select auth.uid())

-- public.users
DROP POLICY IF EXISTS "Update own profile" ON public.users;
CREATE POLICY "Update own profile" ON public.users
  FOR UPDATE USING ((select auth.uid())::text = id);

-- public.communities
DROP POLICY IF EXISTS "Insert communities" ON public.communities;
CREATE POLICY "Insert communities" ON public.communities
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders update community" ON public.communities;
CREATE POLICY "Leaders update community" ON public.communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = communities.id
        AND community_memberships.user_id = (select auth.uid())::text
        AND community_memberships.role IN ('Leader', 'Co-Leader')
    )
  );

-- public.community_memberships
DROP POLICY IF EXISTS "Insert own memberships" ON public.community_memberships;
CREATE POLICY "Insert own memberships" ON public.community_memberships
  FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Delete own memberships" ON public.community_memberships;
CREATE POLICY "Delete own memberships" ON public.community_memberships
  FOR DELETE USING ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Leaders update memberships" ON public.community_memberships;
CREATE POLICY "Leaders update memberships" ON public.community_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_memberships cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = (select auth.uid())::text
        AND cm.role IN ('Leader', 'Co-Leader')
    )
  );

-- public.events
DROP POLICY IF EXISTS "Leaders create events" ON public.events;
CREATE POLICY "Leaders create events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = events.community_id
        AND community_memberships.user_id = (select auth.uid())::text
        AND community_memberships.role IN ('Leader', 'Co-Leader')
    )
  );

DROP POLICY IF EXISTS "Leaders update events" ON public.events;
CREATE POLICY "Leaders update events" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = events.community_id
        AND community_memberships.user_id = (select auth.uid())::text
        AND community_memberships.role IN ('Leader', 'Co-Leader')
    )
  );

-- public.channels
DROP POLICY IF EXISTS "Leaders create channels" ON public.channels;
CREATE POLICY "Leaders create channels" ON public.channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_memberships
      WHERE community_memberships.community_id = channels.community_id
        AND community_memberships.user_id = (select auth.uid())::text
        AND community_memberships.role IN ('Leader', 'Co-Leader')
    )
  );

-- public.messages
DROP POLICY IF EXISTS "Insert own messages" ON public.messages;
CREATE POLICY "Insert own messages" ON public.messages
  FOR INSERT WITH CHECK ((select auth.uid())::text = author_id);

-- public.chat_read_receipts
DROP POLICY IF EXISTS "Users can view their own read receipts" ON public.chat_read_receipts;
CREATE POLICY "Users can view their own read receipts" ON public.chat_read_receipts
  FOR SELECT USING ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own read receipts" ON public.chat_read_receipts;
CREATE POLICY "Users can insert their own read receipts" ON public.chat_read_receipts
  FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update their own read receipts" ON public.chat_read_receipts;
CREATE POLICY "Users can update their own read receipts" ON public.chat_read_receipts
  FOR UPDATE USING ((select auth.uid())::text = user_id);

-- public.direct_messages
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their own direct messages" ON public.direct_messages
  FOR SELECT USING ((select auth.uid())::text = sender_id OR (select auth.uid())::text = receiver_id);

DROP POLICY IF EXISTS "Users can insert their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can insert their own direct messages" ON public.direct_messages
  FOR INSERT WITH CHECK ((select auth.uid())::text = sender_id);

-- public.event_rsvps
DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can insert their own RSVPs" ON public.event_rsvps
  FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can update their own RSVPs" ON public.event_rsvps
  FOR UPDATE USING ((select auth.uid())::text = user_id);

-- public.feed_posts
DROP POLICY IF EXISTS "Users can insert their own feed posts" ON public.feed_posts;
CREATE POLICY "Users can insert their own feed posts" ON public.feed_posts
  FOR INSERT WITH CHECK ((select auth.uid())::text = author_id);

-- public.feed_post_likes
DROP POLICY IF EXISTS "Users can like posts" ON public.feed_post_likes;
CREATE POLICY "Users can like posts" ON public.feed_post_likes
  FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.feed_post_likes;
CREATE POLICY "Users can unlike posts" ON public.feed_post_likes
  FOR DELETE USING ((select auth.uid())::text = user_id);

-- public.feed_post_comments
DROP POLICY IF EXISTS "Users can comment on posts" ON public.feed_post_comments;
CREATE POLICY "Users can comment on posts" ON public.feed_post_comments
  FOR INSERT WITH CHECK ((select auth.uid())::text = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.feed_post_comments;
CREATE POLICY "Users can delete own comments" ON public.feed_post_comments
  FOR DELETE USING ((select auth.uid())::text = author_id);

-- public.notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING ((select auth.uid())::text = user_id);

-- public.event_carpools
DROP POLICY IF EXISTS "Drivers can insert their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can insert their own carpool" ON public.event_carpools
  FOR INSERT WITH CHECK ((select auth.uid())::text = driver_id);

DROP POLICY IF EXISTS "Drivers can update their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can update their own carpool" ON public.event_carpools
  FOR UPDATE USING ((select auth.uid())::text = driver_id);

DROP POLICY IF EXISTS "Drivers can delete their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can delete their own carpool" ON public.event_carpools
  FOR DELETE USING ((select auth.uid())::text = driver_id);

-- public.event_carpool_passengers
DROP POLICY IF EXISTS "Users can reserve their own carpool seat" ON public.event_carpool_passengers;
CREATE POLICY "Users can reserve their own carpool seat" ON public.event_carpool_passengers
  FOR INSERT WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can release their own carpool seat" ON public.event_carpool_passengers;
CREATE POLICY "Users can release their own carpool seat" ON public.event_carpool_passengers
  FOR DELETE USING ((select auth.uid())::text = user_id);

-- 5. Covering indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_channels_community_id ON public.channels(community_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_photos_community_id ON public.community_photos(community_id);
CREATE INDEX IF NOT EXISTS idx_community_photos_uploaded_by ON public.community_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_direct_message_reactions_user_id ON public.direct_message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_parent_id ON public.direct_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_event_carpool_passengers_user_id ON public.event_carpool_passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_event_carpools_driver_id ON public.event_carpools(driver_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_comments_author_id ON public.feed_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_comments_post_id ON public.feed_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_user_id ON public.feed_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_id ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_community_id ON public.feed_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_community_id ON public.polls(community_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON public.polls(created_by);
CREATE INDEX IF NOT EXISTS idx_sponsorship_assignments_sponsor_id ON public.sponsorship_assignments(sponsor_id);

NOTIFY pgrst, 'reload schema';
