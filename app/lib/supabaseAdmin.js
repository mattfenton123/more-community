/**
 * Shared Supabase Admin Client for seed/migration scripts.
 * Reads credentials from .env.local using Node's --env-file flag.
 * 
 * Usage: node --env-file=.env.local seedFullData.js
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
export { SUPABASE_URL, SERVICE_KEY };
