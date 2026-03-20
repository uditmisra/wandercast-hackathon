import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { WelcomeStep } from './WelcomeStep';
import { PreferencesStep } from './PreferencesStep';
import { DemoStep } from './DemoStep';
import { analytics } from '@/utils/analytics';

type OnboardingStep = 0 | 1 | 2;

const STEP_KEY = 'wandercast_onboarding_step';

function readSavedStep(): OnboardingStep {
  const saved = localStorage.getItem(STEP_KEY);
  const parsed = saved ? parseInt(saved, 10) : 0;
  return (parsed >= 0 && parsed <= 2 ? parsed : 0) as OnboardingStep;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();

  const [step, setStep] = useState<OnboardingStep>(readSavedStep);
  const [displayStep, setDisplayStep] = useState<OnboardingStep>(step);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedTone, setSelectedTone] = useState(preferences.preferredTone || 'casual');

  const goToStep = useCallback((newStep: OnboardingStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setDisplayStep(newStep);
      localStorage.setItem(STEP_KEY, String(newStep));
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleSignIn = useCallback(() => {
    localStorage.setItem(STEP_KEY, '1');
    navigate('/auth');
  }, [navigate]);

  const handlePreferencesContinue = useCallback((tones: string[], _interests: string[]) => {
    setSelectedTone(tones[0] || 'casual');
    goToStep(2);
  }, [goToStep]);

  const handleComplete = useCallback(() => {
    localStorage.removeItem(STEP_KEY);
    analytics.onboardingCompleted();
    onComplete();
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        key={displayStep}
        className={isTransitioning ? 'animate-onboarding-out' : 'animate-onboarding-in'}
      >
        {displayStep === 0 && (
          <WelcomeStep
            onContinue={() => goToStep(1)}
            onSignIn={handleSignIn}
          />
        )}
        {displayStep === 1 && (
          <PreferencesStep
            onContinue={handlePreferencesContinue}
            onBack={() => goToStep(0)}
          />
        )}
        {displayStep === 2 && (
          <DemoStep
            selectedTone={selectedTone}
            onComplete={handleComplete}
            onBack={() => goToStep(1)}
          />
        )}
      </div>

      {/* Step indicator dots */}
      <div className="fixed left-1/2 -translate-x-1/2 flex gap-3 items-center z-50" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {([0, 1, 2] as const).map(i => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === step
                ? 'w-2 h-2 bg-primary'
                : 'w-1.5 h-1.5 bg-foreground/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
