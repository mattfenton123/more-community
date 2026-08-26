import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';


const mockSponsors = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Gusto Coffee Roasters',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
    url: 'https://example.com/gusto',
    tier: 'Headline'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Kent Outdoors',
    logo: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80',
    url: 'https://example.com/kent-outdoors',
    tier: 'Community'
  }
];

const mockAssignments = [
  {
    sponsor_id: '11111111-1111-1111-1111-111111111111',
    target_id: 'yentw',
    target_type: 'community'
  },
  {
    sponsor_id: '22222222-2222-2222-2222-222222222222',
    target_id: 'tw-ramblers',
    target_type: 'community'
  }
];

async function seed() {
  console.log('Seeding Sponsors...');
  const { data: sData, error: sErr } = await supabase.from('sponsors').insert(mockSponsors).select();
  if (sErr) console.error('Sponsors Error:', sErr);
  else console.log('Sponsors Seeded:', sData.length);

  console.log('Seeding Sponsorship Assignments...');
  const { data: aData, error: aErr } = await supabase.from('sponsorship_assignments').insert(mockAssignments).select();
  if (aErr) console.error('Assignments Error:', aErr);
  else console.log('Assignments Seeded:', aData.length);
}

seed();
