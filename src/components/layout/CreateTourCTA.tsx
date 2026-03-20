import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, ChevronDown } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { useTourChatEngine } from '@/hooks/useTourChatEngine';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { useGeolocation } from '@/hooks/useGeolocation';

interface CreateTourCTAProps {
  onTourGenerated: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
}

export function CreateTourCTA({ onTourGenerated, onTourUpdated }: CreateTourCTAProps) {
  const [expanded, setExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // Auto-request location if previously granted
  useEffect(() => {
    if (expanded && geo.previouslyGranted && !geo.position && !geo.loading) {
      geo.requestPermission();
    }
  }, [expanded]);

  const handleTourGenerated = (tour: TourPlan) => {
    setExpanded(false);
    onTourGenerated(tour);
  };

  const {
    messages,
    isGenerating,
    showQuickStarts,
    input,
    setInput,
    handleSend,
    quickStarts,
  } = useTourChatEngine({
    onTourGenerated: handleTourGenerated,
    onTourUpdated,
    userLocation: geo.position,
  });

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded]);

  // Prevent body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed z-40 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white rounded-full px-5 py-3 active:scale-95 transition-all duration-150 hover:brightness-110"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-orange) 100%)',
          boxShadow: '0 4px 20px rgba(var(--accent-pink-rgb), 0.35), 0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-semibold">Create a tour</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => !isGenerating && setExpanded(false)}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 bg-background border-t border-border animate-slide-up"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '85vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag handle + close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-white/20" />
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => !isGenerating && setExpanded(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="px-5 pb-3">
          <h3 className="font-display text-lg text-white">Create a tour</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tell me where, what, or how you want to explore.</p>
        </div>

        {/* Chat messages */}
        <div
          className="px-5 overflow-y-auto"
          style={{ maxHeight: 'calc(85vh - 220px)', minHeight: 120 }}
        >
          <ChatConversation
            messages={messages}
            isGenerating={isGenerating}
          />
        </div>

        {/* Quick start pills */}
        {showQuickStarts && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex flex-wrap gap-2">
              {quickStarts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isGenerating}
                  className="text-xs px-3.5 py-2 rounded-full border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 active:scale-95 transition-all duration-150 disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-5 pt-3 pb-4">
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            isProcessing={isGenerating}
            placeholder="e.g. Hidden gems in Rome..."
            showLocationButton
            onLocationRequest={geo.requestPermission}
            locationAvailable={!!geo.position}
          />
        </div>
      </div>
    </div>
  );
}
