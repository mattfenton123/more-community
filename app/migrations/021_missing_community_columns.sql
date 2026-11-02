-- Migration 021: Add Missing Community Columns & Co-Host Event Column
-- Run this in the Supabase SQL Editor for project xasaxxjxxkdruuqbrcmf

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS gallery_photos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS guidelines jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS welcome_video_url text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS require_approval boolean DEFAULT false;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS external_links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS flag_reason text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cohost_community_ids jsonb DEFAULT '[]'::jsonb;
