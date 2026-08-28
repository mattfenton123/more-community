"use client";
import { useEffect, useRef } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tunbridge Wells center
const TW_CENTER = [51.1322, 0.2637];

/**
 * Creates a custom emoji marker using a div icon.
 */
function createEmojiIcon(emoji) {
  return L.divIcon({
    html: `<div style="
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(20, 184, 166, 0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      cursor: pointer;
      transition: transform 0.2s ease;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
    className: '', // Remove default leaflet icon class
  });
}

export default function MapView({ communities, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: TW_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB dark tiles for dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add markers for each community
    communities.forEach(comm => {
      if (!comm.lat || !comm.lng) return;

      const emoji = comm.category?.split(' ')[0] || '📍';
      const marker = L.marker([comm.lat, comm.lng], {
        icon: createEmojiIcon(emoji),
      }).addTo(map);

      // Custom popup
      const popupContent = `
        <div style="
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          min-width: 180px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        ">
          <div style="font-weight: 700; color: white; font-size: 0.95rem; margin-bottom: 4px;">
            ${comm.name}
          </div>
          <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 8px;">
            👥 ${comm.metrics?.members || 0} members • ${comm.metrics?.cost || 'Free'}
          </div>
          <div style="
            display: inline-block;
            background: #0f766e;
            color: white;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
          " id="map-view-${comm.id}">
            View →
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-popup',
        offset: [0, -8],
      });

      // Add click handler for the "View" button inside popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-view-${comm.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            navigate.push(`/community/${c.id}`);
          });
        }
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [communities, navigate]);

  return (
    <>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
          border-radius: 12px;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      />
    </>
  );
}
