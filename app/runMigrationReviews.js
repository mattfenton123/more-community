import { SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';

const sql = `
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  target_id text NOT NULL,
  target_type text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Allow public read access on reviews'
    ) THEN
        CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT TO public USING (true);
    END IF;
END
$$;

-- Add to Realtime
BEGIN;
  DO $$
  BEGIN
      IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reviews'
      ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
      END IF;
  END
  $$;
COMMIT;
`;

async function main() {
  console.log('🔄 Running reviews migration...');
  
  const response = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Failed (${response.status}): ${text}`);
    process.exit(1);
  }

  const data = await response.json();
  console.log(`✅ Success:`, JSON.stringify(data));
}

main().catch(console.error);
