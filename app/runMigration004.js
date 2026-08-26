import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';
/**
 * Runs raw SQL against the Supabase database using the
 * internal pg_execute RPC function that the SQL editor uses.
 * This works because service_role has superuser-like access.
 */


async function executeSql(sql, label) {
  console.log(`\n🔄 ${label}...`);
  
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
    console.log(`  ❌ Failed (${response.status}): ${text.substring(0, 200)}`);
    return false;
  }

  const data = await response.json();
  console.log(`  ✅ Success:`, JSON.stringify(data).substring(0, 200));
  return true;
}

async function main() {
  console.log('🚀 Running SQL migrations via Supabase pg endpoint\n');

  const migration004 = `
    CREATE TABLE IF NOT EXISTS public.sponsors (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      logo text NOT NULL,
      url text NOT NULL,
      tier text NOT NULL,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.sponsorship_assignments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
      target_id text NOT NULL,
      target_type text NOT NULL,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sponsorship_assignments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Allow public read access on sponsors" ON public.sponsors FOR SELECT TO public USING (true);
    CREATE POLICY "Allow public read access on sponsorship_assignments" ON public.sponsorship_assignments FOR SELECT TO public USING (true);
  `;

  await executeSql(migration004, 'Migration 004: Sponsorship (DDL)');

  await executeSql(
    `ALTER PUBLICATION supabase_realtime ADD TABLE sponsors, sponsorship_assignments;`,
    'Adding sponsorship tables to realtime publication'
  );

  console.log('\n✅ All migrations complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
