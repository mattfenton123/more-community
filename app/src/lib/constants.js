export const LAUNCH_CITY = 'Tunbridge Wells';
export const LAUNCH_LOCATION_DISPLAY = 'Tunbridge Wells, UK';

export const FALLBACK_IMAGES = {
  community: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
  user: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&q=80',
  event: 'https://images.unsplash.com/photo-1523580494112-071dcb849be5?w=800&q=80',
  general: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80'
};

export const initialExperiences = [
  {
    id: 'exp-venue-1',
    title: 'The Pantiles Historic Meeting Loft & Studio',
    description: 'Bright open-plan loft overlooking The Pantiles. Perfect for community AGMs, creative planning sessions, board game socials, and workshops. High-speed fibre WiFi, 4K projector, and tea/coffee station included.',
    category: '🏛️ Venues & Halls',
    basePrice: 40,
    priceUnit: 'per hour',
    leaderMarkup: 10,
    capacity: 'Up to 45 people',
    amenities: ['4K Projector', 'Fibre WiFi', 'Kitchenette', 'Coffee Bar', 'Natural Light'],
    promotedBy: 'more-leaders-network',
    provider: 'Pantiles Creative Studios',
    duration: 'Hourly / Half Day',
    location: 'The Pantiles, Tunbridge Wells',
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
    rating: 4.95,
    spotsLeft: 8
  },
  {
    id: 'exp-venue-2',
    title: 'High Weald Community Village Hall & Garden',
    description: 'Charming character hall with sprung wooden floor, stage, and private lawn garden. Ideal for yoga retreats, dance groups, community meals, and craft fairs. Full commercial kitchen on site.',
    category: '🏛️ Venues & Halls',
    basePrice: 32,
    priceUnit: 'per hour',
    leaderMarkup: 10,
    capacity: 'Up to 90 people',
    amenities: ['Commercial Kitchen', 'Private Garden', 'Free Parking', 'Accessible', 'PA Sound System'],
    promotedBy: 'more-leaders-network',
    provider: 'High Weald Community Trust',
    duration: 'Hourly / Full Day',
    location: 'High Weald, Kent',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    rating: 4.88,
    spotsLeft: 12
  },
  {
    id: 'exp-retreat-1',
    title: 'Bewl Water Lakeside Boathouse Retreat & Bunkhouse',
    description: 'Exclusive lakeside retreat lodge with private deck and wood-fired sauna. Ideal for weekend community team escapes, wild swimming clubs, and walking groups. Direct water access and trail loops.',
    category: '🏡 Retreats & Stays',
    basePrice: 135,
    priceUnit: 'per night',
    leaderMarkup: 10,
    capacity: 'Up to 24 guests',
    amenities: ['Lakeside Deck', 'Wood Sauna', 'Campfire Circle', 'Fitted Kitchen', 'Water Sports Gear'],
    promotedBy: 'c_tw_ramblers',
    provider: 'Bewl Water Outdoor Retreats',
    duration: '2 Nights (Weekend)',
    location: 'Bewl Water, Lamberhurst',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    rating: 4.97,
    spotsLeft: 6
  },
  {
    id: 'exp-retreat-2',
    title: 'Bedgebury Pine Forest Cabin & Wellness Hideaway',
    description: 'Secluded pine cabins nestled right on the fringe of Bedgebury Pinetum. Includes open-air hot tub, yoga deck among the pines, communal cooking hearth, and lockable mountain bike storage.',
    category: '🏡 Retreats & Stays',
    basePrice: 150,
    priceUnit: 'per night',
    leaderMarkup: 10,
    capacity: 'Up to 18 guests',
    amenities: ['Forest Trails', 'Outdoor Hot Tub', 'Yoga Deck', 'Log Burners', 'Bike Wash & Lockup'],
    promotedBy: 'c_mindful_miles',
    provider: 'Bedgebury Escapes',
    duration: '1-3 Nights',
    location: 'Bedgebury Forest, Goudhurst',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    rating: 4.92,
    spotsLeft: 5
  },

  {
    id: 'exp1',
    title: 'Tandem Skydive over the Kent Coast',
    description: 'Experience the ultimate thrill with a 15,000ft tandem skydive overlooking the white cliffs. Full training, equipment and post-jump certificate included.',
    category: '⛰️ Adventure',
    basePrice: 199,
    leaderMarkup: 15,
    promotedBy: 'kent-adventures',
    provider: 'SkyHigh Adventures',
    duration: '1 day',
    location: 'Headcorn Aerodrome, Kent',
    image: '/images/communities/parkrun.webp',
    rating: 4.9,
    spotsLeft: 6
  },
  {
    id: 'exp2',
    title: 'Spa & Wellness Retreat Day',
    description: 'A full day of relaxation including hot stone massage, facial treatment, sauna access, healthy lunch and guided meditation session.',
    category: '🧘 Wellness',
    basePrice: 85,
    leaderMarkup: 10,
    promotedBy: 'tw-yoga-collective',
    provider: 'The Pantiles Spa',
    duration: '1 day',
    location: 'Tunbridge Wells',
    image: '/images/communities/gallery-running-1.webp',
    rating: 4.8,
    spotsLeft: 12
  },
  {
    id: 'exp3',
    title: 'West End Theatre Night  -  Hamilton',
    description: 'Premium stalls tickets to Hamilton at the Victoria Palace Theatre. Includes pre-show dinner at a nearby restaurant and group transport from TW.',
    category: '🎭 Culture',
    basePrice: 120,
    leaderMarkup: 12,
    promotedBy: 'tw-creative-collective',
    provider: 'More Experiences',
    duration: '1 evening',
    location: 'London West End',
    image: '/images/communities/parkrun.webp',
    rating: 4.9,
    spotsLeft: 8
  },
  {
    id: 'exp4',
    title: 'Kent Vineyard Wine Tasting',
    description: 'Tour a local award-winning vineyard, learn about English sparkling wine production, and enjoy a guided tasting of 6 wines with artisan cheese board.',
    category: '🍷 Food & Drink',
    basePrice: 55,
    leaderMarkup: 18,
    promotedBy: 'mindful-miles',
    provider: 'Chapel Down Vineyard',
    duration: '1 afternoon',
    location: 'Tenterden, Kent',
    image: '/images/communities/gallery-running-1.webp',
    rating: 4.7,
    spotsLeft: 15
  },
  {
    id: 'exp5',
    title: 'Coasteering Adventure  -  Eastbourne',
    description: 'Leap from cliffs, swim through caves and explore the dramatic chalk coastline. All safety equipment and qualified instructors provided.',
    category: '⛰️ Adventure',
    basePrice: 65,
    leaderMarkup: 15,
    promotedBy: 'kent-adventures',
    provider: 'Buzz Active',
    duration: '1 day',
    location: 'Eastbourne, East Sussex',
    image: '/images/communities/parkrun.webp',
    rating: 4.6,
    spotsLeft: 10
  },
  {
    id: 'exp6',
    title: 'Pottery & Ceramics Workshop',
    description: 'Spend a relaxing day learning wheel-throwing and hand-building techniques. Take home your own fired and glazed creations. All materials included.',
    category: '🎨 Creative',
    basePrice: 75,
    leaderMarkup: 10,
    promotedBy: 'tw-creative-collective',
    provider: 'TW Clay Studio',
    duration: '1 day',
    location: 'Tunbridge Wells',
    image: '/images/communities/gallery-running-1.webp',
    rating: 4.8,
    spotsLeft: 4
  }
];

export const COMMUNITY_TAG_CATEGORIES = {
  'Sports & Fitness': [
    '⚽ Sports', '🏃 Running', '🚶 Walking', '🐕 Dog Walking', '🚴 Cycling', '🎾 Tennis & Padel',
    '🏊 Swimming', '🧗 Climbing & Bouldering', '🏋️ Fitness & Gym', '🧘 Yoga & Pilates',
    '🥊 Boxing & Martial Arts', '🏄 Watersports', '⛳ Golf', '🛹 Skate & Roller', '🥾 Hiking'
  ],
  'Social & Lifestyle': [
    '☕ Coffee & Chat', '🍻 Social Drinks', '🐕 Dog Walking', '🐶 Dog Walkers', '🍷 Food & Drink', '🍳 Cooking & Baking',
    '👶 Parenting & Families', '🤝 Volunteering', '💬 Discussion & Debates',
    '🏳️‍🌈 LGBTQ+', '🌱 Vegan & Plant-Based', '✨ Mindfulness & Meditation', '🌟 Chill Vibes'
  ],
  'Arts & Creative': [
    '🎨 Creative & Art', '✂️ Arts & Crafts', '📸 Photography', '🧶 Knitting & Sewing',
    '🏺 Pottery & Ceramics', '📝 Creative Writing', '📚 Book Club', '🎭 Theatre & Drama',
    '🎵 Music & Jamming', '🎤 Choir & Singing', '💃 Dance & Movement'
  ],
  'Outdoors & Nature': [
    '⛰️ Adventure', '🌲 Trails & Woodlands', '🐕 Dog Walking', '🏕️ Camping', '🌱 Gardening',
    '🌊 Wild Swimming', '🎣 Angling & Fishing', '🦅 Birdwatching', '🌿 Ecology & Nature'
  ],
  'Tech, Games & Learning': [
    '💻 Tech & Coding', '🎮 Video Gaming', '🎲 Board Games', '♟️ Chess',
    '💼 Business & Networking', '🚀 Startups & Founders', '🎓 Learning & Skills',
    '🌍 Language Exchange', '🔬 Science & Nature', '🪙 Finance & Investing'
  ]
};

export const ALL_COMMUNITY_TAGS = Array.from(new Set(Object.values(COMMUNITY_TAG_CATEGORIES).flat()));
