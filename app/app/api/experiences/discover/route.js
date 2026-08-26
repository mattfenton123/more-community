import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Bali';
  const provider = searchParams.get('provider') || 'viator';

  // Check for API Keys in environment variables
  const VIATOR_API_KEY = process.env.VIATOR_API_KEY;
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  try {
    if (provider === 'viator') {
      if (!VIATOR_API_KEY) {
        console.log("No Viator API Key found. Returning test mode data.");
        // Test Mode Fallback Data
        return NextResponse.json({
          status: 'success',
          isTestMode: true,
          data: [
            {
              id: `vtr-${Date.now()}-1`,
              title: `Full-Day Private Tour in ${query}`,
              description: `Discover the hidden gems of ${query} with a certified local guide.`,
              image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
              basePrice: 120,
              category: '⛰️ Adventure',
              duration: '8 Hours',
              rating: '4.9 (128 reviews)',
              source: 'Viator'
            },
            {
              id: `vtr-${Date.now()}-2`,
              title: `Culinary Experience & Tasting in ${query}`,
              description: `A highly-rated food tour exploring the best local flavors.`,
              image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
              basePrice: 65,
              category: '🍷 Food & Drink',
              duration: '3 Hours',
              rating: '4.8 (85 reviews)',
              source: 'Viator'
            }
          ]
        });
      }

      // If key exists, we would make the actual fetch call to Viator:
      // const res = await fetch('https://api.viator.com/partner/search/freetext', {
      //   method: 'POST',
      //   headers: { 'exp-api-key': VIATOR_API_KEY, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ searchTerm: query })
      // });
      // const data = await res.json();
      // ... parse and normalize data ...
      
      return NextResponse.json({ status: 'error', message: 'Live Viator integration requires implementation based on schema.' }, { status: 501 });
      
    } else if (provider === 'google') {
      if (!GOOGLE_PLACES_API_KEY) {
         // Test Mode Fallback Data
         return NextResponse.json({
           status: 'success',
           isTestMode: true,
           data: [
             {
               id: `gpl-${Date.now()}-1`,
               title: `Popular Local Spot in ${query}`,
               description: `A highly rated local attraction in ${query}.`,
               image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
               basePrice: 45,
               category: '🎭 Culture',
               duration: '2 Hours',
               rating: '5.0 (42 reviews)',
               source: 'Google Places'
             }
           ]
         });
      }
      
      return NextResponse.json({ status: 'error', message: 'Live Google Places integration requires implementation.' }, { status: 501 });
    }

    return NextResponse.json({ status: 'error', message: 'Invalid provider specified' }, { status: 400 });

  } catch (error) {
    console.error("Discovery API Error:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
