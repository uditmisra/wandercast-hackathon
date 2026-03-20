import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Place } from '@/types/tour';

interface MapViewProps {
  places: Place[];
  currentStopIndex: number;
  className?: string;
  onMarkerClick?: (index: number) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// ─── Utilities ───────────────────────────────────────────────────

/** Haversine distance in meters */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatWalkTime(meters: number): string {
  const minutes = Math.round(meters / 80); // ~80m/min walking pace
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

// ─── Marker DOM factory ──────────────────────────────────────────

type MarkerState = 'visited' | 'current' | 'upcoming';

function createMarkerElement(index: number, state: MarkerState, placeName: string): HTMLDivElement {
  const size = state === 'current' ? 36 : 28;

  // Wrapper — sized to the circle, label overflows via absolute positioning
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative; width: ${size}px; height: ${size}px;
    cursor: pointer; transition: transform 0.2s ease;
  `;

  // Pulsing ring for active marker
  if (state === 'current') {
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: absolute; top: 50%; left: 50%; width: 52px; height: 52px;
      transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(var(--accent-pink-rgb),0.25), rgba(var(--accent-pink-rgb),0.10), transparent 70%);
    `;
    pulse.animate([
      { transform: 'translate(-50%, -50%) scale(0.7)', opacity: '0.8' },
      { transform: 'translate(-50%, -50%) scale(2)', opacity: '0' },
    ], { duration: 2000, iterations: Infinity, easing: 'ease-out' });
    wrapper.appendChild(pulse);
  }

  // Circle
  const circle = document.createElement('div');

  if (state === 'visited') {
    circle.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: var(--accent-pink); border: 2.5px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s ease;
    `;
    circle.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (state === 'current') {
    circle.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: var(--accent-pink);
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 14px; font-weight: 700;
      font-family: 'DM Serif Display', Georgia, serif;
      transition: all 0.3s ease;
    `;
    circle.textContent = String(index + 1);
  } else {
    circle.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: white; border: 2px solid rgba(0,0,0,0.12);
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      display: flex; align-items: center; justify-content: center;
      color: rgba(0,0,0,0.35); font-size: 12px; font-weight: 600;
      font-family: 'Inter', sans-serif;
      transition: all 0.3s ease;
    `;
    circle.textContent = String(index + 1);
  }

  wrapper.appendChild(circle);

  // Name label for current marker — absolutely positioned so it doesn't shift anchor
  if (state === 'current') {
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute; top: 100%; left: 50%;
      transform: translateX(-50%); margin-top: 6px;
      padding: 4px 10px; border-radius: 10px;
      background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      white-space: nowrap; font-size: 11px; font-weight: 600;
      color: #0A0A0A; font-family: 'Inter', sans-serif;
      max-width: 150px; overflow: hidden; text-overflow: ellipsis;
      pointer-events: none;
    `;
    label.textContent = placeName;
    wrapper.appendChild(label);
  }

  // Hover effect
  wrapper.addEventListener('mouseenter', () => { wrapper.style.transform = 'scale(1.15)'; });
  wrapper.addEventListener('mouseleave', () => { wrapper.style.transform = 'scale(1)'; });

  return wrapper;
}

// ─── Component ───────────────────────────────────────────────────

export function MapView({ places, currentStopIndex, className = '', onMarkerClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; el: HTMLDivElement; index: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const placesKeyRef = useRef<string>('');

  // Walking distance to next stop
  const currentPlace = places[currentStopIndex];
  const nextPlace = currentStopIndex < places.length - 1 ? places[currentStopIndex + 1] : null;
  const walkDistance =
    currentPlace?.latitude && currentPlace?.longitude && nextPlace?.latitude && nextPlace?.longitude
      ? haversineMeters(currentPlace.latitude, currentPlace.longitude, nextPlace.latitude, nextPlace.longitude)
      : null;

  // Initialize map ONCE
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    const firstWithCoords = places.find(p => p.latitude && p.longitude);
    const center: [number, number] = firstWithCoords
      ? [firstWithCoords.longitude!, firstWithCoords.latitude!]
      : [0, 20]; // World view — no London bias

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current = map;
    map.on('load', () => setLoaded(true));

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      placesKeyRef.current = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers and route
  const updateMapContent = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const validPlaces = places.filter(p => p.latitude && p.longitude);
    const placeKey = validPlaces.map(p => p.id).join(',');
    const placesChanged = placeKey !== placesKeyRef.current;

    // ── Rebuild route only when places change ──
    if (placesChanged) {
      placesKeyRef.current = placeKey;

      try {
        if (map.getLayer('route-line')) map.removeLayer('route-line');
        if (map.getSource('route')) map.removeSource('route');
      } catch { /* ignore */ }

      const coords = validPlaces.map(p => [p.longitude!, p.latitude!]);
      if (coords.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          lineMetrics: true,
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-gradient': [
              'interpolate', ['linear'], ['line-progress'],
              0, '#FF2D78',
              0.5, '#FF69B4',
              1, '#FF6A00',
            ],
            'line-width': 3,
            'line-opacity': 0.4,
            'line-dasharray': [2, 3],
          },
        });
      }

      // Fit bounds on initial load
      if (coords.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach(c => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      } else if (coords.length === 1) {
        map.flyTo({ center: coords[0] as [number, number], zoom: 15, duration: 1000 });
      }
    }

    // ── Always rebuild markers (state depends on currentStopIndex) ──
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    places.forEach((place, index) => {
      if (!place.latitude || !place.longitude) return;

      const state: MarkerState = index < currentStopIndex ? 'visited'
        : index === currentStopIndex ? 'current'
        : 'upcoming';

      const el = createMarkerElement(index, state, place.name);

      if (onMarkerClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick(index);
        });
      }

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);

      markersRef.current.push({ marker, el, index });
    });

    // Fly to current stop on navigation (not on initial place load)
    if (!placesChanged) {
      const cp = places[currentStopIndex];
      if (cp?.longitude && cp?.latitude) {
        map.flyTo({ center: [cp.longitude, cp.latitude], zoom: 15, duration: 1000 });
      }
    }
  }, [places, currentStopIndex, loaded, onMarkerClick]);

  useEffect(() => {
    updateMapContent();
  }, [updateMapContent]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`bg-black/5 flex items-center justify-center ${className}`}>
        <div className="text-center text-foreground/40 text-sm">
          <p className="font-medium">Map unavailable</p>
          <p className="text-xs mt-1">Set VITE_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {!loaded && (
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      )}

      {/* Walking distance to next stop */}
      {walkDistance !== null && nextPlace && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-lg border border-black/10 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/25" />
              <div className="w-6 border-t border-dashed border-foreground/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <span className="text-[11px] font-medium text-foreground/60">
              ~{formatWalkTime(walkDistance)} walk
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
