import React from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BuildBarProps {
  stopCount: number;
  onBuild: () => void;
  onClear: () => void;
}

export function BuildBar({ stopCount, onBuild, onClear }: BuildBarProps) {
  if (stopCount < 1) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-6xl mx-auto px-6 pb-2">
        <div className="pointer-events-auto bg-primary text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="bg-white text-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {stopCount}
            </span>
            <span className="text-sm font-medium">
              stop{stopCount !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClear}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-all duration-150 active:scale-90 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={onBuild}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-5 h-9 font-semibold shadow-lg shadow-white/10 active:scale-95 transition-all duration-150"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            {stopCount === 1 ? 'Play Story' : 'Build Tour'}
          </Button>
        </div>
      </div>
    </div>
  );
}
