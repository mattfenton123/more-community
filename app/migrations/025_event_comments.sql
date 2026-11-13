-- Migration 025: Event Discussion / Q&A Comments (Shared across host & co-host communities)
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.event_comments (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id, created_at);

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event comments" ON public.event_comments;
CREATE POLICY "Anyone can view event comments" ON public.event_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post event comments" ON public.event_comments;
CREATE POLICY "Authenticated users can post event comments" ON public.event_comments
  FOR INSERT WITH CHECK (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "Authors or hosts can delete event comments" ON public.event_comments;
CREATE POLICY "Authors or hosts can delete event comments" ON public.event_comments
  FOR DELETE USING (
    auth.uid()::text = author_id
    OR EXISTS (
      SELECT 1 FROM public.events e
      LEFT JOIN public.communities c ON c.id = e.community_id
      WHERE e.id = event_comments.event_id
        AND (
          c.leader_id = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM public.community_memberships cm
            WHERE cm.user_id = auth.uid()::text
              AND cm.role IN ('Leader', 'Co-Leader')
              AND (
                cm.community_id = e.community_id
                OR COALESCE(e.cohost_community_ids, '[]'::jsonb) @> to_jsonb(cm.community_id)
              )
          )
          OR EXISTS (
            SELECT 1 FROM public.communities pc
            WHERE pc.leader_id = auth.uid()::text
              AND COALESCE(e.cohost_community_ids, '[]'::jsonb) @> to_jsonb(pc.id)
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
