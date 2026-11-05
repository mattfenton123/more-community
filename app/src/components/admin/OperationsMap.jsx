"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, Activity, Users, Calendar, 
  ExternalLink, Layers, Navigation, Globe, CheckCircle2, Shield
} from 'lucide-react';

const CLUSTERS = [
  { id: 'all', label: 'All South East', lat: 51.0500, lng: 0.3500, zoom: 9 },
  { id: 'heathfield', label: 'Heathfield Cluster', lat: 50.9680, lng: 0.2530, zoom: 14 },
  { id: 'tunbridge-wells', label: 'Tunbridge Wells', lat: 51.1322, lng: 0.2637, zoom: 14 },
  { id: 'bewl-water', label: 'Bewl Water Trail', lat: 51.0763, lng: 0.3875, zoom: 13 },
  { id: 'st-leonards', label: 'St Leonards & Coast', lat: 50.8560, lng: 0.5560, zoom: 14 },
  { id: 'london', label: 'London Region', lat: 51.5074, lng: -0.1278, zoom: 12 }
];

// Exact coordinates for known communities
const KNOWN_COORDS = {
  'mankind-heathfield-ymow0': { lat: 50.9680, lng: 0.2530, town: 'Heathfield', area: 'High Street Hub' },
  'more-shades-of-golden-0rhnh': { lat: 50.9685, lng: 0.2520, town: 'Heathfield', area: 'Cuckoo Trail' },
  'more-community-walks-qubcx': { lat: 51.0763, lng: 0.3875, town: 'Bewl Water', area: 'Kent & East Sussex' },
  'ruth-breathes-acut8': { lat: 50.8560, lng: 0.5560, town: 'St Leonards-on-Sea', area: 'Marina Promenade' },
  'more-performance-bresthing-6i2uv': { lat: 51.1315, lng: 0.2550, town: 'Tunbridge Wells', area: 'Common & Pantiles' },
  'more-leaders-network': { lat: 51.1322, lng: 0.2637, town: 'Regional Hub', area: 'Kent & East Sussex' }
};

// Town coordinates dictionary for dynamic communities
const TOWN_COORDS = {
  'heathfield': { lat: 50.9680, lng: 0.2530 },
  'tunbridge wells': { lat: 51.1322, lng: 0.2637 },
  'royal tunbridge wells': { lat: 51.1322, lng: 0.2637 },
  'bewl water': { lat: 51.0763, lng: 0.3875 },
  'st leonards': { lat: 50.8560, lng: 0.5560 },
  'st leonards-on-sea': { lat: 50.8560, lng: 0.5560 },
  'hastings': { lat: 50.8542, lng: 0.5735 },
  'eastbourne': { lat: 50.7680, lng: 0.2900 },
  'brighton': { lat: 50.8225, lng: -0.1372 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'sevenoaks': { lat: 51.2720, lng: 0.1880 },
  'tonbridge': { lat: 51.1940, lng: 0.2740 },
  'maidstone': { lat: 51.2704, lng: 0.5227 },
  'crowborough': { lat: 51.0600, lng: 0.1600 }
};

function createPinIcon(color, glowColor) {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: ${glowColor};
          opacity: 0.45;
          filter: blur(5px);
        "></div>
        <div style="
          width: 22px; height: 22px;
          border-radius: 50%;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

function MapFlyController({ target, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (target && !isNaN(target.lat) && !isNaN(target.lng)) {
      map.flyTo([target.lat, target.lng], zoom || 13, { duration: 1.2 });
    }
  }, [target, zoom, map]);
  return null;
}

export default function OperationsMap({ platformStats }) {
  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'
  const [activeCluster, setActiveCluster] = useState('all');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const markerRefs = useRef({});

  const activeIcon = useMemo(() => createPinIcon('#22c55e', 'rgba(34, 197, 94, 0.8)'), []);
  const moderateIcon = useMemo(() => createPinIcon('#f59e0b', 'rgba(245, 158, 11, 0.8)'), []);
  const dormantIcon = useMemo(() => createPinIcon('#ef4444', 'rgba(239, 68, 68, 0.8)'), []);

  const healthList = platformStats?.communityHealth || [];

  const communities = useMemo(() => {
    return healthList.map((c, idx) => {
      const known = KNOWN_COORDS[c.id];
      let lat, lng, town, area;
      if (known) {
        lat = known.lat;
        lng = known.lng;
        town = known.town;
        area = known.area;
      } else if (c.lat && c.lng && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng))) {
        lat = Number(c.lat);
        lng = Number(c.lng);
        town = c.location_name || 'South East';
        area = c.location || 'Local Hub';
      } else {
        const locLower = (c.location_name || c.location || '').toLowerCase();
        let matchedTown = null;
        for (const [key, coords] of Object.entries(TOWN_COORDS)) {
          if (locLower.includes(key)) {
            matchedTown = { key, ...coords };
            break;
          }
        }
        if (matchedTown) {
          lat = matchedTown.lat + (idx % 3) * 0.003;
          lng = matchedTown.lng + (idx % 3) * 0.003;
          town = c.location_name || matchedTown.key;
          area = c.location || 'Local Area';
        } else {
          lat = 51.0500 + ((idx * 0.035) % 0.25);
          lng = 0.2500 + ((idx * 0.045) % 0.35);
          town = c.location_name || 'Kent & Sussex';
          area = c.location || 'Active Region';
        }
      }
      return {
        ...c,
        lat,
        lng,
        town,
        area
      };
    });
  }, [healthList]);

  const currentFocus = useMemo(() => {
    if (selectedCommunityId) {
      const match = communities.find(c => c.id === selectedCommunityId);
      if (match) {
        return { lat: match.lat, lng: match.lng, zoom: 14, name: match.name, town: match.town };
      }
    }
    const cluster = CLUSTERS.find(c => c.id === activeCluster) || CLUSTERS[0];
    return { lat: cluster.lat, lng: cluster.lng, zoom: cluster.zoom, name: cluster.label, town: cluster.label };
  }, [selectedCommunityId, activeCluster, communities]);

  const handleSelectCommunity = (id) => {
    setSelectedCommunityId(id);
    const marker = markerRefs.current[id];
    if (marker) {
      marker.openPopup();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <style>{`
        .operations-map-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.14) !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 36px rgba(0,0,0,0.7) !important;
          padding: 0 !important;
        }
        .operations-map-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .operations-map-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.14) !important;
        }
      `}</style>

      {/* Header with Cluster & Map Layer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#2dd4bf" /> Geographic Operations Map
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>
            Live geospatial tracking with {communities.length} community markers across South East England.
          </p>
        </div>

        {/* Map Layer Toggle: Google Roadmap vs Google Satellite vs Google Terrain */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setMapLayer('roadmap')}
            style={{
              background: mapLayer === 'roadmap' ? '#2dd4bf' : 'transparent',
              color: mapLayer === 'roadmap' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Google Roadmap
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            style={{
              background: mapLayer === 'satellite' ? '#2dd4bf' : 'transparent',
              color: mapLayer === 'satellite' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Google Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('terrain')}
            style={{
              background: mapLayer === 'terrain' ? '#2dd4bf' : 'transparent',
              color: mapLayer === 'terrain' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Google Terrain
          </button>
        </div>
      </div>

      {/* Cluster Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CLUSTERS.map(c => {
          const isSelected = activeCluster === c.id && !selectedCommunityId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCluster(c.id);
                setSelectedCommunityId(null);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '99px',
                background: isSelected ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#2dd4bf' : 'var(--slate-300)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              📍 {c.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Map Container */}
      <div style={{ 
        width: '100%', height: '520px', borderRadius: '18px', 
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
        background: '#090d16', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <MapContainer 
          center={[currentFocus.lat, currentFocus.lng]} 
          zoom={currentFocus.zoom} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', backgroundColor: '#090d16' }}
          attributionControl={false}
        >
          {mapLayer === 'satellite' ? (
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              maxZoom={20}
            />
          ) : mapLayer === 'terrain' ? (
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              maxZoom={20}
            />
          ) : (
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              maxZoom={20}
            />
          )}

          <MapInvalidator />
          <MapFlyController target={currentFocus} zoom={currentFocus.zoom} />

          {/* Google Maps Attribution Badge */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
            padding: '4px 10px', borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.72rem', fontWeight: 800, color: '#3c4043',
            border: '1px solid rgba(0,0,0,0.1)',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '0.85rem' }}>📍</span>
            <span>Google Maps</span>
          </div>

          {communities.map(c => {
            let icon = moderateIcon;
            let statusColor = '#f59e0b';
            if (c.health === 'active') {
              icon = activeIcon;
              statusColor = '#22c55e';
            } else if (c.health === 'dormant') {
              icon = dormantIcon;
              statusColor = '#ef4444';
            }

            return (
              <Marker 
                key={c.id || Math.random()} 
                position={[c.lat, c.lng]} 
                icon={icon}
                ref={el => { if (el) markerRefs.current[c.id] = el; }}
                eventHandlers={{
                  click: () => setSelectedCommunityId(c.id)
                }}
              >
                <Popup className="operations-map-popup">
                  <div style={{ padding: '16px 18px', minWidth: '220px', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>{c.name}</h3>
                      <span style={{ 
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: '999px',
                        background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`
                      }}>
                        {c.health}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="#2dd4bf" /> 
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{c.town}</span> 
                        <span style={{ color: '#64748b' }}>({c.area})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="#38bdf8" /> 
                        <span><strong>{c.members || 0}</strong> members</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#f59e0b" /> 
                        <span><strong>{c.cEvents || 0}</strong> meetups scheduled</span>
                      </div>
                      {c.cRevenue > 0 && (
                        <div style={{ color: '#2dd4bf', fontWeight: 600 }}>
                          💰 £{c.cRevenue} total ticket revenue
                        </div>
                      )}
                    </div>

                    <a 
                      href={`/community/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        background: 'rgba(20, 184, 166, 0.2)', border: '1px solid rgba(20, 184, 166, 0.4)',
                        color: 'var(--teal-300)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none'
                      }}
                    >
                      <span>View Live Page</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Active Focus Pill */}
        <div style={{
          position: 'absolute', bottom: '14px', left: '14px', zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(10px)',
          padding: '6px 14px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 10px #2dd4bf' }}></span>
          <span style={{ color: 'var(--white)', fontWeight: 700 }}>{currentFocus.name}</span>
          <span style={{ color: 'var(--slate-400)' }}>•</span>
          <span style={{ color: '#2dd4bf', fontFamily: 'monospace' }}>{currentFocus.lat.toFixed(4)}°, {currentFocus.lng.toFixed(4)}°</span>
        </div>
      </div>

      {/* Community Pinpoints Tray */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-300)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Geospatial Communities ({communities.length})</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Click any community to zoom and open pin info</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {communities.map(c => {
            const isSelected = selectedCommunityId === c.id;
            const statusColor = c.health === 'active' ? '#22c55e' : c.health === 'dormant' ? '#ef4444' : '#f59e0b';
            return (
              <div
                key={c.id}
                onClick={() => handleSelectCommunity(c.id)}
                className="interactive-press"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: statusColor, boxShadow: `0 0 8px ${statusColor}`,
                  flexShrink: 0
                }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', display: 'flex', gap: '8px' }}>
                    <span>📍 {c.town}</span>
                    <span>•</span>
                    <span>👥 {c.members || 0} members</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: isSelected ? '#2dd4bf' : 'var(--slate-500)', fontWeight: 600 }}>
                  Pin →
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.8rem', color: 'var(--slate-400)', padding: '0 4px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }}></span> Active (High Engagement)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }}></span> Moderate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}></span> Dormant (Needs Support)
        </div>
      </div>
    </div>
  );
}
