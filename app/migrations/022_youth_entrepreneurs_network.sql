-- Migration 022: Add The Youth Entrepreneurs Network and its Friday 29 January 2027 Launch Meetup
-- Run this in the Supabase SQL Editor for project xasaxxjxxkdruuqbrcmf

INSERT INTO public.communities (
  id,
  name,
  description,
  category,
  tags,
  image,
  cover_image,
  lat,
  lng,
  location_name,
  target_audience,
  cost,
  activity_level,
  verified,
  is_private,
  visibility,
  require_approval,
  leader_id,
  guidelines,
  gallery_photos,
  highlights,
  external_links
)
VALUES (
  'the-youth-entrepreneurs-network',
  'The Youth Entrepreneurs Network',
  'A Tunbridge Wells community connecting young founders, builders, freelancers, creators, and aspiring entrepreneurs. Regular in-person meetups, honest peer support, and practical collaboration across Tunbridge Wells.',
  '💼 Business',
  ARRAY[
    '💼 Business',
    '🚀 Startups & Founders',
    '🎓 Learning & Skills',
    '☕ Coffee & Chat'
  ]::text[],
  '/images/communities/entrepreneurs.webp',
  '/images/communities/entrepreneurs.webp',
  51.1266,
  0.2583,
  'The Buzz on The Pantiles, Tunbridge Wells [r=15km] • @51.12660,0.25830',
  'Young founders, creators, solo builders & aspiring entrepreneurs in Tunbridge Wells',
  'Free',
  'Active',
  true,
  false,
  'public',
  false,
  'a31edbf0-db87-4a32-b108-c13d365adbf8',
  '[
    "Come ready to share openly, support others building locally, and make genuine connections.",
    "No cold pitching or spam: keep conversations helpful, welcoming, and practical.",
    "Please update your RSVP if your plans change so others know who is coming."
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  image = EXCLUDED.image,
  cover_image = EXCLUDED.cover_image,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  location_name = EXCLUDED.location_name,
  target_audience = EXCLUDED.target_audience,
  cost = EXCLUDED.cost,
  activity_level = EXCLUDED.activity_level,
  verified = EXCLUDED.verified,
  is_private = EXCLUDED.is_private,
  visibility = EXCLUDED.visibility,
  leader_id = EXCLUDED.leader_id,
  guidelines = EXCLUDED.guidelines;

INSERT INTO public.community_memberships (community_id, user_id, role)
SELECT 'the-youth-entrepreneurs-network', v.user_id, v.role
FROM (
  VALUES
    ('a31edbf0-db87-4a32-b108-c13d365adbf8', 'Leader'),
    ('d5293cb2-b334-46a5-8d11-d2dc29bb98de', 'Co-Leader')
) AS v(user_id, role)
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = v.user_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = 'the-youth-entrepreneurs-network'
      AND cm.user_id = v.user_id
  );

INSERT INTO public.events (
  id,
  community_id,
  title,
  date,
  time,
  location,
  image,
  description,
  status,
  attendees,
  max_capacity,
  ticket_price,
  cohost_community_ids
)
VALUES (
  'f5c3a8d4-29b1-5e70-9c44-8f31b2027129',
  'the-youth-entrepreneurs-network',
  'The Youth Entrepreneurs Network Launch Meetup',
  '2027-01-29',
  '12:00',
  'The Buzz on The Pantiles, 12-16 The Pantiles, Tunbridge Wells [r=15km] • @51.12660,0.25830',
  '/images/communities/entrepreneurs.webp',
  'Join us at 12:00 PM on Friday 29th January at The Buzz on The Pantiles for the launch of The Youth Entrepreneurs Network in Tunbridge Wells. Drop in for a relaxed lunchtime coffee, meet fellow young founders, builders, and creatives, share what you are working on, and help shape our monthly meetups.',
  'published',
  0,
  NULL,
  0.0,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  community_id = EXCLUDED.community_id,
  title = EXCLUDED.title,
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  location = EXCLUDED.location,
  image = EXCLUDED.image,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  ticket_price = EXCLUDED.ticket_price;
