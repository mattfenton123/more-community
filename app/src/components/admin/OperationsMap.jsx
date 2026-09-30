"use client";
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Generate reliable, self-contained SVG pin icons with glow effects
function createHealthIcon(color, glowColor) {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 30px; height: 30px;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 30px; height: 30px;
          border-radius: 50%;
          background: ${glowColor};
          opacity: 0.4;
          filter: blur(4px);
        "></div>
        <div style="
          width: 20px; height: 20px;
          border-radius: 50%;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18]
  });
}

// Controller to invalidate size when tab changes or mounts
function MapInvalidator() {
  const map = useMap();
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

// Deterministic UK coordinate generator for mock/fallback communities
function getStableCoords(id, index) {
  let hash = 0;
  const str = String(id || index || 'tw');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  // Cluster primarily around Kent & London/South East, with realistic UK spread
  const latOffset = ((Math.abs(hash) % 1000) / 1000) * 2.8; 
  const lngOffset = (((Math.abs(hash >> 3)) % 1000) / 1000) * 3.2 - 1.6;
  return {
    lat: 51.1322 + latOffset * 0.6,
    lng: 0.2637 + lngOffset * 0.6
  };
}

export default function OperationsMap({ platformStats }) {
  // Center around South East England / UK
  const center = [51.5074, 0.1278];
  const zoom = 8;

  const activeIcon = useMemo(() => createHealthIcon('#22c55e', 'rgba(34, 197, 94, 0.8)'), []);
  const moderateIcon = useMemo(() => createHealthIcon('#f59e0b', 'rgba(245, 158, 11, 0.8)'), []);
  const dormantIcon = useMemo(() => createHealthIcon('#ef4444', 'rgba(239, 68, 68, 0.8)'), []);

  const healthList = platformStats?.communityHealth || [];

  const communitiesWithLocation = healthList.map((c, idx) => {
    if (c.lat && c.lng && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng))) {
      return { ...c, lat: Number(c.lat), lng: Number(c.lng) };
    }
    const fallback = getStableCoords(c.id, idx);
    return { ...c, lat: fallback.lat, lng: fallback.lng };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <style>{`
        .operations-map-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .operations-map-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .operations-map-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
        }
      `}</style>

      <div>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
          Geographic Operations Map
        </h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>
          Live geospatial tracking of community density, health, and event participation.
        </p>
      </div>

      <div style={{ 
        width: '100%', height: '500px', borderRadius: '16px', 
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
        background: '#020617', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        position: 'relative'
      }}>
        <MapContainer 
          center={center} 
          zoom={zoom} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            subdomains="abcd"
          />
          <MapInvalidator />
          {communitiesWithLocation.map(c => {
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
              <Marker key={c.id || Math.random()} position={[c.lat, c.lng]} icon={icon}>
                <Popup className="operations-map-popup">
                  <div style={{ padding: '14px 16px', minWidth: '180px', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{c.name}</h3>
                      <span style={{ 
                        fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: '999px',
                        background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`
                      }}>
                        {c.health}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>👥 <strong>Members:</strong> <span style={{ color: '#f1f5f9' }}>{c.members || 0}</span></div>
                      <div>📅 <strong>Events:</strong> <span style={{ color: '#f1f5f9' }}>{c.cEvents || 0}</span></div>
                      {c.revenue && <div>💰 <strong>Revenue:</strong> <span style={{ color: '#2dd4bf' }}>{c.revenue}</span></div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.8rem', color: 'var(--slate-400)', padding: '0 4px' }}>
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
