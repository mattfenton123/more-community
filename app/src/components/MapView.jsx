"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Regional anchor center: High Weald / Kent & East Sussex border
const REGION_CENTER = [51.0800, 0.3000];

// Verified geographic coordinates for all known communities and event venues
const KNOWN_LOCATIONS = [
  // Heathfield & Cuckoo Trail (More Shades of Golden & walks)
  { name: 'cuckoo trail car park', lat: 50.9685, lng: 0.2520 },
  { name: 'cuckoo trail', lat: 50.9685, lng: 0.2520 },
  { name: 'heathfield', lat: 50.9680, lng: 0.2530 },
  
  // Bewl Water (More Community Walks)
  { name: 'bewl water reservoir', lat: 51.0676, lng: 0.4049 },
  { name: 'bewl reservoir', lat: 51.0676, lng: 0.4049 },
  { name: 'bewl water', lat: 51.0676, lng: 0.4049 },
  { name: 'bewl', lat: 51.0676, lng: 0.4049 },
  { name: 'lamberhurst', lat: 51.0990, lng: 0.3950 },

  // Tunbridge Wells landmarks & spots
  { name: 'pantiles', lat: 51.1280, lng: 0.2620 },
  { name: 'calverley grounds', lat: 51.1355, lng: 0.2605 },
  { name: 'calverley', lat: 51.1355, lng: 0.2605 },
  { name: 'dunorlan park', lat: 51.1345, lng: 0.2710 },
  { name: 'dunorlan', lat: 51.1345, lng: 0.2710 },
  { name: 'camden road', lat: 51.1330, lng: 0.2630 },
  { name: 'camden', lat: 51.1330, lng: 0.2630 },
  { name: 'tw common', lat: 51.1315, lng: 0.2550 },
  { name: 'tunbridge wells common', lat: 51.1315, lng: 0.2550 },
  { name: 'common', lat: 51.1315, lng: 0.2550 },
  { name: 'the forum', lat: 51.1310, lng: 0.2650 },
  { name: 'forum', lat: 51.1310, lng: 0.2650 },
  { name: 'trinity theatre', lat: 51.1315, lng: 0.2640 },
  { name: 'trinity', lat: 51.1315, lng: 0.2640 },
  { name: 'assembly hall', lat: 51.1340, lng: 0.2625 },
  { name: 'grosvenor', lat: 51.1280, lng: 0.2680 },
  { name: 'st johns', lat: 51.1370, lng: 0.2560 },
  { name: 'high street', lat: 51.1295, lng: 0.2615 },
  { name: 'hawkenbury', lat: 51.1400, lng: 0.2770 },
  { name: 'rusthall', lat: 51.1380, lng: 0.2350 },
  { name: 'southborough', lat: 51.1550, lng: 0.2580 },
  { name: 'tunbridge wells', lat: 51.1322, lng: 0.2637 },

  // Surrounding Kent & East Sussex towns and nature spots
  { name: 'bedgebury national pinetum', lat: 51.0827, lng: 0.4578 },
  { name: 'bedgebury', lat: 51.0827, lng: 0.4578 },
  { name: 'wadhurst', lat: 51.0620, lng: 0.3400 },
  { name: 'crowborough', lat: 51.0550, lng: 0.1600 },
  { name: 'mayfield', lat: 51.0200, lng: 0.2600 },
  { name: 'eridge rocks', lat: 51.1039, lng: 0.2078 },
  { name: 'eridge', lat: 51.1039, lng: 0.2078 },
  { name: 'groombridge place', lat: 51.1189, lng: 0.1878 },
  { name: 'groombridge', lat: 51.1189, lng: 0.1878 },
  { name: 'penshurst place', lat: 51.1744, lng: 0.1828 },
  { name: 'penshurst', lat: 51.1744, lng: 0.1828 },
  { name: 'haysden country park', lat: 51.1895, lon: 0.2520 },
  { name: 'tonbridge castle', lat: 51.1965, lng: 0.2740 },
  { name: 'tonbridge', lat: 51.1965, lng: 0.2740 },
  { name: 'sevenoaks', lat: 51.2720, lng: 0.1880 },
  { name: 'ashdown forest', lat: 51.0667, lng: 0.0667 },
  { name: 'ashdown', lat: 51.0667, lng: 0.0667 },
  { name: 'uckfield', lat: 50.9700, lng: 0.0900 },
  { name: 'kent & east sussex', lat: 51.0800, lng: 0.3300 },
];

// Direct accurate coordinates for our active platform communities
const COMMUNITY_COORDS_MAP = {
  'more-shades-of-golden-0rhnh': [50.9680, 0.2530],       // Heathfield, East Sussex
  'more-community-walks-qubcx': [51.0676, 0.4049],        // Bewl Water / High Weald
  'more-performance-bresthing-6i2uv': [51.1322, 0.2637],   // Tunbridge Wells, Kent
};

/**
 * Resolves reliable coordinates for a community.
 */
function resolveCommunityCoords(comm, index) {
  if (comm.lat && comm.lng && !isNaN(Number(comm.lat)) && !isNaN(Number(comm.lng))) {
    return [Number(comm.lat), Number(comm.lng)];
  }

  if (comm.id && COMMUNITY_COORDS_MAP[comm.id]) {
    return COMMUNITY_COORDS_MAP[comm.id];
  }

  const textToScan = `${comm.location_name || ''} ${comm.description || ''} ${comm.name || ''}`.toLowerCase();
  for (const loc of KNOWN_LOCATIONS) {
    if (textToScan.includes(loc.name)) {
      return [loc.lat, loc.lng];
    }
  }

  // Stable pseudo-random fallback around regional center
  let hash = 0;
  const seed = String(comm.id || comm.name || index);
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const radius = 0.005 + ((Math.abs(hash >> 3) % 100) / 100) * 0.015;
  const lat = 51.1322 + radius * Math.cos(angle);
  const lng = 0.2637 + radius * Math.sin(angle) * 1.5;

  return [lat, lng];
}

/**
 * Resolves reliable coordinates for an event.
 */
function resolveEventCoords(event, index) {
  if (event.lat && event.lng && !isNaN(Number(event.lat)) && !isNaN(Number(event.lng))) {
    return [Number(event.lat), Number(event.lng)];
  }

  const textToScan = `${event.location || ''} ${event.title || ''} ${event.description || ''}`.toLowerCase();
  for (const loc of KNOWN_LOCATIONS) {
    if (textToScan.includes(loc.name)) {
      return [loc.lat, loc.lng];
    }
  }

  if (event.communityId && COMMUNITY_COORDS_MAP[event.communityId]) {
    const [cLat, cLng] = COMMUNITY_COORDS_MAP[event.communityId];
    return [cLat + 0.0008, cLng + 0.0008];
  }

  return [51.1322, 0.2637];
}

function createCommunityIcon(emoji) {
  return L.divIcon({
    html: `<div style="
      width: 44px; height: 44px; border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(20, 184, 166, 0.85);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 14px rgba(20,184,166,0.35);
      cursor: pointer;
      position: relative;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
      ${emoji || '📍'}
      <div style="position: absolute; bottom: -3px; right: -3px; width: 10px; height: 10px; border-radius: 50%; background: #14b8a6; border: 2px solid #0f172a;"></div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
    className: '',
  });
}

function createEventIcon(emoji = '📅') {
  return L.divIcon({
    html: `<div style="
      width: 44px; height: 44px; border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border: 2px solid #a855f7;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 16px rgba(168,85,247,0.45);
      cursor: pointer;
      position: relative;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
      ${emoji}
      <div style="position: absolute; top: -3px; right: -3px; width: 11px; height: 11px; border-radius: 50%; background: #f43f5e; border: 2px solid #0f172a;"></div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
    className: '',
  });
}

export default function MapView({ communities = [], events = [], onSelect }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'communities' | 'events'
  const navigate = useNavigate();

  // Make navigation globally callable from marker popup buttons
  useEffect(() => {
    window.__moreNavigateCommunity = (id) => {
      navigate.push(`/community/${id}`);
    };
    window.__moreNavigateEvent = (id) => {
      navigate.push(`/events/${id}`);
    };
    return () => {
      delete window.__moreNavigateCommunity;
      delete window.__moreNavigateEvent;
    };
  }, [navigate]);

  // Filter out global or non-physical items from local map
  const activeCommunities = useMemo(() => {
    return (communities || []).filter(c => c.id !== 'more-leaders-network' && c.location_name !== 'Global');
  }, [communities]);

  const activeEvents = useMemo(() => {
    return (events || []).filter(e => e.status !== 'cancelled');
  }, [events]);

  // Render or Update Leaflet Map
  const renderLeaflet = useCallback(() => {
    if (!mapRef.current) return;

    // 1. Initialize map if not yet created
    if (!leafletMapRef.current) {
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }

      const map = L.map(mapRef.current, {
        center: REGION_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tile layer for premium dark UI
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      leafletMapRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 350);
    }

    const map = leafletMapRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const allCoords = [];

    // 2. Add Community Markers
    if (filterType === 'all' || filterType === 'communities') {
      activeCommunities.forEach((comm, idx) => {
        const [lat, lng] = resolveCommunityCoords(comm, idx);
        allCoords.push([lat, lng]);

        const emoji = comm.category?.split(' ')[0] || comm.tags?.[0]?.split(' ')[0] || (comm.name?.toLowerCase().includes('golden') ? '🐶' : comm.name?.toLowerCase().includes('walk') ? '🚶' : '🧘');
        const marker = L.marker([lat, lng], {
          icon: createCommunityIcon(emoji),
        }).addTo(markersGroup);

        const memberCount = comm.memberCount || comm.metrics?.members || comm.members || 1;
        const costBadge = comm.cost || comm.metrics?.cost || 'Free';
        const locationText = comm.location_name || (comm.id === 'more-shades-of-golden-0rhnh' ? 'Heathfield, East Sussex' : comm.id === 'more-community-walks-qubcx' ? 'Bewl Water, Kent & East Sussex' : 'Tunbridge Wells, Kent');

        const popupHtml = `
          <div style="
            background: #0f172a;
            border: 1px solid rgba(20,184,166,0.35);
            border-radius: 14px;
            padding: 14px 16px;
            min-width: 220px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          ">
            <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; background: rgba(20,184,166,0.15); color: #2dd4bf; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
              <span>Community</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 1.25rem;">${emoji}</span>
              <div style="font-weight: 700; color: white; font-size: 0.95rem; line-height: 1.2;">
                ${comm.name}
              </div>
            </div>
            <div style="color: #94a3b8; font-size: 0.78rem; margin-bottom: 6px;">
              📍 ${locationText}
            </div>
            <div style="color: #cbd5e1; font-size: 0.78rem; margin-bottom: 12px;">
              👥 ${memberCount} member${memberCount !== 1 ? 's' : ''} • <span style="color: #2dd4bf; font-weight: 600;">${costBadge}</span>
            </div>
            <button 
              onclick="window.__moreNavigateCommunity('${comm.id}')"
              style="
                width: 100%;
                background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                color: white;
                padding: 9px 12px;
                border: none;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.15s;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
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
    }

    // 3. Add Event Markers
    if (filterType === 'all' || filterType === 'events') {
      activeEvents.forEach((ev, idx) => {
        const [lat, lng] = resolveEventCoords(ev, idx);
        allCoords.push([lat, lng]);

        const evEmoji = ev.title?.toLowerCase().includes('walk') ? '🚶' : ev.title?.toLowerCase().includes('dog') ? '🐶' : '📅';
        const marker = L.marker([lat, lng], {
          icon: createEventIcon(evEmoji),
        }).addTo(markersGroup);

        const dateStr = ev.date ? new Date(ev.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Upcoming';
        const timeStr = ev.time ? ` • ${ev.time}` : '';
        const attendeeCount = ev.attendees || 0;

        const popupHtml = `
          <div style="
            background: #0f172a;
            border: 1px solid rgba(168,85,247,0.35);
            border-radius: 14px;
            padding: 14px 16px;
            min-width: 230px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          ">
            <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; background: rgba(168,85,247,0.15); color: #c084fc; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
              <span>Upcoming Event</span>
            </div>
            <div style="font-weight: 700; color: white; font-size: 0.95rem; line-height: 1.25; margin-bottom: 6px;">
              ${ev.title}
            </div>
            <div style="color: #f59e0b; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px;">
              🗓️ ${dateStr}${timeStr}
            </div>
            <div style="color: #94a3b8; font-size: 0.78rem; margin-bottom: 6px;">
              📍 ${ev.location || 'See event details'}
            </div>
            <div style="color: #cbd5e1; font-size: 0.78rem; margin-bottom: 12px;">
              👥 ${attendeeCount} attending
            </div>
            <button 
              onclick="window.__moreNavigateEvent('${ev.id}')"
              style="
                width: 100%;
                background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
                color: white;
                padding: 9px 12px;
                border: none;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              View Event Details →
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: false,
          className: 'custom-leaflet-popup',
          offset: [0, -8],
        });
      });
    }

    // 4. Smoothly fit bounds to show all points across Tunbridge Wells, Bewl Water, and Heathfield
    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        map.setView(REGION_CENTER, 11);
      }
    } else {
      map.setView(REGION_CENTER, 11);
    }

    map.invalidateSize();
  }, [activeCommunities, activeEvents, filterType]);

  // Main effect to drive map rendering
  useEffect(() => {
    renderLeaflet();

    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [renderLeaflet]);

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

  const totalPoints = activeCommunities.length + activeEvents.length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
          border: 1px solid rgba(255,255,255,0.15) !important;
        }
      `}</style>

      {/* Floating Filter Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 1000,
        display: 'flex',
        gap: '6px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '5px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={() => setFilterType('all')}
          className="interactive-press"
          style={{
            background: filterType === 'all' ? 'rgba(20,184,166,0.2)' : 'transparent',
            border: filterType === 'all' ? '1px solid rgba(20,184,166,0.4)' : '1px solid transparent',
            color: filterType === 'all' ? '#2dd4bf' : 'var(--slate-400)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All ({totalPoints})
        </button>
        <button
          onClick={() => setFilterType('communities')}
          className="interactive-press"
          style={{
            background: filterType === 'communities' ? 'rgba(20,184,166,0.2)' : 'transparent',
            border: filterType === 'communities' ? '1px solid rgba(20,184,166,0.4)' : '1px solid transparent',
            color: filterType === 'communities' ? '#2dd4bf' : 'var(--slate-400)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          👥 Groups ({activeCommunities.length})
        </button>
        <button
          onClick={() => setFilterType('events')}
          className="interactive-press"
          style={{
            background: filterType === 'events' ? 'rgba(168,85,247,0.2)' : 'transparent',
            border: filterType === 'events' ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent',
            color: filterType === 'events' ? '#c084fc' : 'var(--slate-400)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📅 Events ({activeEvents.length})
        </button>
      </div>

      {/* Map DOM Element */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '350px',
          backgroundColor: '#020617'
        }}
      />
    </div>
  );
}
