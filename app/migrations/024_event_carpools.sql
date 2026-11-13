-- Migration 024: Event Carpools & Seat Reservations (Cross-device sync)
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.event_carpools (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  driver_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  origin text NOT NULL,
  departure_time text,
  seats_total integer NOT NULL DEFAULT 3 CHECK (seats_total >= 1 AND seats_total <= 12),
  flexible_on_route boolean NOT NULL DEFAULT true,
  notes text DEFAULT '',
  chip_in text DEFAULT 'Free',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.event_carpool_passengers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  carpool_id text NOT NULL REFERENCES public.event_carpools(id) ON DELETE CASCADE,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(carpool_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_carpools_event_id ON public.event_carpools(event_id);
CREATE INDEX IF NOT EXISTS idx_event_carpool_passengers_event_id ON public.event_carpool_passengers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_carpool_passengers_carpool_id ON public.event_carpool_passengers(carpool_id);

ALTER TABLE public.event_carpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_carpool_passengers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event carpools" ON public.event_carpools;
CREATE POLICY "Anyone can view event carpools" ON public.event_carpools
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can insert their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can insert their own carpool" ON public.event_carpools
  FOR INSERT WITH CHECK (auth.uid()::text = driver_id);

DROP POLICY IF EXISTS "Drivers can update their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can update their own carpool" ON public.event_carpools
  FOR UPDATE USING (auth.uid()::text = driver_id);

DROP POLICY IF EXISTS "Drivers can delete their own carpool" ON public.event_carpools;
CREATE POLICY "Drivers can delete their own carpool" ON public.event_carpools
  FOR DELETE USING (auth.uid()::text = driver_id);

DROP POLICY IF EXISTS "Anyone can view carpool passengers" ON public.event_carpool_passengers;
CREATE POLICY "Anyone can view carpool passengers" ON public.event_carpool_passengers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can reserve their own carpool seat" ON public.event_carpool_passengers;
CREATE POLICY "Users can reserve their own carpool seat" ON public.event_carpool_passengers
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can release their own carpool seat" ON public.event_carpool_passengers;
CREATE POLICY "Users can release their own carpool seat" ON public.event_carpool_passengers
  FOR DELETE USING (auth.uid()::text = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_carpools;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_carpool_passengers;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
