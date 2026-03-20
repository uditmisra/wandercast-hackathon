import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AVAILABLE_INTERESTS } from '@/types/tour';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { BrandLogo } from '@/components/BrandLogo';
import { analytics } from '@/utils/analytics';

interface PreferencesStepProps {
  onContinue: (tones: string[], interests: string[]) => void;
  onBack: () => void;
}

const TONE_OPTIONS = [
  { value: 'casual', label: 'Friendly & Casual', desc: 'Like chatting with a local friend' },
  { value: 'scholarly', label: 'Deep & Scholarly', desc: 'Rich historical detail and context' },
  { value: 'dramatic', label: 'Atmospheric & Dramatic', desc: 'Vivid scenes that come alive' },
  { value: 'witty', label: 'Witty & Charming', desc: 'Stories told with personality' },
] as const;

type Phase = 'tone' | 'interests';

export function PreferencesStep({ onContinue, onBack }: PreferencesStepProps) {
  const { updatePreferences } = useUserPreferences();
  const [phase, setPhase] = useState<Phase>('tone');
  const [selectedTones, setSelectedTones] = useState<string[]>(['casual']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleTone = (value: string) => {
    setSelectedTones(prev => {
      if (prev.includes(value)) {
        return prev.length > 1 ? prev.filter(t => t !== value) : prev;
      }
      return [...prev, value];
    });
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCTA = () => {
    if (phase === 'tone') {
      setPhase('interests');
      return;
    }
    updatePreferences({
      preferredTone: selectedTones[0],
      interests: selectedInterests,
    });
    analytics.preferencesSet({ tone: selectedTones[0], interestCount: selectedInterests.length, source: 'onboarding' });
    onContinue(selectedTones, selectedInterests);
  };

  const handleBack = () => {
    if (phase === 'interests') {
      setPhase('tone');
      return;
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-[0.1em] font-semibold">Back</span>
        </button>
        <BrandLogo size="sm" className="text-foreground/70" />
        <div className="w-16" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="max-w-3xl mx-auto">

          {phase === 'tone' && (
            <div className="mt-4">
              <span
                className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground/70 block pb-2 mb-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                How should your guide sound?
              </span>
              <p className="text-[13px] text-foreground/70 mb-5">Select one or more — we'll blend them into your experience.</p>

              <div className="grid grid-cols-2 gap-3">
                {TONE_OPTIONS.map(tone => {
                  const isSelected = selectedTones.includes(tone.value);
                  return (
                    <button
                      key={tone.value}
                      onClick={() => toggleTone(tone.value)}
                      className={`text-left rounded-2xl py-4 px-5 transition-all duration-150 active:scale-[0.98] ${
                        isSelected ? 'bg-card' : 'bg-transparent'
                      }`}
                      style={{
                        border: isSelected ? '1.5px solid var(--accent-pink)' : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[14px] font-semibold text-foreground">{tone.label}</span>
                        {isSelected && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: 'radial-gradient(circle at 30% 30%, var(--accent-pink), #5B8AFF, var(--accent-orange))' }}
                          />
                        )}
                      </div>
                      <span className="text-[12px] text-foreground/70 mt-1 block">{tone.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {phase === 'interests' && (
            <div className="mt-4">
              <span
                className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground/70 block pb-2 mb-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                What stories interest you?
              </span>
              <p className="text-[13px] text-foreground/70 mb-5">Pick as many as you like — this helps us personalise your tours.</p>

              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-transparent text-foreground/80 hover:text-foreground'
                      }`}
                      style={{
                        border: isSelected ? '1px solid var(--accent-pink)' : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {interest.icon} {interest.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 bg-gradient-to-t from-background via-background to-transparent" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={handleCTA}
          className="w-full max-w-md mx-auto block bg-primary text-white py-5 rounded-full font-semibold uppercase tracking-[0.1em] text-[13px] active:scale-95 transition-all duration-150 hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
