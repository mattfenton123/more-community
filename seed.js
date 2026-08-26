const SUPABASE_URL = 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function seedUser() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: 'u4',
        name: 'Sarah Chen',
        role: 'Member',
        joined: 'Joined Mar 2024',
        bio: 'Looking for local groups to join.',
        avatar: 'https://i.pravatar.cc/150?u=4'
      })
    });
    console.log("Status:", res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

seedUser();
