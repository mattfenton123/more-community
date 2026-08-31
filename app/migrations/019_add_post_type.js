import { SUPABASE_URL, SERVICE_KEY } from '../lib/supabaseAdmin.js';

const sql = `
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'post';
`;

async function main() {
  console.log('🔄 Running migration: add post_type to feed_posts...');
  
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
