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
    aliases: ['heathfield', 'heathfield high street', 'heathfield east sussex', 'mankind heathfield']
  },
  {
    name: 'Heathfield Community Hub, High Street',
    area: 'Heathfield, East Sussex',
    lat: 50.9680,
    lng: 0.2530,
    aliases: ['community hub heathfield', 'heathfield hub', 'high st heathfield']
  },

  // Bewl Water & Surrounds (Visitor Centre & Main Car Park)
  {
    name: 'Bewl Water Car Park & Visitor Centre',
    area: 'Bewlbridge Lane, Lamberhurst TN3 8JH',
    lat: 51.0793,
    lng: 0.3914,
    aliases: [
      'bewl',
      'bewl reservoir',
      'bewl water',
      'bewl water reservoir',
      'bewl water car park',
      'bewl car park',
      'bewl visitor centre',
      'bewl water visitor centre',
      'bewl water / bewl reservoir',
      'bewlbridge lane',
      'lamberhurst'
    ]
  },

  // Coastal / St Leonards & Hastings
  {
    name: 'St Leonards-on-Sea',
    area: 'East Sussex Coast',
    lat: 50.8560,
    lng: 0.5560,
    aliases: [
      'st leonards',
      'st leonards-on-sea',
      'st leonards on sea',
      'ruth breathes',
      'hastings'
    ]
  },

  // Tunbridge Wells Parks & Common
  {
    name: 'Dunorlan Park (Main Car Park)',
    area: 'Pembury Road, Royal Tunbridge Wells TN2 3QA',
    lat: 51.1313,
    lng: 0.2867,
    aliases: ['dunorlan', 'dunorlan park', 'dunorlan park gate', 'dunorlan car park', 'dunorlan cafe', 'dunorlan park (main car park)']
  },
  {
    name: 'Calverley Grounds',
    area: 'Royal Tunbridge Wells TN1 1BT',
    lat: 51.1305,
    lng: 0.2663,
    aliases: ['calverley', 'calverley grounds', 'calverley park']
  },
  {
    name: 'The Pantiles',
    area: 'Royal Tunbridge Wells TN2 5TN',
    lat: 51.1263,
    lng: 0.2577,
    aliases: ['pantiles', 'the pantiles', 'lower pantiles', 'upper pantiles', 'the pantiles tunbridge wells', 'pantiles tunbridge wells']
  },
  {
    name: 'The Pantiles Bandstand',
    area: 'The Pantiles, Royal Tunbridge Wells TN2 5TN',
    lat: 51.1257,
    lng: 0.2573,
    aliases: ['the pantiles bandstand', 'pantiles bandstand', 'bandstand the pantiles']
  },
  {
    name: 'Tunbridge Wells Common',
    area: 'Wellington Rocks, Royal Tunbridge Wells',
    lat: 51.1302,
    lng: 0.2541,
    aliases: ['tw common', 'tunbridge wells common', 'wellington rocks']
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
  },
  {
    name: 'Etchingham, East Sussex',
    area: 'East Sussex',
    lat: 51.0080,
    lng: 0.4400,
    aliases: ['etchingham', 'etchingham east sussex', 'etchingham station']
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
 * Extracts radius in km embedded in a community location string:
 * e.g. "Bewl Water & High Weald [r=6km]" -> 6
 * e.g. "Tunbridge Wells (5km radius)" -> 5
 */
export function parseLocationRadius(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return 4;
  const match = locationStr.match(/\[r=(\d+(?:\.\d+)?)km\]/i) || locationStr.match(/(\d+(?:\.\d+)?)\s*km\s*radius/i);
  if (match) {
    const r = parseFloat(match[1]);
    if (!isNaN(r) && r > 0) return r;
  }
  return 4; // default 4km radius for local communities
}

/**
 * Cleans the human-facing location string by removing internal coordinate and radius tokens.
 * e.g. "Bewl Water Car Park opp. Visitor Centre [r=5km] • @51.07630,0.38750" -> "Bewl Water Car Park opp. Visitor Centre"
 */
export function normalizeCoords(coords) {
  if (!coords) return null;
  if (Array.isArray(coords) && coords.length >= 2) {
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  if (typeof coords === 'object' && coords.lat != null && coords.lng != null) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  return null;
}

export function stripUkPostcode(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    // Full UK postcodes (e.g. TN19 7AG, TN197AG, BN1 1AA, SW1A 1AA)
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, '')
    // Standalone or trailing outward UK postcode prefixes (e.g. TN19, BN21, ME14)
    .replace(/(?:^|[\s,])(?:TN|BN|ME|CT|RH|DA|BR|CR|GU|KT|PO|SM|SE|SW|NW|EC|WC)\d{1,2}[A-Z]?(?=$|[\s,])/gi, ' ')
    .replace(/\s*,\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^,\s*|\s*,\s*$/g, '');
}

export function cleanLocationName(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return '';
  return locationStr
    .replace(/\s*•\s*@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g, '')
    .replace(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g, '')
    .replace(/[\[\(]-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?[\]\)]/g, '')
    .replace(/\b(?:Pinned )?Spot\s*$/i, '')
    .replace(/\s*\[r=\d+(?:\.\d+)?km\]/gi, '')
    .replace(/\s*\(\d+(?:\.\d+)?km\s*radius\)/gi, '')
    .trim()
    .replace(/\s*•\s*$/, '')
    .replace(/,\s*$/, '');
}

/**
 * Formats a location for public sharing, invites, emails, and badges.
 * Strips embedded map coordinates whenever an address/place name exists.
 * If literally NO address exists (e.g. an off-grid pin), returns a Google Maps link or coordinate string.
 */
export function formatShareLocation(locationStr, fallback = '') {
  const clean = cleanLocationName(locationStr);
  if (clean && !/^(?:pinned )?spot$/i.test(clean)) {
    return clean;
  }
  const coords = parseLocationCoords(locationStr);
  if (coords) {
    return `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  }
  return fallback;
}

/**
 * Encodes human name with precise pinpoint coordinates and optional coverage radius.
 */
export function encodeLocationWithCoords(name, lat, lng, radius = null) {
  const clean = cleanLocationName(name);
  if (!clean || !clean.trim()) return '';
  let result = clean.trim();
  if (radius && radius > 0) {
    result += ` [r=${radius}km]`;
  }
  if (lat != null && lng != null) {
    result += ` • @${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
  }
  return result;
}

/**
 * Resolves a clear, human-friendly location display text for a community.
 */
export function getCommunityLocation(comm) {
  if (!comm) return 'Kent & East Sussex';
  const raw = comm.location_name || comm.location || '';
  const cleaned = cleanLocationName(raw);
  const lower = cleaned.toLowerCase();
  if (cleaned && lower !== 'global' && lower !== 'various locations - check events' && lower !== 'various locations') {
    return cleaned;
  }
  if (comm.id === 'ruth-breathes-acut8') return 'St Leonards-on-Sea, East Sussex';
  if (comm.id === 'mankind-heathfield-ymow0') return 'The Community Hub, Heathfield';
  if (comm.id === 'more-shades-of-golden-0rhnh') return 'Heathfield & Cuckoo Trail';
  if (comm.id === 'more-community-walks-qubcx') return 'Bewl Water, Kent & East Sussex';
  if (comm.id === 'more-performance-bresthing-6i2uv') return 'Tunbridge Wells, Kent';
  if (comm.id === 'more-leaders-network') return 'Kent & East Sussex (Regional)';
  return cleaned || 'Tunbridge Wells & surrounding';
}

/**
 * Searches local verified spot registry.
 */
export function searchKnownLocations(query) {
  if (!query || typeof query !== 'string') return [];
  const qLower = cleanLocationName(query).toLowerCase().trim();
  if (qLower.length < 2) return [];
  const matches = [];
  for (const spot of REGIONAL_KNOWN_LOCATIONS) {
    const nameL = spot.name.toLowerCase();
    const areaL = (spot.area || '').toLowerCase();
    const aliasHit = (spot.aliases || []).some((a) => {
      const al = a.toLowerCase();
      return al.includes(qLower) || (qLower.length >= 4 && qLower.includes(al));
    });
    if (nameL.includes(qLower) || areaL.includes(qLower) || aliasHit) {
      matches.push({
        id: `local_${spot.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name: spot.name,
        address: spot.area ? `${spot.name}, ${spot.area}` : spot.name,
        area: spot.area || 'Kent & East Sussex',
        lat: spot.lat,
        lon: spot.lng,
        source: 'local',
      });
    }
  }
  return matches;
}

export function findKnownLocation(query) {
  if (!query || typeof query !== 'string') return null;
  const cleaned = cleanLocationName(query).toLowerCase().trim();
  if (!cleaned) return null;
  const primaryPart = cleaned.split(',')[0].trim();

  // 1. Exact match on full query or primary comma-part (when qualifier is town/county)
  for (const spot of REGIONAL_KNOWN_LOCATIONS) {
    const sName = spot.name.toLowerCase();
    if (cleaned === sName || primaryPart === sName) return spot;
    if (spot.aliases) {
      for (const alias of spot.aliases) {
        const al = alias.toLowerCase();
        if (cleaned === al || primaryPart === al) return spot;
      }
    }
  }

  // 2. Longest-alias substring match (only when query doesn't name a different sub-venue)
  if (cleaned.length >= 4) {
    let bestSpot = null;
    let bestLen = 0;
    for (const spot of REGIONAL_KNOWN_LOCATIONS) {
      const candidates = [spot.name, ...(spot.aliases || [])];
      for (const cand of candidates) {
        const cLow = cand.toLowerCase();
        if (cleaned.includes(cLow) && cLow.length > bestLen) {
          bestSpot = spot;
          bestLen = cLow.length;
        }
      }
    }
    if (bestSpot) return bestSpot;
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

/**
 * Comprehensive Kent & Sussex town, village, landmark & county vocabulary
 * so typing ANY location in Kent or Sussex surfaces surrounding Kent & Sussex results.
 */
export const KENT_AND_SUSSEX_TERMS = [
  // Counties & regions
  'kent', 'sussex', 'east sussex', 'west sussex', 'kent & east sussex', 'kent and east sussex',
  'kent & sussex', 'kent and sussex', 'high weald', 'weald', 'south east',
  // East Sussex towns & villages
  'heathfield', 'etchingham', 'st leonards', 'st leonards-on-sea', 'st leonards on sea',
  'hastings', 'eastbourne', 'brighton', 'hove', 'brighton & hove', 'lewes', 'rye', 'battle',
  'crowborough', 'uckfield', 'bexhill', 'bexhill-on-sea', 'wadhurst', 'mayfield', 'burwash',
  'robertsbridge', 'ticehurst', 'hurst green', 'flimwell', 'forest row', 'hartfield', 'buxted',
  'hailsham', 'polegate', 'seaford', 'newhaven', 'peacehaven', 'herstmonceux', 'ninfield',
  'sedlescombe', 'winchelsea', 'camber', 'ashdown forest', 'cuckoo trail', 'pevensey',
  'ringmer', 'alfriston', 'frant', 'groombridge', 'eridge', 'rotherfield', 'cross in hand',
  'horam', 'hellingly', 'punnetts town', 'broad oak', 'stones cross',
  // Kent towns & villages
  'tunbridge wells', 'royal tunbridge wells', 'tonbridge', 'sevenoaks', 'bewl water', 'bewl',
  'lamberhurst', 'bedgebury', 'goudhurst', 'cranbrook', 'hawkhurst', 'tenterden', 'paddock wood',
  'pembury', 'southborough', 'rusthall', 'penshurst', 'edenbridge', 'westerham', 'maidstone',
  'canterbury', 'ashford', 'folkestone', 'dover', 'dartford', 'deal', 'ramsgate', 'margate',
  'broadstairs', 'whitstable', 'herne bay', 'faversham', 'sittingbourne', 'chatham', 'rochester',
  'gillingham', 'gravesend', 'medway', 'hythe', 'sandwich', 'cranbrook', 'staplehurst',
  'marden', 'headcorn', 'yalding', 'hadlow', 'hildenborough', 'speldhurst', 'langton green',
  'brenchley', 'matfield', 'horsmonden', 'kilndown', 'benenden', 'rolvenden', 'sissinghurst',
  'scotney', 'pantiles', 'dunorlan', 'calverley', 'high rocks', 'broadwater warren',
  // West Sussex towns & villages
  'east grinstead', 'haywards heath', 'burgess hill', 'crawley', 'horsham', 'worthing',
  'chichester', 'arundel', 'bognor', 'bognor regis', 'littlehampton', 'shoreham', 'shoreham-by-sea',
  'steyning', 'petworth', 'midhurst', 'billingshurst', 'pulborough', 'hassocks', 'hurstpierpoint',
  'cuckfield', 'lindfield', 'turners hill', 'copthorne', 'gatwick'
];

const KENT_SUSSEX_POSTCODE_RE = /^(?:tn|bn|me|ct|rh|da)\d{1,2}(?:\s*\d[a-z]{2})?$/i;

const SURROUNDING_AREA_CATCHMENTS = {
  kent_sussex: KENT_AND_SUSSEX_TERMS,
  surrey: [
    'surrey', 'guildford', 'reigate', 'redhill', 'dorking', 'oxted', 'caterham', 'epsom',
    'farnham', 'woking', 'leatherhead', 'godalming', 'haslemere', 'banstead', 'weybridge'
  ],
  london: [
    'london', 'greater london', 'south london', 'east london', 'west london', 'north london',
    'central london', 'croydon', 'bromley', 'greenwich', 'richmond', 'wimbledon', 'clapham'
  ]
};

/**
 * Regional hierarchy mapping for UK county & broad region searches.
 * Enables sponsors (e.g., law firms, clinics, regional brands) to search
 * broad catchments like 'Kent', 'East Sussex', or 'South East' and match all
 * local towns and clubs operating within that region.
 */
export const UK_REGIONAL_CATCHMENTS = {
  'south east': [
    ...KENT_AND_SUSSEX_TERMS,
    ...SURROUNDING_AREA_CATCHMENTS.surrey,
    ...SURROUNDING_AREA_CATCHMENTS.london,
    'regional'
  ],
  'se': [
    ...KENT_AND_SUSSEX_TERMS
  ],
  'kent and sussex': KENT_AND_SUSSEX_TERMS,
  'kent & sussex': KENT_AND_SUSSEX_TERMS,
  'kent': KENT_AND_SUSSEX_TERMS,
  'east sussex': KENT_AND_SUSSEX_TERMS,
  'sussex': KENT_AND_SUSSEX_TERMS,
  'west sussex': KENT_AND_SUSSEX_TERMS,
  'surrey': SURROUNDING_AREA_CATCHMENTS.surrey,
  'london': SURROUNDING_AREA_CATCHMENTS.london
};

/**
 * Detects whether a free-text search query refers to a geographic location
 * (town, village, county, region, or UK postcode) and returns its surrounding area terms.
 */
export function detectSurroundingArea(query) {
  if (!query || typeof query !== 'string') return null;
  const raw = query.trim().toLowerCase();
  if (raw.length < 2) return null;

  // Strip trailing ", uk" / ", england" and normalize "&" / "and"
  const q = raw
    .replace(/,\s*(uk|united kingdom|england)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!q) return null;

  // 1. Kent & Sussex postcode check (e.g. "TN19", "TN19 7AG", "BN1", "ME14")
  if (KENT_SUSSEX_POSTCODE_RE.test(q)) {
    return { area: 'kent_sussex', terms: KENT_AND_SUSSEX_TERMS };
  }

  // 2. Check known area catchments (exact match or whole-word match inside query, e.g. "etchingham, east sussex" or "walks in kent")
  const checkTerms = (terms) =>
    terms.some((term) => {
      if (q === term) return true;
      if (term.length >= 4 && q.includes(term)) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?:^|[\\s,&/-])${escaped}(?:$|[\\s,&/-])`, 'i').test(q);
      }
      return false;
    });

  if (checkTerms(KENT_AND_SUSSEX_TERMS)) {
    return { area: 'kent_sussex', terms: KENT_AND_SUSSEX_TERMS };
  }

  if (checkTerms(SURROUNDING_AREA_CATCHMENTS.surrey)) {
    return { area: 'surrey', terms: [...SURROUNDING_AREA_CATCHMENTS.surrey, ...KENT_AND_SUSSEX_TERMS] };
  }

  if (checkTerms(SURROUNDING_AREA_CATCHMENTS.london)) {
    return { area: 'london', terms: SURROUNDING_AREA_CATCHMENTS.london };
  }

  // 3. Also check REGIONAL_KNOWN_LOCATIONS names/aliases (all are in Kent & Sussex)
  const known = findKnownLocation(q);
  if (known) {
    return { area: 'kent_sussex', terms: KENT_AND_SUSSEX_TERMS };
  }

  return null;
}

/**
 * Returns a match score for a searchable item against a query:
 * - 2: Direct text/location match
 * - 1: Surrounding area match (e.g. user typed "Kent", "Sussex", "Etchingham", "TN19", etc.
 *      and the item is anywhere in Kent & Sussex)
 * - 0: No match
 */
export function getLocationSearchRank(itemSearchText, query) {
  if (!query || !query.trim()) return 2;
  const q = query.trim().toLowerCase();
  const corpus = String(itemSearchText || '').toLowerCase();

  if (corpus.includes(q)) return 2;

  const areaMatch = detectSurroundingArea(q);
  if (areaMatch) {
    if (areaMatch.terms.some((term) => corpus.includes(term))) {
      return 1;
    }
    // Also match Kent & Sussex postcodes inside item corpus (e.g. "TN19 7AG")
    if (areaMatch.area === 'kent_sussex' && /\b(?:tn|bn|me|ct|rh|da)\d{1,2}\b/i.test(corpus)) {
      return 1;
    }
  }

  return 0;
}

/**
 * Returns comprehensive searchable location and regional keywords for a community.
 */
export function getCommunitySearchText(comm) {
  if (!comm) return '';
  const parts = [
    comm.name,
    comm.description,
    comm.category,
    comm.location_name,
    comm.location,
    comm.city,
    comm.county,
    comm.region,
    comm.postcode,
    ...(Array.isArray(comm.tags) ? comm.tags : [])
  ];

  const id = comm.id || '';
  if (id.includes('mankind') || id.includes('heathfield') || id.includes('golden')) {
    parts.push('heathfield', 'east sussex', 'sussex', 'high weald', 'south east', 'se', 'cuckoo trail');
  }
  if (id.includes('walks') || id.includes('bewl')) {
    parts.push('bewl water', 'lamberhurst', 'kent', 'east sussex', 'sussex', 'south east', 'se', 'wadhurst');
  }
  if (id.includes('breathe') || id.includes('ruth') || id.includes('acut8')) {
    parts.push('st leonards', 'st leonards-on-sea', 'hastings', 'east sussex', 'sussex', 'coast', 'south east', 'se');
  }
  if (id.includes('performance') || id.includes('6i2uv') || id.includes('tunbridge')) {
    parts.push('tunbridge wells', 'kent', 'south east', 'se', 'pantiles', 'common');
  }
  if (id.includes('network') || id.includes('leaders')) {
    parts.push('kent', 'east sussex', 'west sussex', 'sussex', 'south east', 'se', 'regional', 'uk', 'global', 'all');
  }

  const locName = ((comm.location_name || comm.location || '')).toLowerCase();
  if (locName.includes('heathfield')) {
    parts.push('east sussex', 'sussex', 'south east', 'high weald');
  }
  if (locName.includes('tunbridge wells') || locName.includes('tonbridge') || locName.includes('sevenoaks')) {
    parts.push('kent', 'south east');
  }
  if (locName.includes('st leonards') || locName.includes('hastings') || locName.includes('eastbourne')) {
    parts.push('east sussex', 'sussex', 'south east', 'coast');
  }
  if (locName.includes('bewl')) {
    parts.push('kent', 'east sussex', 'sussex', 'south east');
  }

  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Intelligent regional & keyword matcher for partner and discovery searches.
 * Handles exact town names, club names, county names, and broad umbrella regions
 * (e.g. 'South East', 'Kent', 'Sussex').
 */
export function matchCommunityLocation(comm, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const searchCorpus = getCommunitySearchText(comm);

  // 1. Direct substring match
  if (searchCorpus.includes(q)) return true;

  // 2. Check catchment expansions (e.g. 'south east', 'kent', 'sussex')
  for (const [region, subTerms] of Object.entries(UK_REGIONAL_CATCHMENTS)) {
    if (q === region || q.includes(region) || region.includes(q)) {
      if (subTerms.some(term => searchCorpus.includes(term))) {
        return true;
      }
    }
  }

  // 3. Multi-word search (every token >= 2 chars must match)
  const tokens = q.split(/\s+/).filter(t => t.length > 1);
  if (tokens.length > 1 && tokens.every(t => searchCorpus.includes(t))) {
    return true;
  }

  return false;
}
