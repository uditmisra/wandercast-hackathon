import React, { useState, useCallback } from 'react';
import { Phone } from 'lucide-react';

const VoiceAgentWrapper = React.lazy(() =>
  import('@/components/VoiceAgentWrapper').then(m => ({ default: m.VoiceAgentWrapper }))
);

const SUGGESTIONS = [
  { label: 'Colosseum, Rome', place: 'Colosseum', city: 'Rome' },
  { label: 'Eiffel Tower, Paris', place: 'Eiffel Tower', city: 'Paris' },
  { label: 'Edinburgh Castle', place: 'Edinburgh Castle', city: 'Edinburgh' },
  { label: 'Taj Mahal, Agra', place: 'Taj Mahal', city: 'Agra' },
  { label: 'Shibuya Crossing, Tokyo', place: 'Shibuya Crossing', city: 'Tokyo' },
  { label: 'Brooklyn Bridge, NYC', place: 'Brooklyn Bridge', city: 'New York' },
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

export default function ConversationPage() {
  const [view, setView] = useState<'home' | 'conversation'>('home');
  const [input, setInput] = useState('');
  const [activePlace, setActivePlace] = useState({ place: '', city: '' });

  const startConversation = useCallback((place: string, city: string) => {
    if (!place.trim()) return;
    setActivePlace({ place: place.trim(), city: city.trim() });
    setView('conversation');
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
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/[0.03] blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Brand */}
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-3 tracking-tight">
          Wandercast
        </h1>
        <p className="text-white/50 text-lg sm:text-xl mb-12">
          Talk to any place on Earth
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Colosseum, Rome"
              autoFocus
              className="w-full rounded-2xl bg-white/[0.05] border border-white/[0.1] text-white text-lg py-4 px-6 pr-14 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Phone className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => startConversation(s.place, s.city)}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.08] hover:text-white/70 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-6 text-white/15 text-xs">
        Powered by ElevenLabs + Firecrawl
      </div>
    </div>
  );
}
