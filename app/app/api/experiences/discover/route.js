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

    return NextResponse.json({ status: 'error', message: 'Invalid provider specified' }, { status: 400 });

  } catch (error) {
    console.error("Discovery API Error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
