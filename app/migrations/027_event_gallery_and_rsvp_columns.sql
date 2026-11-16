-- ============================================================
-- Migration 027: Event Gallery Images & Event RSVP Metadata Columns
-- - Adds events.gallery_images jsonb column for event memory photos (upcoming & past)
-- - Ensures event_rsvps has ticket_type, referred_by, guest_name, answer columns
-- - Reloads PostgREST schema cache
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS ticket_type text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS answer text;

NOTIFY pgrst, 'reload schema';
