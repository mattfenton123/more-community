"use client";

let googleMapsPromise = null;
let googleAuthFailed = false;
const authErrorListeners = new Set();

export function hasGoogleAuthError() {
  return googleAuthFailed;
}

export function onGoogleAuthError(cb) {
  if (typeof cb !== 'function') return () => {};
  authErrorListeners.add(cb);
  if (googleAuthFailed) cb();
  return () => authErrorListeners.delete(cb);
}

function triggerGoogleAuthFailure() {
  googleAuthFailed = true;
  authErrorListeners.forEach((cb) => {
    try { cb(); } catch {}
  });
}

export function loadGoogleMaps(apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (googleAuthFailed) return Promise.reject(new Error('Google Maps authentication failed'));
  if (window.google?.maps?.places && window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (!apiKey) {
    return Promise.reject(new Error('No Google Maps API key provided'));
  }

  const prevAuthFail = window.gm_authFailure;
  if (!window.__moreGmAuthHooked) {
    window.__moreGmAuthHooked = true;
    window.gm_authFailure = () => {
      triggerGoogleAuthFailure();
      if (typeof prevAuthFail === 'function') {
        try { prevAuthFail(); } catch {}
      }
    };
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      const check = setInterval(() => {
        if (googleAuthFailed) {
          clearInterval(check);
          reject(new Error('Google Maps authentication failed'));
          return;
        }
        if (window.google?.maps?.places && window.google?.maps?.Map) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); reject(new Error('Timeout loading Google Maps')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=GB&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => {
      const check = setInterval(() => {
        if (googleAuthFailed) {
          clearInterval(check);
          reject(new Error('Google Maps authentication failed'));
          return;
        }
        if (window.google?.maps?.places && window.google?.maps?.Map) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        if (window.google?.maps?.Map) resolve(window.google.maps);
        else reject(new Error('Google Maps did not finish initializing'));
      }, 5000);
    };
    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function tidyFormattedAddress(raw = '') {
  return String(raw || '').replace(/,\s*(UK|United Kingdom)$/i, '').trim();
}

/**
 * Searches places using modern Places AutocompleteSuggestion OR legacy AutocompleteService
 * with valid CircleLiteral locationBias.
 */
export async function getPlacePredictions(query, centerCoords = [51.1322, 0.2637]) {
  if (!query || !query.trim() || googleAuthFailed) return [];
  const lat = Number(centerCoords?.[0]) || 51.1322;
  const lng = Number(centerCoords?.[1]) || 0.2637;

  try {
    const maps = await loadGoogleMaps();
    if (googleAuthFailed) return [];

    // 1. Try modern Places (New) AutocompleteSuggestion if available
    if (maps?.places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      try {
        const { suggestions } = await maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedRegionCodes: ['gb'],
          locationBias: {
            center: { lat, lng },
            radius: 35000,
          },
        });
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions
            .map((s) => s.placePrediction)
            .filter(Boolean)
            .map((p) => {
              const fullText = tidyFormattedAddress(p.text?.text || '');
              const mainText = p.mainText?.text || fullText.split(',')[0];
              const secondaryText = tidyFormattedAddress(p.secondaryText?.text || '');
              return {
                id: `gp_${p.placeId}`,
                name: mainText,
                address: fullText || [mainText, secondaryText].filter(Boolean).join(', '),
                area: secondaryText,
                placeId: p.placeId,
                _placePrediction: p,
                source: 'google',
              };
            });
        }
      } catch {
        // Fallback to AutocompleteService below if Places API (New) isn't enabled
      }
    }

    // 2. Fallback to AutocompleteService with valid CircleLiteral locationBias
    if (!maps?.places?.AutocompleteService) return [];
    const service = new maps.places.AutocompleteService();
    return await new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'gb' },
          locationBias: {
            center: { lat, lng },
            radius: 35000,
          },
        },
        (predictions, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
            resolve(
              predictions.map((p) => {
                const desc = tidyFormattedAddress(p.description || '');
                const main = p.structured_formatting?.main_text || desc.split(',')[0];
                const secondary = tidyFormattedAddress(p.structured_formatting?.secondary_text || '');
                return {
                  id: `gp_${p.place_id}`,
                  name: main,
                  address: desc || [main, secondary].filter(Boolean).join(', '),
                  area: secondary,
                  placeId: p.place_id,
                  source: 'google',
                };
              })
            );
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Google Places predictions fallback:', err);
    return [];
  }
}

/**
 * Retrieves exact venue/street coordinates and formatted address for a Google Place ID.
 */
export async function getPlaceDetails(placeId, predictionObj = null, mapOrNode = null) {
  if (!placeId || googleAuthFailed) return null;
  try {
    const maps = await loadGoogleMaps();

    // 1. Try modern Place.fetchFields
    if (predictionObj?._placePrediction?.toPlace || maps?.places?.Place) {
      try {
        const place = predictionObj?._placePrediction?.toPlace
          ? predictionObj._placePrediction.toPlace()
          : new maps.places.Place({ id: placeId });
        await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });
        if (place.location) {
          const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
          const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
          const formatted = tidyFormattedAddress(place.formattedAddress || '');
          const name = place.displayName || formatted.split(',')[0];
          const fullAddress =
            name && formatted && !formatted.toLowerCase().startsWith(name.toLowerCase())
              ? `${name}, ${formatted}`
              : (formatted || name);
          return { lat, lng, formattedAddress: fullAddress, name };
        }
      } catch {
        // Fallback to PlacesService
      }
    }

    // 2. Try PlacesService.getDetails (returns exact POI pin even when Geocoding API isn't enabled)
    if (maps?.places?.PlacesService && typeof document !== 'undefined') {
      const psResult = await new Promise((resolve) => {
        try {
          const host = mapOrNode || document.createElement('div');
          const svc = new maps.places.PlacesService(host);
          svc.getDetails(
            { placeId, fields: ['geometry', 'name', 'formatted_address', 'vicinity'] },
            (place, status) => {
              if (status === maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const formatted = tidyFormattedAddress(place.formatted_address || place.vicinity || '');
                const name = place.name || formatted.split(',')[0];
                const fullAddress =
                  name && formatted && !formatted.toLowerCase().startsWith(name.toLowerCase())
                    ? `${name}, ${formatted}`
                    : (formatted || name);
                resolve({ lat, lng, formattedAddress: fullAddress, name });
              } else {
                resolve(null);
              }
            }
          );
        } catch {
          resolve(null);
        }
      });
      if (psResult) return psResult;
    }

    // 3. Final fallback to Geocoder
    if (maps?.Geocoder) {
      const geocoder = new maps.Geocoder();
      return await new Promise((resolve) => {
        geocoder.geocode({ placeId }, (results, status) => {
          if (status === 'OK' && results && results[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            const formatted = tidyFormattedAddress(results[0].formatted_address || '');
            resolve({
              lat: loc.lat(),
              lng: loc.lng(),
              formattedAddress: formatted,
              name: formatted.split(',')[0],
            });
          } else {
            resolve(null);
          }
        });
      });
    }

    return null;
  } catch (err) {
    console.warn('Google Place details fallback:', err);
    return null;
  }
}

export async function reverseGeocodeWithGoogle(lat, lng) {
  if (googleAuthFailed) return null;
  try {
    const maps = await loadGoogleMaps();
    if (!maps?.Geocoder) return null;
    const geocoder = new maps.Geocoder();
    return await new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && Array.isArray(results) && results.length > 0) {
          // Prefer specific street / premise / POI over broad postal/city results
          const specific =
            results.find((r) => !r.types?.includes('plus_code') && !r.types?.includes('postal_code_prefix')) ||
            results[0];
          const formatted = tidyFormattedAddress(specific.formatted_address || '');
          if (formatted && !/^[A-Z0-9]{4}\+[A-Z0-9]{2,3}/i.test(formatted)) {
            resolve({
              name: formatted,
              shortName: formatted.split(',')[0].trim(),
              area: formatted.split(',').slice(1).join(',').trim(),
            });
            return;
          }
        }
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

export const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#2dd4bf" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064e3b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0f766e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0284c7" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] }
];
