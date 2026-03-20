import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CityPlaceWithStories } from '@/types/library';

interface ExploreMapViewProps {
  places: CityPlaceWithStories[];
  selectedPlaceIds: Set<string>;
  userLocation?: { lat: number; lng: number } | null;
  onPlaceTap: (place: CityPlaceWithStories) => void;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;

function createExploreMarker(place: CityPlaceWithStories, isSelected: boolean): HTMLDivElement {
  const isMustSee = place.must_see;
  const circleSize = isMustSee ? 32 : 26;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    width: ${circleSize}px; height: ${circleSize}px;
    cursor: pointer;
  `;

  const circle = document.createElement('div');

  if (isSelected) {
    circle.style.cssText = `
      width: ${circleSize}px; height: ${circleSize}px; border-radius: 50%;
      background: var(--accent-pink); border: 2.5px solid white;
      box-shadow: 0 2px 10px rgba(var(--accent-pink-rgb),0.4);
      display: flex; align-items: center; justify-content: center;
      transition: box-shadow 0.2s ease;
    `;
    circle.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (isMustSee) {
    circle.style.cssText = `
      width: ${circleSize}px; height: ${circleSize}px; border-radius: 50%;
      background: var(--accent-pink);
      border: 2.5px solid white;
      box-shadow: 0 3px 12px rgba(var(--accent-pink-rgb),0.35);
      display: flex; align-items: center; justify-content: center;
      transition: box-shadow 0.2s ease;
    `;
    circle.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  } else {
    circle.style.cssText = `
      width: ${circleSize}px; height: ${circleSize}px; border-radius: 50%;
      background: var(--surface-elevated); border: 2px solid rgba(255,255,255,0.15);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      transition: box-shadow 0.2s ease;
    `;
    const categoryIcon = getCategoryIcon(place.category);
    circle.innerHTML = `<span style="font-size: 12px">${categoryIcon}</span>`;
  }

  wrapper.appendChild(circle);

  // Hover: intensify glow via box-shadow only (no transforms = no Mapbox conflict)
  wrapper.addEventListener('mouseenter', () => {
    circle.style.boxShadow = isSelected
      ? '0 2px 16px rgba(var(--accent-pink-rgb),0.6)'
      : isMustSee
        ? '0 3px 20px rgba(var(--accent-pink-rgb),0.5)'
        : '0 2px 12px rgba(0,0,0,0.5)';
  });
  wrapper.addEventListener('mouseleave', () => {
    circle.style.boxShadow = isSelected
      ? '0 2px 10px rgba(var(--accent-pink-rgb),0.4)'
      : isMustSee
        ? '0 3px 12px rgba(var(--accent-pink-rgb),0.35)'
        : '0 2px 6px rgba(0,0,0,0.3)';
  });

  return wrapper;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'landmark': '🏛️',
    'museum': '🎨',
    'park': '🌳',
    'church': '⛪',
    'market': '🛍️',
    'pub': '🍺',
    'restaurant': '🍽️',
    'bridge': '🌉',
    'square': '🏙️',
    'theatre': '🎭',
  };
  return icons[category?.toLowerCase()] || '📍';
}

function createUserLocationMarker(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position: relative; width: 16px; height: 16px;`;

  // Pulsing ring
  const pulse = document.createElement('div');
  pulse.style.cssText = `
    position: absolute; top: 50%; left: 50%; width: 32px; height: 32px;
    transform: translate(-50%, -50%); border-radius: 50%;
    background: rgba(var(--accent-pink-rgb), 0.25); pointer-events: none;
  `;
  pulse.animate([
    { transform: 'translate(-50%, -50%) scale(0.5)', opacity: '0.6' },
    { transform: 'translate(-50%, -50%) scale(2)', opacity: '0' },
  ], { duration: 2000, iterations: Infinity, easing: 'ease-out' });
  wrapper.appendChild(pulse);

  // Accent dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--accent-pink); border: 3px solid white;
    box-shadow: 0 2px 8px rgba(var(--accent-pink-rgb), 0.5);
  `;
  wrapper.appendChild(dot);

  return wrapper;
}

export function ExploreMapView({ places, selectedPlaceIds, userLocation, onPlaceTap, className = '' }: ExploreMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    const firstPlace = places.find(p => p.lat && p.lng);
    const center: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : firstPlace
        ? [firstPlace.lng, firstPlace.lat]
        : [-0.1278, 51.5074];

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
      userMarkerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validPlaces = places.filter(p => p.lat && p.lng);

    validPlaces.forEach((place) => {
      const isSelected = selectedPlaceIds.has(place.place_id);
      const el = createExploreMarker(place, isSelected);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPlaceTap(place);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (validPlaces.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validPlaces.forEach(p => bounds.extend([p.lng, p.lat]));
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else if (validPlaces.length === 1) {
      map.flyTo({ center: [validPlaces[0].lng, validPlaces[0].lat], zoom: 15, duration: 1000 });
    }
  }, [places, selectedPlaceIds, loaded, onPlaceTap, userLocation]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = createUserLocationMarker();
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
      userMarkerRef.current = marker;
    }
  }, [userLocation, loaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`bg-white/5 flex items-center justify-center ${className}`}>
        <div className="text-center text-foreground/40 text-sm">
          <p className="font-medium">Map unavailable</p>
          <p className="text-xs mt-1">Set VITE_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {!loaded && (
        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
