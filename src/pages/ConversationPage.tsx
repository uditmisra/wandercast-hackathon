import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Phone, MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const VoiceAgentWrapper = React.lazy(() =>
  import('@/components/VoiceAgentWrapper').then(m => ({ default: m.VoiceAgentWrapper }))
);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN;

const SUGGESTIONS = [
  { label: 'Colosseum, Rome', place: 'Colosseum', city: 'Rome', lng: 12.4924, lat: 41.8902 },
  { label: 'Eiffel Tower, Paris', place: 'Eiffel Tower', city: 'Paris', lng: 2.2945, lat: 48.8584 },
  { label: 'Edinburgh Castle', place: 'Edinburgh Castle', city: 'Edinburgh', lng: -3.2007, lat: 55.9486 },
  { label: 'Taj Mahal, Agra', place: 'Taj Mahal', city: 'Agra', lng: 78.0421, lat: 27.1751 },
  { label: 'Shibuya Crossing, Tokyo', place: 'Shibuya Crossing', city: 'Tokyo', lng: 139.7016, lat: 35.6595 },
  { label: 'Brooklyn Bridge, NYC', place: 'Brooklyn Bridge', city: 'New York', lng: -73.9969, lat: 40.7061 },
];

function parseInput(input: string): { place: string; city: string } {
  const trimmed = input.trim();
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx > 0) {
    return {
      place: trimmed.slice(0, commaIdx).trim(),
      city: trimmed.slice(commaIdx + 1).trim(),
    };
  }
  return { place: trimmed, city: '' };
}

/** Ambient dark globe map — decorative backdrop that flies to locations */
const ambientMapRef = { current: null as mapboxgl.Map | null };
let rotateActive = true;

function flyMapTo(lng: number, lat: number) {
  if (!ambientMapRef.current) return;
  rotateActive = false;
  ambientMapRef.current.flyTo({
    center: [lng, lat],
    zoom: 4,
    duration: 3000,
    curve: 1.5,
  });
}

function AmbientMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || ambientMapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 30],
      zoom: 1.5,
      interactive: false,
      attributionControl: false,
      projection: 'globe' as any,
    });

    map.on('style.load', () => {
      map.setFog({
        color: 'rgba(15, 15, 40, 0.3)',
        'high-color': 'rgba(80, 60, 150, 0.3)',
        'horizon-blend': 0.04,
        'space-color': 'rgba(8, 8, 20, 1)',
        'star-intensity': 0.5,
      } as any);
    });

    // Slow auto-rotate (stops when flyTo is triggered)
    const rotate = () => {
      if (!ambientMapRef.current) return;
      if (rotateActive) {
        const center = ambientMapRef.current.getCenter();
        center.lng += 0.01;
        ambientMapRef.current.setCenter(center);
      }
      requestAnimationFrame(rotate);
    };
    map.on('load', () => {
      rotate();
      // Try to center on user's location
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          if (ambientMapRef.current && rotateActive) {
            ambientMapRef.current.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 3,
              duration: 4000,
            });
          }
        },
        () => {}, // silently ignore if denied
        { timeout: 5000 }
      );
    });

    ambientMapRef.current = map;

    return () => {
      ambientMapRef.current = null;
      rotateActive = true;
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ filter: 'saturate(0.8) brightness(1)' }}
    />
  );
}

export default function ConversationPage() {
  const [view, setView] = useState<'home' | 'conversation'>('home');
  const [input, setInput] = useState('');
  const [activePlace, setActivePlace] = useState({ place: '', city: '' });
  const [focusedSuggestion, setFocusedSuggestion] = useState<number | null>(null);

  const startConversation = useCallback((place: string, city: string, lng?: number, lat?: number) => {
    if (!place.trim()) return;
    setActivePlace({ place: place.trim(), city: city.trim() });

    // Fly map to location, then start conversation after a brief visual moment
    if (lng && lat) {
      flyMapTo(lng, lat);
      setTimeout(() => setView('conversation'), 1500);
    } else if (MAPBOX_TOKEN) {
      // Geocode the typed place, fly to it, then start
      const query = encodeURIComponent(city ? `${place}, ${city}` : place);
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
        .then(r => r.json())
        .then(data => {
          const [geoLng, geoLat] = data.features?.[0]?.center || [];
          if (geoLng && geoLat) flyMapTo(geoLng, geoLat);
          setTimeout(() => setView('conversation'), 1500);
        })
        .catch(() => setView('conversation'));
    } else {
      setView('conversation');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { place, city } = parseInput(input);
    startConversation(place, city);
  };

  if (view === 'conversation') {
    const placeObj = {
      id: `place-${Date.now()}`,
      name: activePlace.place,
      city: activePlace.city,
      country: '',
      description: '',
      estimatedDuration: 0,
    };

    const tourContext = {
      title: `Conversation about ${activePlace.place}`,
      interests: [] as any[],
      personalization: { preferredTone: 'casual' },
    };

    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-violet-400/50 rounded-full animate-spin" />
        </div>
      }>
        <VoiceAgentWrapper
          place={placeObj as any}
          tourContext={tourContext}
          onClose={() => {
            setView('home');
            setInput('');
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient globe map backdrop */}
      <AmbientMap />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%)',
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-violet-600/[0.06] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg text-center px-5 sm:px-6">
        {/* Brand */}
        <div className="mb-10 sm:mb-16">
          <h1 className="font-display text-4xl sm:text-6xl text-white mb-2 sm:mb-4 tracking-tight drop-shadow-lg">
            Wandercast
          </h1>
          <p className="text-white/40 text-base sm:text-xl font-light tracking-wide">
            Talk to any place on Earth
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-violet-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 sm:left-5 w-5 h-5 text-white/20" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Where do you want to go?"
                autoFocus
                className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.1] text-white text-base sm:text-lg py-3.5 sm:py-4 pl-12 sm:pl-14 pr-14 sm:pr-16 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 sm:right-2.5 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:bg-white/[0.06] disabled:border disabled:border-white/[0.06] disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-violet-500/25 disabled:shadow-none"
              >
                <Phone className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => startConversation(s.place, s.city, s.lng, s.lat)}
              onMouseEnter={() => setFocusedSuggestion(i)}
              onMouseLeave={() => setFocusedSuggestion(null)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm transition-all duration-300 active:scale-95 ${
                focusedSuggestion === i
                  ? 'bg-violet-500/15 border-violet-500/30 text-white/80'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60 hover:border-white/[0.12]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className={`w-3 h-3 transition-colors duration-300 ${
                  focusedSuggestion === i ? 'text-violet-400' : 'text-white/20'
                }`} />
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 sm:bottom-6 text-white/10 text-[10px] sm:text-xs tracking-wider" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        Powered by ElevenLabs + Firecrawl
      </div>
    </div>
  );
}
