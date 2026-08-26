

const SUPABASE_URL = 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY'; // Service role key

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Prefer': 'return=minimal,resolution=merge-duplicates'
};

async function insertData(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    console.error(`Failed to insert into ${table}:`, await res.text());
  } else {
    console.log(`Inserted ${data.length || 1} records into ${table}`);
  }
}

async function run() {
  console.log("Starting mock data population...");

  // 1. Users
  const users = [
    { id: 'u_david', name: 'David Smith', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=10', bio: 'Tech enthusiast and hiker.', joined: '2025-01-01', onboarded: true },
    { id: 'u_emma', name: 'Emma Wilson', role: 'Leader', avatar: 'https://i.pravatar.cc/150?u=11', bio: 'Passionate about local arts.', joined: '2025-02-15', onboarded: true },
    { id: 'u_james', name: 'James Taylor', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=12', bio: 'Foodie and photographer.', joined: '2025-03-10', onboarded: true }
  ];
  await insertData('users', users);

  // 2. Communities
  const communities = [
    {
      id: 'tw-tech-meetup',
      name: 'TW Tech Meetup',
      description: 'A place for developers, designers, and tech enthusiasts in Tunbridge Wells to connect and share ideas.',
      image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
      lat: 51.1352,
      lng: 0.2587
    },
    {
      id: 'local-arts-collective',
      name: 'Local Arts Collective',
      description: 'Supporting local artists, organizing exhibitions, and sharing creative works across Kent.',
      image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
      lat: 51.1320,
      lng: 0.2600
    },
    {
      id: 'kent-foodies',
      name: 'Kent Foodies',
      description: 'Exploring the best restaurants, cafes, and pop-up food stalls in Tunbridge Wells and beyond.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      lat: 51.1300,
      lng: 0.2650
    }
  ];
  await insertData('communities', communities);

  // 3. Memberships
  const memberships = [
    { community_id: 'tw-tech-meetup', user_id: 'u_david', role: 'Leader' },
    { community_id: 'tw-tech-meetup', user_id: 'u_alice', role: 'Member' },
    { community_id: 'tw-tech-meetup', user_id: 'u_bob', role: 'Member' },
    
    { community_id: 'local-arts-collective', user_id: 'u_emma', role: 'Leader' },
    { community_id: 'local-arts-collective', user_id: 'u_charlie', role: 'Member' },
    
    { community_id: 'kent-foodies', user_id: 'u_james', role: 'Leader' },
    { community_id: 'kent-foodies', user_id: 'u_alice', role: 'Member' },
    { community_id: 'kent-foodies', user_id: 'u_emma', role: 'Member' }
  ];
  await insertData('community_memberships', memberships);

  // 4. Channels
  const channels = [
    { id: 'ch_tech_gen', community_id: 'tw-tech-meetup', name: 'general', type: 'text' },
    { id: 'ch_tech_jobs', community_id: 'tw-tech-meetup', name: 'jobs', type: 'text' },
    
    { id: 'ch_arts_gen', community_id: 'local-arts-collective', name: 'general', type: 'text' },
    { id: 'ch_arts_exhibitions', community_id: 'local-arts-collective', name: 'exhibitions', type: 'text' },
    
    { id: 'ch_food_gen', community_id: 'kent-foodies', name: 'general', type: 'text' },
    { id: 'ch_food_recs', community_id: 'kent-foodies', name: 'recommendations', type: 'text' }
  ];
  await insertData('channels', channels);

  // 5. Events
  const events = [
    { id: 'ev_tech_1', community_id: 'tw-tech-meetup', title: 'React JS Workshop', date: '2026-07-10', time: '18:00', location: 'The Amelia Scott', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', attendees: 15 },
    { id: 'ev_arts_1', community_id: 'local-arts-collective', title: 'Summer Exhibition', date: '2026-08-05', time: '10:00', location: 'Pantiles Gallery', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', attendees: 40 },
    { id: 'ev_food_1', community_id: 'kent-foodies', title: 'Street Food Festival', date: '2026-07-20', time: '12:00', location: 'Calverley Grounds', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', attendees: 120 }
  ];
  await insertData('events', events);

  // 6. Messages
  const messages = [
    { community_id: 'tw-tech-meetup', channel: 'ch_tech_gen', author_id: 'u_david', text: 'Welcome to the tech meetup! Introduce yourselves!', timestamp: '09:00 AM' },
    { community_id: 'tw-tech-meetup', channel: 'ch_tech_gen', author_id: 'u_alice', text: 'Hi everyone, I am a frontend dev looking to learn more about React.', timestamp: '09:15 AM' },
    
    { community_id: 'local-arts-collective', channel: 'ch_arts_gen', author_id: 'u_emma', text: 'Has everyone seen the new installation at the Amelia?', timestamp: '10:00 AM' },
    
    { community_id: 'kent-foodies', channel: 'ch_food_recs', author_id: 'u_james', text: 'Best coffee in town? Let me know your thoughts.', timestamp: '11:00 AM' },
    { community_id: 'kent-foodies', channel: 'ch_food_recs', author_id: 'u_emma', text: 'Fine Grind without a doubt!', timestamp: '11:05 AM' }
  ];
  await insertData('messages', messages);

  console.log("Mock data population complete!");
}

run();
