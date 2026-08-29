import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const { data, error } = await supabaseAdmin.from('communities').upsert([{
    id: 'more-leaders-network',
    name: 'The more. Leaders Network',
    description: 'A private space for more. leaders to collaborate, share tips, and organize cross-community events.',
    tags: ['leadership', 'network'],
    leader_id: null,
    is_private: true,
    activity_level: 'Active',
    location_name: 'Global',
    cost: 'Free for Leaders'
  }]);
  
  if (error) {
    console.error('Error seeding community:', error);
  } else {
    console.log('Successfully seeded Leaders Network community!');
  }
}

seed();
