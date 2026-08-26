import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';



async function seedCommunities() {
  console.log('🌱 Seeding communities...');

  const communities = [
    {
      id: 'tw-ramblers',
      name: 'TW Ramblers',
      description: 'Local walking group exploring the beautiful Kent countryside around Tunbridge Wells.',
      lat: 51.1352,
      lng: 0.2587
    },
    {
      id: 'mindful-miles',
      name: 'Mindful Miles',
      description: 'Walking and wellness in Tunbridge Wells.',
      lat: 51.1322,
      lng: 0.2637
    },
    {
      id: 'a-z-challenge',
      name: 'A-Z Challenge TW',
      description: 'Walking every street in Tunbridge Wells.',
      lat: 51.129,
      lng: 0.271
    },
    {
      id: 'tw-parkrun',
      name: 'TW Parkrun',
      description: 'Free, weekly, 5km timed run in Dunorlan Park.',
      lat: 51.138,
      lng: 0.253
    },
    {
      id: 'tw-yoga-collective',
      name: 'TW Yoga Collective',
      description: 'Outdoor yoga sessions in local parks.',
      lat: 51.131,
      lng: 0.268
    },
    {
      id: 'kent-adventures',
      name: 'Kent Adventures',
      description: 'Outdoor activities and climbing.',
      lat: 51.127,
      lng: 0.276
    },
    {
      id: 'tw-good-neighbours',
      name: 'TW Good Neighbours',
      description: 'Helping the elderly and vulnerable in the community.',
      lat: 51.134,
      lng: 0.26
    },
    {
      id: 'tw-interfaith-network',
      name: 'TW Interfaith Network',
      description: 'Bringing together different faiths for community projects.',
      lat: 51.13,
      lng: 0.265
    },
    {
      id: 'tw-creative-collective',
      name: 'TW Creative Collective',
      description: 'Local artists and makers.',
      lat: 51.136,
      lng: 0.255
    },
    {
      id: 'yentw',
      name: 'Young Entrepreneurs TW',
      description: 'Networking for young professionals and business owners.',
      lat: 51.133,
      lng: 0.262
    }
  ];

  for (const c of communities) {
    const { error } = await supabase.from('communities').upsert(c);
    if (error) console.error(`Error inserting ${c.id}:`, error.message);
  }

  console.log('✅ Communities seeded');
}

seedCommunities().catch(console.error);
