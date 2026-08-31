import { SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';
import fs from 'fs';

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

async function run() {
  const sql = fs.readFileSync('privacy_schema.sql', 'utf8');
  await executeSql(sql, 'Privacy Schema Updates');
}
run();
