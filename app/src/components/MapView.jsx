"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tunbridge Wells center
const TW_CENTER = [51.1322, 0.2637];

// Well-known Tunbridge Wells landmark locations for communities without explicit lat/lng
const KNOWN_TW_LOCATIONS = [
  { name: 'pantiles', lat: 51.1280, lng: 0.2620 },
  { name: 'calverley', lat: 51.1355, lng: 0.2605 },
  { name: 'dunorlan', lat: 51.1345, lng: 0.2710 },
  { name: 'camden', lat: 51.1330, lng: 0.2630 },
  { name: 'common', lat: 51.1315, lng: 0.2550 },
  { name: 'forum', lat: 51.1310, lng: 0.2650 },
  { name: 'trinity', lat: 51.1315, lng: 0.2640 },
  { name: 'assembly hall', lat: 51.1340, lng: 0.2625 },
  { name: 'grosvenor', lat: 51.1280, lng: 0.2680 },
  { name: 'st johns', lat: 51.1370, lng: 0.2560 },
  { name: 'high street', lat: 51.1295, lng: 0.2615 },
  { name: 'hawkenbury', lat: 51.1400, lng: 0.2770 },
  { name: 'rusthall', lat: 51.1380, lng: 0.2350 },
  { name: 'southborough', lat: 51.1550, lng: 0.2580 },
];

/**
 * Resolves a reliable lat/lng pair for a community.
 * If community has lat/lng, uses it.
 * If not, checks location_name / description for known spots.
 * Otherwise creates a stable deterministic offset around Tunbridge Wells center.
 */
function resolveCoords(comm, index) {
  if (comm.lat && comm.lng && !isNaN(Number(comm.lat)) && !isNaN(Number(comm.lng))) {
    return [Number(comm.lat), Number(comm.lng)];
  }

  const textToScan = `${comm.location_name || ''} ${comm.description || ''} ${comm.name || ''}`.toLowerCase();
  for (const loc of KNOWN_TW_LOCATIONS) {
    if (textToScan.includes(loc.name)) {
      return [loc.lat, loc.lng];
    }
  }

  // Stable pseudo-random offset based on ID/name hash
  let hash = 0;
  const seed = String(comm.id || comm.name || index);
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const radius = 0.004 + ((Math.abs(hash >> 3) % 100) / 100) * 0.012; // ~500m to 1.5km from center
  const lat = TW_CENTER[0] + radius * Math.cos(angle);
  const lng = TW_CENTER[1] + radius * Math.sin(angle) * 1.5;

  return [lat, lng];
}

const GOOGLE_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b132b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#748cab" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#2dd4bf" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f2027" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] }
];

function createEmojiIcon(emoji) {
  return L.divIcon({
    html: `<div style="
      width: 42px; height: 42px; border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(20, 184, 166, 0.6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 4px 18px rgba(0,0,0,0.5), 0 0 12px rgba(20,184,166,0.3);
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">${emoji}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
    className: '',
  });
}

export default function MapView({ communities, onSelect }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const googleMapRef = useRef(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const navigate = useNavigate();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Make navigation globally callable from marker popups
  useEffect(() => {
    window.__moreNavigateCommunity = (id) => {
      navigate.push(`/community/${id}`);
    };
    return () => {
      delete window.__moreNavigateCommunity;
    };
  }, [navigate]);

  // Google Maps Auth Failure listener - fall back to Leaflet if API key fails
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed. Seamlessly switching to Leaflet Dark Map.');
      setUseGoogleMaps(false);
    };
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  // Try loading Google Maps if API key is present
  useEffect(() => {
    if (!apiKey) return;

    if (window.google?.maps) {
      setUseGoogleMaps(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setUseGoogleMaps(true);
      script.onerror = () => {
        console.warn('Google Maps script failed to load. Falling back to Leaflet.');
        setUseGoogleMaps(false);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setUseGoogleMaps(true));
    }
  }, [apiKey]);

  // Render or Update Leaflet Map
  const renderLeaflet = useCallback(() => {
    if (!mapRef.current) return;

    // 1. Initialize map if not yet created
    if (!leafletMapRef.current) {
      // Clear any lingering Leaflet ID on the DOM container to prevent "Map container is already initialized"
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }

      const map = L.map(mapRef.current, {
        center: TW_CENTER,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      leafletMapRef.current = map;

      // Invalidate size to ensure all tiles render cleanly
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 350);
    }

    const map = leafletMapRef.current;
    const markersGroup = markersLayerRef.current;

    if (!map || !markersGroup) return;

    // 2. Clear old markers and add new markers
    markersGroup.clearLayers();

    const commList = communities || [];
    const markerCoords = [];

    commList.forEach((comm, idx) => {
      const [lat, lng] = resolveCoords(comm, idx);
      markerCoords.push([lat, lng]);

      const emoji = comm.category?.split(' ')[0] || comm.tags?.[0]?.split(' ')[0] || '📍';
      const marker = L.marker([lat, lng], {
        icon: createEmojiIcon(emoji),
      }).addTo(markersGroup);

      const memberCount = comm.memberCount || comm.metrics?.members || 1;
      const costBadge = comm.cost || comm.metrics?.cost || 'Free';
      const locationText = comm.location_name || 'Tunbridge Wells';

      const popupHtml = `
        <div style="
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 16px;
          min-width: 200px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 1.2rem;">${emoji}</span>
            <div style="font-weight: 700; color: white; font-size: 0.95rem; line-height: 1.2;">
              ${comm.name}
            </div>
          </div>
          <div style="color: #94a3b8; font-size: 0.78rem; margin-bottom: 4px;">
            📍 ${locationText}
          </div>
          <div style="color: #cbd5e1; font-size: 0.78rem; margin-bottom: 10px;">
            👥 ${memberCount} members • <span style="color: #2dd4bf; font-weight: 600;">${costBadge}</span>
          </div>
          <button 
            onclick="window.__moreNavigateCommunity('${comm.id}')"
            style="
              width: 100%;
              background: #0d9488;
              color: white;
              padding: 8px 12px;
              border: none;
              border-radius: 8px;
              font-size: 0.8rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#0f766e'"
            onmouseout="this.style.background='#0d9488'"
          >
            View Community →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: 'custom-leaflet-popup',
        offset: [0, -8],
      });
    });

    // Invalidate size on each update
    map.invalidateSize();
  }, [communities]);

  // Main effect to drive map rendering
  useEffect(() => {
    if (!mapRef.current) return;

    if (useGoogleMaps && window.google?.maps) {
      try {
        // Clean up Leaflet if it was active
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
          markersLayerRef.current = null;
        }
        if (mapRef.current._leaflet_id) {
          delete mapRef.current._leaflet_id;
        }

        // Initialize Google Map
        const gMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: TW_CENTER[0], lng: TW_CENTER[1] },
          zoom: 14,
          styles: GOOGLE_DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          backgroundColor: "#020617"
        });
        googleMapRef.current = gMap;

        const infoWindow = new window.google.maps.InfoWindow();

        (communities || []).forEach((comm, idx) => {
          const [lat, lng] = resolveCoords(comm, idx);
          const emoji = comm.category?.split(' ')[0] || comm.tags?.[0]?.split(' ')[0] || '📍';

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: gMap,
            title: comm.name,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="12" fill="%230f172a" stroke="%2314b8a6" stroke-width="2"/><text x="50%" y="55%" font-size="20" dominant-baseline="middle" text-anchor="middle">${emoji}</text></svg>`,
              scaledSize: new window.google.maps.Size(40, 40)
            }
          });

          marker.addListener('click', () => {
            const memberCount = comm.memberCount || comm.metrics?.members || 1;
            const costBadge = comm.cost || comm.metrics?.cost || 'Free';
            const locationText = comm.location_name || 'Tunbridge Wells';

            const content = document.createElement('div');
            content.style.cssText = "background: #0f172a; border-radius: 12px; padding: 12px 14px; min-width: 180px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: white;";
            content.innerHTML = `
              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;">${comm.name}</div>
              <div style="color: #94a3b8; font-size: 0.78rem; margin-bottom: 4px;">📍 ${locationText}</div>
              <div style="color: #cbd5e1; font-size: 0.78rem; margin-bottom: 8px;">👥 ${memberCount} members • ${costBadge}</div>
              <button onclick="window.__moreNavigateCommunity('${comm.id}')" style="background: #0d9488; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; width: 100%;">View Community →</button>
            `;

            infoWindow.setContent(content);
            infoWindow.open(gMap, marker);
          });
        });

        return;
      } catch (err) {
        console.warn("Failed initializing Google Maps, falling back to Leaflet:", err);
        setUseGoogleMaps(false);
      }
    }

    // Default & robust: Render Leaflet
    renderLeaflet();

    // Resize listener
    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [communities, useGoogleMaps, renderLeaflet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
      }
      if (mapRef.current && mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }
    };
  }, []);

  return (
    <>
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 14px !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
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
          minHeight: '350px',
          borderRadius: 0,
          overflow: 'hidden',
          backgroundColor: '#020617'
        }}
      />
    </>
  );
}
