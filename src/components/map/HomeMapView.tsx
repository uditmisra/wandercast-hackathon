import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CityPlaceWithStories, CityWithPlaces } from '@/types/library';

export interface NativePOI {
  name: string;
  lat: number;
  lng: number;
  category?: string;
}

interface HomeMapViewProps {
  cities: CityWithPlaces[];
  userLocation?: { lat: number; lng: number } | null;
  onPlaceTap: (place: CityPlaceWithStories, city: CityWithPlaces) => void;
  onNativePOITap?: (poi: NativePOI) => void;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;
const DEFAULT_ZOOM = 14;

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** City center coordinates for distance comparison */
function getCityCenter(city: CityWithPlaces): { lat: number; lng: number } {
  const validPlaces = city.places.filter(p => p.lat && p.lng);
  if (validPlaces.length === 0) return { lat: 51.5074, lng: -0.1278 };
  const lat = validPlaces.reduce((sum, p) => sum + p.lat, 0) / validPlaces.length;
  const lng = validPlaces.reduce((sum, p) => sum + p.lng, 0) / validPlaces.length;
  return { lat, lng };
}

function createGlowMarker(place: CityPlaceWithStories): HTMLDivElement {
  const isMustSee = place.must_see;
  const dotSize = isMustSee ? 14 : 10;
  const color = 'var(--accent-pink)';
  const colorRgb = 'var(--accent-pink-rgb)';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    width: ${dotSize + 12}px; height: ${dotSize + 12}px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  `;

  // Dot — centered by flexbox, hover uses box-shadow only (no transforms)
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%;
    background: ${color};
    border: 2px solid rgba(255,255,255,0.7);
    box-shadow: 0 0 ${isMustSee ? 12 : 8}px rgba(${colorRgb}, 0.5);
    transition: box-shadow 0.2s ease;
  `;
  wrapper.appendChild(dot);

  // Hover: intensify glow via box-shadow (no transform = no Mapbox conflict)
  wrapper.addEventListener('mouseenter', () => {
    dot.style.boxShadow = `0 0 20px rgba(${colorRgb}, 0.7), 0 0 40px rgba(${colorRgb}, 0.3)`;
  });
  wrapper.addEventListener('mouseleave', () => {
    dot.style.boxShadow = `0 0 ${isMustSee ? 12 : 8}px rgba(${colorRgb}, 0.5)`;
  });

  return wrapper;
}

/** Map Mapbox maki icon / class to our category taxonomy */
function mapMakiToCategory(maki?: string, poiClass?: string): string {
  if (!maki && !poiClass) return 'landmark';
  const m = (maki || '').toLowerCase();
  const c = (poiClass || '').toLowerCase();

  if (['museum', 'art-gallery'].includes(m) || c === 'arts_and_entertainment') return 'museum';
  if (['park', 'garden', 'campsite'].includes(m) || c === 'park_like') return 'park';
  if (['place-of-worship', 'religious-christian', 'religious-jewish', 'religious-muslim'].includes(m) || c === 'religion') return 'church';
  if (['restaurant', 'cafe', 'bar', 'fast-food', 'bakery'].includes(m) || c === 'food_and_drink') return 'restaurant';
  if (['lodging', 'hotel'].includes(m) || c === 'lodging') return 'hotel';
  if (['bridge'].includes(m)) return 'bridge';
  if (['theatre', 'cinema', 'music'].includes(m)) return 'theatre';
  if (['monument', 'castle', 'historic'].includes(m)) return 'landmark';
  if (['shop', 'grocery', 'clothing-store'].includes(m) || c === 'commercial_services') return 'market';
  if (['stadium', 'swimming', 'pitch'].includes(m) || c === 'sport_and_leisure') return 'park';
  return 'landmark';
}

function createUserLocationMarker(): HTMLDivElement {
  // Blue "you are here" — distinct from pink curated pins and white discovery dots
  const BLUE = '#4285F4';
  const BLUE_RGB = '66, 133, 244';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    width: 32px; height: 32px; position: relative;
    display: flex; align-items: center; justify-content: center;
  `;

  const pulse = document.createElement('div');
  pulse.style.cssText = `
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(${BLUE_RGB}, 0.25); pointer-events: none;
  `;
  pulse.animate([
    { transform: 'scale(0.5)', opacity: '0.6' },
    { transform: 'scale(1.5)', opacity: '0' },
  ], { duration: 2000, iterations: Infinity, easing: 'ease-out' });
  wrapper.appendChild(pulse);

  const dot = document.createElement('div');
  dot.style.cssText = `
    position: relative;
    width: 16px; height: 16px; border-radius: 50%;
    background: ${BLUE}; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(${BLUE_RGB}, 0.5);
  `;
  wrapper.appendChild(dot);

  return wrapper;
}

export function HomeMapView({ cities, userLocation, onPlaceTap, onNativePOITap, className = '' }: HomeMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const prevUserLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevActiveCitySlug = useRef<string | null>(null);

  // Legend is always visible — no toggle/timer needed

  // Determine which single city to show — nearest to user, or first available
  const activeCity = useMemo(() => {
    if (cities.length === 0) return null;
    if (!userLocation) return cities[0]; // Show nearest curated city; GPS flyTo overrides once resolved

    let nearest = cities[0];
    let minDist = Infinity;
    for (const city of cities) {
      const center = getCityCenter(city);
      const dist = haversineKm(userLocation.lat, userLocation.lng, center.lat, center.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }
    return nearest;
  }, [cities, userLocation]);

  const activePlaces = useMemo(() => {
    return activeCity?.places.filter(p => p.lat && p.lng) || [];
  }, [activeCity]);

  // Get initial center: user location, or the active city center
  const getInitialCenter = useCallback((): [number, number] => {
    if (userLocation) return [userLocation.lng, userLocation.lat];
    if (activeCity) {
      const center = getCityCenter(activeCity);
      return [center.lng, center.lat];
    }
    return [0, 20]; // World view — no city bias
  }, [userLocation, activeCity]);

  // Store callbacks and data in refs to avoid stale closures inside map.on('load')
  const onNativePOITapRef = useRef(onNativePOITap);
  useEffect(() => { onNativePOITapRef.current = onNativePOITap; }, [onNativePOITap]);

  const activePlacesRef = useRef(activePlaces);
  useEffect(() => { activePlacesRef.current = activePlaces; }, [activePlaces]);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    const initialCenter = getInitialCenter();
    const hasKnownLocation = !!(userLocation || activeCity);
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: hasKnownLocation ? DEFAULT_ZOOM : 2,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      setLoaded(true);

      // ─── Tourist POI classes that deserve visible markers ───
      // Filtered to genuinely interesting places — not restaurants, shops, transit
      const TOURIST_CLASSES = [
        'arts_and_entertainment', 'historic', 'landmark',
        'park_like', 'religion', 'visitor_amenities',
      ];

      // ─── Add visible dot markers for tourist POIs ───
      // Uses the same vector tile source as poi-label, but renders circle dots
      // filtered to tourist categories. WebGL-native — no DOM overhead.
      try {
        const poiLayerDef = map.getStyle()?.layers?.find(l => l.id === 'poi-label');
        const poiSource = (poiLayerDef as any)?.source ?? 'composite';
        const poiSourceLayer = (poiLayerDef as any)?.['source-layer'] ?? 'poi_label';

        map.addLayer({
          id: 'discovered-poi-dots',
          type: 'circle',
          source: poiSource,
          'source-layer': poiSourceLayer,
          minzoom: 12,
          filter: ['all',
            ['in', ['get', 'class'], ['literal', TOURIST_CLASSES]],
            ['<=', ['get', 'filterrank'], 3],
          ],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 5],
            'circle-color': 'rgba(255, 183, 77, 0.25)',
            'circle-stroke-color': 'rgba(255, 183, 77, 0.7)',
            'circle-stroke-width': 1.5,
          },
        }, 'poi-label'); // Render below text labels
      } catch (err) {
        console.warn('Could not add discovered-poi-dots layer:', err);
      }

      // ─── Shared click handler for native POIs ───
      let lastPoiClickMs = 0;
      const handleNativePOIClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
        // Debounce — both layers may fire for the same click
        const now = Date.now();
        if (now - lastPoiClickMs < 150) return;
        lastPoiClickMs = now;

        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as Record<string, any>;
        const name = props.name_en || props.name;
        if (!name) return;

        const coords: [number, number] =
          feature.geometry.type === 'Point'
            ? (feature.geometry as any).coordinates as [number, number]
            : [e.lngLat.lng, e.lngLat.lat];

        // Skip if overlaps with a curated place (within 50m)
        const curatedMatch = activePlacesRef.current.find(p => {
          const dist = haversineKm(coords[1], coords[0], p.lat, p.lng);
          return dist < 0.05;
        });
        if (curatedMatch) return;

        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        const category = mapMakiToCategory(props.maki, props.class);
        onNativePOITapRef.current?.({ name, lat: coords[1], lng: coords[0], category });
      };

      // Register on both the circle dots and the text labels
      map.on('click', 'discovered-poi-dots', handleNativePOIClick);
      map.on('click', 'poi-label', handleNativePOIClick);

      // Pointer cursor on hover for both layers
      ['poi-label', 'discovered-poi-dots'].forEach(layerId => {
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
      });
    });

    // Close popup on background clicks (not on POI or curated marker clicks)
    map.on('click', (e) => {
      try {
        const activeLayers = ['poi-label', 'discovered-poi-dots'].filter(id => !!map.getLayer(id));
        const hitFeatures = map.queryRenderedFeatures(e.point, { layers: activeLayers });
        if (hitFeatures.length > 0) return;
      } catch { /* layers not yet loaded */ }

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      userMarkerRef.current = null;
      popupRef.current = null;
      setLoaded(false); // Reset so dependent effects re-fire after HMR/strict mode
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to user location when GPS resolves (deduped by coords)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !userLocation) return;

    const prev = prevUserLocationRef.current;
    if (prev && prev.lat === userLocation.lat && prev.lng === userLocation.lng) return;
    prevUserLocationRef.current = userLocation;

    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: DEFAULT_ZOOM, duration: 2000 });
  }, [userLocation, loaded]);

  // When active city changes (e.g. GPS resolves to a different city), fly there
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !activeCity) return;
    if (prevActiveCitySlug.current === activeCity.slug) return;
    prevActiveCitySlug.current = activeCity.slug;

    // Only fly to city if user GPS hasn't resolved yet
    if (!prevUserLocationRef.current) {
      const center = getCityCenter(activeCity);
      map.flyTo({ center: [center.lng, center.lat], zoom: DEFAULT_ZOOM, duration: 1500 });
    }
  }, [activeCity, loaded]);

  // Update curated markers — only for the active city
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !activeCity) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Close any open popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    activePlaces.forEach((place) => {
      const el = createGlowMarker(place);

      el.addEventListener('click', (e) => {
        e.stopPropagation();

        // Remove existing popup
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        const story = place.stories[0];

        const popupContent = document.createElement('div');
        popupContent.style.cssText = `font-family: inherit; min-width: 180px; max-width: 220px;`;
        popupContent.innerHTML = `
          <div style="padding: 2px 0;">
            <p style="font-size: 14px; font-weight: 600; color: #fff; margin: 0 0 4px 0; line-height: 1.2;">
              ${place.name}
            </p>
            <p style="font-size: 11px; color: var(--muted-foreground, #999); margin: 0 0 8px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${story?.hook || ''}
            </p>
            <button id="play-${place.place_id}" style="
              display: inline-flex; align-items: center; gap: 6px;
              background: var(--accent-pink); color: white; border: none; border-radius: 20px;
              padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer;
              transition: background 0.15s;
            ">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              Play story
            </button>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          className: 'home-map-popup',
          maxWidth: '240px',
        })
          .setLngLat([place.lng, place.lat])
          .setDOMContent(popupContent)
          .addTo(map);

        popupRef.current = popup;

        // Attach play handler
        setTimeout(() => {
          const btn = document.getElementById(`play-${place.place_id}`);
          if (btn) {
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              popup.remove();
              popupRef.current = null;
              onPlaceTap(place, activeCity);
            });
          }
        }, 0);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds to the single city's places (only on initial load, not on every re-render)
    if (activePlaces.length > 1 && !prevUserLocationRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      activePlaces.forEach(p => bounds.extend([p.lng, p.lat]));
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(bounds, { padding: { top: 60, bottom: 300, left: 40, right: 40 }, maxZoom: 15 });
    }
  }, [activePlaces, activeCity, loaded, onPlaceTap, userLocation]);

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
        <div className="text-center text-muted-foreground text-sm">
          <p className="font-medium">Map unavailable</p>
          <p className="text-xs mt-1 text-muted-foreground">Set VITE_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'absolute' }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Map legend — always visible */}
      {loaded && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-black/70 backdrop-blur-md rounded-xl px-3.5 py-2.5 space-y-1.5 border border-white/10 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-pink)', boxShadow: '0 0 6px rgba(var(--accent-pink-rgb), 0.5)' }} />
              <span className="text-[11px] text-white/80">Curated stories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border" style={{ background: 'rgba(255, 183, 77, 0.25)', borderColor: 'rgba(255, 183, 77, 0.7)' }} />
              <span className="text-[11px] text-white/80">Tap to discover</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#4285F4', border: '1.5px solid white' }} />
                <span className="text-[11px] text-white/80">You</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
