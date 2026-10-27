"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, Check, Loader2, Sparkles, Crosshair } from 'lucide-react';
import {
  REGIONAL_KNOWN_LOCATIONS,
  DEFAULT_TW_CENTER,
  DEFAULT_REGION_CENTER,
  cleanLocationName,
  parseLocationCoords,
  encodeLocationWithCoords,
  findKnownLocation,
  geocodeLocation
} from '../lib/location';

const TOP_PRESETS = [
  { name: 'Bewl Water Car Park', query: 'Bewl Water Car Park & Visitor Centre' },
  { name: 'Cuckoo Trail, Heathfield', query: 'Cuckoo Trail Car Park, Heathfield' },
  { name: 'The Pantiles', query: 'The Pantiles' },
  { name: 'Dunorlan Park', query: 'Dunorlan Park' },
  { name: 'Calverley Grounds', query: 'Calverley Grounds' },
  { name: 'TW Common', query: 'Tunbridge Wells Common' }
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

// Controller to automatically re-center and resize the map when coords change
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] != null && coords[1] != null && !isNaN(coords[0]) && !isNaN(coords[1])) {
      map.setView(coords, Math.max(map.getZoom(), 15), { animate: true });
      map.invalidateSize();
    }
  }, [coords, map]);

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

// Map Click and Drag handler
function MapInteractionHandler({ onLocationChosen }) {
  useMapEvents({
    click(e) {
      onLocationChosen(e.latlng.lat, e.latlng.lng, true);
    }
  });
  return null;
}

export default function LocationPicker({ locationName, setLocationName, coords: externalCoords, onCoordsChange }) {
  // Initial coordinates resolution
  const initialCoords = useMemo(() => {
    if (externalCoords && externalCoords[0] != null && externalCoords[1] != null) {
      return [externalCoords[0], externalCoords[1]];
    }
    const parsed = parseLocationCoords(locationName);
    if (parsed) return [parsed.lat, parsed.lng];

    const known = findKnownLocation(locationName);
    if (known) return [known.lat, known.lng];

    return DEFAULT_TW_CENTER;
  }, []);

  const [coords, setCoords] = useState(initialCoords);
  const [searchQuery, setSearchQuery] = useState(cleanLocationName(locationName) || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showMap, setShowMap] = useState(true); // Default map open so leaders can easily pinpoint
  const [pinAddress, setPinAddress] = useState(cleanLocationName(locationName) || '');
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [areaLabel, setAreaLabel] = useState('');
  const [isManualPin, setIsManualPin] = useState(() => Boolean(parseLocationCoords(locationName)));
  const isManualPinRef = useRef(Boolean(parseLocationCoords(locationName)));
  const markerRef = useRef(null);

  // Keep internal query aligned if parent prop changes externally
  useEffect(() => {
    if (locationName) {
      const parsed = parseLocationCoords(locationName);
      const clean = cleanLocationName(locationName);

      if (parsed) {
        setCoords([parsed.lat, parsed.lng]);
        setIsManualPin(true);
        isManualPinRef.current = true;
      } else if (!isManualPinRef.current) {
        const known = findKnownLocation(locationName);
        if (known) {
          setCoords([known.lat, known.lng]);
          setAreaLabel(known.area || '');
        } else if (clean && clean !== searchQuery) {
          // Geocode in background to align map
          geocodeLocation(clean).then(res => {
            if (res && res.lat && res.lng && !isManualPinRef.current) {
              setCoords([res.lat, res.lng]);
            }
          });
        }
      }

      setSearchQuery(clean);
      setPinAddress(clean);
    }
  }, [locationName]);

  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createPinIcon();
  }, []);

  // Reverse geocoding helper with Nominatim fallback
  const reverseGeocode = async (lat, lng) => {
    // Check known spots within 250 meters first
    for (const spot of REGIONAL_KNOWN_LOCATIONS) {
      const dLat = Math.abs(spot.lat - lat);
      const dLng = Math.abs(spot.lng - lng);
      if (dLat < 0.0025 && dLng < 0.0025) {
        return { name: spot.name, area: spot.area };
      }
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const shortName = parts.slice(0, 2).join(',').trim();
        const area = parts.slice(2, 4).join(',').trim();
        return { name: shortName || data.display_name, area };
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using coordinate fallback:", e);
    }
    return { name: `Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`, area: '' };
  };

  const handleLocationChosen = async (lat, lng, isManual = false, customTitle = null) => {
    setCoords([lat, lng]);
    setShowMap(true);
    setSearchNotFound(false);
    if (isManual) {
      setIsManualPin(true);
      isManualPinRef.current = true;
    }
    if (onCoordsChange) onCoordsChange([lat, lng]);

    // If user already entered a descriptive title, preserve it instead of overriding with generic coordinates
    let chosenName = customTitle;
    if (!chosenName) {
      if (searchQuery && searchQuery.trim() && !searchQuery.startsWith('Spot (') && !searchQuery.startsWith('Location (')) {
        chosenName = searchQuery.trim();
      } else {
        const resolved = await reverseGeocode(lat, lng);
        chosenName = resolved.name;
        if (resolved.area) setAreaLabel(resolved.area);
      }
    }

    setPinAddress(chosenName);
    const encoded = encodeLocationWithCoords(chosenName, lat, lng);
    setLocationName(encoded);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchNotFound(false);
    const qClean = cleanLocationName(searchQuery).toLowerCase().trim();

    // 1. Check verified spots first (including Cuckoo Trail, Bewl Water, Dunorlan, etc.)
    const matchedSpot = findKnownLocation(qClean);
    if (matchedSpot) {
      const newCoords = [matchedSpot.lat, matchedSpot.lng];
      setCoords(newCoords);
      setSearchQuery(matchedSpot.name);
      setPinAddress(matchedSpot.name);
      setAreaLabel(matchedSpot.area || '');
      setSearchResults([]);
      setShowMap(true);
      if (onCoordsChange) onCoordsChange(newCoords);
      setLocationName(encodeLocationWithCoords(matchedSpot.name, matchedSpot.lat, matchedSpot.lng));
      return;
    }

    setIsSearching(true);
    try {
      const normalized = qClean
        .replace(/\bopp\.?\b/gi, '')
        .replace(/\bopposite\b/gi, '')
        .replace(/\bnext to\b/gi, '')
        .replace(/\bnear\b/gi, '')
        .replace(/\bby\b/gi, '')
        .trim();

      const candidates = [
        qClean,
        normalized !== qClean ? normalized : null,
        !qClean.includes('uk') ? `${normalized}, UK` : null
      ].filter(Boolean);

      let foundData = [];
      for (const cand of candidates) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cand)}&viewbox=-0.3,51.45,0.8,50.85&bounded=0&limit=5`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (data && data.length > 0) {
          foundData = data;
          break;
        }
      }

      setSearchResults(foundData || []);

      if (foundData && foundData.length > 0) {
        const best = foundData[0];
        const newCoords = [parseFloat(best.lat), parseFloat(best.lon)];
        setCoords(newCoords);
        const shortName = best.display_name.split(',').slice(0, 2).join(',').trim();
        setSearchQuery(shortName);
        setPinAddress(shortName);
        setShowMap(true);
        if (onCoordsChange) onCoordsChange(newCoords);
        setLocationName(encodeLocationWithCoords(shortName, newCoords[0], newCoords[1]));
      } else {
        setSearchNotFound(true);
        setShowMap(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (result) => {
    const newCoords = [parseFloat(result.lat), parseFloat(result.lon)];
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim();
    setCoords(newCoords);
    setSearchQuery(shortName);
    setPinAddress(shortName);
    setSearchResults([]);
    setShowMap(true);
    if (onCoordsChange) onCoordsChange(newCoords);
    setLocationName(encodeLocationWithCoords(shortName, newCoords[0], newCoords[1]));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        await handleLocationChosen(pos.coords.latitude, pos.coords.longitude, 'My Current Location');
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation denied/failed:", err);
        handleLocationChosen(DEFAULT_TW_CENTER[0], DEFAULT_TW_CENTER[1]);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <input 
          className="form-input" 
          placeholder="Search start location (e.g. Bewl Water Car Park, The Pantiles)..." 
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            setPinAddress(val);
            // If coordinates were already chosen/pinned, keep them locked while updating the human name
            if (coords && coords[0] != null && coords[1] != null) {
              setLocationName(encodeLocationWithCoords(val, coords[0], coords[1]));
            } else {
              setLocationName(val);
            }
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
          style={{ padding: '13px 16px', flex: 1, borderRadius: '12px', fontSize: '0.92rem' }} 
        />
        
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
            <span>Pinned meeting spot: <strong>{coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°</strong> (Drag pin or tap map to adjust)</span>
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
            Re-center
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
              setSearchQuery(preset.query);
              const spot = findKnownLocation(preset.query);
              if (spot) {
                handleLocationChosen(spot.lat, spot.lng, false, spot.name);
              } else {
                handleSearch();
              }
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
          <span>📍 Specific landmark not found in online directory. Tap anywhere on the map or drag the pin to place your start location directly.</span>
        </div>
      )}

      {/* Autocomplete / Search Suggestions */}
      {searchResults.length > 0 && (
        <div style={{ 
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: '12px', overflow: 'hidden', marginTop: '-4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10
        }}>
          {searchResults.map((res, i) => (
            <div 
              key={i} 
              onClick={() => selectResult(res)}
              className="interactive-press"
              style={{ 
                padding: '11px 16px',
                borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                cursor: 'pointer', fontSize: '0.86rem', color: 'var(--slate-200)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <MapPin size={15} color="#2dd4bf" style={{ flexShrink: 0 }} />
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {res.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Leaflet Map for Pinpointing */}
      {showMap && (
        <div style={{
          borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#020617', zIndex: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          <div style={{ height: '230px', width: '100%', position: 'relative' }}>
            <MapContainer 
              center={coords} 
              zoom={15} 
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
                        handleLocationChosen(pos.lat, pos.lng, true);
                      }
                    }
                  }}
                />
              )}
              <MapController coords={coords} />
              <MapInteractionHandler onLocationChosen={handleLocationChosen} />
            </MapContainer>

            {/* Quick helper badge overlay */}
            <div style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 400,
              background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
              padding: '5px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '0.72rem', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '5px',
              pointerEvents: 'none'
            }}>
              <Crosshair size={12} /> Tap map or drag pin to fine-tune
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
                {areaLabel && (
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
