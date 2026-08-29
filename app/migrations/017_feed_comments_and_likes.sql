-- 1. Create Feed Post Likes Table
CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- 2. Create Feed Post Comments Table
CREATE TABLE IF NOT EXISTS public.feed_post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS Policies for feed_post_likes
ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see all feed post likes" ON public.feed_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.feed_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.feed_post_likes FOR DELETE USING (auth.uid() = user_id);

-- 4. RLS Policies for feed_post_comments
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see all feed post comments" ON public.feed_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment on posts" ON public.feed_post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.feed_post_comments FOR DELETE USING (auth.uid() = author_id);

-- 5. Add to realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, users, communities, events, channels, community_memberships, notifications, direct_messages, event_rsvps, feed_posts, feed_post_likes, feed_post_comments;
commit;
