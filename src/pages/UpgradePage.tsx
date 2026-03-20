import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { GradientOrb } from '@/components/design/GradientOrb';
import { BrandLogo } from '@/components/BrandLogo';
import { analytics } from '@/utils/analytics';

const PREMIUM_GOLD = '#C5A059';

interface Benefit {
  text: string;
  disabled?: boolean;
}

const EXPLORER_BENEFITS: Benefit[] = [
  { text: '3 AI tours per month' },
  { text: 'Standard narration voice' },
  { text: 'Basic question answering' },
];

const VOYAGER_BENEFITS: Benefit[] = [
  { text: 'Unlimited AI tours' },
  { text: 'High-fidelity emotional voices' },
  { text: 'Unlimited Q&A per tour' },
  { text: 'Exclusive curated content' },
  { text: 'Offline audio downloads' },
];

const COMPARISON_DATA = [
  { feature: 'Tours per month', explorer: '3', voyager: 'Unlimited' },
  { feature: 'Voice quality', explorer: 'Standard', voyager: 'HD' },
  { feature: 'Questions per tour', explorer: '10', voyager: 'Unlimited' },
  { feature: 'Curated content', explorer: 'Limited', voyager: 'Full' },
  { feature: 'Offline mode', explorer: '\u2014', voyager: '\u2713' },
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPlan] = useState('explorer');
  const shownAtRef = useRef<number>(Date.now());

  useEffect(() => {
    // Infer referrer from navigation state set by callers
    const referrer = (location.state as any)?.upgradeReferrer ?? 'direct';
    analytics.upgradePageViewed({ referrer });
    analytics.paywallShown({ trigger: 'manual', location: 'page' });
    shownAtRef.current = Date.now();
  }, []);

  const handleUpgrade = () => {
    // TODO: Integrate Stripe payment provider
    analytics.checkoutStarted({ plan: 'plus', billing_period: 'monthly' });
    console.log('Upgrading to Voyager Plus...');
  };

  const handleBack = () => {
    analytics.paywallDismissed({ trigger: 'manual', time_on_paywall_ms: Date.now() - shownAtRef.current });
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-black text-sm uppercase tracking-wide">Back</span>
          </button>
          <BrandLogo size="sm" />
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Header */}
        <div className="relative pt-10 pb-8">
          <GradientOrb size={250} opacity={0.1} blur={60} className="-top-10 -right-20" />
          <h1 className="font-display text-[40px] leading-[1.1] text-foreground mb-2">
            Elevate Your<br />Journey
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
            Unlock high-fidelity narrators and expanded features for your global explorations.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="flex flex-col gap-5 mb-10">
          {/* Explorer (current) */}
          <div
            className="relative overflow-hidden p-6"
            style={{
              borderRadius: '40px 40px 4px 4px',
              border: currentPlan === 'explorer' ? '2px solid rgba(0,0,0,0.15)' : '1px solid rgba(0,0,0,0.1)',
              background: currentPlan === 'explorer' ? 'white' : 'rgba(255,255,255,0.4)',
            }}
          >
            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-card-foreground/50 mb-2 block">
              Current Plan
            </span>
            <h2 className="font-display text-2xl text-card-foreground mb-1">Explorer</h2>
            <span className="font-display text-lg italic text-card-foreground/60 mb-5 block">
              Included with membership
            </span>
            <ul className="flex flex-col gap-3">
              {EXPLORER_BENEFITS.map((b, i) => (
                <li key={i} className="text-[13px] flex items-center gap-2.5 text-card-foreground/70">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Voyager Plus (premium) */}
          <div
            className="relative overflow-hidden p-6"
            style={{
              borderRadius: '40px 40px 4px 4px',
              border: `2px solid ${PREMIUM_GOLD}`,
              background: 'white',
            }}
          >
            <GradientOrb size={120} opacity={0.15} blur={30} className="-top-10 -right-10" />

            <span
              className="absolute top-6 right-6 px-2.5 py-1 text-[9px] rounded-full uppercase font-bold text-white"
              style={{ background: PREMIUM_GOLD }}
            >
              Recommended
            </span>

            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold mb-2 block" style={{ color: PREMIUM_GOLD }}>
              Upgrade to
            </span>
            <h2 className="font-display text-2xl text-card-foreground mb-1">Voyager Plus</h2>
            <span className="font-display text-lg italic text-card-foreground/60 mb-5 block">
              $9.99 / month
            </span>
            <ul className="flex flex-col gap-3 relative z-10">
              {VOYAGER_BENEFITS.map((b, i) => (
                <li key={i} className="text-[13px] flex items-center gap-2.5 text-card-foreground/80">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: PREMIUM_GOLD }} />
                  {b.text}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              className="mt-6 w-full p-4 rounded-full text-xs font-semibold uppercase tracking-[0.1em] bg-card-foreground text-card hover:bg-card-foreground/90 active:scale-[0.98] transition-all"
            >
              Switch to Voyager Plus
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-10">
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}
          >
            Full Comparison
          </span>

          <div className="flex flex-col mt-2">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_60px_60px] py-3 text-[10px] uppercase tracking-[0.05em] text-foreground/40" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div>Feature</div>
              <div className="text-center">EXP</div>
              <div className="text-center font-bold" style={{ color: PREMIUM_GOLD }}>VP+</div>
            </div>

            {COMPARISON_DATA.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_60px] py-3 text-[13px] text-foreground/70" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>{row.feature}</div>
                <div className="text-center">{row.explorer}</div>
                <div className="text-center">{row.voyager}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-foreground/30">
          Subscriptions renew automatically. Cancel anytime in settings.
        </div>
      </div>
    </div>
  );
}
