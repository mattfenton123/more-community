import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very simple .env parser
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service role key for RLS bypass

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Cannot seed database.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding real-world Tunbridge Wells data...');

  // 1. Communities
  const communities = [
    {
      id: 'c_parkrun_tw',
      name: 'Royal Tunbridge Wells parkrun',
      description: 'A free, fun, and friendly weekly 5k community event. Walk, jog, run, volunteer or spectate – it\'s up to you!',
      image: 'https://images.unsplash.com/photo-1553532434-615d0eb1ce0b?auto=format&fit=crop&w=800&q=80',
      lat: 51.1345,
      lng: 0.2801,
      contact_email: 'tunbridgewells@parkrun.com',
      website: 'https://www.parkrun.org.uk/royaltunbridgewells/'
    },
    {
      id: 'c_mumclub_tw',
      name: 'The Mum Club Tunbridge Wells',
      description: 'The Mum Club is the UK\'s leading event-based community and digital destination for women who happen to be mothers. Join us for coffee, brunches, and walking clubs.',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      lat: 51.1300,
      lng: 0.2600,
      instagram: '@themumclubtunbridgewells',
      website: 'https://themumclub.com'
    },
    {
      id: 'c_business_network_tw',
      name: 'TW Business Networking',
      description: 'A professional networking community in Tunbridge Wells hosting structured and informal business meetups to support local professionals and entrepreneurs.',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
      lat: 51.1325,
      lng: 0.2640,
      website: 'https://tunbridgewells.works'
    },
    {
      id: 'c_u3a_tw',
      name: 'Tunbridge Wells u3a',
      description: 'Learn, laugh, and live! We are a cooperative movement of people no longer in full-time employment, coming together to continue their educational, social, and creative interests.',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      lat: 51.1380,
      lng: 0.2650,
      website: 'https://u3asites.org.uk/tunbridgewells'
    }
  ];

  for (const c of communities) {
    const { error } = await supabase.from('communities').upsert(c);
    if (error) console.error('Error inserting community:', c.name, error.message);
  }

  // 2. Assign Leaders
  const memberships = [
    { community_id: 'c_parkrun_tw', user_id: 'u_parkrun', role: 'Leader' },
    { community_id: 'c_mumclub_tw', user_id: 'u_mumclub', role: 'Leader' },
    { community_id: 'c_business_network_tw', user_id: 'u_entwine', role: 'Leader' },
    { community_id: 'c_u3a_tw', user_id: 'u_u3a', role: 'Leader' }
  ];

  for (const m of memberships) {
    // Check if membership exists
    const { data: existing } = await supabase.from('community_memberships')
      .select('*')
      .eq('community_id', m.community_id)
      .eq('user_id', m.user_id)
      .single();
    
    if (!existing) {
      const { error } = await supabase.from('community_memberships').insert(m);
      if (error) console.error('Error assigning leader:', m.community_id, error.message);
    }
  }

  // 3. Events (Real Data)
  const events = [
    {
      id: 'e_parkrun_june27',
      community_id: 'c_parkrun_tw',
      title: 'Royal Tunbridge Wells parkrun',
      description: 'Join us for our weekly free 5k timed run. Remember to bring your scannable barcode!',
      date: '2026-06-27',
      time: '09:00',
      location: 'Dunorlan Park, Tunbridge Wells',
      image: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?auto=format&fit=crop&w=800&q=80',
      status: 'published',
      attendees: 145
    },
    {
      id: 'e_mumclub_coffee',
      community_id: 'c_mumclub_tw',
      title: 'TMC Coffee Club',
      description: 'Come and meet other local mums for a relaxed coffee morning at Lemons Bar on The Pantiles. Babies and toddlers welcome!',
      date: '2026-07-01',
      time: '10:00',
      location: 'Lemons Bar, The Pantiles',
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
      status: 'published',
      attendees: 25
    },
    {
      id: 'e_powered_up',
      community_id: 'c_business_network_tw',
      title: 'Powered Up Business Networking',
      description: 'A dynamic networking event for local professionals and business owners. Bring your business cards!',
      date: '2026-07-13',
      time: '18:30',
      location: 'The Claremont Pub and Garden',
      image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80',
      status: 'published',
      attendees: 40
    },
    {
      id: 'e_synergy_net',
      community_id: 'c_business_network_tw',
      title: 'Synergy Business Networking',
      description: 'Structured, no-pitching, small-group table conversations designed to forge genuine business relationships.',
      date: '2026-07-15',
      time: '07:30',
      location: 'Royal Wells Hotel',
      image: 'https://images.unsplash.com/photo-1566453982463-5461c360dbfa?auto=format&fit=crop&w=800&q=80',
      status: 'published',
      attendees: 30
    },
    {
      id: 'e_u3a_monthly',
      community_id: 'c_u3a_tw',
      title: 'Monthly Members Meeting',
      description: 'Our regular monthly gathering featuring a guest speaker on local history, followed by tea, coffee, and group updates.',
      date: '2026-07-10',
      time: '14:00',
      location: 'Tunbridge Wells Community Centre',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      status: 'published',
      attendees: 60
    }
  ];

  for (const e of events) {
    const { error } = await supabase.from('events').upsert(e);
    if (error) console.error('Error inserting event:', e.title, error.message);
  }

  // 4. Default Channels
  const channels = [
    { id: 'ch_parkrun_gen', community_id: 'c_parkrun_tw', name: 'general', type: 'text' },
    { id: 'ch_parkrun_vol', community_id: 'c_parkrun_tw', name: 'volunteers', type: 'text' },
    { id: 'ch_mumclub_gen', community_id: 'c_mumclub_tw', name: 'general', type: 'text' },
    { id: 'ch_biz_gen', community_id: 'c_business_network_tw', name: 'introductions', type: 'text' },
    { id: 'ch_u3a_gen', community_id: 'c_u3a_tw', name: 'general', type: 'text' }
  ];

  for (const ch of channels) {
    const { error } = await supabase.from('channels').upsert(ch);
    if (error) console.error('Error inserting channel:', ch.name, error.message);
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);
