import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for community health
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dormantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const moderateIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


export default function OperationsMap({ platformStats }) {
  // Center of UK
  const center = [54.5, -2.5];
  const zoom = 6;

  // Render the map and plot communities based on their location.
  // Assuming communities have lat/lng properties, otherwise we'll mock it if missing for MVP visualization.
  const communitiesWithLocation = platformStats.communityHealth.map(c => {
    // Generate a mock location in the UK if none exists, just for the MVP visualization
    const lat = c.lat || (51.5 + (Math.random() * 4));
    const lng = c.lng || (-3 + (Math.random() * 4));
    return { ...c, lat, lng };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Geographic Operations Map</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Live tracking of community health and density across the UK.</p>
      </div>

      <div style={{ flex: 1, minHeight: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {communitiesWithLocation.map(c => {
            let icon = moderateIcon;
            if (c.health === 'active') icon = activeIcon;
            if (c.health === 'dormant') icon = dormantIcon;

            return (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={icon}>
                <Popup>
                  <div style={{ color: 'black' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{c.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}><strong>Health:</strong> <span style={{textTransform: 'capitalize'}}>{c.health}</span></p>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}><strong>Members:</strong> {c.members}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}><strong>Events:</strong> {c.cEvents}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></span> Active
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span> Moderate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span> Dormant
        </div>
      </div>
    </div>
  );
}
