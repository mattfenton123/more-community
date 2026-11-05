"use client";

let googleMapsPromise = null;

export function loadGoogleMaps(apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }
  if (!apiKey) {
    return Promise.reject(new Error('No Google Maps API key provided'));
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); reject(new Error('Timeout loading Google Maps')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve(window.google.maps);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(window.google?.maps); }, 4000);
    };
    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Searches places using Google Maps Places AutocompleteService
 */
export async function getPlacePredictions(query, centerCoords = [51.132, 0.263]) {
  if (!query || !query.trim()) return [];
  try {
    const maps = await loadGoogleMaps();
    if (!maps?.places?.AutocompleteService) return [];

    const service = new maps.places.AutocompleteService();
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'gb' },
          locationBias: centerCoords ? new maps.LatLng(centerCoords[0], centerCoords[1]) : undefined
        },
        (predictions, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(
              predictions.map(p => ({
                id: p.place_id,
                name: p.structured_formatting?.main_text || p.description.split(',')[0],
                address: p.description,
                area: p.structured_formatting?.secondary_text || '',
                placeId: p.place_id,
                source: 'google'
              }))
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
 * Retrieves coordinates for a Google Place ID
 */
export async function getPlaceDetails(placeId) {
  try {
    const maps = await loadGoogleMaps();
    if (!maps?.places) return null;

    // Use Geocoder to resolve place_id to lat/lng without needing an invisible DOM node
    const geocoder = new maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          const name = results[0].formatted_address.split(',')[0];
          resolve({ lat, lng, formattedAddress: results[0].formatted_address, name });
        } else {
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn('Google Place details fallback:', err);
    return null;
  }
}
