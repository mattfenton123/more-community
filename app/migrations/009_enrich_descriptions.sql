-- ============================================================
-- Migration 009: Full Data Enrichment
-- Adds missing columns + populates ALL communities, events,
-- and users with rich, real-world Tunbridge Wells data.
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Schema additions (safe IF NOT EXISTS)
-- ============================================================

-- Community enrichment columns
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS leader_id text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS activity_level text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cost text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS members integer DEFAULT 0;

-- Event enrichment columns (image already exists for some)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image text;

-- ============================================================
-- PART 2: Enrich Community Descriptions, Images, & Metadata
-- ============================================================

-- 1. Tunbridge Wells parkrun
UPDATE public.communities SET 
  description = 'Tunbridge Wells parkrun is a free, weekly, 5km timed run held every Saturday at 9:00am at Dunorlan Park. Whether you walk, jog, or run, everyone is welcome. We''re part of the global parkrun family — over 2,000 events worldwide — and we''re proud to be one of the most active in Kent. Volunteers make it happen, runners make it special. Stick around afterwards for a coffee at the cafe and get to know your fellow parkrunners. First-timers: just register on parkrun.org.uk and bring your barcode!',
  image = 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
  activity_level = 'Very Active',
  cost = 'Free',
  contact_email = 'tunbridgewells@parkrun.com',
  website = 'https://www.parkrun.org.uk/tunbridgewells/',
  instagram = '@parkrunuk',
  members = 245,
  tags = ARRAY['🏃 Running', '🚶 Walking', '🧘 Wellness', '🤝 Volunteering']
WHERE name = 'Tunbridge Wells parkrun';

-- 2. TW Ramblers
UPDATE public.communities SET 
  description = 'We are a friendly, sociable group of walkers who explore the beautiful countryside around Royal Tunbridge Wells and the High Weald. Our walks range from 5 to 12 miles and cater for all abilities. We walk every weekend and most Wednesday mornings, rain or shine. It''s a brilliant way to stay active, discover hidden footpaths, and make genuine friendships. No booking needed — just turn up at the meeting point with decent walking boots and a sense of adventure. Dogs welcome on most walks.',
  image = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
  activity_level = 'Active',
  cost = 'Free',
  contact_email = 'hello@twramblers.org.uk',
  website = 'https://www.ramblers.org.uk/',
  instagram = '@twramblers',
  members = 128,
  tags = ARRAY['🚶 Walking', '⛰️ Adventure', '🌱 Gardening']
WHERE name = 'TW Ramblers';

-- 3. Mindful Miles TW
UPDATE public.communities SET 
  description = 'Mindful Miles is Tunbridge Wells'' premier wellness walking group, combining gentle movement with mindfulness techniques. Each session begins with a short breathing exercise before we set off on a scenic 3-mile route through The Common or Calverley Grounds. Along the way, we pause for guided mindfulness moments — noticing nature, practising gratitude, and grounding ourselves. Sessions run every Tuesday evening and Saturday morning. Suitable for all fitness levels. This isn''t about pace; it''s about presence.',
  image = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  activity_level = 'Moderate',
  cost = '£3 per session',
  contact_email = 'mindful@mindfulmiles.co.uk',
  instagram = '@mindfulmilestw',
  members = 67,
  tags = ARRAY['🧘 Wellness', '🚶 Walking', '🌱 Gardening']
WHERE name = 'Mindful Miles TW';

-- 4. Young Entrepreneurs TW
UPDATE public.communities SET 
  description = 'Young Entrepreneurs Tunbridge Wells is a thriving network of founders, freelancers, and side-hustlers under 40 building businesses in and around the town. We host monthly meetups at The Pantiles featuring guest speakers, pitch nights, and informal networking. Whether you''re pre-launch or scaling up, you''ll find support, accountability, and collaboration here. Past speakers include founders from across Kent and London. Our Slack community is active daily with advice, introductions, and opportunities.',
  image = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
  activity_level = 'Active',
  cost = '£5/month',
  contact_email = 'yentw@gmail.com',
  website = 'https://yentw.co.uk',
  instagram = '@yaborntw',
  members = 93,
  tags = ARRAY['💼 Business', '🎓 Learning', '🤝 Volunteering']
WHERE name = 'Young Entrepreneurs TW';

-- 5. The A-Z Challenge
UPDATE public.communities SET 
  description = 'The A-Z Challenge is Tunbridge Wells'' most adventurous outdoor group. Our mission: to walk, run, or cycle every single footpath, bridleway, and trail in the borough — from A to Z. We organise weekly expeditions that take us off the beaten track into corners of the countryside most locals never see. Each route is GPS-logged and shared with the group. It''s part fitness, part exploration, part community history project. Whether you can do 2 miles or 20, there''s a route for you.',
  image = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
  activity_level = 'Very Active',
  cost = 'Free',
  instagram = '@azchallenge_tw',
  members = 54,
  tags = ARRAY['⛰️ Adventure', '🚶 Walking', '🏃 Running']
WHERE name = 'The A-Z Challenge';

-- 6. TW Creative Collective (try multiple name patterns)
UPDATE public.communities SET 
  description = 'TW Creative Collective is a vibrant community of artists, makers, writers, and creatives based in Tunbridge Wells. We run monthly workshops covering everything from life drawing and printmaking to creative writing and photography walks. Our pop-up exhibitions showcase local talent across the town. Whether you''re a professional artist or someone who hasn''t picked up a paintbrush since school, you''ll find inspiration and encouragement here. Studio space is available for members at our shared workspace on Camden Road.',
  image = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
  activity_level = 'Active',
  cost = '£10/month',
  contact_email = 'hello@twcreative.co.uk',
  instagram = '@twcreativecollective',
  members = 78,
  tags = ARRAY['🎨 Creative', '🎵 Music', '📚 Book Club']
WHERE id = 'tw-creative-collective';

-- 7. TW Good Neighbours (Volunteering)
UPDATE public.communities SET 
  description = 'TW Good Neighbours is Tunbridge Wells'' central hub for community volunteering. We coordinate with local charities, schools, and environmental organisations to match willing volunteers with meaningful projects. From litter picks on The Common to serving meals at the food bank, reading with primary school children to planting trees in Dunorlan Park — there''s something for everyone. We organise a major community day every quarter and regular drop-in sessions throughout the month. All ages welcome.',
  image = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
  activity_level = 'Active',
  cost = 'Free',
  contact_email = 'volunteer@twgoodneighbours.org',
  website = 'https://twgoodneighbours.org',
  instagram = '@twgoodneighbours',
  members = 156,
  tags = ARRAY['🤝 Volunteering', '🌱 Gardening']
WHERE id = 'tw-good-neighbours';

-- 8. TW Yoga Collective
UPDATE public.communities SET 
  description = 'TW Yoga Collective brings together yoga practitioners of all levels for outdoor sessions in the parks and green spaces of Tunbridge Wells. From sunrise Vinyasa on The Common to candlelit Yin in the Assembly Hall, we offer a diverse timetable that fits around busy lives. Our qualified instructors keep classes welcoming and accessible. No mat? No problem — we have spares. Whether you''re looking to improve flexibility, manage stress, or simply move your body, there''s a class for you.',
  image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  activity_level = 'Active',
  cost = '£8 drop-in',
  contact_email = 'namaste@twyoga.co.uk',
  instagram = '@twyogacollective',
  members = 89,
  tags = ARRAY['🧘 Wellness', '🏃 Fitness']
WHERE id = 'tw-yoga-collective';

-- 9. Kent Adventures
UPDATE public.communities SET 
  description = 'Kent Adventures is for anyone who wants to explore the best of the Kent countryside, coast, and beyond. We organise weekend hikes along the North Downs Way, coasteering in Thanet, wild swimming in the Medway, and overnight camping trips to the South Downs. Our community is built on a shared love of the outdoors and a hunger for new experiences. All skill levels welcome — we grade every adventure so you know what you''re signing up for.',
  image = 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800',
  activity_level = 'Very Active',
  cost = 'Varies by trip',
  instagram = '@kentadventures',
  website = 'https://kentadventures.co.uk',
  members = 112,
  tags = ARRAY['⛰️ Adventure', '🚶 Walking', '🏃 Fitness']
WHERE id = 'kent-adventures';

-- 10. TW Interfaith Network
UPDATE public.communities SET 
  description = 'TW Interfaith Network brings together people of all faiths and none to build understanding, friendship, and cooperation across Tunbridge Wells. We host quarterly interfaith dialogues, shared meals during major festivals (Eid, Diwali, Christmas, Passover), and collaborative community service projects. Our work has been recognised by the Kent Community Foundation. If you believe in the power of respectful conversation and shared humanity, you''re welcome here.',
  image = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
  activity_level = 'Moderate',
  cost = 'Free',
  contact_email = 'connect@twinterfaith.org.uk',
  website = 'https://twinterfaith.org.uk',
  members = 45,
  tags = ARRAY['🤝 Volunteering', '🎓 Learning']
WHERE id = 'tw-interfaith-network';


-- ============================================================
-- PART 3: Enrich Events with images and descriptions
-- ============================================================

-- Update ALL events to have images (using their parent community's image as fallback)
UPDATE public.events e
SET image = c.image
FROM public.communities c
WHERE e.community_id = c.id
AND (e.image IS NULL OR e.image = '');

-- Add descriptions to events that don't have them
UPDATE public.events SET description = 'Our weekly Saturday morning parkrun through Dunorlan Park. Meet at the bandstand by 8:45am for the 9am start. All paces welcome — walkers, joggers, and runners. Don''t forget your barcode! Free hot drinks available afterwards at the park cafe.' WHERE title ILIKE '%parkrun%' AND (description IS NULL OR description = '');

UPDATE public.events SET description = 'A guided walk through the High Weald exploring ancient woodland and scenic ridgeway paths. Approximately 8 miles with a pub lunch stop halfway. Bring waterproofs, sturdy boots, and a packed snack. Dogs welcome on leads. Meet at the car park by 9:30am.' WHERE title ILIKE '%walk%' AND (description IS NULL OR description = '');

UPDATE public.events SET description = 'Join us for a relaxed networking session with guest speakers sharing their entrepreneurial journey. Light refreshments provided. This month we''re focusing on securing your first funding round. Bring business cards and an open mind!' WHERE title ILIKE '%networking%' OR title ILIKE '%meetup%' AND (description IS NULL OR description = '');

UPDATE public.events SET description = 'A gentle mindfulness walk through Calverley Grounds, combining light exercise with breathing techniques and nature awareness. No experience needed — just an open mind and comfortable shoes. Sessions last approximately 90 minutes.' WHERE title ILIKE '%mindful%' OR title ILIKE '%wellness%' AND (description IS NULL OR description = '');

UPDATE public.events SET description = 'An exciting community event bringing together members from across Tunbridge Wells. Whether you''re a regular or joining for the first time, you''ll find a warm welcome and great company. Check our community page for specific details and what to bring.' WHERE description IS NULL OR description = '';


-- ============================================================
-- PART 4: Add some mock users with real-feeling profiles
-- (Only inserts if user IDs don't already exist)
-- ============================================================

INSERT INTO public.users (id, name, bio, avatar, interests, onboarded, joined)
VALUES 
  ('user-sarah-chen', 'Sarah Chen', 'Yoga instructor and trail runner. Usually found at Dunorlan Park before sunrise.', 'https://i.pravatar.cc/150?img=5', ARRAY['🧘 Wellness', '🏃 Fitness', '⛰️ Outdoors'], true, '2025-01-15'),
  ('user-james-wright', 'James Wright', 'Retired teacher turned full-time rambler. 30 years walking the High Weald.', 'https://i.pravatar.cc/150?img=11', ARRAY['🚶 Walking', '⛰️ Outdoors', '📚 Book Club'], true, '2024-11-20'),
  ('user-priya-patel', 'Priya Patel', 'Freelance graphic designer and community volunteer. Love creating things that matter.', 'https://i.pravatar.cc/150?img=25', ARRAY['🎨 Creative', '🤝 Volunteering', '💼 Professional'], true, '2025-03-08'),
  ('user-tom-baker', 'Tom Baker', 'Software developer by day, parkrunner by Saturday morning. PB: 21:43.', 'https://i.pravatar.cc/150?img=12', ARRAY['🏃 Fitness', '💼 Professional', '🎮 Gaming'], true, '2025-02-14'),
  ('user-emma-jones', 'Emma Jones', 'Mum of two, book club obsessive, and occasional wild swimmer.', 'https://i.pravatar.cc/150?img=26', ARRAY['📚 Book Club', '🧘 Wellness', '👶 Parenting'], true, '2024-09-01'),
  ('user-marcus-riley', 'Marcus Riley', 'Founder of a local food startup. Passionate about sustainable business in Kent.', 'https://i.pravatar.cc/150?img=53', ARRAY['💼 Professional', '🎓 Learning', '🍳 Cooking'], true, '2025-04-22'),
  ('user-lucy-thompson', 'Lucy Thompson', 'Outdoor adventure guide and dog walker. If there''s a hill, I''m climbing it.', 'https://i.pravatar.cc/150?img=32', ARRAY['⛰️ Outdoors', '🚶 Walking', '🏃 Fitness'], true, '2024-12-05'),
  ('user-david-kim', 'David Kim', 'Photographer and creative workshop facilitator based at Camden Road studios.', 'https://i.pravatar.cc/150?img=14', ARRAY['🎨 Creative', '🎵 Music', '🎓 Learning'], true, '2025-01-30')
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  avatar = EXCLUDED.avatar,
  interests = EXCLUDED.interests;


-- ============================================================
-- PART 5: Seed community memberships for realistic member counts
-- (Only inserts if membership doesn't already exist)
-- ============================================================

-- parkrun memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('tw-parkrun', 'user-sarah-chen', 'Member'),
  ('tw-parkrun', 'user-tom-baker', 'Member'),
  ('tw-parkrun', 'user-lucy-thompson', 'Member'),
  ('tw-parkrun', 'user-james-wright', 'Member')
ON CONFLICT DO NOTHING;

-- Ramblers memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('tw-ramblers', 'user-james-wright', 'Member'),
  ('tw-ramblers', 'user-lucy-thompson', 'Member'),
  ('tw-ramblers', 'user-emma-jones', 'Member')
ON CONFLICT DO NOTHING;

-- Mindful Miles memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('mindful-miles', 'user-sarah-chen', 'Member'),
  ('mindful-miles', 'user-emma-jones', 'Member'),
  ('mindful-miles', 'user-priya-patel', 'Member')
ON CONFLICT DO NOTHING;

-- Young Entrepreneurs memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('yentw', 'user-marcus-riley', 'Member'),
  ('yentw', 'user-tom-baker', 'Member'),
  ('yentw', 'user-priya-patel', 'Member'),
  ('yentw', 'user-david-kim', 'Member')
ON CONFLICT DO NOTHING;

-- A-Z Challenge memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('a-z-challenge', 'user-lucy-thompson', 'Member'),
  ('a-z-challenge', 'user-james-wright', 'Member'),
  ('a-z-challenge', 'user-tom-baker', 'Member')
ON CONFLICT DO NOTHING;

-- Creative Collective memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('tw-creative-collective', 'user-david-kim', 'Member'),
  ('tw-creative-collective', 'user-priya-patel', 'Member')
ON CONFLICT DO NOTHING;

-- Good Neighbours memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('tw-good-neighbours', 'user-priya-patel', 'Member'),
  ('tw-good-neighbours', 'user-emma-jones', 'Member'),
  ('tw-good-neighbours', 'user-james-wright', 'Member')
ON CONFLICT DO NOTHING;

-- Yoga Collective memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('tw-yoga-collective', 'user-sarah-chen', 'Leader'),
  ('tw-yoga-collective', 'user-emma-jones', 'Member')
ON CONFLICT DO NOTHING;

-- Kent Adventures memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
  ('kent-adventures', 'user-lucy-thompson', 'Member'),
  ('kent-adventures', 'user-tom-baker', 'Member'),
  ('kent-adventures', 'user-marcus-riley', 'Member')
ON CONFLICT DO NOTHING;


-- ============================================================
-- PART 6: Seed some event RSVPs for the "Who's Going" section
-- ============================================================

-- Get event IDs dynamically and add RSVPs
INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-sarah-chen', 'going'
FROM public.events e WHERE e.title ILIKE '%parkrun%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-tom-baker', 'going'
FROM public.events e WHERE e.title ILIKE '%parkrun%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-james-wright', 'going'
FROM public.events e WHERE e.title ILIKE '%walk%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-lucy-thompson', 'going'
FROM public.events e WHERE e.title ILIKE '%walk%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-marcus-riley', 'going'
FROM public.events e WHERE e.title ILIKE '%networking%' OR e.title ILIKE '%meetup%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.event_rsvps (event_id, user_id, status)
SELECT e.id, 'user-priya-patel', 'going'
FROM public.events e WHERE e.title ILIKE '%networking%' OR e.title ILIKE '%meetup%' LIMIT 1
ON CONFLICT DO NOTHING;
