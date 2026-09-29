import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xasaxxjxxkdruuqbrcmf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMPEXQKfkPDK1XktnEOIDQ_Fhs_p7rQ';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('⚠️ WARNING: Using fallback hardcoded Supabase keys.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
