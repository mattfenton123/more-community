-- ============================================================
-- Migration 020: Sponsors and Advertising
-- Create tables for sponsors and sponsorship_assignments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sponsors (
    id text PRIMARY KEY,
    name text NOT NULL,
    logo text,
    "heroImage" text,
    bio text,
    url text,
    tier text DEFAULT 'Standard',
    industry text,
    location text,
    "communitySupportStatement" text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sponsorship_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sponsor_id text NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    target_type text NOT NULL, -- e.g., 'community', 'region', 'global'
    target_id text, -- ID of community if target_type is 'community'
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_assignments ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read Access)
DO $$
BEGIN
  CREATE POLICY "Enable read access for all users on sponsors" ON public.sponsors FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE POLICY "Enable read access for all users on sponsorship_assignments" ON public.sponsorship_assignments FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable Realtime
DO $$
BEGIN
  alter publication supabase_realtime add table public.sponsors;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  alter publication supabase_realtime add table public.sponsorship_assignments;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
