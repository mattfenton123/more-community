import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL is not set in this environment. Falling back to default mock keys to prevent crashes.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
