/**
 * Runs migration 009 against Supabase using the REST API + service_role key.
 * This approach works on all Supabase plans.
 */

const SUPABASE_URL = 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=minimal',
};

async function restPatch(table, matchCol, matchVal, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${matchCol}=eq.${encodeURIComponent(matchVal)}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(data) });
  if (!res.ok) {
    const t = await res.text();
    console.log(`  ❌ PATCH ${table} where ${matchCol}=${matchVal}: ${res.status} ${t.substring(0, 200)}`);
    return false;
  }
  return true;
}

async function restPost(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const t = await res.text();
    // 409 conflict = already exists, that's fine
    if (res.status === 409) return true;
    console.log(`  ❌ POST ${table}: ${res.status} ${t.substring(0, 200)}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('🚀 Running Migration 009: Full Data Enrichment via REST API\n');

  // Step 1: First, get all existing communities to see their actual names
  console.log('📋 Fetching existing communities...');
  const commsRes = await fetch(`${SUPABASE_URL}/rest/v1/communities?select=id,name`, { headers });
  const existingComms = await commsRes.json();
  console.log(`  Found ${existingComms.length} communities:`);
  existingComms.forEach(c => console.log(`    • ${c.id}: ${c.name}`));

  // Step 2: Enrich communities by ID (more reliable than name matching)
  console.log('\n📝 Enriching communities...');

  const enrichments = {
    'tw-parkrun': {
      description: "Tunbridge Wells parkrun is a free, weekly, 5km timed run held every Saturday at 9:00am at Dunorlan Park. Whether you walk, jog, or run, everyone is welcome. We're part of the global parkrun family — over 2,000 events worldwide — and we're proud to be one of the most active in Kent. Volunteers make it happen, runners make it special. Stick around afterwards for a coffee at the cafe and get to know your fellow parkrunners. First-timers: just register on parkrun.org.uk and bring your barcode!",
      image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
      activity_level: 'Very Active', cost: 'Free',
      contact_email: 'tunbridgewells@parkrun.com',
      website: 'https://www.parkrun.org.uk/tunbridgewells/',
      instagram: '@parkrunuk', members: 245,
      tags: ['🏃 Running', '🚶 Walking', '🧘 Wellness', '🤝 Volunteering']
    },
    'tw-ramblers': {
      description: "We are a friendly, sociable group of walkers who explore the beautiful countryside around Royal Tunbridge Wells and the High Weald. Our walks range from 5 to 12 miles and cater for all abilities. We walk every weekend and most Wednesday mornings, rain or shine. It's a brilliant way to stay active, discover hidden footpaths, and make genuine friendships. No booking needed — just turn up at the meeting point with decent walking boots and a sense of adventure. Dogs welcome on most walks.",
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
      activity_level: 'Active', cost: 'Free',
      contact_email: 'hello@twramblers.org.uk',
      website: 'https://www.ramblers.org.uk/',
      instagram: '@twramblers', members: 128,
      tags: ['🚶 Walking', '⛰️ Adventure', '🌱 Gardening']
    },
    'mindful-miles': {
      description: "Mindful Miles is Tunbridge Wells' premier wellness walking group, combining gentle movement with mindfulness techniques. Each session begins with a short breathing exercise before we set off on a scenic 3-mile route through The Common or Calverley Grounds. Along the way, we pause for guided mindfulness moments — noticing nature, practising gratitude, and grounding ourselves. Sessions run every Tuesday evening and Saturday morning. Suitable for all fitness levels. This isn't about pace; it's about presence.",
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      activity_level: 'Moderate', cost: '£3 per session',
      contact_email: 'mindful@mindfulmiles.co.uk',
      instagram: '@mindfulmilestw', members: 67,
      tags: ['🧘 Wellness', '🚶 Walking', '🌱 Gardening']
    },
    'yentw': {
      description: "Young Entrepreneurs Tunbridge Wells is a thriving network of founders, freelancers, and side-hustlers under 40 building businesses in and around the town. We host monthly meetups at The Pantiles featuring guest speakers, pitch nights, and informal networking. Whether you're pre-launch or scaling up, you'll find support, accountability, and collaboration here. Past speakers include founders from across Kent and London. Our Slack community is active daily with advice, introductions, and opportunities.",
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
      activity_level: 'Active', cost: '£5/month',
      contact_email: 'yentw@gmail.com',
      website: 'https://yentw.co.uk',
      instagram: '@yaborntw', members: 93,
      tags: ['💼 Business', '🎓 Learning', '🤝 Volunteering']
    },
    'a-z-challenge': {
      description: "The A-Z Challenge is Tunbridge Wells' most adventurous outdoor group. Our mission: to walk, run, or cycle every single footpath, bridleway, and trail in the borough — from A to Z. We organise weekly expeditions that take us off the beaten track into corners of the countryside most locals never see. Each route is GPS-logged and shared with the group. It's part fitness, part exploration, part community history project. Whether you can do 2 miles or 20, there's a route for you.",
      image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
      activity_level: 'Very Active', cost: 'Free',
      instagram: '@azchallenge_tw', members: 54,
      tags: ['⛰️ Adventure', '🚶 Walking', '🏃 Running']
    },
    'tw-creative-collective': {
      description: "TW Creative Collective is a vibrant community of artists, makers, writers, and creatives based in Tunbridge Wells. We run monthly workshops covering everything from life drawing and printmaking to creative writing and photography walks. Our pop-up exhibitions showcase local talent across the town. Whether you're a professional artist or someone who hasn't picked up a paintbrush since school, you'll find inspiration and encouragement here.",
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
      activity_level: 'Active', cost: '£10/month',
      contact_email: 'hello@twcreative.co.uk',
      instagram: '@twcreativecollective', members: 78,
      tags: ['🎨 Creative', '🎵 Music', '📚 Book Club']
    },
    'tw-good-neighbours': {
      description: "TW Good Neighbours is Tunbridge Wells' central hub for community volunteering. We coordinate with local charities, schools, and environmental organisations to match willing volunteers with meaningful projects. From litter picks on The Common to serving meals at the food bank, reading with primary school children to planting trees in Dunorlan Park — there's something for everyone. All ages welcome.",
      image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
      activity_level: 'Active', cost: 'Free',
      contact_email: 'volunteer@twgoodneighbours.org',
      website: 'https://twgoodneighbours.org',
      instagram: '@twgoodneighbours', members: 156,
      tags: ['🤝 Volunteering', '🌱 Gardening']
    },
    'tw-yoga-collective': {
      description: "TW Yoga Collective brings together yoga practitioners of all levels for outdoor sessions in the parks and green spaces of Tunbridge Wells. From sunrise Vinyasa on The Common to candlelit Yin in the Assembly Hall, we offer a diverse timetable that fits around busy lives. Our qualified instructors keep classes welcoming and accessible.",
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      activity_level: 'Active', cost: '£8 drop-in',
      contact_email: 'namaste@twyoga.co.uk',
      instagram: '@twyogacollective', members: 89,
      tags: ['🧘 Wellness', '🏃 Fitness']
    },
    'kent-adventures': {
      description: "Kent Adventures is for anyone who wants to explore the best of the Kent countryside, coast, and beyond. We organise weekend hikes along the North Downs Way, coasteering in Thanet, wild swimming in the Medway, and overnight camping trips to the South Downs. All skill levels welcome — we grade every adventure so you know what you're signing up for.",
      image: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800',
      activity_level: 'Very Active', cost: 'Varies by trip',
      instagram: '@kentadventures',
      website: 'https://kentadventures.co.uk', members: 112,
      tags: ['⛰️ Adventure', '🚶 Walking', '🏃 Fitness']
    },
    'tw-interfaith-network': {
      description: "TW Interfaith Network brings together people of all faiths and none to build understanding, friendship, and cooperation across Tunbridge Wells. We host quarterly interfaith dialogues, shared meals during major festivals (Eid, Diwali, Christmas, Passover), and collaborative community service projects.",
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      activity_level: 'Moderate', cost: 'Free',
      contact_email: 'connect@twinterfaith.org.uk',
      website: 'https://twinterfaith.org.uk', members: 45,
      tags: ['🤝 Volunteering', '🎓 Learning']
    },
  };

  // Also enrich any communities not matched by known IDs
  for (const comm of existingComms) {
    const enrichment = enrichments[comm.id];
    if (enrichment) {
      const ok = await restPatch('communities', 'id', comm.id, enrichment);
      console.log(`  ${ok ? '✅' : '❌'} ${comm.name} (${comm.id})`);
    } else {
      // Give unknown communities a generic image based on name
      const genericData = {
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
        activity_level: 'Active',
        cost: 'Free',
        tags: ['🤝 Volunteering']
      };
      const ok = await restPatch('communities', 'id', comm.id, genericData);
      console.log(`  ${ok ? '✅' : '❌'} ${comm.name} (${comm.id}) [generic fallback]`);
    }
  }

  // Step 3: Seed users
  console.log('\n👥 Seeding users...');
  const users = [
    { id: 'user-sarah-chen', name: 'Sarah Chen', bio: 'Yoga instructor and trail runner. Usually found at Dunorlan Park before sunrise.', avatar: 'https://i.pravatar.cc/150?img=5', interests: ['🧘 Wellness', '🏃 Fitness', '⛰️ Outdoors'], onboarded: true },
    { id: 'user-james-wright', name: 'James Wright', bio: 'Retired teacher turned full-time rambler. 30 years walking the High Weald.', avatar: 'https://i.pravatar.cc/150?img=11', interests: ['🚶 Walking', '⛰️ Outdoors', '📚 Book Club'], onboarded: true },
    { id: 'user-priya-patel', name: 'Priya Patel', bio: 'Freelance graphic designer and community volunteer. Love creating things that matter.', avatar: 'https://i.pravatar.cc/150?img=25', interests: ['🎨 Creative', '🤝 Volunteering', '💼 Professional'], onboarded: true },
    { id: 'user-tom-baker', name: 'Tom Baker', bio: 'Software developer by day, parkrunner by Saturday morning. PB: 21:43.', avatar: 'https://i.pravatar.cc/150?img=12', interests: ['🏃 Fitness', '💼 Professional', '🎮 Gaming'], onboarded: true },
    { id: 'user-emma-jones', name: 'Emma Jones', bio: 'Mum of two, book club obsessive, and occasional wild swimmer.', avatar: 'https://i.pravatar.cc/150?img=26', interests: ['📚 Book Club', '🧘 Wellness', '👶 Parenting'], onboarded: true },
    { id: 'user-marcus-riley', name: 'Marcus Riley', bio: 'Founder of a local food startup. Passionate about sustainable business in Kent.', avatar: 'https://i.pravatar.cc/150?img=53', interests: ['💼 Professional', '🎓 Learning', '🍳 Cooking'], onboarded: true },
    { id: 'user-lucy-thompson', name: 'Lucy Thompson', bio: "Outdoor adventure guide and dog walker. If there's a hill, I'm climbing it.", avatar: 'https://i.pravatar.cc/150?img=32', interests: ['⛰️ Outdoors', '🚶 Walking', '🏃 Fitness'], onboarded: true },
    { id: 'user-david-kim', name: 'David Kim', bio: 'Photographer and creative workshop facilitator based at Camden Road studios.', avatar: 'https://i.pravatar.cc/150?img=14', interests: ['🎨 Creative', '🎵 Music', '🎓 Learning'], onboarded: true },
  ];

  for (const u of users) {
    const ok = await restPost('users', u);
    console.log(`  ${ok ? '✅' : '❌'} ${u.name}`);
  }

  // Step 4: Seed memberships
  console.log('\n🤝 Seeding memberships...');
  const memberships = [
    ['tw-parkrun', 'user-sarah-chen'], ['tw-parkrun', 'user-tom-baker'], ['tw-parkrun', 'user-lucy-thompson'], ['tw-parkrun', 'user-james-wright'],
    ['tw-ramblers', 'user-james-wright'], ['tw-ramblers', 'user-lucy-thompson'], ['tw-ramblers', 'user-emma-jones'],
    ['mindful-miles', 'user-sarah-chen'], ['mindful-miles', 'user-emma-jones'], ['mindful-miles', 'user-priya-patel'],
    ['yentw', 'user-marcus-riley'], ['yentw', 'user-tom-baker'], ['yentw', 'user-priya-patel'], ['yentw', 'user-david-kim'],
    ['a-z-challenge', 'user-lucy-thompson'], ['a-z-challenge', 'user-james-wright'], ['a-z-challenge', 'user-tom-baker'],
    ['tw-creative-collective', 'user-david-kim'], ['tw-creative-collective', 'user-priya-patel'],
    ['tw-good-neighbours', 'user-priya-patel'], ['tw-good-neighbours', 'user-emma-jones'], ['tw-good-neighbours', 'user-james-wright'],
    ['tw-yoga-collective', 'user-sarah-chen'], ['tw-yoga-collective', 'user-emma-jones'],
    ['kent-adventures', 'user-lucy-thompson'], ['kent-adventures', 'user-tom-baker'], ['kent-adventures', 'user-marcus-riley'],
  ];

  for (const [cid, uid] of memberships) {
    const ok = await restPost('community_memberships', { community_id: cid, user_id: uid, role: 'Member' });
    console.log(`  ${ok ? '✅' : '❌'} ${uid} → ${cid}`);
  }

  // Step 5: Enrich events with images from their parent community
  console.log('\n🎟️ Enriching events...');
  const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,community_id,title,image&image=is.null`, { headers });
  const eventsNoImage = await eventsRes.json();
  console.log(`  Found ${eventsNoImage.length} events without images`);

  for (const evt of eventsNoImage) {
    const comm = enrichments[evt.community_id];
    if (comm?.image) {
      await restPatch('events', 'id', evt.id, { image: comm.image });
      console.log(`  ✅ ${evt.title} → image from ${evt.community_id}`);
    }
  }

  // Also add descriptions to events
  const allEventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,description`, { headers });
  const allEvents = await allEventsRes.json();
  
  for (const evt of allEvents) {
    if (evt.description && evt.description.trim() !== '') continue;
    
    let desc = 'An exciting community event bringing together members from across Tunbridge Wells. Check our community page for details.';
    const t = evt.title?.toLowerCase() || '';
    if (t.includes('parkrun') || t.includes('run')) {
      desc = 'Our weekly Saturday morning parkrun through Dunorlan Park. Meet at the bandstand by 8:45am for the 9am start. All paces welcome — walkers, joggers, and runners.';
    } else if (t.includes('walk') || t.includes('hike')) {
      desc = 'A guided walk through the High Weald exploring ancient woodland and scenic ridgeway paths. Approximately 8 miles with a pub lunch stop halfway. Bring waterproofs and sturdy boots.';
    } else if (t.includes('network') || t.includes('meetup') || t.includes('meet')) {
      desc = 'A relaxed networking session with guest speakers sharing their entrepreneurial journey. Light refreshments provided.';
    } else if (t.includes('yoga') || t.includes('mindful') || t.includes('wellness')) {
      desc = 'A gentle mindfulness session combining light exercise with breathing techniques and nature awareness. No experience needed — just an open mind and comfortable shoes.';
    }
    
    await restPatch('events', 'id', evt.id, { description: desc });
    console.log(`  ✅ Description for: ${evt.title}`);
  }

  // Step 6: Final verify
  console.log('\n📊 Verification...');
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/communities?select=name,image,activity_level,cost,tags`, { headers });
  const verified = await verifyRes.json();
  console.log(`  Communities: ${verified.length}`);
  verified.forEach(r => console.log(`    • ${r.name} | img: ${r.image ? '✅' : '❌'} | ${r.activity_level || '—'} | ${r.cost || '—'} | tags: ${(r.tags || []).length}`));

  const usersVerify = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name&id=like.user-*`, { headers });
  const uv = await usersVerify.json();
  console.log(`  Seeded users: ${uv.length}`);

  console.log('\n✅ Migration 009 complete! Refresh the app to see all changes.\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
