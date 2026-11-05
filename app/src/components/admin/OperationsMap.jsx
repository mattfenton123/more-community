"use client";
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Activity, Users, Calendar, ArrowUpRight, 
  ExternalLink, Layers, Navigation, Globe, CheckCircle2, Shield
} from 'lucide-react';

const CLUSTERS = [
  { id: 'all', label: 'All South East', lat: 51.0500, lng: 0.3500, zoom: 9 },
  { id: 'heathfield', label: 'Heathfield Cluster', lat: 50.9680, lng: 0.2530, zoom: 14 },
  { id: 'tunbridge-wells', label: 'Tunbridge Wells', lat: 51.1322, lng: 0.2637, zoom: 14 },
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

export default function OperationsMap({ platformStats }) {
  const [mapType, setMapType] = useState('m'); // 'm' = Roadmap, 'k' = Satellite, 'p' = Terrain
  const [activeCluster, setActiveCluster] = useState('all');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  const healthList = platformStats?.communityHealth || [];

  const communities = useMemo(() => {
    return healthList.map((c, idx) => {
      const known = KNOWN_COORDS[c.id];
      const lat = known ? known.lat : (c.lat && !isNaN(Number(c.lat)) ? Number(c.lat) : 51.1322 + (idx * 0.05));
      const lng = known ? known.lng : (c.lng && !isNaN(Number(c.lng)) ? Number(c.lng) : 0.2637 + (idx * 0.05));
      const town = known ? known.town : (c.location_name || 'South East');
      const area = known ? known.area : (c.location || 'Active Hub');
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
        return { lat: match.lat, lng: match.lng, zoom: 15, name: match.name, town: match.town };
      }
    }
    const cluster = CLUSTERS.find(c => c.id === activeCluster) || CLUSTERS[0];
    return { lat: cluster.lat, lng: cluster.lng, zoom: cluster.zoom, name: cluster.label, town: cluster.label };
  }, [selectedCommunityId, activeCluster, communities]);

  // Google Maps interactive embed URL
  const googleEmbedUrl = `https://maps.google.com/maps?q=${currentFocus.lat},${currentFocus.lng}&t=${mapType}&z=${currentFocus.zoom}&hl=en&output=embed`;

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${currentFocus.lat},${currentFocus.lng}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header with Cluster & Map Layer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#2dd4bf" /> Geographic Operations Map
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>
            Live Google Maps geospatial tracking of community density, health, and event participation.
          </p>
        </div>

        {/* Google Maps Layer Toggle: Roadmap vs Satellite */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setMapType('m')}
            style={{
              background: mapType === 'm' ? '#2dd4bf' : 'transparent',
              color: mapType === 'm' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Google Map
          </button>
          <button
            type="button"
            onClick={() => setMapType('k')}
            style={{
              background: mapType === 'k' ? '#2dd4bf' : 'transparent',
              color: mapType === 'k' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Satellite View
          </button>
        </div>
      </div>

      {/* Cluster Quick-Jump Bar */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
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

      {/* Google Maps Main Container */}
      <div style={{ 
        width: '100%', height: '480px', borderRadius: '18px', 
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
        background: '#090d16', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <iframe
          title="Google Operations Map"
          width="100%"
          height="100%"
          style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={googleEmbedUrl}
        />

        {/* Floating Active Focus Pill & Open in Google Maps */}
        <div style={{
          position: 'absolute', bottom: '14px', left: '14px', zIndex: 10,
          background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(10px)',
          padding: '6px 14px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 10px #2dd4bf' }}></span>
          <span style={{ color: 'var(--white)', fontWeight: 700 }}>{currentFocus.name}</span>
          <span style={{ color: 'var(--slate-400)' }}>•</span>
          <span style={{ color: '#2dd4bf', fontFamily: 'monospace' }}>{currentFocus.lat.toFixed(4)}°, {currentFocus.lng.toFixed(4)}°</span>
        </div>

        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute', top: '14px', right: '14px', zIndex: 10,
            background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(10px)',
            padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--white)', fontSize: '0.76rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
          }}
        >
          <span>Open Full Google Maps</span>
          <ExternalLink size={13} color="#2dd4bf" />
        </a>
      </div>

      {/* Community Geospatial Pinpoints Tray */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-300)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Geospatial Communities ({communities.length})</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 500 }}>Click any club to pinpoint location on Google Maps</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {communities.map(c => {
            const isSelected = selectedCommunityId === c.id;
            let statusColor = '#22c55e';
            let statusLabel = 'Active';
            if (c.health === 'moderate') {
              statusColor = '#f59e0b';
              statusLabel = 'Moderate';
            } else if (c.health === 'dormant') {
              statusColor = '#ef4444';
              statusLabel = 'Dormant';
            }

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCommunityId(isSelected ? null : c.id)}
                style={{
                  background: isSelected ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1.5px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--white)', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </strong>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '99px',
                    background: statusColor + '20',
                    color: statusColor,
                    border: '1px solid ' + statusColor + '40'
                  }}>
                    {statusLabel}
                  </span>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="#2dd4bf" />
                  <span>{c.town} • {c.area}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--slate-300)', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>👥 {c.members || 12} members</span>
                  <span>📅 {c.cEvents || 0} events</span>
                  <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{isSelected ? '📍 Pinpointed' : 'Click to view'}</span>
                </div>
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
