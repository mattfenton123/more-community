"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';

// Default center: Tunbridge Wells
const DEFAULT_CENTER = [51.1322, 0.2637];

const customIcon = L.divIcon({
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: #3b82f6; border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 16px;
  ">📍</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function LocationPicker({ locationName, setLocationName }) {
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState(locationName || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showMap, setShowMap] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length > 0) {
        const best = data[0];
        setCoords([parseFloat(best.lat), parseFloat(best.lon)]);
        setLocationName(best.display_name.split(',')[0]); 
        setShowMap(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (result) => {
    setCoords([parseFloat(result.lat), parseFloat(result.lon)]);
    setLocationName(result.display_name.split(',')[0]);
    setSearchResults([]);
    setShowMap(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <input 
          className="form-input" 
          placeholder="Type a place (e.g. The Common)" 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setLocationName(e.target.value); }}
          onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(e); }}
          style={{ padding: '14px 16px', flex: 1 }} 
        />
        <button 
          onClick={handleSearch}
          type="button"
          disabled={isSearching}
          className="btn btn-primary"
          style={{ padding: '0 16px', borderRadius: '12px', background: '#3b82f6', color: 'var(--white)', border: 'none' }}
        >
          {isSearching ? '...' : <Search size={18} />}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div style={{ 
          background: 'var(--slate-800)', border: '1px solid var(--slate-700)', 
          borderRadius: '12px', overflow: 'hidden', marginTop: '-4px' 
        }}>
          {searchResults.slice(0, 3).map((res, i) => (
            <div 
              key={i} 
              onClick={() => selectResult(res)}
              style={{ 
                padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--slate-700)' : 'none',
                cursor: 'pointer', fontSize: '0.9rem', color: 'var(--slate-200)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <MapPin size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {res.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {!showMap && (
        <div 
          onClick={() => setShowMap(true)}
          style={{ 
            textAlign: 'center', color: '#3b82f6', fontSize: '0.85rem', 
            cursor: 'pointer', padding: '8px', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: '8px' 
          }}
        >
          Or select on map
        </div>
      )}

      {showMap && (
        <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--slate-700)', zIndex: 0 }}>
          <MapContainer center={coords} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            <Marker position={coords} icon={customIcon} />
            <MapClickHandler setLocation={({lat, lng}) => setCoords([lat, lng])} />
          </MapContainer>
          <div style={{ 
            background: 'var(--slate-900)', padding: '8px', fontSize: '0.75rem', 
            color: 'var(--slate-400)', textAlign: 'center', borderTop: '1px solid var(--slate-700)' 
          }}>
            Tap map to adjust pin position
          </div>
        </div>
      )}
    </div>
  );
}
