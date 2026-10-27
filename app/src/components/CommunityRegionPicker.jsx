"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, Check, Loader2, Crosshair, Compass } from 'lucide-react';
import {
  DEFAULT_TW_CENTER,
  cleanLocationName,
  parseLocationCoords,
  parseLocationRadius,
  encodeLocationWithCoords,
  findKnownLocation,
  geocodeLocation
} from '../lib/location';

const REGIONAL_HUB_PRESETS = [
  { name: 'Tunbridge Wells', query: 'Tunbridge Wells, Kent', lat: 51.1322, lng: 0.2637, defaultRadius: 5 },
  { name: 'Bewl Water & High Weald', query: 'Bewl Water Car Park & Visitor Centre', lat: 51.0763, lng: 0.3875, defaultRadius: 8 },
  { name: 'Heathfield', query: 'Heathfield, East Sussex', lat: 50.9680, lng: 0.2530, defaultRadius: 6 },
  { name: 'Tonbridge', query: 'Tonbridge, Kent', lat: 51.1965, lng: 0.2740, defaultRadius: 5 },
  { name: 'St Leonards & Coast', query: 'St Leonards-on-Sea', lat: 50.8560, lng: 0.5560, defaultRadius: 7 },
  { name: 'Crowborough & Ashdown', query: 'Crowborough, East Sussex', lat: 51.0550, lng: 0.1600, defaultRadius: 8 },
  { name: 'Sevenoaks', query: 'Sevenoaks, Kent', lat: 51.2720, lng: 0.1880, defaultRadius: 6 }
];

const RADIUS_OPTIONS = [
  { km: 2, label: '2 km', desc: 'Walking / Town Center' },
  { km: 5, label: '5 km', desc: 'Town & Surrounds (Recommended)' },
  { km: 8, label: '8 km', desc: 'District & Country Parks' },
  { km: 15, label: '15 km', desc: 'Wide High Weald Region' }
];

function createRegionCenterIcon() {
  return L.divIcon({
    html: `<div style="
      width: 44px; height: 44px; border-radius: 14px;
      background: #0f172a; border: 2.5px solid #14b8a6;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 16px rgba(20,184,166,0.5);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 22px; cursor: grab;
      position: relative;
    ">
      <span>👥</span>
      <div style="position: absolute; bottom: -4px; right: -4px; width: 12px; height: 12px; border-radius: 50%; background: #2dd4bf; border: 2px solid #0f172a;"></div>
    </div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

function RegionMapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] != null && coords[1] != null && !isNaN(coords[0]) && !isNaN(coords[1])) {
      map.setView(coords, Math.max(map.getZoom(), 12), { animate: true });
      map.invalidateSize();
    }
  }, [coords, map]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

function RegionMapInteractionHandler({ onCenterChosen }) {
  useMapEvents({
    click(e) {
      onCenterChosen(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function CommunityRegionPicker({
  locationName,
  setLocationName,
  coords: externalCoords,
  onCoordsChange,
  radius: externalRadius,
  onRadiusChange
}) {
  const initialCoords = useMemo(() => {
    if (externalCoords && externalCoords[0] != null && externalCoords[1] != null) {
      return [Number(externalCoords[0]), Number(externalCoords[1])];
    }
    const parsed = parseLocationCoords(locationName);
    if (parsed) return [parsed.lat, parsed.lng];

    const known = findKnownLocation(locationName);
    if (known) return [known.lat, known.lng];

    return DEFAULT_TW_CENTER;
  }, []);

  const initialRadius = useMemo(() => {
    if (externalRadius && Number(externalRadius) > 0) return Number(externalRadius);
    return parseLocationRadius(locationName) || 5;
  }, []);

  const [coords, setCoords] = useState(initialCoords);
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [searchQuery, setSearchQuery] = useState(cleanLocationName(locationName) || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const markerRef = useRef(null);

  // Sync coords if external prop updates
  useEffect(() => {
    if (externalCoords && externalCoords[0] != null && externalCoords[1] != null) {
      setCoords([Number(externalCoords[0]), Number(externalCoords[1])]);
    }
  }, [externalCoords]);

  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createRegionCenterIcon();
  }, []);

  const updateLocationPayload = (name, lat, lng, rad) => {
    const clean = cleanLocationName(name) || 'Local Region';
    if (onCoordsChange) onCoordsChange([lat, lng]);
    if (onRadiusChange) onRadiusChange(rad);
    if (setLocationName) {
      const encoded = encodeLocationWithCoords(clean, lat, lng, rad);
      setLocationName(encoded);
    }
  };

  const handleCenterChosen = (lat, lng, name = null) => {
    const newCoords = [lat, lng];
    setCoords(newCoords);
    const chosenName = name || searchQuery || 'Community Area';
    updateLocationPayload(chosenName, lat, lng, radiusKm);
  };

  const handleRadiusChange = (newRad) => {
    const val = Number(newRad);
    setRadiusKm(val);
    updateLocationPayload(searchQuery, coords[0], coords[1], val);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const qClean = cleanLocationName(searchQuery).toLowerCase().trim();
    const matchedSpot = findKnownLocation(qClean);
    if (matchedSpot) {
      const newCoords = [matchedSpot.lat, matchedSpot.lng];
      setCoords(newCoords);
      setSearchResults([]);
      updateLocationPayload(matchedSpot.name, matchedSpot.lat, matchedSpot.lng, radiusKm);
      return;
    }

    setIsSearching(true);
    try {
      const res = await geocodeLocation(qClean);
      if (res && res.lat && res.lng) {
        const newCoords = [res.lat, res.lng];
        setCoords(newCoords);
        setSearchResults([]);
        updateLocationPayload(res.displayName ? res.displayName.split(',').slice(0, 2).join(',').trim() : searchQuery, res.lat, res.lng, radiusKm);
      }
    } catch (err) {
      console.warn("Region search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        handleCenterChosen(pos.coords.latitude, pos.coords.longitude, 'My Local Area');
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation denied/failed:", err);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header Explainer */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(20, 184, 166, 0.08)',
        border: '1px solid rgba(20, 184, 166, 0.2)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Compass size={18} color="var(--teal-400)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--slate-200)', lineHeight: 1.4 }}>
          Communities represent an <strong>area or regional hub</strong> on the map. Select your center point and coverage radius.
        </span>
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <input 
          className="form-input" 
          placeholder="Search town, landmark or area (e.g. Bewl Water, Heathfield, Tunbridge Wells)..." 
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            updateLocationPayload(val, coords[0], coords[1], radiusKm);
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

      {/* Preset Regional Hub Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {REGIONAL_HUB_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSearchQuery(preset.name);
              setCoords([preset.lat, preset.lng]);
              if (preset.defaultRadius) setRadiusKm(preset.defaultRadius);
              updateLocationPayload(preset.name, preset.lat, preset.lng, preset.defaultRadius || radiusKm);
            }}
            className="interactive-press"
            style={{
              padding: '6px 11px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--slate-300)',
              fontSize: '0.75rem',
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

      {/* Coverage Radius Selector */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '12px 14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>
            Coverage Area Radius: <strong style={{ color: 'var(--teal-400)' }}>{radiusKm} km</strong> (~{(radiusKm * 0.621).toFixed(1)} miles)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
            {RADIUS_OPTIONS.find(o => o.km === radiusKm)?.desc || `${radiusKm}km region`}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.km}
              type="button"
              onClick={() => handleRadiusChange(opt.km)}
              className="interactive-press"
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: radiusKm === opt.km ? '1.5px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.1)',
                background: radiusKm === opt.km ? 'rgba(20, 184, 166, 0.18)' : 'rgba(255,255,255,0.03)',
                color: radiusKm === opt.km ? 'var(--white)' : 'var(--slate-300)',
                fontSize: '0.75rem',
                fontWeight: radiusKm === opt.km ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Leaflet Map with Circle Radius */}
      <div style={{
        borderRadius: '14px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        background: '#020617', zIndex: 0,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{ height: '240px', width: '100%', position: 'relative' }}>
          <MapContainer 
            center={coords} 
            zoom={12} 
            style={{ height: '100%', width: '100%', backgroundColor: '#020617' }} 
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {/* Regional Coverage Circle */}
            <Circle
              center={coords}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#0d9488',
                fillColor: '#14b8a6',
                fillOpacity: 0.16,
                weight: 2,
                dashArray: '6, 6'
              }}
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
                      handleCenterChosen(pos.lat, pos.lng);
                    }
                  }
                }}
              />
            )}
            <RegionMapController coords={coords} />
            <RegionMapInteractionHandler onCenterChosen={handleCenterChosen} />
          </MapContainer>

          {/* Quick helper badge overlay */}
          <div style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 400,
            background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)',
            padding: '5px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.72rem', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '5px',
            pointerEvents: 'none'
          }}>
            <Crosshair size={12} /> Tap map or drag marker to set hub
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
                {cleanLocationName(searchQuery) || 'Local Region'}
              </span>
              <span style={{ color: 'var(--teal-400)', marginLeft: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                • {radiusKm} km radius circle
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontFamily: 'monospace', flexShrink: 0, marginLeft: '8px' }}>
            {coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°
          </div>
        </div>
      </div>
    </div>
  );
}
