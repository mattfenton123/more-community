"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, Search, Navigation, Check, Loader2, Sparkles, Crosshair } from 'lucide-react';
import {
  REGIONAL_KNOWN_LOCATIONS,
  DEFAULT_TW_CENTER,
  cleanLocationName,
  parseLocationCoords,
  encodeLocationWithCoords,
  findKnownLocation,
  searchKnownLocations,
  normalizeCoords,
  geocodeLocation
} from '../lib/location';
import {
  loadGoogleMaps,
  getPlacePredictions,
  getPlaceDetails,
  reverseGeocodeWithGoogle,
  onGoogleAuthError,
  hasGoogleAuthError,
  DARK_MAP_STYLES
} from '../lib/googleMaps';

const TOP_PRESETS = [
  { name: 'The Pantiles', query: 'The Pantiles', fullAddress: 'The Pantiles, Royal Tunbridge Wells TN2 5TN', area: 'Royal Tunbridge Wells TN2 5TN', coords: [51.1263, 0.2577] },
  { name: 'Pantiles Bandstand', query: 'The Pantiles Bandstand', fullAddress: 'The Pantiles Bandstand, Royal Tunbridge Wells TN2 5TN', area: 'The Pantiles, Royal Tunbridge Wells TN2 5TN', coords: [51.1257, 0.2573] },
  { name: 'Dunorlan Park', query: 'Dunorlan Park (Main Car Park)', fullAddress: 'Dunorlan Park (Main Car Park), Pembury Road, Tunbridge Wells TN2 3QA', area: 'Pembury Road, Royal Tunbridge Wells TN2 3QA', coords: [51.1313, 0.2867] },
  { name: 'Calverley Grounds', query: 'Calverley Grounds', fullAddress: 'Calverley Grounds, Royal Tunbridge Wells TN1 1BT', area: 'Royal Tunbridge Wells TN1 1BT', coords: [51.1305, 0.2663] },
  { name: 'TW Common', query: 'Tunbridge Wells Common', fullAddress: 'Tunbridge Wells Common, Wellington Rocks, Royal Tunbridge Wells', area: 'Wellington Rocks, Royal Tunbridge Wells', coords: [51.1302, 0.2541] },
  { name: 'Bewl Water Car Park', query: 'Bewl Water Car Park & Visitor Centre', fullAddress: 'Bewl Water Car Park & Visitor Centre, Bewlbridge Lane, Lamberhurst TN3 8JH', area: 'Bewlbridge Lane, Lamberhurst TN3 8JH', coords: [51.0793, 0.3914] },
  { name: 'Cuckoo Trail, Heathfield', query: 'Cuckoo Trail Car Park, Heathfield', fullAddress: 'Cuckoo Trail Car Park, Station Road, Heathfield', area: 'Heathfield, East Sussex', coords: [50.9685, 0.2517] }
];

function createPinIcon() {
  return L.divIcon({
    html: `<div style="
      width: 42px; height: 42px; border-radius: 50%;
      background: #0d9488; border: 3px solid #ffffff;
      box-shadow: 0 4px 18px rgba(0,0,0,0.5), 0 0 0 8px rgba(13,148,136,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 22px; cursor: grab;
      transition: transform 0.15s ease;
    ">📍</div>`,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
}

function MapController({ coords, markerRef, targetZoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] != null && coords[1] != null && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])) {
      map.setView(coords, Math.max(map.getZoom() || 15, targetZoom), { animate: true });
      if (markerRef?.current) {
        markerRef.current.setLatLng(coords);
      }
      map.invalidateSize();
    }
  }, [coords, map, markerRef, targetZoom]);

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
}

function MapInteractionHandler({ onLocationChosen }) {
  useMapEvents({
    click(e) {
      onLocationChosen(e.latlng.lat, e.latlng.lng, true, null);
    }
  });
  return null;
}

async function fetchServerPlaces(query, lat, lng) {
  try {
    const res = await fetch(
      `/api/places/search?q=${encodeURIComponent(query)}&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&limit=12`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.results)) return data.results;
    }
  } catch {
    // Fallback below if route is unreachable
  }

  // Direct Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=gb&q=${encodeURIComponent(query)}&viewbox=-0.3,51.45,0.8,50.85&bounded=0&limit=10`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((d) => ({
        id: `osm_${d.place_id}`,
        name: d.name || d.display_name.split(',')[0].trim(),
        address: d.display_name.replace(/,\s*(United Kingdom|UK)$/i, '').trim(),
        area: d.display_name.split(',').slice(1, 4).join(',').trim(),
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
        source: 'osm',
      }));
    }
  } catch {
    // Ignore
  }
  return [];
}

function mergeSearchCandidates(localMatches, googleMatches, osmMatches) {
  const all = [...googleMatches, ...localMatches, ...osmMatches];
  const deduped = [];
  for (const item of all) {
    if (!item || !item.name) continue;
    const itemNameKey = (item.name || '').toLowerCase().split(',')[0].trim();
    const dup = deduped.some((ex) => {
      if (item.placeId && ex.placeId && item.placeId === ex.placeId) return true;
      const exNameKey = (ex.name || '').toLowerCase().split(',')[0].trim();
      if (itemNameKey !== exNameKey) return false;
      if (item.lat != null && ex.lat != null) {
        return Math.abs(item.lat - ex.lat) < 0.0005 && Math.abs((item.lon ?? 0) - (ex.lon ?? 0)) < 0.0005;
      }
      return true;
    });
    if (!dup) deduped.push(item);
  }
  return deduped.slice(0, 12);
}

export default function LocationPicker({ locationName, setLocationName, coords: externalCoords, onCoordsChange }) {
  const initialCoords = useMemo(() => {
    const parsed = parseLocationCoords(locationName);
    if (parsed) return [parsed.lat, parsed.lng];
    const norm = normalizeCoords(externalCoords);
    if (norm) return norm;
    const known = findKnownLocation(locationName);
    if (known) return [known.lat, known.lng];
    return DEFAULT_TW_CENTER;
  }, []);

  const [coords, setCoords] = useState(initialCoords);
  const coordsRef = useRef(initialCoords);
  coordsRef.current = coords;

  const [targetZoom, setTargetZoom] = useState(16);
  const [searchQuery, setSearchQuery] = useState(cleanLocationName(locationName) || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMap] = useState(true);
  const [pinAddress, setPinAddress] = useState(cleanLocationName(locationName) || '');
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [areaLabel, setAreaLabel] = useState('');
  const [isManualPin, setIsManualPin] = useState(() => Boolean(parseLocationCoords(locationName)));

  const isManualPinRef = useRef(Boolean(parseLocationCoords(locationName)));
  const lastResolvedAddressRef = useRef(cleanLocationName(locationName) || '');
  const lastExternalLocRef = useRef(locationName);
  const searchSeqRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const markerRef = useRef(null);

  // Native Google Maps References
  const googleMapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [useLeafletFallback, setUseLeafletFallback] = useState(() => hasGoogleAuthError());

  // Listen for Google Maps runtime auth failures (e.g. referrer/billing restrictions)
  useEffect(() => {
    return onGoogleAuthError(() => {
      setUseLeafletFallback(true);
    });
  }, []);

  // Sync externalCoords changes when locationName doesn't already lock specific coords
  useEffect(() => {
    const norm = normalizeCoords(externalCoords);
    if (norm && !parseLocationCoords(locationName) && !isManualPinRef.current) {
      setCoords(norm);
    }
  }, [externalCoords, locationName]);

  // Keep internal state aligned if parent resets or swaps event externally
  useEffect(() => {
    if (locationName === lastExternalLocRef.current) return;
    lastExternalLocRef.current = locationName;

    if (locationName) {
      const parsed = parseLocationCoords(locationName);
      const clean = cleanLocationName(locationName);

      if (parsed) {
        setCoords([parsed.lat, parsed.lng]);
        setIsManualPin(true);
        isManualPinRef.current = true;
      } else if (!isManualPinRef.current) {
        const known = findKnownLocation(clean);
        if (known) {
          setCoords([known.lat, known.lng]);
          setAreaLabel(known.area || '');
        }
      }

      setSearchQuery(clean);
      setPinAddress(clean);
    } else {
      setSearchQuery('');
      setPinAddress('');
      setAreaLabel('');
      setIsManualPin(false);
      isManualPinRef.current = false;
      const norm = normalizeCoords(externalCoords);
      if (norm) setCoords(norm);
    }
  }, [locationName, externalCoords]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    // 1. Try Google Geocoder first for crisp UK street & postcode formatting
    if (!useLeafletFallback) {
      const gRev = await reverseGeocodeWithGoogle(lat, lng);
      if (gRev?.name) return gRev;
    }

    // 2. Try server reverse geocode (Nominatim with compliant User-Agent)
    try {
      const res = await fetch(`/api/places/search?reverse=1&lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.result?.name) return data.result;
      }
    } catch {
      // Fallback below
    }

    // 3. Direct client Nominatim fallback
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        const clean = data.display_name.replace(/,\s*(United Kingdom|UK)$/i, '').trim();
        const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
        return {
          name: parts.slice(0, 3).join(', ') || clean,
          shortName: parts[0] || clean,
          area: parts.slice(2, 4).join(', '),
        };
      }
    } catch {
      // Literally no address found
    }

    return { name: '', shortName: '', area: '' };
  }, [useLeafletFallback]);

  const commitLocation = useCallback((label, lat, lng, manualFlag = false, area = '', zoom = 17) => {
    const clean = cleanLocationName(label || '');
    const newCoords = [Number(lat), Number(lng)];
    setCoords(newCoords);
    setTargetZoom(zoom);
    setSearchNotFound(false);
    setIsManualPin(manualFlag);
    isManualPinRef.current = manualFlag;
    if (area) setAreaLabel(area);

    const displayLabel = clean || `Pinned Spot`;
    lastResolvedAddressRef.current = clean;
    setSearchQuery(clean);
    setPinAddress(clean || 'Off-road Map Pin');

    const encoded = clean
      ? encodeLocationWithCoords(clean, newCoords[0], newCoords[1])
      : `@${newCoords[0].toFixed(5)},${newCoords[1].toFixed(5)}`;
    lastExternalLocRef.current = encoded;
    if (onCoordsChange) onCoordsChange(newCoords);
    setLocationName(encoded);
  }, [onCoordsChange, setLocationName]);

  const handleLocationChosen = useCallback(async (lat, lng, isManual = false, customTitle = null) => {
    const newCoords = [Number(lat), Number(lng)];
    setCoords(newCoords);
    setTargetZoom(17);
    setSearchNotFound(false);
    if (isManual) {
      setIsManualPin(true);
      isManualPinRef.current = true;
    }
    if (onCoordsChange) onCoordsChange(newCoords);

    if (customTitle) {
      commitLocation(customTitle, lat, lng, isManual, areaLabel, 17);
      return;
    }

    const resolved = await reverseGeocode(lat, lng);
    const currentTyped = searchQuery.trim();
    const isAutoOrEmpty =
      !currentTyped ||
      currentTyped === lastResolvedAddressRef.current ||
      /^(?:pinned )?spot\b/i.test(currentTyped);

    if (resolved?.name && isAutoOrEmpty) {
      commitLocation(resolved.name, lat, lng, isManual, resolved.area || '', 17);
    } else if (currentTyped) {
      if (resolved?.name) setAreaLabel(resolved.name);
      setPinAddress(currentTyped);
      const encoded = encodeLocationWithCoords(currentTyped, lat, lng);
      lastExternalLocRef.current = encoded;
      setLocationName(encoded);
    } else {
      commitLocation('', lat, lng, isManual, 'Exact GPS Pin', 17);
    }
  }, [areaLabel, commitLocation, onCoordsChange, reverseGeocode, searchQuery, setLocationName]);

  const handleLocationChosenRef = useRef(handleLocationChosen);
  handleLocationChosenRef.current = handleLocationChosen;

  // Native Google Maps Initialization and Synchronization
  useEffect(() => {
    let isMounted = true;
    if (!showMap || useLeafletFallback) return;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !googleMapContainerRef.current || hasGoogleAuthError()) return;
        const latest = coordsRef.current;
        const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

        if (!mapInstanceRef.current) {
          const map = new maps.Map(googleMapContainerRef.current, {
            center: { lat: latest[0], lng: latest[1] },
            zoom: Math.max(targetZoom, 16),
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: isLight ? [] : DARK_MAP_STYLES,
          });

          const marker = new maps.Marker({
            position: { lat: latest[0], lng: latest[1] },
            map,
            draggable: true,
            animation: maps.Animation.DROP,
            title: 'Drag to adjust exact meeting point',
          });

          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
              handleLocationChosenRef.current(pos.lat(), pos.lng(), true, null);
            }
          });

          map.addListener('click', (e) => {
            if (e.latLng) {
              marker.setPosition(e.latLng);
              handleLocationChosenRef.current(e.latLng.lat(), e.latLng.lng(), true, null);
            }
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;
        } else {
          const pos = { lat: coords[0], lng: coords[1] };
          mapInstanceRef.current.setCenter(pos);
          if ((mapInstanceRef.current.getZoom() || 0) < targetZoom) {
            mapInstanceRef.current.setZoom(targetZoom);
          }
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(pos);
          }
        }
      })
      .catch(() => {
        if (isMounted) setUseLeafletFallback(true);
      });

    return () => {
      isMounted = false;
    };
  }, [showMap, coords, targetZoom, useLeafletFallback]);

  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createPinIcon();
  }, []);

  const selectResult = useCallback(async (result) => {
    if (!result) return;
    setShowDropdown(false);
    setSearchNotFound(false);

    if (result.source === 'google' && result.placeId) {
      setIsSearching(true);
      try {
        const details = await getPlaceDetails(result.placeId, result, mapInstanceRef.current || googleMapContainerRef.current);
        if (details && details.lat != null && details.lng != null) {
          const addr = details.formattedAddress || result.address || result.name;
          commitLocation(addr, details.lat, details.lng, false, result.area || '', 17);
          setIsSearching(false);
          return;
        }
      } catch (err) {
        console.error('Place details error:', err);
      } finally {
        setIsSearching(false);
      }
      // Fallback: geocode by description via server API
      const fallbackOsm = await fetchServerPlaces(result.address || result.name, coordsRef.current[0], coordsRef.current[1]);
      if (fallbackOsm.length > 0) {
        const first = fallbackOsm[0];
        commitLocation(result.address || first.address || first.name, first.lat, first.lon, false, result.area || first.area, 17);
      }
      return;
    }

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const cleanAddr = result.address || result.name || searchQuery;
      commitLocation(cleanAddr, lat, lon, false, result.area || '', 17);
    }
  }, [commitLocation, searchQuery]);

  const runSearch = useCallback(async (queryText, autoPinFirst = false) => {
    const qClean = cleanLocationName(queryText).trim();
    if (qClean.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const reqSeq = ++searchSeqRef.current;
    setIsSearching(true);
    setSearchNotFound(false);

    try {
      const [centerLat, centerLng] = coordsRef.current;
      const localMatches = searchKnownLocations(qClean);
      const [googleMatches, osmMatches] = await Promise.all([
        getPlacePredictions(qClean, [centerLat, centerLng]),
        fetchServerPlaces(qClean, centerLat, centerLng),
      ]);

      if (reqSeq !== searchSeqRef.current) return;

      const merged = mergeSearchCandidates(localMatches, googleMatches, osmMatches);
      setSearchResults(merged);
      setShowDropdown(merged.length > 0);

      if (merged.length === 0) {
        if (autoPinFirst) setSearchNotFound(true);
        return;
      }

      if (autoPinFirst) {
        // Move pin immediately to top match while KEEPING options visible so leader can refine
        const best = merged[0];
        if (best.source === 'google' && best.placeId) {
          const details = await getPlaceDetails(best.placeId, best, mapInstanceRef.current || googleMapContainerRef.current);
          if (reqSeq !== searchSeqRef.current) return;
          if (details && details.lat != null && details.lng != null) {
            commitLocation(details.formattedAddress || best.address || best.name, details.lat, details.lng, false, best.area || '', 17);
            setShowDropdown(merged.length > 1);
            return;
          }
          // Try next non-google match if Google PlaceDetails failed
          const alt = merged.find((m) => m.lat != null && m.lon != null);
          if (alt) {
            commitLocation(alt.address || alt.name, alt.lat, alt.lon, false, alt.area || '', 17);
            setShowDropdown(merged.length > 1);
            return;
          }
        } else if (best.lat != null && best.lon != null) {
          commitLocation(best.address || best.name, best.lat, best.lon, false, best.area || '', 17);
          setShowDropdown(merged.length > 1);
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
      if (autoPinFirst) setSearchNotFound(true);
    } finally {
      if (reqSeq === searchSeqRef.current) setIsSearching(false);
    }
  }, [commitLocation]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    await runSearch(searchQuery, true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        await handleLocationChosen(pos.coords.latitude, pos.coords.longitude, true, null);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied/failed:', err);
        handleLocationChosen(DEFAULT_TW_CENTER[0], DEFAULT_TW_CENTER[1], true, null);
      },
      { timeout: 8000 }
    );
  };

  const getBadgeLabel = (source) => {
    if (source === 'google') return 'Google';
    if (source === 'postcode') return 'Postcode';
    if (source === 'local') return 'Verified Spot';
    return 'Address';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            className="form-input"
            placeholder="Search street, venue, postcode or park (e.g. The Pantiles, TN2 5TN)..."
            value={searchQuery}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setPinAddress(val);
              setSearchNotFound(false);
              setIsManualPin(false);
              isManualPinRef.current = false;

              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

              if (!val.trim()) {
                setLocationName('');
                lastExternalLocRef.current = '';
                setSearchResults([]);
                setShowDropdown(false);
                return;
              }

              // Store clean typed text without gluing old/stale coordinates
              lastExternalLocRef.current = val;
              setLocationName(val);

              if (val.trim().length >= 2) {
                debounceTimerRef.current = setTimeout(() => {
                  runSearch(val, false);
                }, 260);
              } else {
                setSearchResults([]);
                setShowDropdown(false);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
            style={{ padding: '13px 40px 13px 16px', width: '100%', borderRadius: '12px', fontSize: '0.92rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                setSearchQuery('');
                setPinAddress('');
                setAreaLabel('');
                setLocationName('');
                lastExternalLocRef.current = '';
                lastResolvedAddressRef.current = '';
                setIsManualPin(false);
                isManualPinRef.current = false;
                setSearchResults([]);
                setShowDropdown(false);
              }}
              title="Clear location"
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Geolocation Button */}
        <button
          onClick={handleUseCurrentLocation}
          type="button"
          title="Use my current GPS location"
          disabled={isLocating}
          className="interactive-press"
          style={{
            padding: '0 14px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            color: isLocating ? 'var(--teal-400)' : 'var(--slate-300)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={17} />}
        </button>

        {/* Search Submit Button */}
        <button
          onClick={handleSearch}
          type="button"
          disabled={isSearching}
          aria-label="Search locations"
          className="btn interactive-press"
          style={{
            padding: '0 18px', borderRadius: '12px',
            background: '#0d9488', color: 'white',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      {/* Autocomplete / Search Suggestions */}
      {showDropdown && searchResults.length > 0 && (
        <div
          className="places-dropdown"
          style={{
            background: 'var(--slate-900)',
            border: '1px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginTop: '-4px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            zIndex: 20,
            maxHeight: '270px',
            overflowY: 'auto'
          }}
        >
          <div style={{
            padding: '6px 14px',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--teal-300)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'rgba(20, 184, 166, 0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Select exact venue or street address ({searchResults.length} options)</span>
            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.7rem' }}
            >
              Close
            </button>
          </div>
          {searchResults.map((res, i) => (
            <div
              key={res.id || i}
              onClick={() => selectResult(res)}
              className="interactive-press"
              style={{
                padding: '10px 14px',
                borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                cursor: 'pointer',
                fontSize: '0.86rem',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <MapPin size={15} color="var(--teal-400)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {res.name || res.address}
                  </div>
                  {(res.address || res.area) && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                      {res.address || res.area}
                    </div>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: res.source === 'google' ? 'rgba(20,184,166,0.16)' : res.source === 'postcode' ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.08)',
                color: res.source === 'google' ? 'var(--teal-300)' : res.source === 'postcode' ? '#93c5fd' : 'var(--slate-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                flexShrink: 0
              }}>
                {getBadgeLabel(res.source)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Manual Pin Lock Indicator */}
      {isManualPin && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px', background: 'rgba(20, 184, 166, 0.12)',
          border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '10px',
          fontSize: '0.78rem', color: '#2dd4bf'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair size={14} />
            <span>Exact map pin placed ({coords[0].toFixed(5)}, {coords[1].toFixed(5)}) — drag pin or tap map to adjust</span>
          </span>
          <button
            type="button"
            onClick={() => {
              isManualPinRef.current = false;
              setIsManualPin(false);
              if (searchQuery) handleSearch();
            }}
            className="interactive-press"
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--slate-300)',
              borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer',
              marginLeft: '8px', whiteSpace: 'nowrap'
            }}
          >
            Re-search
          </button>
        </div>
      )}

      {/* Preset spot quick-chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {TOP_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setShowDropdown(false);
              commitLocation(preset.fullAddress, preset.coords[0], preset.coords[1], false, preset.area, 17);
            }}
            className="interactive-press"
            style={{
              padding: '5px 10px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--slate-300)',
              fontSize: '0.74rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📍</span> {preset.name}
          </button>
        ))}
      </div>

      {/* Search Not Found Banner */}
      {searchNotFound && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          color: '#fbbf24',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📍 Address not found — tap anywhere on the map or drag the pin to set your exact meeting spot (coordinates will be used for Google Maps if no street address exists).</span>
        </div>
      )}

      {/* Interactive Map for Pinpointing */}
      {showMap && (
        <div style={{
          borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#020617', zIndex: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{ height: '240px', width: '100%', position: 'relative' }}>
            {!useLeafletFallback ? (
              <div
                ref={googleMapContainerRef}
                style={{ height: '100%', width: '100%', background: '#020617' }}
              />
            ) : (
              <MapContainer
                center={coords}
                zoom={targetZoom}
                style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
                zoomControl={true}
                attributionControl={false}
              >
                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {markerIcon && (
                  <Marker
                    ref={markerRef}
                    position={coords}
                    icon={markerIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: () => {
                        const marker = markerRef.current;
                        if (marker) {
                          const pos = marker.getLatLng();
                          handleLocationChosen(pos.lat, pos.lng, true, null);
                        }
                      }
                    }}
                  />
                )}
                <MapController coords={coords} markerRef={markerRef} targetZoom={targetZoom} />
                <MapInteractionHandler onLocationChosen={handleLocationChosen} />
              </MapContainer>
            )}

            {/* Quick helper badge overlay */}
            <div style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 10,
              background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)',
              padding: '5px 11px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.18)',
              fontSize: '0.72rem', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '5px',
              pointerEvents: 'none'
            }}>
              <Sparkles size={12} color="#2dd4bf" />
              <span>{useLeafletFallback ? 'Map Pin • Tap or drag pin' : 'Google Maps • Tap or drag pin'}</span>
            </div>
          </div>

          {/* Map Footer status */}
          <div style={{
            background: '#0f172a', padding: '10px 14px', fontSize: '0.8rem',
            color: 'var(--slate-300)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <Check size={15} color="#2dd4bf" style={{ flexShrink: 0 }} />
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 600, color: 'var(--white)' }}>
                  {pinAddress || 'Pin placed'}
                </span>
                {areaLabel && !String(pinAddress).includes(areaLabel) && (
                  <span style={{ color: 'var(--slate-400)', marginLeft: '6px', fontSize: '0.74rem' }}>
                    ({areaLabel})
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--teal-400)', fontFamily: 'monospace', flexShrink: 0, marginLeft: '8px' }}>
              {coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
