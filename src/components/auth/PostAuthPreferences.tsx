import { useState } from 'react';
import { AVAILABLE_INTERESTS } from '@/types/tour';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { BrandLogo } from '@/components/BrandLogo';
import { analytics } from '@/utils/analytics';

const TONE_OPTIONS = [
  { value: 'casual', label: 'Friendly & Casual', desc: 'Like chatting with a local friend' },
  { value: 'scholarly', label: 'Deep & Scholarly', desc: 'Rich historical detail and context' },
  { value: 'dramatic', label: 'Atmospheric & Dramatic', desc: 'Vivid scenes that come alive' },
  { value: 'witty', label: 'Witty & Charming', desc: 'Stories told with personality' },
] as const;

interface PostAuthPreferencesProps {
  onComplete: () => void;
}

/**
 * Compact post-signup preference picker shown inline after auth wall sign-up.
 * Elena Verna PLG pattern: user just experienced the "aha moment" (first stop audio),
 * now capture preferences so every subsequent stop is personalized.
 * Two phases: tone → interests. Quick, 2-tap, feels value-additive.
 */
export function PostAuthPreferences({ onComplete }: PostAuthPreferencesProps) {
  const { updatePreferences } = useUserPreferences();
  const [phase, setPhase] = useState<'tone' | 'interests'>('tone');
  const [selectedTone, setSelectedTone] = useState('casual');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleContinue = () => {
    if (phase === 'tone') {
      setPhase('interests');
      return;
    }
    updatePreferences({
      preferredTone: selectedTone,
      interests: selectedInterests,
    });
    analytics.preferencesSet({ tone: selectedTone, interestCount: selectedInterests.length, source: 'post-auth' });
    onComplete();
  };

  const handleSkip = () => {
    analytics.preferencesSkipped({ source: 'post-auth' });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <BrandLogo size="sm" className="mb-6 opacity-60" />

        {phase === 'tone' ? (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Personalise your tours
            </h2>
            <p className="text-sm text-foreground/50 mb-5">
              How should your guide sound?
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {TONE_OPTIONS.map(tone => {
                const isSelected = selectedTone === tone.value;
                return (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    className={`text-left rounded-xl py-3 px-4 transition-all duration-150 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-card border-primary/50'
                        : 'bg-transparent border-white/10'
                    }`}
                    style={{ border: `1px solid ${isSelected ? 'var(--accent-pink)' : 'rgba(255,255,255,0.1)'}` }}
                  >
                    <span className="text-sm font-semibold text-foreground block">{tone.label}</span>
                    <span className="text-xs text-foreground/50 mt-0.5 block">{tone.desc}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">
              What stories interest you?
            </h2>
            <p className="text-sm text-foreground/50 mb-5">
              Pick a few — we'll weave them into every tour.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {AVAILABLE_INTERESTS.map(interest => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => setSelectedInterests(prev =>
                      prev.includes(interest.id) ? prev.filter(i => i !== interest.id) : [...prev, interest.id]
                    )}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-transparent text-foreground/70'
                    }`}
                    style={{ border: `1px solid ${isSelected ? 'var(--accent-pink)' : 'rgba(255,255,255,0.1)'}` }}
                  >
                    {interest.icon} {interest.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          onClick={handleContinue}
          className="w-full h-11 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all duration-150 mb-3"
        >
          {phase === 'tone' ? 'Continue' : 'Start listening'}
        </button>
        <button
          onClick={handleSkip}
          className="w-full text-center text-sm text-foreground/40 hover:text-foreground/60 transition-colors py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
