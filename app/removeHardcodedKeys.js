import fs from 'fs';
import path from 'path';

const SECRET_KEY = 'sb_secret_3q0ih_hSN57WBnym_RXoJA_zD-v6Lja';
const SUPABASE_URL = 'https://nkyithbhufwgwnbxvqqu.supabase.co';

const files = [
  'seedFullData.js',
  'seedMockData.js', 
  'seedCommunities.js',
  'seedFeedPosts.js',
  'seedSponsors.js',
  'runMigrations.js',
  'runMigration004.js',
  'initDb.js',
  'createBucket.js',
  'cleanDemoDb.js',
  'applyInitTables.js',
  'seedExtendedData.js',
  'runMigration.js',
  'check.js'
];

for (const file of files) {
  if (!fs.existsSync(file)) { console.log('SKIP (not found): ' + file); continue; }
  
  let lines = fs.readFileSync(file, 'utf-8').split('\n');
  
  if (!lines.some(l => l.includes(SECRET_KEY))) { 
    console.log('SKIP (no key): ' + file); 
    continue; 
  }
  
  // Filter out lines that contain the hardcoded key or URL declaration
  let filtered = lines.filter(line => {
    const trimmed = line.trim();
    // Remove hardcoded key lines
    if (trimmed.includes(SECRET_KEY) && (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var '))) return false;
    // Remove hardcoded URL lines (only the declaration, not usage)
    if (trimmed.includes(SUPABASE_URL) && (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var '))) return false;
    return true;
  });
  
  // Remove the old createClient import if present
  filtered = filtered.filter(line => {
    const trimmed = line.trim();
    if (trimmed === "import { createClient } from '@supabase/supabase-js';") return false;
    if (trimmed === 'import { createClient } from "@supabase/supabase-js";') return false;
    return true;
  });
  
  // Remove old createClient calls that reference the now-removed variables
  filtered = filtered.filter(line => {
    const trimmed = line.trim();
    if (trimmed.match(/^const supabase\w*\s*=\s*createClient\(/)) return false;
    return true;
  });
  
  // Add shared import at the very top
  const importLine = "import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';";
  
  // Check if first line is a comment or empty, insert after
  filtered.unshift(importLine);
  
  fs.writeFileSync(file, filtered.join('\n'), 'utf-8');
  console.log('FIXED: ' + file);
}

console.log('\nDone! All scripts now read credentials from .env.local');
console.log('Run scripts with: node --env-file=.env.local <script>.js');
