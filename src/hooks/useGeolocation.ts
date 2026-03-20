import { useState, useCallback } from 'react';

interface GeolocationPosition {
  lat: number;
  lng: number;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  city: string | null;
  country: string | null;
  neighbourhood: string | null;
}

const STORAGE_KEY = 'wandercast_geo_permission';

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    city: null,
    country: null,
    neighbourhood: null,
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ city: string | null; country: string | null; neighbourhood: string | null }> => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) return { city: null, country: null, neighbourhood: null };

    try {
      // Single call with multiple types — Mapbox returns one feature per matched type
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=neighborhood,locality,place,country&limit=5`
      );
      const data = await resp.json();

      let city: string | null = null;
      let country: string | null = null;
      let neighbourhood: string | null = null;

      for (const feature of data.features || []) {
        const type = feature.place_type?.[0];
        if ((type === 'neighborhood' || type === 'locality') && !neighbourhood) {
          neighbourhood = feature.text;
        }
        if (type === 'place' && !city) {
          city = feature.text;
        }
        if (type === 'country' && !country) {
          country = feature.text;
        }
      }

      return { city, country, neighbourhood };
    } catch {
      return { city: null, country: null, neighbourhood: null };
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        localStorage.setItem(STORAGE_KEY, 'granted');

        const { city, country, neighbourhood } = await reverseGeocode(position.lat, position.lng);

        setState({
          position,
          error: null,
          loading: false,
          city,
          country,
          neighbourhood,
        });
      },
      (err) => {
        console.warn('[Geolocation] Permission denied or failed:', err.code, err.message);
        localStorage.setItem(STORAGE_KEY, 'denied');
        setState({
          position: null,
          error: err.message,
          loading: false,
          city: null,
          country: null,
          neighbourhood: null,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  const previouslyGranted = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'granted';

  return {
    ...state,
    requestPermission,
    previouslyGranted,
  };
}
