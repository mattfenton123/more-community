"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, Check, Loader2 } from 'lucide-react';

// Default center: Tunbridge Wells
const DEFAULT_CENTER = [51.1322, 0.2637];

// Well-known Tunbridge Wells & surrounding Kent/East Sussex locations for fast local lookup
const FAST_TW_SPOTS = [
  { name: 'Bewl Water / Bewl Reservoir', lat: 51.0676, lon: 0.4049, aliases: ['bewl', 'bewl reservoir', 'bewl water', 'bewl water reservoir'] },
  { name: 'Dunorlan Park', lat: 51.1345, lon: 0.2710, aliases: ['dunorlan', 'dunorlan park'] },
  { name: 'The Pantiles', lat: 51.1280, lon: 0.2620, aliases: ['pantiles', 'the pantiles'] },
  { name: 'Calverley Grounds', lat: 51.1355, lon: 0.2605, aliases: ['calverley', 'calverley grounds'] },
  { name: 'Tunbridge Wells Common', lat: 51.1315, lon: 0.2550, aliases: ['tw common', 'common', 'tunbridge wells common'] },
  { name: 'Camden Road', lat: 51.1330, lon: 0.2630, aliases: ['camden rd', 'camden road'] },
  { name: 'The Forum', lat: 51.1310, lon: 0.2650, aliases: ['forum', 'the forum'] },
  { name: 'Trinity Theatre & Arts Centre', lat: 51.1315, lon: 0.2640, aliases: ['trinity', 'trinity theatre'] },
  { name: 'Assembly Hall Theatre', lat: 51.1340, lon: 0.2625, aliases: ['assembly hall'] },
  { name: 'Grosvenor & Hilbert Park', lat: 51.1280, lon: 0.2680, aliases: ['hilbert', 'grosvenor park', 'grosvenor & hilbert'] },
  { name: 'St Johns Park', lat: 51.1370, lon: 0.2560, aliases: ['st johns', 'st johns park'] },
  { name: 'High Street, Tunbridge Wells', lat: 51.1295, lon: 0.2615, aliases: ['high street'] },
  { name: 'Bedgebury National Pinetum & Forest', lat: 51.0827, lon: 0.4578, aliases: ['bedgebury', 'pinetum', 'bedgebury forest'] },
  { name: 'Groombridge Place', lat: 51.1189, lon: 0.1878, aliases: ['groombridge', 'groombridge place'] },
  { name: 'Eridge Rocks', lat: 51.1039, lon: 0.2078, aliases: ['eridge', 'eridge rocks'] },
  { name: 'Harrison\'s Rocks', lat: 51.1011, lon: 0.1972, aliases: ['harrisons rocks', 'harrison rocks', 'harrisons'] },
  { name: 'High Rocks', lat: 51.1278, lon: 0.2319, aliases: ['high rocks'] },
  { name: 'Scotney Castle', lat: 51.0931, lon: 0.4069, aliases: ['scotney', 'scotney castle'] },
  { name: 'Penshurst Place', lat: 51.1744, lon: 0.1828, aliases: ['penshurst', 'penshurst place'] },
  { name: 'Kingdom (Penshurst)', lat: 51.1685, lon: 0.1795, aliases: ['kingdom', 'kingdom penshurst'] },
  { name: 'Haysden Country Park', lat: 51.1895, lon: 0.2520, aliases: ['haysden', 'haysden park'] },
  { name: 'Tonbridge Castle', lat: 51.1965, lon: 0.2740, aliases: ['tonbridge castle', 'tonbridge'] },
  { name: 'Ashdown Forest', lat: 51.0667, lon: 0.0667, aliases: ['ashdown', 'ashdown forest'] },
  { name: 'Southborough Common', lat: 51.1578, lon: 0.2742, aliases: ['southborough'] },
  { name: 'Rusthall Common', lat: 51.1390, lon: 0.2310, aliases: ['rusthall'] },
  { name: 'Broadwater Warren', lat: 51.1095, lon: 0.2480, aliases: ['broadwater', 'broadwater warren'] },
  { name: 'Cuckoo Trail Car Park, Heathfield', lat: 50.9685, lon: 0.2520, aliases: ['cuckoo trail', 'cuckoo trail car park', 'cuckoo trail heathfield', 'heathfield walk'] },
  { name: 'Heathfield, East Sussex', lat: 50.9680, lon: 0.2530, aliases: ['heathfield', 'heathfield high street', 'heathfield east sussex'] },
  { name: 'Mayfield, East Sussex', lat: 51.0200, lon: 0.2600, aliases: ['mayfield', 'mayfield village'] },
  { name: 'Crowborough, East Sussex', lat: 51.0550, lon: 0.1600, aliases: ['crowborough'] },
  { name: 'Wadhurst, East Sussex', lat: 51.0620, lon: 0.3400, aliases: ['wadhurst'] }
];

function createPinIcon() {
  return L.divIcon({
    html: `<div style="
      width: 38px; height: 38px; border-radius: 50%;
      background: #0d9488; border: 3px solid #ffffff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 6px rgba(13,148,136,0.25);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; cursor: grab;
      transition: transform 0.15s ease;
    ">📍</div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

// Controller to automatically re-center and resize the map when coords change
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
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
      onLocationChosen(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationPicker({ locationName, setLocationName }) {
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState(locationName || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [pinAddress, setPinAddress] = useState(locationName || '');
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Keep internal query aligned if parent prop changes
  useEffect(() => {
    if (locationName && locationName !== searchQuery && !searchQuery) {
      setSearchQuery(locationName);
      setPinAddress(locationName);
    }
  }, [locationName]);

  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createPinIcon();
  }, []);

  // Reverse geocoding helper with Nominatim fallback
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const shortName = parts.slice(0, 2).join(',').trim();
        return shortName || data.display_name;
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using coordinate fallback:", e);
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const handleLocationChosen = async (lat, lng) => {
    setCoords([lat, lng]);
    setShowMap(true);
    setSearchNotFound(false);
    const resolvedName = await reverseGeocode(lat, lng);
    setSearchQuery(resolvedName);
    setPinAddress(resolvedName);
    setLocationName(resolvedName);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchNotFound(false);

    // Check fast local TW & Kent/Sussex spots first (including aliases)
    const qLower = searchQuery.toLowerCase().trim();
    const matchedSpot = FAST_TW_SPOTS.find(s => 
      s.name.toLowerCase().includes(qLower) || 
      (s.aliases && s.aliases.some(a => qLower.includes(a) || a.includes(qLower)))
    );
    if (matchedSpot) {
      setCoords([matchedSpot.lat, matchedSpot.lon]);
      setLocationName(matchedSpot.name);
      setSearchQuery(matchedSpot.name);
      setPinAddress(matchedSpot.name);
      setSearchResults([]);
      setShowMap(true);
      return;
    }

    setIsSearching(true);
    try {
      // Build candidate searches in order of relevance without forcefully restricting to TW town center
      const candidates = [
        searchQuery,
        qLower.includes('reservoir') ? searchQuery.replace(/\breservoir\b/gi, 'Water') : null,
        qLower.includes('water') ? searchQuery.replace(/\bwater\b/gi, 'Reservoir') : null,
        !qLower.includes('uk') ? `${searchQuery}, Kent, UK` : null,
        !qLower.includes('uk') ? `${searchQuery}, UK` : null
      ].filter(Boolean);

      let foundData = [];
      for (const cand of candidates) {
        // Prioritize South East / Kent / Sussex region with viewbox
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cand)}&viewbox=-0.2,51.35,0.7,50.95&bounded=0&limit=4`;
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
        const shortName = best.display_name.split(',')[0].trim();
        setLocationName(shortName);
        setSearchQuery(shortName);
        setPinAddress(shortName);
        setShowMap(true);
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
    setCoords(newCoords);
    const shortName = result.display_name.split(',')[0].trim();
    setLocationName(shortName);
    setSearchQuery(shortName);
    setPinAddress(shortName);
    setSearchResults([]);
    setShowMap(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        await handleLocationChosen(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation denied/failed:", err);
        // Fallback to Tunbridge Wells
        handleLocationChosen(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      },
      { timeout: 7000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <input 
          className="form-input" 
          placeholder="e.g. The Pantiles, Calverley Grounds..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setLocationName(e.target.value);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
          style={{ padding: '13px 16px', flex: 1, borderRadius: '12px' }} 
        />
        
        {/* Geolocation Button */}
        <button 
          onClick={handleUseCurrentLocation}
          type="button"
          title="Use my current location"
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
          <span>📍 Specific landmark not found in index. Tap anywhere on the map to place your pin directly.</span>
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

      {/* Toggle Map View button */}
      {!showMap && (
        <button 
          type="button"
          onClick={() => setShowMap(true)}
          className="interactive-press"
          style={{ 
            textAlign: 'center', color: '#2dd4bf', fontSize: '0.84rem', 
            cursor: 'pointer', padding: '9px',
            background: 'rgba(45, 212, 191, 0.06)',
            border: '1px dashed rgba(45, 212, 191, 0.3)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <MapPin size={14} /> Open map to select or fine-tune pin
        </button>
      )}

      {/* Interactive Leaflet Map */}
      {showMap && (
        <div style={{
          borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#020617', zIndex: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            <MapContainer 
              center={coords} 
              zoom={15} 
              style={{ height: '100%', width: '100%', backgroundColor: '#020617' }} 
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {markerIcon && (
                <Marker 
                  position={coords} 
                  icon={markerIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleLocationChosen(position.lat, position.lng);
                    }
                  }}
                />
              )}
              <MapController coords={coords} />
              <MapInteractionHandler onLocationChosen={handleLocationChosen} />
            </MapContainer>
          </div>

          {/* Map Footer status */}
          <div style={{ 
            background: '#0f172a', padding: '9px 14px', fontSize: '0.78rem', 
            color: 'var(--slate-300)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <Check size={14} color="#2dd4bf" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                {pinAddress || 'Tap anywhere or drag pin to adjust'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)', flexShrink: 0, marginLeft: '8px' }}>
              Tap map to move pin
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
