import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';



async function seedFullData() {
  console.log('🌱 Starting Full Data Seed with Deeply Researched TW Communities...');

  // 1. Delete old data (optional, but good for a clean seed)
  // We'll just upsert to overwrite mostly, but let's clear events and memberships
  // We don't delete communities to avoid breaking foreign keys in a messy way if we miss one,
  // but upsert will overwrite details.

  const users = [
    { id: 'u_parkrun', name: 'James Run', role: 'Leader', bio: 'Avid runner and parkrun coordinator.', avatar: 'https://images.unsplash.com/photo-1553532434-615d0eb1ce0b?auto=format&fit=crop&w=800&q=80' },
    { id: 'u_yoga', name: 'Sarah Om', role: 'Leader', bio: 'Yoga instructor and wellness guide.', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
    { id: 'u_adventure', name: 'Mike Hike', role: 'Leader', bio: 'Explorer of the Kent countryside.', avatar: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80' },
    { id: 'u_u3a', name: 'Margaret Smith', role: 'Leader', bio: 'Coordinator for u3a Tunbridge Wells.', avatar: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
    { id: 'u_mumclub', name: 'Chloe Davies', role: 'Leader', bio: 'Organiser for The Mum Club TW.', avatar: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?auto=format&fit=crop&w=800&q=80' },
    { id: 'u_entwine', name: 'Richard Bolt', role: 'Leader', bio: 'Business networker and founder.', avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80' },
  ];

  const communities = [
    // Originals retained
    {
      id: 'tw-parkrun',
      name: 'TW Parkrun',
      description: 'Free, weekly, 5km timed run in Dunorlan Park. Open to everyone, safe and easy to take part.',
      tags: ['🏃 Running', 'Fitness', 'Outdoors'],
      cover_image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80',
      lat: 51.138,
      lng: 0.253
    },
    {
      id: 'tw-yoga-collective',
      name: 'TW Yoga Collective',
      description: 'Outdoor yoga sessions in local parks and community halls. Join us for mindful flows and meditation.',
      tags: ['🧘 Wellness', 'Yoga', 'Mindfulness'],
      cover_image: 'https://images.unsplash.com/photo-1566453982463-5461c360dbfa?auto=format&fit=crop&w=800&q=80',
      lat: 51.131,
      lng: 0.268
    },
    {
      id: 'kent-adventures',
      name: 'Kent Adventures',
      description: 'Weekend hikes, climbing, and outdoor activities around the high weald of Kent.',
      tags: ['⛰️ Adventure', 'Hiking', 'Outdoors'],
      cover_image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      lat: 51.127,
      lng: 0.276
    },
    
    // New Researched Communities
    {
      id: 'u3a-tunbridge-wells',
      name: 'u3a Tunbridge Wells',
      description: 'A vibrant community for those no longer in full-time employment, offering interest groups spanning arts, crafts, history, and language learning.',
      tags: ['🎨 Creative', '📚 Learning', 'History'],
      cover_image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
      lat: 51.1305,
      lng: 0.2612
    },
    {
      id: 'tw-social-sisters',
      name: 'TW Social Sisters',
      description: 'An inclusive social club focused on friendship for women, organizing regular casual meetups, book clubs, and local walks.',
      tags: ['🤝 Volunteering', 'Social', 'Friendship'],
      cover_image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=800&q=80',
      lat: 51.1340,
      lng: 0.2600
    },
    {
      id: 'the-mum-club-tw',
      name: 'The Mum Club Tunbridge Wells',
      description: 'Connecting local mothers through organized walks, brunches, and seasonal gatherings to build a supportive village.',
      tags: ['👶 Parenting', 'Social', 'Wellness'],
      cover_image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
      lat: 51.1290,
      lng: 0.2710
    },
    {
      id: 'entwine-business',
      name: 'enTWine Business Networking',
      description: 'A highly active business networking group for local entrepreneurs, freelancers, and small businesses in the TW area.',
      tags: ['💼 Business', 'Networking', 'Professionals'],
      cover_image: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?auto=format&fit=crop&w=800&q=80',
      lat: 51.1330,
      lng: 0.2620
    },
    {
      id: 'forever-active-tw',
      name: 'Forever Active TW',
      description: 'Dedicated to keeping older adults active through gentle exercise classes, pickleball, and guided pub walks across Everyday Active Kent.',
      tags: ['🧘 Wellness', 'Fitness', 'Seniors'],
      cover_image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
      lat: 51.1352,
      lng: 0.2587
    },
    {
      id: 'west-kent-ivc',
      name: 'West Kent IVC',
      description: 'A social events club aimed at professionals and graduates looking to expand their social life through organized activities, theatre trips, and dining out.',
      tags: ['🤝 Volunteering', 'Professionals', 'Social'],
      cover_image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
      lat: 51.1360,
      lng: 0.2550
    }
  ];

  const events = [
    {
      id: 'ev_parkrun_1',
      community_id: 'tw-parkrun',
      title: 'Saturday Parkrun 5k',
      date: '2026-06-27',
      time: '09:00',
      location: 'Dunorlan Park, TW',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      attendees: 145,
      status: 'published',
      max_capacity: null
    },
    {
      id: 'ev_yoga_1',
      community_id: 'tw-yoga-collective',
      title: 'Sunrise Vinyasa Flow',
      date: '2026-06-28',
      time: '07:30',
      location: 'The Common, TW',
      image: 'https://images.unsplash.com/photo-1581579438747-104c557989eb?auto=format&fit=crop&w=800&q=80',
      attendees: 22,
      status: 'published',
      max_capacity: 30
    },
    {
      id: 'ev_u3a_art',
      community_id: 'u3a-tunbridge-wells',
      title: 'Watercolour Workshop',
      date: '2026-07-01',
      time: '14:00',
      location: 'Trinity Theatre Cafe',
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?auto=format&fit=crop&w=800&q=80',
      attendees: 12,
      status: 'published',
      max_capacity: 15
    },
    {
      id: 'ev_mumclub_brunch',
      community_id: 'the-mum-club-tw',
      title: 'Summer Mum Brunch',
      date: '2026-07-05',
      time: '10:30',
      location: 'The Ivy, Tunbridge Wells',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
      attendees: 45,
      status: 'published',
      max_capacity: 50
    },
    {
      id: 'ev_entwine_meetup',
      community_id: 'entwine-business',
      title: 'Monthly Networking Breakfast',
      date: '2026-07-10',
      time: '08:00',
      location: 'Hotel du Vin',
      image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80',
      attendees: 30,
      status: 'published',
      max_capacity: null
    }
  ];

  const memberships = [
    { community_id: 'tw-parkrun', user_id: 'u_parkrun', role: 'Leader' },
    { community_id: 'tw-yoga-collective', user_id: 'u_yoga', role: 'Leader' },
    { community_id: 'kent-adventures', user_id: 'u_adventure', role: 'Leader' },
    { community_id: 'u3a-tunbridge-wells', user_id: 'u_u3a', role: 'Leader' },
    { community_id: 'the-mum-club-tw', user_id: 'u_mumclub', role: 'Leader' },
    { community_id: 'entwine-business', user_id: 'u_entwine', role: 'Leader' },
  ];

  console.log('Inserting Users...');
  for (const u of users) {
    await supabase.from('users').upsert(u);
  }

  console.log('Inserting Communities...');
  for (const c of communities) {
    await supabase.from('communities').upsert(c);
  }

  console.log('Inserting Events...');
  for (const e of events) {
    await supabase.from('events').upsert(e);
  }

  console.log('Inserting Memberships...');
  for (const m of memberships) {
    await supabase.from('community_memberships').delete().match({ community_id: m.community_id, user_id: m.user_id });
    await supabase.from('community_memberships').insert(m);
  }

  console.log('✅ Deep Research Seed Complete!');
}

seedFullData().catch(console.error);
