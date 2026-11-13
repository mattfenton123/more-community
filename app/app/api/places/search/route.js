import { NextResponse } from 'next/server';

const UA = 'MoreCommunityApp/1.0 (https://www.morecommunity.app)';
const CACHE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map();

function getCached(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  if (searchCache.size > 250) {
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(key, { ts: Date.now(), data });
}

function formatOsmAddress(addr = {}, fallbackName = '') {
  const streetPart = [addr.house_number, addr.road || addr.pedestrian || addr.footway || addr.path]
    .filter(Boolean)
    .join(' ')
    .trim();
  const primary =
    addr.tourism ||
    addr.amenity ||
    addr.leisure ||
    addr.shop ||
    addr.historic ||
    addr.building ||
    addr.attraction ||
    streetPart ||
    addr.neighbourhood ||
    addr.suburb ||
    fallbackName;

  const locality = addr.town || addr.city || addr.village || addr.hamlet || addr.suburb || '';
  const county = addr.county || addr.state_district || '';
  const postcode = addr.postcode || '';

  const parts = [];
  if (primary) parts.push(primary);
  if (streetPart && streetPart.toLowerCase() !== String(primary || '').toLowerCase()) {
    parts.push(streetPart);
  }
  if (locality && !parts.some((p) => p.toLowerCase().includes(locality.toLowerCase()))) {
    parts.push(locality);
  }
  if (county && !locality && !parts.some((p) => p.toLowerCase().includes(county.toLowerCase()))) {
    parts.push(county);
  }
  if (postcode && !parts.some((p) => p.toLowerCase().includes(postcode.toLowerCase()))) {
    parts.push(postcode);
  }

  return parts.filter(Boolean).join(', ');
}

function formatPhotonAddress(props = {}) {
  const streetPart = [props.housenumber, props.street].filter(Boolean).join(' ').trim();
  const primary = props.name || streetPart || props.district || props.city || '';
  const locality = props.city || props.town || props.village || props.locality || props.county || '';
  const postcode = props.postcode || '';

  const parts = [];
  if (primary) parts.push(primary);
  if (streetPart && streetPart.toLowerCase() !== primary.toLowerCase()) parts.push(streetPart);
  if (props.district && !parts.some((p) => p.toLowerCase().includes(props.district.toLowerCase()))) {
    parts.push(props.district);
  }
  if (locality && !parts.some((p) => p.toLowerCase().includes(locality.toLowerCase()))) {
    parts.push(locality);
  }
  if (postcode && !parts.some((p) => p.toLowerCase().includes(postcode.toLowerCase()))) {
    parts.push(postcode);
  }
  return {
    name: primary || parts[0] || '',
    address: parts.filter(Boolean).join(', '),
    area: [locality, postcode].filter(Boolean).join(' '),
    postcode,
  };
}

function approxDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * 111;
  const dLon = (lon2 - lon1) * 70;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

async function queryPostcodesIo(q) {
  const cleaned = q.trim().toUpperCase();
  const fullUkPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  const outcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

  try {
    if (fullUkPostcode.test(cleaned)) {
      const compact = cleaned.replace(/\s+/g, '');
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      if (json?.status === 200 && json?.result) {
        const r = json.result;
        const area = [r.admin_ward, r.parish || r.admin_district, r.region].filter(Boolean).slice(0, 2).join(', ');
        return [{
          id: `pc_${r.postcode}`,
          name: `${r.postcode}${r.admin_ward ? ` (${r.admin_ward})` : ''}`,
          address: [r.postcode, r.admin_ward, r.admin_district, r.admin_county].filter(Boolean).join(', '),
          area: area || r.admin_district || 'UK Postcode',
          postcode: r.postcode,
          lat: r.latitude,
          lon: r.longitude,
          source: 'postcode',
        }];
      }
    } else if (outcodeRegex.test(cleaned) || /^[A-Z]{1,2}\d/i.test(cleaned)) {
      const res = await fetch(`https://api.postcodes.io/postcodes?q=${encodeURIComponent(cleaned)}&limit=5`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      if (json?.status === 200 && Array.isArray(json?.result)) {
        return json.result
          .filter((r) => r.latitude != null && r.longitude != null)
          .map((r) => ({
            id: `pc_${r.postcode}`,
            name: `${r.postcode}${r.admin_ward ? ` — ${r.admin_ward}` : ''}`,
            address: [r.postcode, r.admin_ward, r.admin_district, r.admin_county].filter(Boolean).join(', '),
            area: [r.admin_ward, r.admin_district].filter(Boolean).join(', '),
            postcode: r.postcode,
            lat: r.latitude,
            lon: r.longitude,
            source: 'postcode',
          }));
      }
    }
  } catch {
    // Ignore postcode API error
  }
  return [];
}

async function queryNominatim(q, lat, lng, limit = 10) {
  const dLon = 0.45;
  const dLat = 0.30;
  const viewbox = `${(lng - dLon).toFixed(4)},${(lat + dLat).toFixed(4)},${(lng + dLon).toFixed(4)},${(lat - dLat).toFixed(4)}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=gb&q=${encodeURIComponent(q)}&viewbox=${viewbox}&bounded=0&limit=${limit}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((d) => {
      const a = d.address || {};
      const formatted = formatOsmAddress(a, d.name || d.display_name?.split(',')[0]);
      const name = d.name || formatted.split(',')[0] || d.display_name?.split(',')[0] || q;
      const areaParts = formatted.split(',').slice(1).map((s) => s.trim()).filter(Boolean);
      return {
        id: `osm_${d.place_id}`,
        name,
        address: formatted || d.display_name,
        area: areaParts.join(', ') || d.display_name?.split(',').slice(1, 4).join(',').trim() || '',
        postcode: a.postcode || '',
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
        category: d.type || d.class || 'place',
        source: 'osm',
      };
    });
  } catch {
    return [];
  }
}

async function queryPhoton(q, lat, lng, limit = 10) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=${limit}&lang=en`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const features = Array.isArray(json?.features) ? json.features : [];
    const gbOnly = features.filter((f) => {
      const cc = String(f?.properties?.countrycode || '').toUpperCase();
      return !cc || cc === 'GB';
    });
    const list = gbOnly.length > 0 ? gbOnly : features;
    return list
      .filter((f) => Array.isArray(f?.geometry?.coordinates))
      .map((f, idx) => {
        const [lon, fLat] = f.geometry.coordinates;
        const p = f.properties || {};
        const fmt = formatPhotonAddress(p);
        return {
          id: `ph_${p.osm_id || idx}_${Number(fLat).toFixed(4)}`,
          name: fmt.name || q,
          address: fmt.address || fmt.name,
          area: fmt.area,
          postcode: fmt.postcode,
          lat: Number(fLat),
          lon: Number(lon),
          category: p.osm_value || p.osm_key || 'place',
          source: 'photon',
        };
      });
  } catch {
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reverse = searchParams.get('reverse') === '1';
    const lat = parseFloat(searchParams.get('lat') || '51.1322');
    const lng = parseFloat(searchParams.get('lng') || '0.2637');

    if (reverse) {
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json({ result: null });
      }
      const revKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
      const cached = getCached(revKey);
      if (cached !== null) {
        return NextResponse.json({ result: cached });
      }
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': UA },
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            const addr = data.address || {};
            const formatted = formatOsmAddress(addr, data.name || '');
            const locality = addr.town || addr.city || addr.village || addr.suburb || addr.county || '';
            const result = formatted
              ? {
                  name: formatted,
                  shortName: data.name || formatted.split(',')[0] || formatted,
                  area: [locality, addr.postcode].filter(Boolean).join(', '),
                  postcode: addr.postcode || '',
                }
              : null;
            setCached(revKey, result);
            return NextResponse.json({ result });
          }
        }
      } catch {
        // Fallback null
      }
      return NextResponse.json({ result: null });
    }

    const qRaw = (searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12', 10), 1), 15);
    if (qRaw.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cacheKey = `q:${qRaw.toLowerCase()}:${lat.toFixed(2)},${lng.toFixed(2)}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ results: cached });
    }

    const normalized = qRaw
      .replace(/\bopp\.?\b/gi, '')
      .replace(/\bopposite\b/gi, '')
      .replace(/\bnext to\b/gi, '')
      .replace(/\bnear\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const safeLat = Number.isNaN(lat) ? 51.1322 : lat;
    const safeLng = Number.isNaN(lng) ? 0.2637 : lng;

    const [postcodeResults, photonResults, osmResults] = await Promise.all([
      queryPostcodesIo(normalized),
      queryPhoton(normalized, safeLat, safeLng, 10),
      queryNominatim(normalized, safeLat, safeLng, 10),
    ]);

    const combined = [...postcodeResults, ...osmResults, ...photonResults];
    const deduped = [];
    for (const item of combined) {
      if (!item || Number.isNaN(item.lat) || Number.isNaN(item.lon) || !item.name) continue;
      const itemFirst = item.name.toLowerCase().split(',')[0].trim();
      const dup = deduped.some((existing) => {
        const sameName = existing.name.toLowerCase().split(',')[0].trim() === itemFirst;
        const near = approxDistanceKm(existing.lat, existing.lon, item.lat, item.lon) < 0.045;
        return sameName && near;
      });
      if (!dup) {
        deduped.push({
          ...item,
          _distKm: approxDistanceKm(safeLat, safeLng, item.lat, item.lon),
        });
      }
    }

    // Prioritize postcodes / close matches (<= 35km) + exact prefix match cleanly
    const qLower = normalized.toLowerCase();
    deduped.sort((a, b) => {
      if (a.source === 'postcode' && b.source !== 'postcode') return -1;
      if (b.source === 'postcode' && a.source !== 'postcode') return 1;
      const aExact = a.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aLocal = a._distKm <= 35 ? 0 : 1;
      const bLocal = b._distKm <= 35 ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
      return a._distKm - b._distKm;
    });

    const results = deduped.slice(0, limit).map(({ _distKm, ...rest }) => rest);
    setCached(cacheKey, results);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [], error: err?.message || 'Search failed' }, { status: 200 });
  }
}
