import { supabaseAdmin as supabase, SUPABASE_URL, SERVICE_KEY } from './lib/supabaseAdmin.js';



async function seed() {
  console.log('🌱 Seeding mock feed posts...');

  const { data: users, error: usersErr } = await supabase.from('users').select('id');
  if (usersErr) throw usersErr;
  
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }
  
  const user1 = users[0].id;
  const user2 = users.length > 1 ? users[1].id : users[0].id;

  const { data: communities, error: commsErr } = await supabase.from('communities').select('id, name');
  if (commsErr) throw commsErr;

  if (!communities || communities.length === 0) {
     console.log('No communities found.');
     return;
  }

  const posts = [
    {
      community_id: communities[0].id,
      author_id: user1,
      text: `Just finished an amazing session with the ${communities[0].name} crew! Thanks everyone for coming out today. See you all next week! 🙌`,
      media: null,
      likes: 12,
      comments: 3,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      community_id: communities[0].id,
      author_id: user2,
      text: `Does anyone have the route map for our next meetup? Would love to review it beforehand. 🗺️`,
      media: null,
      likes: 4,
      comments: 8,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ];
  
  if (communities.length > 1) {
    posts.push({
      community_id: communities[1].id,
      author_id: user1,
      text: `Welcome to all the new members who joined ${communities[1].name} this week! Let's introduce ourselves in the chat. 🎉`,
      media: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      likes: 24,
      comments: 15,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    });
  }

  if (communities.length > 2) {
    posts.push({
      community_id: communities[2].id,
      author_id: user2,
      text: `We are looking for volunteers to help organize the summer festival for ${communities[2].name}. DM me if interested!`,
      media: null,
      likes: 8,
      comments: 2,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    });
  }

  for (const post of posts) {
    const { error } = await supabase.from('feed_posts').insert(post);
    if (error) console.error('Error inserting post:', error.message);
  }
  
  console.log('✅ Mock feed posts inserted');
}

seed();
