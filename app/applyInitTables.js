import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';
import fs from 'fs';
import path from 'path';


async function main() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'initTables.sql'), 'utf8');

  console.log('🔄 Running initTables.sql...');
  
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
    console.error(`❌ Failed (${response.status}): ${text.substring(0, 500)}`);
    process.exit(1);
  }

  const data = await response.json();
  console.log(`✅ Success:`, JSON.stringify(data).substring(0, 500));
}

main().catch(console.error);
