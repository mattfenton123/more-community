import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';



async function seed() {
  console.log('🌱 Seeding mock data...');

  // 1. Create a couple of mock users
  const mockUsers = [
    { id: 'u_alice', name: 'Alice Walker', role: 'Member', bio: 'Love hiking and outdoors.', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 'u_bob', name: 'Bob Smith', role: 'Member', bio: 'Just moved to TW.', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 'u_charlie', name: 'Charlie Davis', role: 'Leader', bio: 'Community organizer.', avatar: 'https://i.pravatar.cc/150?u=3' }
  ];

  for (const u of mockUsers) {
    const { error } = await supabase.from('users').upsert(u);
    if (error) console.error('Error inserting user:', error.message);
  }
  console.log('✅ Mock users inserted');

  // 2. Add members to a community (tw-ramblers)
  const communityId = 'tw-ramblers';
  const mockMembers = [
    { community_id: communityId, user_id: 'u_alice', role: 'member' },
    { community_id: communityId, user_id: 'u_bob', role: 'member' },
    { community_id: communityId, user_id: 'u_charlie', role: 'admin' },
  ];

  for (const m of mockMembers) {
    await supabase.from('community_members').upsert(m);
  }
  console.log('✅ Mock members added to tw-ramblers');

  // 3. Add Channels
  const channels = [
    { community_id: communityId, name: 'general', description: 'General chat' },
    { community_id: communityId, name: 'upcoming-hikes', description: 'Plan upcoming walks' }
  ];

  for (const c of channels) {
    await supabase.from('channels').upsert(c, { onConflict: 'community_id,name' });
  }

  // 4. Add Messages
  const messages = [
    { community_id: communityId, channel: 'general', user_id: 'u_charlie', text: 'Welcome to the ramblers group!' },
    { community_id: communityId, channel: 'general', user_id: 'u_alice', text: 'Hi everyone, excited to get walking!' },
    { community_id: communityId, channel: 'upcoming-hikes', user_id: 'u_bob', text: 'Is anyone up for a walk this weekend?' },
  ];

  for (const msg of messages) {
    await supabase.from('messages').insert(msg);
  }
  console.log('✅ Mock messages inserted');

  // 5. Add an Event
  const eventId = 'event_demo_1';
  const event = {
    id: eventId,
    community_id: communityId,
    title: 'Weekend Walk in the Pantiles',
    description: 'A gentle 5k loop around the beautiful Tunbridge Wells.',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
    time: '10:00 AM',
    location: 'The Pantiles, Royal Tunbridge Wells',
    created_by: 'u_charlie'
  };

  await supabase.from('events').upsert(event);
  console.log('✅ Mock event inserted');

  // 6. Add RSVPs
  await supabase.from('event_rsvps').upsert([
    { event_id: eventId, user_id: 'u_alice', status: 'going' },
    { event_id: eventId, user_id: 'u_bob', status: 'interested' }
  ]);
  console.log('✅ Mock RSVPs inserted');

  // 7. Add a Poll
  const poll = {
    community_id: communityId,
    channel: 'general',
    question: 'Where should our next walk be?',
    options: JSON.stringify(['Dunorlan Park', 'Bewl Water', 'Ashdown Forest']),
    created_by: 'u_charlie'
  };
  const { data: pollData } = await supabase.from('polls').insert(poll).select().single();
  
  if (pollData) {
    await supabase.from('poll_votes').insert([
      { poll_id: pollData.id, user_id: 'u_alice', option_index: 0 },
      { poll_id: pollData.id, user_id: 'u_bob', option_index: 1 }
    ]);
    console.log('✅ Mock poll and votes inserted');
  }

  console.log('🎉 Seeding complete!');
}

seed().catch(err => console.error(err));
