import { NextResponse } from 'next/server';

function categorize(title, desc) {
  const text = ((title || '') + ' ' + (desc || '')).toLowerCase();
  if (/axe|skydive|skydiving|outdoor|hike|hiking|climb|climbing|kayak|raft|rafting|bike|cycling|run|running|surf|zip|archery|wind tunnel|adventure|boat|coastal/.test(text)) {
    return '⛰️ Adventure';
  }
  if (/wine|tasting|vineyard|culinary|food|drink|pub|brewery|beer|cooking|gourmet|cheese|tea|dining|cocktail|distillery/.test(text)) {
    return '🍷 Food & Drink';
  }
  if (/spa|wellness|massage|yoga|meditation|retreat|thermal|sauna|relax|mindful|sound bath/.test(text)) {
    return '🧘 Wellness';
  }
  if (/perfume|workshop|pottery|painting|craft|photo|art|design|studio|glass|sculpture/.test(text)) {
    return '🎨 Creative';
  }
  return '🎭 Culture';
}

function formatDuration(d) {
  if (!d) return 'Half Day';
  if (d.fixedDurationInMinutes) {
    const m = d.fixedDurationInMinutes;
    if (m < 60) return `${m} mins`;
    if (m === 60) return '1 hour';
    if (m % 60 === 0) return `${m / 60} hours`;
    return `${(m / 60).toFixed(1)} hours`;
  }
  if (d.variableDurationFromMinutes) {
    const from = Math.round(d.variableDurationFromMinutes / 60);
    const to = Math.round((d.variableDurationToMinutes || d.variableDurationFromMinutes) / 60);
    return from === to ? `${from} hours` : `${from}-${to} hours`;
  }
  return 'Flexible';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Tunbridge Wells';
  const count = Math.min(50, Math.max(1, Number(searchParams.get('count')) || 24));
  const provider = searchParams.get('provider') || 'viator';
  const code = searchParams.get('code');

  const VIATOR_API_KEY = process.env.VIATOR_API_KEY || '041f870e-5641-49c7-a512-865fc512720a';

  try {
    if (provider === 'viator') {
      // Single product lookup
      if (code) {
        const prodRes = await fetch(`https://api.viator.com/partner/products/${code}`, {
          method: 'GET',
          headers: {
            'exp-api-key': VIATOR_API_KEY,
            'Accept': 'application/json;version=2.0',
            'Accept-Language': 'en-GB'
          },
          next: { revalidate: 3600 }
        });

        if (prodRes.ok) {
          const p = await prodRes.json();
          const image = p.images?.[0]?.variants?.find(v => v.width >= 600 && v.width <= 1000)?.url 
            || p.images?.[0]?.variants?.[0]?.url 
            || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80';

          const rating = p.reviews?.combinedAverageRating ? Number(p.reviews.combinedAverageRating.toFixed(1)) : 4.8;
          const reviewsCount = p.reviews?.totalReviews || 12;

          return NextResponse.json({
            status: 'success',
            data: {
              id: p.productCode,
              productCode: p.productCode,
              title: p.title,
              description: p.description || '',
              category: categorize(p.title, p.description),
              basePrice: 35, // default if pricingInfo is per person
              leaderMarkup: 15,
              promotedBy: 'more-community',
              provider: 'Viator',
              duration: formatDuration(p.duration),
              location: 'South East England',
              image,
              rating,
              reviewsCount,
              spotsLeft: 8,
              productUrl: p.productUrl,
              inclusions: p.inclusions || [],
              source: 'Viator'
            }
          });
        }
      }

      // Free text search
      const viatorRes = await fetch('https://api.viator.com/partner/search/freetext', {
        method: 'POST',
        headers: {
          'exp-api-key': VIATOR_API_KEY,
          'Accept': 'application/json;version=2.0',
          'Accept-Language': 'en-GB',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchTerm: query,
          searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: 1, count } }],
          currency: 'GBP'
        }),
        next: { revalidate: 1800 } // Cache for 30 minutes in Next.js
      });

      if (!viatorRes.ok) {
        const errorText = await viatorRes.text();
        console.error('Viator API returned non-200:', viatorRes.status, errorText);
        throw new Error(`Viator API error: ${viatorRes.status}`);
      }

      const viatorData = await viatorRes.json();
      const rawProducts = viatorData.products?.results || [];

      const normalized = rawProducts.map((p, idx) => {
        const image = p.images?.[0]?.variants?.find(v => v.width >= 600 && v.width <= 1000)?.url 
          || p.images?.[0]?.variants?.[0]?.url 
          || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80';

        const basePrice = Math.max(10, Math.round(p.pricing?.summary?.fromPrice || 25));
        const rating = p.reviews?.combinedAverageRating ? Number(p.reviews.combinedAverageRating.toFixed(1)) : 4.8;
        const reviewsCount = p.reviews?.totalReviews || (10 + (idx % 15));

        return {
          id: p.productCode,
          productCode: p.productCode,
          title: p.title,
          description: p.description || '',
          category: categorize(p.title, p.description),
          basePrice,
          leaderMarkup: 15,
          promotedBy: 'more-community',
          provider: 'Viator',
          duration: formatDuration(p.duration),
          location: query ? (query.charAt(0).toUpperCase() + query.slice(1)) : 'Kent & South East',
          image,
          rating,
          reviewsCount,
          spotsLeft: ((idx * 3 + 5) % 10) + 2,
          productUrl: p.productUrl,
          source: 'Viator'
        };
      });

      return NextResponse.json({
        status: 'success',
        query,
        count: normalized.length,
        data: normalized
      });
    }

    if (provider === 'google') {
      let googleResults = [];
      const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let usedApi = false;

      if (GOOGLE_KEY) {
        try {
          const gRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}`, {
            next: { revalidate: 3600 }
          });
          const gData = await gRes.json();
          if (gData.status === 'OK' && gData.results?.length > 0) {
            usedApi = true;
            googleResults = gData.results.map((place, idx) => {
              let photoUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
              if (place.photos?.[0]?.photo_reference) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_KEY}`;
              }
              return {
                id: place.place_id || `google-${idx}`,
                productCode: place.place_id || `google-${idx}`,
                title: place.name,
                description: place.formatted_address || `${place.name} in South East England`,
                category: categorize(place.name, place.types?.join(' ')),
                basePrice: 45,
                leaderMarkup: 15,
                promotedBy: 'more-community',
                provider: 'Google Places',
                duration: '2-3 hours',
                location: place.formatted_address || query,
                image: photoUrl,
                rating: place.rating ? Number(place.rating.toFixed(1)) : 4.7,
                reviewsCount: place.user_ratings_total || 24,
                spotsLeft: 12,
                productUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                source: 'Google Places'
              };
            });
          }
        } catch (e) {
          console.warn("Google Places fetch error, falling back to simulated results:", e.message);
        }
      }

      if (googleResults.length === 0) {
        // Curated high quality local experience results tailored to query
        const cleanQuery = query.trim();
        const isHotelQuery = /hotel|hilton|marriott|resort|inn|stay|spa/i.test(cleanQuery);
        const isDining = /food|dining|restaurant|bistro|cafe|pub|bar|roast|chef/i.test(cleanQuery);
        const isWellness = /spa|wellness|retreat|yoga|massage/i.test(cleanQuery);

        googleResults = [
          {
            id: `gp-${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
            productCode: `GP-${cleanQuery.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-01`,
            title: isHotelQuery ? `${cleanQuery} Executive Lounge & Afternoon Tea` : `${cleanQuery} Experience & Tasting`,
            description: `Exclusive group package at ${cleanQuery}. Includes dedicated host, welcome refreshments, and private member lounge access.`,
            category: isWellness ? '🧘 Wellness' : isDining ? '🍷 Food & Drink' : '🎭 Culture',
            basePrice: 42,
            leaderMarkup: 15,
            promotedBy: 'more-community',
            provider: 'Google Places',
            duration: '2.5 hours',
            location: cleanQuery.includes(',') ? cleanQuery : `${cleanQuery}, South East`,
            image: isHotelQuery 
              ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            rating: 4.8,
            reviewsCount: 142,
            spotsLeft: 10,
            productUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`,
            source: 'Google Places'
          },
          {
            id: `gp-${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}-2`,
            productCode: `GP-${cleanQuery.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-02`,
            title: isHotelQuery ? `${cleanQuery} Spa Day & Thermal Suite Pass` : `${cleanQuery} Private Workshop & Social`,
            description: `Curated community session at ${cleanQuery}. Features full amenity access and reserved networking area.`,
            category: '🧘 Wellness',
            basePrice: 58,
            leaderMarkup: 15,
            promotedBy: 'more-community',
            provider: 'Google Places',
            duration: '3 hours',
            location: cleanQuery.includes(',') ? cleanQuery : `${cleanQuery}, South East`,
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
            rating: 4.9,
            reviewsCount: 88,
            spotsLeft: 6,
            productUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`,
            source: 'Google Places'
          },
          {
            id: `gp-${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}-3`,
            productCode: `GP-${cleanQuery.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-03`,
            title: `${cleanQuery} Rooftop Social & Evening Gathering`,
            description: `Sunset gathering spot for community members at ${cleanQuery}. Includes signature drink voucher and reserved seating.`,
            category: '🍷 Food & Drink',
            basePrice: 28,
            leaderMarkup: 15,
            promotedBy: 'more-community',
            provider: 'Google Places',
            duration: '2 hours',
            location: cleanQuery.includes(',') ? cleanQuery : `${cleanQuery}, South East`,
            image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
            rating: 4.7,
            reviewsCount: 64,
            spotsLeft: 14,
            productUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`,
            source: 'Google Places'
          }
        ];
      }

      return NextResponse.json({
        status: 'success',
        isTestMode: !usedApi,
        query,
        count: googleResults.length,
        data: googleResults
      });
    }

    // Default fallback if unknown provider passed
    return NextResponse.json({
      status: 'success',
      query,
      count: 0,
      data: []
    });

  } catch (error) {
    console.error("Discovery API Error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
