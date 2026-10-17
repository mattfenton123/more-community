/**
 * Shared Geographic & Location Utilities for More Community
 * Provides verified coordinates, parsing, geocoding, and map utilities.
 */

export const DEFAULT_TW_CENTER = [51.1322, 0.2637];
export const DEFAULT_REGION_CENTER = [51.0800, 0.3000];

export const REGIONAL_KNOWN_LOCATIONS = [
  // Cuckoo Trail & Heathfield
  {
    name: 'Cuckoo Trail Car Park, Heathfield',
    area: 'Heathfield, East Sussex',
    lat: 50.9685,
    lng: 0.2520,
    aliases: [
      'cuckoo trail',
      'cuckoo trail car park',
      'cuckoo trail heathfield',
      'cuckoo',
      'waitrose heathfield',
      'heathfield walk',
      'station road heathfield'
    ]
  },
  {
    name: 'Heathfield, East Sussex',
    area: 'East Sussex',
    lat: 50.9680,
    lng: 0.2530,
    aliases: ['heathfield', 'heathfield high street', 'heathfield east sussex']
  },

  // Bewl Water & Surrounds
  {
    name: 'Bewl Water / Bewl Reservoir',
    area: 'Lamberhurst / Wadhurst',
    lat: 51.0676,
    lng: 0.4049,
    aliases: [
      'bewl',
      'bewl reservoir',
      'bewl water',
      'bewl water reservoir',
      'bewl water visitor centre',
      'lamberhurst'
    ]
  },

  // Tunbridge Wells Parks & Common
  {
    name: 'Dunorlan Park',
    area: 'Tunbridge Wells',
    lat: 51.1345,
    lng: 0.2710,
    aliases: ['dunorlan', 'dunorlan park', 'dunorlan park gate', 'dunorlan cafe']
  },
  {
    name: 'Calverley Grounds',
    area: 'Tunbridge Wells',
    lat: 51.1355,
    lng: 0.2605,
    aliases: ['calverley', 'calverley grounds', 'calverley park']
  },
  {
    name: 'The Pantiles',
    area: 'Tunbridge Wells',
    lat: 51.1280,
    lng: 0.2620,
    aliases: ['pantiles', 'the pantiles', 'lower pantiles', 'upper pantiles', 'bandstand']
  },
  {
    name: 'Tunbridge Wells Common',
    area: 'Tunbridge Wells',
    lat: 51.1315,
    lng: 0.2550,
    aliases: ['tw common', 'common', 'tunbridge wells common', 'wellington rocks']
  },
  {
    name: 'Grosvenor & Hilbert Park',
    area: 'Tunbridge Wells',
    lat: 51.1280,
    lng: 0.2680,
    aliases: ['hilbert', 'grosvenor park', 'grosvenor & hilbert', 'hilbert woods']
  },
  {
    name: 'St Johns Park',
    area: 'Tunbridge Wells',
    lat: 51.1370,
    lng: 0.2560,
    aliases: ['st johns', 'st johns park', 'st john\'s']
  },
  {
    name: 'Hawkenbury Recreation Ground',
    area: 'Tunbridge Wells',
    lat: 51.1400,
    lng: 0.2770,
    aliases: ['hawkenbury', 'hawkenbury rec']
  },

  // Culture & Social Venues
  {
    name: 'The Forum',
    area: 'Tunbridge Wells Common',
    lat: 51.1310,
    lng: 0.2650,
    aliases: ['forum', 'the forum', 'the forum tw']
  },
  {
    name: 'Trinity Theatre & Arts Centre',
    area: 'Tunbridge Wells',
    lat: 51.1315,
    lng: 0.2640,
    aliases: ['trinity', 'trinity theatre', 'trinity arts centre']
  },
  {
    name: 'Assembly Hall Theatre',
    area: 'Tunbridge Wells',
    lat: 51.1340,
    lng: 0.2625,
    aliases: ['assembly hall', 'the assembly hall', 'assembly hall theatre']
  },
  {
    name: 'Camden Road',
    area: 'Tunbridge Wells',
    lat: 51.1330,
    lng: 0.2630,
    aliases: ['camden rd', 'camden road']
  },
  {
    name: 'High Street, Tunbridge Wells',
    area: 'Tunbridge Wells',
    lat: 51.1295,
    lng: 0.2615,
    aliases: ['high street', 'tw high street', 'chapel place']
  },
  {
    name: 'The Beacon',
    area: 'Rusthall / Tunbridge Wells',
    lat: 51.1410,
    lng: 0.2410,
    aliases: ['the beacon', 'beacon', 'tea garden lane']
  },

  // Country Parks, Forests & Castles
  {
    name: 'Bedgebury National Pinetum & Forest',
    area: 'Goudhurst / Kent',
    lat: 51.0827,
    lng: 0.4578,
    aliases: ['bedgebury', 'pinetum', 'bedgebury forest', 'bedgebury pinetum']
  },
  {
    name: 'Haysden Country Park',
    area: 'Tonbridge',
    lat: 51.1895,
    lng: 0.2520,
    aliases: ['haysden', 'haysden park', 'haysden country park']
  },
  {
    name: 'Tonbridge Castle',
    area: 'Tonbridge',
    lat: 51.1965,
    lng: 0.2740,
    aliases: ['tonbridge castle', 'tonbridge']
  },
  {
    name: 'Penshurst Place',
    area: 'Penshurst',
    lat: 51.1744,
    lng: 0.1828,
    aliases: ['penshurst', 'penshurst place']
  },
  {
    name: 'Kingdom (Penshurst)',
    area: 'Penshurst',
    lat: 51.1685,
    lng: 0.1795,
    aliases: ['kingdom', 'kingdom penshurst']
  },
  {
    name: 'Groombridge Place',
    area: 'Groombridge',
    lat: 51.1189,
    lng: 0.1878,
    aliases: ['groombridge', 'groombridge place']
  },
  {
    name: 'Eridge Rocks',
    area: 'Eridge Green',
    lat: 51.1039,
    lng: 0.2078,
    aliases: ['eridge', 'eridge rocks', 'eridge green']
  },
  {
    name: 'Harrison\'s Rocks',
    area: 'Groombridge',
    lat: 51.1011,
    lng: 0.1972,
    aliases: ['harrisons rocks', 'harrison rocks', 'harrisons']
  },
  {
    name: 'High Rocks',
    area: 'Tunbridge Wells',
    lat: 51.1278,
    lng: 0.2319,
    aliases: ['high rocks']
  },
  {
    name: 'Scotney Castle',
    area: 'Lamberhurst',
    lat: 51.0931,
    lng: 0.4069,
    aliases: ['scotney', 'scotney castle']
  },
  {
    name: 'Ashdown Forest',
    area: 'East Sussex',
    lat: 51.0667,
    lng: 0.0667,
    aliases: ['ashdown', 'ashdown forest', 'pooh corner', 'hartfield']
  },
  {
    name: 'Broadwater Warren',
    area: 'Groombridge',
    lat: 51.1095,
    lng: 0.2480,
    aliases: ['broadwater', 'broadwater warren', 'rspb broadwater warren']
  },
  {
    name: 'Southborough Common',
    area: 'Southborough',
    lat: 51.1578,
    lng: 0.2742,
    aliases: ['southborough', 'southborough common']
  },
  {
    name: 'Rusthall Common',
    area: 'Rusthall',
    lat: 51.1390,
    lng: 0.2310,
    aliases: ['rusthall', 'rusthall common', 'toad rock']
  },
  {
    name: 'Crowborough, East Sussex',
    area: 'Crowborough',
    lat: 51.0550,
    lng: 0.1600,
    aliases: ['crowborough', 'goldsmiths center']
  },
  {
    name: 'Mayfield, East Sussex',
    area: 'Mayfield',
    lat: 51.0200,
    lng: 0.2600,
    aliases: ['mayfield', 'mayfield village']
  },
  {
    name: 'Wadhurst, East Sussex',
    area: 'Wadhurst',
    lat: 51.0620,
    lng: 0.3400,
    aliases: ['wadhurst']
  }
];

/**
 * Extracts coordinates embedded in a location string:
 * e.g. "Cuckoo Trail Car Park • @50.96850,0.25200" -> { lat: 50.9685, lng: 0.252 }
 * e.g. "Dunorlan Park [51.1345, 0.2710]" -> { lat: 51.1345, lng: 0.271 }
 */
export function parseLocationCoords(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return null;

  // Match @lat,lng format
  const atMatch = locationStr.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match [lat, lng] or (lat, lng)
  const bracketMatch = locationStr.match(/[\[\(](-?\d+\.\d+),\s*(-?\d+\.\d+)[\]\)]/);
  if (bracketMatch) {
    const lat = parseFloat(bracketMatch[1]);
    const lng = parseFloat(bracketMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

/**
 * Cleans the human-facing location string by removing internal coordinate tokens.
 * e.g. "Cuckoo Trail Car Park opp. Waitrose • @50.96850,0.25200" -> "Cuckoo Trail Car Park opp. Waitrose"
 */
export function cleanLocationName(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return '';
  return locationStr
    .replace(/\s*•\s*@(-?\d+\.\d+),\s*(-?\d+\.\d+)/g, '')
    .replace(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/g, '')
    .replace(/[\[\(]-?\d+\.\d+,\s*-?\d+\.\d+[\]\)]/g, '')
    .trim()
    .replace(/\s*•\s*$/, '');
}

/**
 * Encodes human name with precise pinpoint coordinates.
 */
export function encodeLocationWithCoords(name, lat, lng) {
  const clean = cleanLocationName(name) || 'Selected Location';
  if (lat == null || lng == null) return clean;
  return `${clean} • @${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

/**
 * Searches local verified spot registry.
 */
export function findKnownLocation(query) {
  if (!query || typeof query !== 'string') return null;
  const qLower = query.toLowerCase().trim();

  // Try exact alias match or substring containment
  for (const spot of REGIONAL_KNOWN_LOCATIONS) {
    if (spot.name.toLowerCase() === qLower) return spot;
    if (qLower.includes(spot.name.toLowerCase())) return spot;

    if (spot.aliases) {
      for (const alias of spot.aliases) {
        if (qLower === alias || qLower.includes(alias) || alias.includes(qLower)) {
          return spot;
        }
      }
    }
  }

  return null;
}

// In-memory geocode cache to prevent redundant OSM queries
const geocodeCache = new Map();

/**
 * Robust geocoding: handles exact coordinates, known spots, and smart OSM queries.
 */
export async function geocodeLocation(query, options = {}) {
  if (!query || typeof query !== 'string') return { lat: DEFAULT_TW_CENTER[0], lng: DEFAULT_TW_CENTER[1] };

  // 1. Check embedded coordinates
  const parsed = parseLocationCoords(query);
  if (parsed) return parsed;

  const cleanQuery = cleanLocationName(query);

  // 2. Check known spots registry
  const known = findKnownLocation(cleanQuery);
  if (known) return { lat: known.lat, lng: known.lng, name: known.name, area: known.area };

  // 3. Check memory cache
  const cacheKey = cleanQuery.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 4. Clean search term for OpenStreetMap Nominatim
  // Remove noisy prepositions that confuse geocoders (e.g. "opp. Waitrose", "gate 2", "car park opp.")
  const normalized = cleanQuery
    .replace(/\bopp\.?\b/gi, '')
    .replace(/\bopposite\b/gi, '')
    .replace(/\bnext to\b/gi, '')
    .replace(/\bnear\b/gi, '')
    .replace(/\bby\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const candidates = [
    cleanQuery,
    normalized !== cleanQuery ? normalized : null,
    !cleanQuery.toLowerCase().includes('uk') ? `${normalized}, UK` : null
  ].filter(Boolean);

  for (const cand of candidates) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cand)}&viewbox=-0.3,51.45,0.8,50.85&bounded=0&limit=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: options.signal
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      // Aborted or network error, continue to fallback
    }
  }

  // 5. Fallback to Tunbridge Wells center
  const fallback = { lat: DEFAULT_TW_CENTER[0], lng: DEFAULT_TW_CENTER[1] };
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}
