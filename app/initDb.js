import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';


const initialMessages = [
  {
    community_id: 'yentw',
    channel: 'announcements',
    author_id: 'u2',
    text: "Welcome to the YENTW Announcements channel! We'll post all major updates here.",
    timestamp: "10:00 AM"
  },
  {
    community_id: 'yentw',
    channel: 'general',
    author_id: 'u4',
    text: "Hey everyone! Glad to be here.",
    timestamp: "10:15 AM"
  },
  {
    community_id: 'yentw',
    channel: 'general',
    author_id: 'u1',
    text: "Looking forward to the next meetup. Anyone have venue ideas?",
    timestamp: "10:20 AM"
  },
  {
    community_id: 'mindful-miles',
    channel: 'announcements',
    author_id: 'u1',
    text: "Next walk is on Sunday at 9 AM. See you there!",
    timestamp: "10:00 AM"
  }
];

async function seed() {
  const { data, error } = await supabase.from('messages').insert(initialMessages);
  if (error) {
    console.error('Error seeding messages:', error);
  } else {
    console.log('Successfully seeded mock messages!');
  }
}

seed();
