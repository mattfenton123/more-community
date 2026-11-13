-- Migration 025: Event Discussion / Q&A Comments (Shared across host & co-host communities)
-- Run the ENTIRE script in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.event_comments (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Normalize any pre-existing event_comments table schema before indexes & RLS policies run
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.event_comments RENAME COLUMN user_id TO author_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'text'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'content'
    ) THEN
      ALTER TABLE public.event_comments RENAME COLUMN content TO text;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'body'
    ) THEN
      ALTER TABLE public.event_comments RENAME COLUMN body TO text;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'event_comments' AND column_name = 'comment'
    ) THEN
      ALTER TABLE public.event_comments RENAME COLUMN comment TO text;
    END IF;
  END IF;
END $$;

ALTER TABLE public.event_comments
  ADD COLUMN IF NOT EXISTS event_id text REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS author_id text REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS text text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_comments_author_id ON public.event_comments(author_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.event_comments TO anon, authenticated, service_role;
GRANT INSERT, DELETE ON TABLE public.event_comments TO authenticated, service_role;

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event comments" ON public.event_comments;
CREATE POLICY "Anyone can view event comments" ON public.event_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post event comments" ON public.event_comments;
CREATE POLICY "Authenticated users can post event comments" ON public.event_comments
  FOR INSERT WITH CHECK ((select auth.uid())::text = author_id::text);

DROP POLICY IF EXISTS "Authors or hosts can delete event comments" ON public.event_comments;
CREATE POLICY "Authors or hosts can delete event comments" ON public.event_comments
  FOR DELETE USING (
    (select auth.uid())::text = author_id::text
    OR EXISTS (
      SELECT 1 FROM public.events e
      LEFT JOIN public.communities c ON c.id::text = e.community_id::text
      WHERE e.id::text = event_comments.event_id::text
        AND (
          c.leader_id::text = (select auth.uid())::text
          OR EXISTS (
            SELECT 1 FROM public.community_memberships cm
            WHERE cm.user_id::text = (select auth.uid())::text
              AND cm.role IN ('Leader', 'Co-Leader')
              AND (
                cm.community_id::text = e.community_id::text
                OR COALESCE(to_jsonb(e.cohost_community_ids), '[]'::jsonb) @> jsonb_build_array(cm.community_id::text)
              )
          )
          OR EXISTS (
            SELECT 1 FROM public.communities pc
            WHERE pc.leader_id::text = (select auth.uid())::text
              AND COALESCE(to_jsonb(e.cohost_community_ids), '[]'::jsonb) @> jsonb_build_array(pc.id::text)
          )
        )
    )
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
