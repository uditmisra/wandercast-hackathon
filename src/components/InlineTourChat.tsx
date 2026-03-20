
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { useTourChatEngine } from '@/hooks/useTourChatEngine';
import { ChatConversation } from '@/components/chat/ChatConversation';

interface InlineTourChatProps {
  onTourGenerated: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
  prefillPrompt?: string;
}

export function InlineTourChat({ onTourGenerated, onTourUpdated, prefillPrompt }: InlineTourChatProps) {
  const {
    messages,
    isGenerating,
    showQuickStarts,
    input,
    setInput,
    handleSend,
    quickStarts,
  } = useTourChatEngine({ onTourGenerated, onTourUpdated, prefillPrompt });

  return (
    <div className="bg-white border border-black/10 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-5 max-h-64 overflow-y-auto overscroll-contain">
        <ChatConversation messages={messages} isGenerating={isGenerating} />
      </div>

      {showQuickStarts && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {quickStarts.map((qs, i) => (
              <button
                key={i}
                onClick={() => handleSend(qs)}
                disabled={isGenerating}
                className="text-xs px-3.5 py-2.5 min-h-[44px] rounded-full border border-black/10 text-foreground/60 hover:border-foreground/30 hover:text-foreground active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                {qs}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-black/5 p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 'Best of London' or 'Rome food tour'"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isGenerating}
          className="border-0 bg-black/5 rounded-full px-4 focus-visible:ring-1 focus-visible:ring-foreground"
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isGenerating}
          size="sm"
          className="rounded-full w-10 h-10 p-0 flex-shrink-0"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
