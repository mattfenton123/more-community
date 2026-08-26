/**
 * Seeds chat messages, feed posts and demo users to make the app feel alive.
 * Run: node --env-file=.env.local seedContent.js
 */
import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const fakeUsers = [
  { id: 'demo_user_1', name: 'Sarah Mitchell' },
  { id: 'demo_user_2', name: 'James Cooper' },
  { id: 'demo_user_3', name: 'Olivia Patel' },
  { id: 'demo_user_4', name: 'Tom Hart' },
  { id: 'demo_user_5', name: 'Emma Wright' },
  { id: 'demo_user_6', name: 'Chris Blake' },
  { id: 'demo_user_7', name: 'Anja Novak' },
  { id: 'demo_user_8', name: 'Liam Kelly' },
  { id: 'demo_user_9', name: 'Priya Sharma' },
  { id: 'demo_user_10', name: 'Will Foster' },
];

// Ensure demo users exist
for (const u of fakeUsers) {
  await s.from('users').upsert([{
    id: u.id, name: u.name,
    avatar: `https://i.pravatar.cc/150?u=${u.id}`,
    role: 'Member', bio: 'Loving the TW community life!',
    joined: new Date().toISOString(), onboarded: true, interests: []
  }], { onConflict: 'id' });
}
console.log('✅ 10 demo users created');

// Add memberships
const { data: comms } = await s.from('communities').select('id');
let memberCount = 0;
for (const comm of comms) {
  const sample = [...fakeUsers].sort(() => 0.5 - Math.random()).slice(0, 4 + Math.floor(Math.random() * 5));
  for (const u of sample) {
    const { error } = await s.from('community_memberships').upsert([{
      community_id: comm.id, user_id: u.id, role: 'Member'
    }], { onConflict: 'community_id,user_id' });
    if (!error) memberCount++;
  }
}
console.log(`✅ ${memberCount} memberships added`);

// Chat messages
const chatTemplates = {
  'c_parkrun_tw': ['Had a PB today! 23:42 🎉', 'Well done! The conditions were perfect this morning', 'Anyone volunteering next Saturday? We need a timekeeper', 'Count me in for volunteering!', 'Loved the new route around the lake 🏃‍♀️', 'Great turnout today - must have been 80+ runners'],
  'c_mumclub_tw': ['Is Bills busy on Saturdays? Should we book?', 'I booked a table for 8 just in case!', 'Can I bring my 3-month-old? First time out!', 'Absolutely! All ages welcome 🥰', 'The brunch was lovely, thanks everyone', 'Who is up for the walk on Wednesday?'],
  'c_u3a_tw': ['The talk on The Pantiles was fascinating', 'Does anyone have the reading list from last session?', 'Looking forward to the watercolour workshop!', 'Can we do a trip to the gallery in Sevenoaks?', 'Great idea — group tickets would be perfect'],
  'c_tw_ramblers': ['Stunning views on the ridge walk today 🌄', 'The bluebell woods were incredible', 'Anyone got a spare pair of walking poles?', 'I have some you can borrow — message me', 'Full moon walk is going to be magical ✨', 'Bring head torches everyone!'],
  'c_tw_run_club': ['Track session was brutal but brilliant 💪', 'My legs are still recovering from Wednesday!', 'Who is doing the 10K on Saturday?', 'I am in — aiming for sub-50', 'Welcome to all the new runners this week!', 'Coach Sarah warm-ups are getting creative 😂'],
  'c_tw_yoga': ['Sunrise flow was pure bliss this morning 🧘', 'The sound bath was life-changing', 'Is there space in the Thursday evening class?', 'Yes! Come along, all welcome', 'I finally nailed crow pose today!', 'Amazing! Well done 🙌'],
  'c_tw_adventure': ['Bewl Water was gorgeous — 13 miles done ✅', 'Wild swimming next week — who is brave enough?', 'Wetsuits are essential, trust me 🥶', 'The bivvy night is fully booked!', 'Best sunrise from the ridge', 'Kent really is an adventure playground'],
  'c_tw_volunteer': ['47 bags of litter collected today! 💚', 'Amazing effort everyone. The park looks great', 'Food bank needs pasta and tinned veg urgently', 'I will drop some off tomorrow morning', 'The community garden is looking beautiful'],
  'c_tw_creatives': ['The sketch walk was so therapeutic', 'Love the light in the watercolour pieces 🎨', 'Deadline for the autumn exhibition is Sept 20th', 'Life drawing next Monday — bring your A-game', 'Has anyone tried the new art supplies shop?'],
  'c_tw_founders': ['Great energy at pitch night last week 🚀', 'The silent co-working is my new favourite thing', 'Revenue update: hit our first 10K month!', 'Congratulations! Drinks on you 🍻', 'Who is coming to the breakfast next Thursday?'],
  'c_tw_books': ['Just finished Intermezzo — wow, what a ride', 'No spoilers! I am only halfway through', 'The author visit is going to be incredible', 'Can we vote on the October book?', 'Love how varied our reading list has been this year'],
  'c_tw_music': ['Open mic was electric last Friday! 🎸', 'Anyone know a drummer for our band?', 'I play drums — DM me!', 'The jam session was so relaxed, loved it', 'Thinking of performing my own songs next month', 'Go for it! This crowd is super supportive'],
  'c_tw_foodies': ['The Thai night was incredible 🍜', 'Recipe please! That green curry was unreal', 'Fresh pasta next — I am already excited', 'Should we do a Christmas dinner special?', 'This group is the best thing in TW'],
  'c_tw_allotments': ['Tomatoes are going crazy this year 🍅', 'Anyone want some courgettes? I have far too many', 'Yes please! Happy to swap for some herbs', 'The seed swap is going to be brilliant', 'My sunflowers are over 6 feet tall!'],
  'c_tw_dads': ['Great walk this morning — the kids loved the puddles', 'Friday social was exactly what I needed', 'Any dads doing the parkrun tomorrow?', 'I will be there with the buggy!', 'This group has genuinely helped my mental health', 'Same here mate. Fresh air and good company 💪'],
  'c_tw_cycling': ['Bedgebury gravel ride was awesome 🚴', 'Cafe stop at Pooh Corner is mandatory', 'Anyone doing the sportive in October?', 'Bike maintenance workshop was really helpful', 'Fixed my first puncture on the road today!', 'Welcome to the club 😂'],
  'c_tw_photography': ['Golden hour light at The Pantiles was insane 📸', 'The Lightroom tips were game-changing', 'Can we do a night photography session?', 'Great idea — the Common at night would be epic', 'Anyone shooting the fireworks in November?'],
};

let msgCount = 0;
for (const [commId, msgs] of Object.entries(chatTemplates)) {
  const shuffled = [...fakeUsers].sort(() => 0.5 - Math.random());
  for (let i = 0; i < msgs.length; i++) {
    const hoursAgo = (msgs.length - i) * 4 + Math.floor(Math.random() * 3);
    const ts = new Date(Date.now() - hoursAgo * 3600 * 1000);
    const { error } = await s.from('messages').insert([{
      community_id: commId, channel: 'general',
      author_id: shuffled[i % shuffled.length].id,
      text: msgs[i],
      timestamp: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    if (!error) msgCount++;
  }
}
console.log(`✅ ${msgCount} chat messages seeded`);

// Feed posts
const feedPosts = [
  { community_id: 'c_parkrun_tw', text: '🏃 New course record today! 16:42 by our very own James Cooper. The whole club was cheering him on. What a Saturday morning! #parkrun #PB', media: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_ramblers', text: 'The autumn colours on today\'s walk through Frant were absolutely stunning 🍂 12 of us explored the old deer park and stopped for hot chocolate at the village café.', media: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_yoga', text: 'Sunrise yoga in Calverley Grounds this morning was pure magic ✨ 22 people showed up despite the early start. Community is everything.', media: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_creatives', text: '🎨 Incredible work from yesterday\'s sketch walk along The Pantiles. Proud of every single piece. Autumn exhibition submissions open until Sept 20th!', media: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_founders', text: '🚀 Pitch Night recap: 5 incredible founders shared their stories. The winner — a local meal-kit startup — won a free month of co-working at The Beacon.', media: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_volunteer', text: '💚 47 bags of litter collected across Tunbridge Wells today. Thank you to every single volunteer. The parks look beautiful. Join us next Saturday!', media: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_adventure', text: 'Wild swimming at Haysden Lake this morning 🏊 The water was fresh but we survived. Next adventure: overnight bivvy on the High Weald ridge!', media: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_mumclub_tw', text: 'What a gorgeous brunch at Bills today! 12 mums, 8 babies, and 0 judgement. This is what The Mum Club is all about 💛', media: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_cycling', text: '🚴 Saturday ride report: 60km through the High Weald. Cafe stop at Pooh Corner (obviously). 14 riders, zero mechanicals, perfect conditions.', media: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_foodies', text: '🍜 Thai night was an absolute feast! Homemade pad thai and green curry that rivalled any restaurant. Next month: fresh pasta masterclass!', media: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_dads', text: 'Saturday morning walk with the dads across the Common. No agenda, just fresh air and honest conversation. This group is genuinely changing lives. 💪', media: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80' },
  { community_id: 'c_tw_allotments', text: '🍅 Harvest festival was incredible! Tables overflowing with homegrown veg, homemade cakes, and community spirit.', media: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80' },
];

let postCount = 0;
const shuffledUsers = [...fakeUsers].sort(() => 0.5 - Math.random());
for (let i = 0; i < feedPosts.length; i++) {
  const fp = feedPosts[i];
  const { error } = await s.from('feed_posts').insert([{
    community_id: fp.community_id,
    author_id: shuffledUsers[i % shuffledUsers.length].id,
    text: fp.text, media: fp.media,
    likes: Math.floor(Math.random() * 25) + 5,
    comments: Math.floor(Math.random() * 8) + 1
  }]);
  if (error) console.log('❌ Post: ' + error.message);
  else postCount++;
}
console.log(`✅ ${postCount} feed posts seeded`);
console.log('\nDone! The app should now feel alive.');
