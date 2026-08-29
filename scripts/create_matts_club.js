const fs = require('fs');
const env = fs.readFileSync('app/.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
if (!urlMatch || !keyMatch) { console.error('No keys found'); process.exit(1); }

const SUPABASE_URL = urlMatch[1].trim();
const SUPABASE_KEY = keyMatch[1].trim();

async function create() {
  const payload = {
    id: 'matts-club',
    name: "Matt's Club",
    description: 'A brand new community created for Matt.',
    tags: ['social', 'networking'],
    image: 'https://ui-avatars.com/api/?name=Matt+Club&background=0D8B93&color=fff&size=512',
    lat: 51.13,
    lng: 0.26,
    target_audience: 'Everyone welcome',
    location_name: 'Tunbridge Wells',
    cost: 'Free',
    activity_level: 'Weekly'
  };
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/communities`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log('Created:', data);
  
  const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?name=ilike.*Matt*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const users = await userRes.json();
  if (users.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/community_memberships`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: 'matts-club', user_id: users[0].id, role: 'Leader' })
    });
    console.log('Assigned leader:', users[0].name);
  }
}
create();
