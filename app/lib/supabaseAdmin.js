/**
 * Shared Supabase Admin Client for seed/migration scripts.
 * Reads credentials from .env.local using Node's --env-file flag.
 * 
 * Usage: node --env-file=.env.local seedFullData.js
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables. Run scripts with:');
  console.error('   node --env-file=.env.local <script>.js');
  process.exit(1);
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
export { SUPABASE_URL, SERVICE_KEY };
