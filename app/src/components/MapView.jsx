"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tunbridge Wells center
const TW_CENTER = [51.1322, 0.2637];

const GOOGLE_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#748cab" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2dd4bf" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f2027" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a5f" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }]
  }
];

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
    className: '',
  });
}

export default function MapView({ communities, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const navigate = useNavigate();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Check if Google Maps is available or load it
    if (apiKey) {
      if (window.google?.maps) {
        setUseGoogleMaps(true);
      } else {
        const existingScript = document.getElementById('google-maps-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.onload = () => setUseGoogleMaps(true);
          script.onerror = () => {
            console.warn('Google Maps script failed to load, falling back to Leaflet.');
            setUseGoogleMaps(false);
          };
          document.head.appendChild(script);
        } else {
          existingScript.addEventListener('load', () => setUseGoogleMaps(true));
        }
      }
    }
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (useGoogleMaps && window.google?.maps) {
      // Initialize Google Map
      const gMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: TW_CENTER[0], lng: TW_CENTER[1] },
        zoom: 14,
        styles: GOOGLE_DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        backgroundColor: "#020617"
      });

      const infoWindow = new window.google.maps.InfoWindow();

      (communities || []).forEach(comm => {
        if (!comm.lat || !comm.lng) return;

        const emoji = comm.category?.split(' ')[0] || '📍';
        const marker = new window.google.maps.Marker({
          position: { lat: Number(comm.lat), lng: Number(comm.lng) },
          map: gMap,
          title: comm.name,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="12" fill="%230f172a" stroke="%2314b8a6" stroke-width="2"/><text x="50%" y="55%" font-size="20" dominant-baseline="middle" text-anchor="middle">${emoji}</text></svg>`,
            scaledSize: new window.google.maps.Size(40, 40)
          }
        });

        marker.addListener('click', () => {
          const content = document.createElement('div');
          content.style.cssText = "background: #0f172a; border-radius: 12px; padding: 12px 14px; min-width: 170px; font-family: 'Plus Jakarta Sans', sans-serif; color: white;";
          content.innerHTML = `
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;">${comm.name}</div>
            <div style="color: #94a3b8; font-size: 0.78rem; margin-bottom: 8px;">👥 ${comm.metrics?.members || 0} members • ${comm.metrics?.cost || 'Free'}</div>
            <button id="gmap-view-${comm.id}" style="background: #0f766e; color: white; border: none; padding: 6px 14px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; cursor: pointer; width: 100%;">View Community →</button>
          `;

          infoWindow.setContent(content);
          infoWindow.open(gMap, marker);

          setTimeout(() => {
            const btn = document.getElementById(`gmap-view-${comm.id}`);
            if (btn) {
              btn.onclick = () => navigate.push(`/community/${comm.id}`);
            }
          }, 50);
        });
      });

      return;
    }

    // Leaflet Fallback
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: TW_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    (communities || []).forEach(comm => {
      if (!comm.lat || !comm.lng) return;

      const emoji = comm.category?.split(' ')[0] || '📍';
      const marker = L.marker([Number(comm.lat), Number(comm.lng)], {
        icon: createEmojiIcon(emoji),
      }).addTo(map);

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
            View Community →
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-popup',
        offset: [0, -8],
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-view-${comm.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            navigate.push(`/community/${comm.id}`);
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
  }, [communities, navigate, useGoogleMaps]);

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
        .gm-style-iw {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .gm-style-iw-d {
          overflow: visible !important;
          padding: 0 !important;
        }
        .gm-style-iw-tc, .gm-ui-hover-effect {
          display: none !important;
        }
      `}</style>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          overflow: 'hidden',
          backgroundColor: '#020617'
        }}
      />
    </>
  );
}
