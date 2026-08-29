import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';

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

  const migration005 = `
    ALTER TABLE public.communities 
      ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS instagram_handle text,
      ADD COLUMN IF NOT EXISTS whatsapp_group text,
      ADD COLUMN IF NOT EXISTS activity_level text,
      ADD COLUMN IF NOT EXISTS cost text;

    ALTER TABLE public.events
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
      ADD COLUMN IF NOT EXISTS max_capacity integer;
  `;

  await executeSql(migration005, 'Migration 005: Add missing columns to communities and events');

  console.log('\n✅ All migrations complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
