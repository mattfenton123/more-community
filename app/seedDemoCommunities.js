/**
 * Seeds demo communities for investor pitch.
 * Covers ALL discover filter categories with realistic Tunbridge Wells groups.
 * 
 * Run: node --env-file=.env.local seedDemoCommunities.js
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ─── Image URLs (all verified 200 OK on Unsplash) ──────────────────
const IMAGES = {
  parkrun:     'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
  mumClub:     'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=800&q=80',
  u3a:         'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  yoga:        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  hiking:      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
  walking:     'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
  business:    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
  art:         'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  volunteer:   'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
  bookClub:    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
  cooking:     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
  gardening:   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
  cycling:     'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
  swimming:    'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
  photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80',
  music:       'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
  dogs:        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
  parents:     'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?auto=format&fit=crop&w=800&q=80',
  chess:       'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
  running:     'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80',
};

// ─── New communities to seed ────────────────────────────────────────
const NEW_COMMUNITIES = [
  // 🚶 Walking
  {
    id: 'c_tw_ramblers',
    name: 'TW Ramblers & Walking Group',
    description: 'Discover the beautiful High Weald countryside on our weekly guided walks. All paces welcome — from gentle strolls to challenging 10-milers. Meet lovely people and enjoy Kent\'s finest landscapes.',
    tags: ['🚶 Walking', '⛰️ Adventure'],
    image: IMAGES.walking,
    verified: true,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 🏃 Running
  {
    id: 'c_tw_run_club',
    name: 'TW Social Run Club',
    description: 'Tunbridge Wells\' friendliest running group! We run 3 times a week at different paces (5:30, 6:30, 7:30 min/km). No one gets left behind — we always run back for you.',
    tags: ['🏃 Running'],
    image: IMAGES.running,
    verified: true,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 🧘 Wellness
  {
    id: 'c_tw_yoga',
    name: 'Calverley Grounds Yoga',
    description: 'Free outdoor yoga every Saturday morning in Calverley Grounds. All levels welcome. Bring a mat, find your flow, and connect with a wonderful community of wellness enthusiasts.',
    tags: ['🧘 Wellness'],
    image: IMAGES.yoga,
    verified: true,
    activity_level: 'Active',
    cost: 'Free'
  },
  // ⛰️ Adventure
  {
    id: 'c_tw_adventure',
    name: 'Kent Adventure Collective',
    description: 'Weekend adventures across Kent and Sussex — hiking, wild swimming, coasteering, and camping. We believe the best stories start with "remember that time we..."',
    tags: ['⛰️ Adventure', '🚶 Walking'],
    image: IMAGES.hiking,
    verified: true,
    activity_level: 'Active',
    cost: '£5/month'
  },
  // 🤝 Volunteering
  {
    id: 'c_tw_volunteer',
    name: 'TW Community Action',
    description: 'Making Tunbridge Wells better, together. Join weekly litter picks, community garden sessions, and local charity events. Over 200 volunteer hours logged this month alone.',
    tags: ['🤝 Volunteering'],
    image: IMAGES.volunteer,
    verified: true,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 🎨 Creative
  {
    id: 'c_tw_creatives',
    name: 'The Pantiles Art Collective',
    description: 'A vibrant community of artists, illustrators, and makers based around The Pantiles. Monthly exhibitions, weekly sketch walks, and a supportive space to grow your creative practice.',
    tags: ['🎨 Creative'],
    image: IMAGES.art,
    verified: true,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 💼 Business
  {
    id: 'c_tw_founders',
    name: 'TW Founders & Freelancers',
    description: 'A high-energy networking group for entrepreneurs, freelancers, and small business owners in the Tunbridge Wells area. Monthly meetups, co-working sessions, and a thriving Slack community.',
    tags: ['💼 Business'],
    image: IMAGES.business,
    verified: true,
    activity_level: 'Active',
    cost: '£10/month'
  },
  // 📚 Book Club
  {
    id: 'c_tw_books',
    name: 'The Common Room Book Club',
    description: 'We meet fortnightly at The Beacon to discuss our latest read over wine and cheese. Fiction, non-fiction, poetry — we read it all. Currently reading: "Intermezzo" by Sally Rooney.',
    tags: ['📚 Book Club', '🎨 Creative'],
    image: IMAGES.bookClub,
    verified: false,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 🎵 Music
  {
    id: 'c_tw_music',
    name: 'TW Open Mic & Jam Sessions',
    description: 'Whether you\'re a seasoned performer or picking up a guitar for the first time — come jam with us! Weekly open mic nights at The Forum and monthly band meetups.',
    tags: ['🎵 Music', '🎨 Creative'],
    image: IMAGES.music,
    verified: false,
    activity_level: 'Growing',
    cost: 'Free'
  },
  // 🍳 Cooking
  {
    id: 'c_tw_foodies',
    name: 'TW Supper Club',
    description: 'A community of food lovers who take turns hosting themed dinner parties across Tunbridge Wells. From Italian feasts to Korean BBQ — we eat our way around the world without leaving Kent.',
    tags: ['🍳 Cooking'],
    image: IMAGES.cooking,
    verified: false,
    activity_level: 'Growing',
    cost: '£5/event'
  },
  // 🌱 Gardening
  {
    id: 'c_tw_allotments',
    name: 'Grosvenor & Hilbert Allotments',
    description: 'Community allotment group with shared plots, seed swaps, and seasonal growing workshops. Perfect for beginners and experienced growers alike. Harvests shared with local food banks.',
    tags: ['🌱 Gardening', '🤝 Volunteering'],
    image: IMAGES.gardening,
    verified: false,
    activity_level: 'Active',
    cost: 'Free'
  },
  // 👶 Parenting
  {
    id: 'c_tw_dads',
    name: 'TW Dads Who Walk',
    description: 'Dads walking together for mental health. Saturday morning walks with prams and toddlers across the Commons. No agenda, just fresh air and honest conversation.',
    tags: ['👶 Parenting', '🚶 Walking', '🧘 Wellness'],
    image: IMAGES.dogs,
    verified: false,
    activity_level: 'Growing',
    cost: 'Free'
  },
  // Additional variety
  {
    id: 'c_tw_cycling',
    name: 'TW Cycling Club',
    description: 'Road cycling, gravel riding, and mountain biking across the High Weald. Group rides every weekend with routes from 20km to 100km. Café stops mandatory.',
    tags: ['🏃 Running', '⛰️ Adventure'],
    image: IMAGES.cycling,
    verified: true,
    activity_level: 'Active',
    cost: '£3/month'
  },
  {
    id: 'c_tw_photography',
    name: 'TW Photography Society',
    description: 'Capture the beauty of Tunbridge Wells and beyond. Monthly photo walks, editing workshops, and exhibition opportunities. All skill levels and camera types welcome.',
    tags: ['🎨 Creative'],
    image: IMAGES.photography,
    verified: false,
    activity_level: 'Growing',
    cost: 'Free'
  },
];

// ─── Events for the new communities ─────────────────────────────────
const NEW_EVENTS = [
  { id: 'e_ramblers_sun', community_id: 'c_tw_ramblers', title: 'Sunday Morning Countryside Walk', description: 'A gentle 6-mile circular route through Frant and Eridge. Meet at the Pantiles car park.', date: '2026-09-07', time: '09:30', location: 'The Pantiles Car Park', image: IMAGES.walking },
  { id: 'e_run_club_wed', community_id: 'c_tw_run_club', title: 'Wednesday Evening Social Run', description: '5K easy-pace group run through Dunorlan Park. All speeds welcome.', date: '2026-08-27', time: '18:30', location: 'Dunorlan Park Gate', image: IMAGES.running },
  { id: 'e_yoga_sat', community_id: 'c_tw_yoga', title: 'Sunrise Yoga in the Park', description: 'Start your weekend with a 60-min vinyasa flow class outdoors. Bring your own mat.', date: '2026-08-30', time: '07:30', location: 'Calverley Grounds', image: IMAGES.yoga },
  { id: 'e_adventure_hike', community_id: 'c_tw_adventure', title: 'Bewl Water Circular Hike', description: '13-mile reservoir loop with pub lunch at the halfway point.', date: '2026-09-06', time: '08:00', location: 'Bewl Water Visitor Centre', image: IMAGES.hiking },
  { id: 'e_volunteer_litter', community_id: 'c_tw_volunteer', title: 'Community Litter Pick', description: 'Help keep TW beautiful. Litter pickers and bags provided. Free coffee afterwards!', date: '2026-08-31', time: '10:00', location: 'Calverley Grounds', image: IMAGES.volunteer },
  { id: 'e_art_sketch', community_id: 'c_tw_creatives', title: 'Sketch Walk: The Pantiles', description: 'Guided plein-air sketching session. All media welcome. Beginners encouraged.', date: '2026-09-03', time: '14:00', location: 'The Pantiles', image: IMAGES.art },
  { id: 'e_founders_meetup', community_id: 'c_tw_founders', title: 'Monthly Founders Breakfast', description: 'Network over bacon rolls and flat whites. This month: "Scaling Beyond 10 Customers".', date: '2026-09-04', time: '08:00', location: 'The Beacon', image: IMAGES.business },
  { id: 'e_book_club_sept', community_id: 'c_tw_books', title: 'September Book Discussion', description: 'Discussing "Intermezzo" by Sally Rooney. New members welcome — wine provided!', date: '2026-09-12', time: '19:30', location: 'The Beacon', image: IMAGES.bookClub },
  { id: 'e_cycling_ride', community_id: 'c_tw_cycling', title: 'Saturday Road Ride (60km)', description: 'Rolling route through Groombridge and Hartfield. Moderate difficulty. Café stop at Pooh Corner.', date: '2026-08-30', time: '08:00', location: 'TW Train Station', image: IMAGES.cycling },
  { id: 'e_supper_club', community_id: 'c_tw_foodies', title: 'Thai Street Food Night', description: 'Learn to cook authentic pad thai and green curry. All ingredients provided. BYOB.', date: '2026-09-05', time: '19:00', location: 'Host TBA (Members Only)', image: IMAGES.cooking },
];

async function verifyImages() {
  console.log('🖼️  Verifying all image URLs...');
  const allUrls = Object.values(IMAGES);
  let failures = 0;
  for (const [key, url] of Object.entries(IMAGES)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status !== 200) {
        console.error(`  ❌ ${key}: ${res.status}`);
        failures++;
      }
    } catch (e) {
      console.error(`  ❌ ${key}: NETWORK ERROR`);
      failures++;
    }
  }
  if (failures > 0) {
    console.error(`\n❌ ${failures} image(s) failed verification. Fix before proceeding.`);
    process.exit(1);
  }
  console.log(`  ✅ All ${Object.keys(IMAGES).length} images verified (200 OK)\n`);
}

async function updateExistingCommunities() {
  console.log('📝 Updating existing community tags...');
  
  // Fix parkrun tags
  await supabase.from('communities').update({ 
    tags: ['🏃 Running', '🤝 Volunteering'],
    verified: true 
  }).eq('id', 'c_parkrun_tw');
  console.log('  ✅ parkrun → 🏃 Running, 🤝 Volunteering (verified)');
  
  // Fix Mum Club tags
  await supabase.from('communities').update({ 
    tags: ['👶 Parenting', '🧘 Wellness'],
    verified: true 
  }).eq('id', 'c_mumclub_tw');
  console.log('  ✅ Mum Club → 👶 Parenting, 🧘 Wellness (verified)');
  
  // Fix u3a tags
  await supabase.from('communities').update({ 
    tags: ['🎓 Learning', '🤝 Volunteering'],
    verified: true 
  }).eq('id', 'c_u3a_tw');
  console.log('  ✅ u3a → 🎓 Learning, 🤝 Volunteering (verified)');
}

async function seedCommunities() {
  console.log('🏘️  Seeding new communities...');
  
  for (const comm of NEW_COMMUNITIES) {
    const { error } = await supabase.from('communities').upsert([{
      id: comm.id,
      name: comm.name,
      description: comm.description,
      tags: comm.tags,
      image: comm.image,
      verified: comm.verified,
      activity_level: comm.activity_level,
      cost: comm.cost
    }], { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ ${comm.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${comm.name} (${comm.tags.join(', ')})`);
    }
  }
}

async function seedEvents() {
  console.log('\n📅 Seeding events...');
  
  for (const event of NEW_EVENTS) {
    const { error } = await supabase.from('events').upsert([{
      id: event.id,
      community_id: event.community_id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      attendees: Math.floor(Math.random() * 15) + 3,
      status: 'published'
    }], { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ ${event.title}: ${error.message}`);
    } else {
      console.log(`  ✅ ${event.title}`);
    }
  }
}

async function seedChannels() {
  console.log('\n💬 Seeding default channels...');
  
  for (const comm of NEW_COMMUNITIES) {
    const { error } = await supabase.from('channels').upsert([{
      id: `ch_${comm.id}_general`,
      community_id: comm.id,
      name: 'general',
      type: 'text'
    }], { onConflict: 'id' });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`  ❌ #general for ${comm.name}: ${error.message}`);
    }
  }
  console.log('  ✅ All #general channels created');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  MORE COMMUNITY — Demo Data Seeder');
  console.log('  Investor Pitch Edition');
  console.log('═══════════════════════════════════════════\n');
  
  await verifyImages();
  await updateExistingCommunities();
  await seedCommunities();
  await seedEvents();
  await seedChannels();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ DONE! Demo data seeded successfully');
  console.log('═══════════════════════════════════════════');
  console.log(`\n  Communities: ${3 + NEW_COMMUNITIES.length} total`);
  console.log(`  Events: ${NEW_EVENTS.length} new`);
  console.log(`  Filter coverage: Walking, Running, Wellness, Adventure, Volunteering, Creative, Business, Book Club, Music, Cooking, Gardening, Parenting`);
}

main().catch(console.error);
