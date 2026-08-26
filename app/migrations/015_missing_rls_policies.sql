-- Migration 015: Add Missing RLS Policies for New Features
-- Run this in the Supabase SQL Editor

-- 1. Direct Messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their own direct messages" ON public.direct_messages
    FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

DROP POLICY IF EXISTS "Users can insert their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can insert their own direct messages" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- 2. Event RSVPs
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all event RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can view all event RSVPs" ON public.event_rsvps
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can insert their own RSVPs" ON public.event_rsvps
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can update their own RSVPs" ON public.event_rsvps
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 3. Feed Posts
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view feed posts" ON public.feed_posts;
CREATE POLICY "Anyone can view feed posts" ON public.feed_posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own feed posts" ON public.feed_posts;
CREATE POLICY "Users can insert their own feed posts" ON public.feed_posts
    FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- 4. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Allow system or community leaders to insert notifications for others

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid()::text = user_id);
