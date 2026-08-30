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
  const sql = `
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_experience boolean DEFAULT false;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS base_experience_id text;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS non_member_price numeric DEFAULT 0;
  `;
  await executeSql(sql, "Adding experience columns to events table");
}

main();
