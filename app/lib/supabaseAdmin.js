/**
 * Shared Supabase Admin Client for seed/migration scripts.
 * Reads credentials from .env.local using Node's --env-file flag.
 * 
 * Usage: node --env-file=.env.local seedFullData.js
 */
import { createClient } from '@supabase/supabase-js';

function isValidServiceKey(key, url) {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.ref) {
      const urlHost = new URL(url).hostname;
      if (!urlHost.includes(payload.ref)) return false;
    }
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SERVICE_KEY = isValidServiceKey(rawKey, SUPABASE_URL) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ');

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
export { SUPABASE_URL, SERVICE_KEY };
