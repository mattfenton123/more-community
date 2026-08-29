import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';

async function createBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      id: 'uploads',
      name: 'uploads',
      public: true
    })
  });
  
  if (res.ok) {
    console.log('Bucket created!');
  } else {
    console.error('Failed:', await res.text());
  }
}

createBucket();
