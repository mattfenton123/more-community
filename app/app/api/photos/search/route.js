import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// High-quality curated fallback library for instant zero-latency loading
const CURATED_LIBRARY = [
  // Mountains, Hiking & Walking
  { id: 'cur-1', category: 'Outdoor & Hiking', label: 'Ben Nevis & Scottish Highlands', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-2', category: 'Outdoor & Hiking', label: 'Snowdonia Mountain Summit', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-3', category: 'Outdoor & Hiking', label: 'Lake District Ridge Walk', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-4', category: 'Outdoor & Hiking', label: 'Misty Woodland Pine Trail', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-5', category: 'Outdoor & Hiking', label: 'Coastal Cliff Path Hike', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', source: 'Unsplash' },

  // Running & Fitness
  { id: 'cur-6', category: 'Running & Fitness', label: 'Morning Trail Runners', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-7', category: 'Running & Fitness', label: 'Community Track Session', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-8', category: 'Running & Fitness', label: 'Outdoor Calisthenics & Fitness', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80', source: 'Unsplash' },

  // Wellness & Yoga
  { id: 'cur-9', category: 'Wellness & Yoga', label: 'Sunrise Yoga in the Park', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-10', category: 'Wellness & Yoga', label: 'Breathwork & Mindfulness', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-11', category: 'Wellness & Yoga', label: 'Forest Sound Bath & Relaxation', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1600&q=80', source: 'Unsplash' },

  // Dogs & Pets
  { id: 'cur-12', category: 'Dogs & Pets', label: 'Social Dog Walk in Meadow', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-13', category: 'Dogs & Pets', label: 'Golden Retriever Park Meetup', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-14', category: 'Dogs & Pets', label: 'Woodland Puppy Group Play', url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1600&q=80', source: 'Unsplash' },

  // Cafe, Food & Social
  { id: 'cur-15', category: 'Cafe & Social', label: 'Artisan Coffee Roastery & Brunch', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-16', category: 'Cafe & Social', label: 'Community Long Table Lunch', url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-17', category: 'Cafe & Social', label: 'Fresh Sourdough & Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80', source: 'Unsplash' },

  // Creative & Craft
  { id: 'cur-18', category: 'Creative & Craft', label: 'Ceramics & Wheel Pottery Workshop', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-19', category: 'Creative & Craft', label: 'Watercolour Painting & Art Class', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-20', category: 'Creative & Craft', label: 'Woodcraft & Makers Studio', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1600&q=80', source: 'Unsplash' },

  // Books & Culture
  { id: 'cur-21', category: 'Books & Culture', label: 'Cosy Evening Book Club Gathering', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&q=80', source: 'Unsplash' },
  { id: 'cur-22', category: 'Books & Culture', label: 'Acoustic Guitar & Open Mic', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&q=80', source: 'Unsplash' },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || 'All').trim();

    let combinedResults = [];

    // 1. If an official Unsplash Access Key is present, query Unsplash API directly
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey && query) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashKey}`,
              'Accept-Version': 'v1'
            },
            next: { revalidate: 3600 }
          }
        );
        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          if (Array.isArray(unsplashData.results)) {
            const unsplashItems = unsplashData.results.map(photo => ({
              id: `unsplash-${photo.id}`,
              label: photo.description || photo.alt_description || query,
              url: photo.urls.regular || photo.urls.full,
              thumb: photo.urls.small || photo.urls.thumb,
              category: 'Unsplash',
              source: 'Unsplash',
              author: photo.user?.name || 'Unsplash Photographer'
            }));
            combinedResults.push(...unsplashItems);
          }
        }
      } catch (err) {
        console.warn('Unsplash API fetch error:', err.message);
      }
    }

    // 2. Query Wikimedia Commons API (covers Ben Nevis, Snowdon, UK trails, towns, sports, landmarks)
    if (query) {
      try {
        const cleanQuery = encodeURIComponent(query);
        const wikiRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${cleanQuery}&gsrlimit=24&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1200&format=json`,
          {
            headers: {
              'User-Agent': 'MoreCommunityApp/1.0 (contact@morecommunity.app)'
            },
            next: { revalidate: 86400 }
          }
        );

        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const pages = Object.values(wikiData.query?.pages || {});
          pages.forEach(p => {
            const info = p.imageinfo?.[0];
            if (info && (info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp')) {
              const width = info.width || 1200;
              if (width >= 600) {
                const cleanTitle = p.title
                  .replace(/^File:/i, '')
                  .replace(/\.[^/.]+$/, '')
                  .replace(/[-_]/g, ' ')
                  .trim();

                const authorName = info.extmetadata?.Artist?.value?.replace(/<[^>]*>?/gm, '').trim() || 'Contributor';

                combinedResults.push({
                  id: `wiki-${p.pageid}`,
                  label: cleanTitle,
                  url: info.thumburl || info.url,
                  thumb: info.thumburl || info.url,
                  fullUrl: info.url,
                  category: 'High-Res Photo',
                  source: 'Wikimedia Commons (Public Domain / CC)',
                  author: authorName
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn('Wikimedia API fetch error:', err.message);
      }
    }

    // 3. Match against curated library
    const qLower = query.toLowerCase();
    const curatedMatches = CURATED_LIBRARY.filter(item => {
      if (category !== 'All' && item.category !== category) return false;
      if (!query) return true;
      return item.label.toLowerCase().includes(qLower) || item.category.toLowerCase().includes(qLower);
    });

    // Merge: place exact search results first, followed by curated matches
    const allPhotos = [...combinedResults, ...curatedMatches];

    // Deduplicate by URL
    const seen = new Set();
    const uniquePhotos = allPhotos.filter(photo => {
      if (!photo.url || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });

    return NextResponse.json({
      success: true,
      query,
      count: uniquePhotos.length,
      photos: uniquePhotos
    });
  } catch (error) {
    console.error('Photo search API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      photos: CURATED_LIBRARY
    }, { status: 500 });
  }
}
