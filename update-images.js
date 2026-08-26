/**
 * Updates community images to use the locally-hosted generated images.
 */

const SUPABASE_URL = 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=minimal',
};

const BASE_URL = '/portal/images/communities';

const imageMap = {
  'tw-parkrun': `${BASE_URL}/parkrun.png`,
  'tw-ramblers': `${BASE_URL}/ramblers.png`,
  'mindful-miles': `${BASE_URL}/mindful-miles.png`,
  'yentw': `${BASE_URL}/entrepreneurs.png`,
  'a-z-challenge': `${BASE_URL}/az-challenge.png`,
  'tw-creative-collective': `${BASE_URL}/creative-collective.png`,
  'tw-good-neighbours': `${BASE_URL}/good-neighbours.png`,
  'tw-yoga-collective': `${BASE_URL}/yoga-collective.png`,
  'kent-adventures': `${BASE_URL}/kent-adventures.png`,
  'tw-interfaith-network': `${BASE_URL}/interfaith.png`,
};

async function main() {
  console.log('🖼️  Updating community images to generated assets...\n');

  for (const [id, image] of Object.entries(imageMap)) {
    const url = `${SUPABASE_URL}/rest/v1/communities?id=eq.${id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image })
    });
    console.log(`  ${res.ok ? '✅' : '❌'} ${id} → ${image}`);
  }

  // Also update events to use parent community images
  console.log('\n🎟️  Updating event images...');
  const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,community_id,title`, { headers });
  const events = await eventsRes.json();
  
  for (const evt of events) {
    if (imageMap[evt.community_id]) {
      const url = `${SUPABASE_URL}/rest/v1/events?id=eq.${evt.id}`;
      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ image: imageMap[evt.community_id] })
      });
      console.log(`  ✅ ${evt.title} → ${imageMap[evt.community_id]}`);
    }
  }

  console.log('\n✅ All images updated to generated assets!\n');
}

main().catch(err => console.error('Fatal:', err.message));
