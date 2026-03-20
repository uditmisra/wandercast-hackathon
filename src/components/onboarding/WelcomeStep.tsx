import { Headphones, MessageSquare, Sparkles } from 'lucide-react';
import { GradientOrb } from '@/components/design/GradientOrb';
import { BrandLogo } from '@/components/BrandLogo';
import { ONBOARDING_IMAGES } from '@/utils/cityImages';

interface WelcomeStepProps {
  onContinue: () => void;
  onSignIn: () => void;
}

const PREVIEW_CARDS = [
  {
    place: 'Colosseum',
    city: 'Rome',
    snippet: '"Fifty thousand voices once shook these walls. Stand where emperors decided fates with a thumbs-down..."',
    image: ONBOARDING_IMAGES.colosseum,
  },
  {
    place: 'Tower Bridge',
    city: 'London',
    snippet: '"Look up — those walkways were once called \'the most expensive promenade in the world,\' and almost nobody used them..."',
    image: ONBOARDING_IMAGES['tower-bridge'],
  },
  {
    place: 'Sacré-Cœur',
    city: 'Paris',
    snippet: '"The stone of this basilica secretes calcite when it rains, so it actually gets whiter with age..."',
    image: ONBOARDING_IMAGES['sacre-coeur'],
  },
  {
    place: 'Central Park',
    city: 'New York',
    snippet: '"Nothing here is natural. Every rock, every lake, every hill was placed by Frederick Law Olmsted\'s vision..."',
    image: ONBOARDING_IMAGES['central-park'],
  },
];

const ORB_STYLES = [
  { background: 'radial-gradient(circle at 30% 30%, var(--accent-pink), #5B8AFF, var(--accent-orange))' },
  { background: 'radial-gradient(circle, #5B8AFF, var(--accent-pink))' },
  { background: 'radial-gradient(circle, var(--accent-orange), var(--accent-pink))' },
  { background: 'radial-gradient(circle at 70% 30%, var(--accent-pink), #5B8AFF, var(--accent-orange))' },
];

const VALUE_PROPS = [
  {
    icon: Headphones,
    title: 'Stories you hear, not read',
    desc: 'Every stop comes alive with narration — history, secrets, and the things guidebooks leave out.',
  },
  {
    icon: MessageSquare,
    title: 'Curious about something? Just ask.',
    desc: '"Who built this?" "Where should I eat nearby?" Get real answers, spoken back to you, mid-tour.',
  },
  {
    icon: Sparkles,
    title: 'Built around what you care about',
    desc: 'Choose your tone. Pick your interests. Every tour is shaped to the way you like to explore.',
  },
];

export function WelcomeStep({ onContinue, onSignIn }: WelcomeStepProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <GradientOrb size={600} opacity={0.09} blur={120} className="-top-48 left-1/2 -translate-x-1/2" />
      <GradientOrb size={350} opacity={0.07} blur={70} className="top-[55%] -right-24 lg:-right-10" />

      {/* Logo */}
      <header className="pt-10 sm:pt-14 pb-2 flex justify-center">
        <BrandLogo size="sm" className="text-foreground/70" />
      </header>

      <main className="flex-1 overflow-y-auto">

        {/* ── Hero + CTA — fits in first viewport ── */}
        <section className="px-6 pt-6 sm:pt-10 lg:pt-14 pb-8 sm:pb-10 text-center max-w-3xl mx-auto min-h-[calc(100vh-160px)] sm:min-h-0 flex flex-col justify-center">
          <h1 className="font-sans text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.08] font-bold tracking-tight text-foreground">
            Every place has a story.
            <br />
            <span className="text-foreground/60">Now you can hear it.</span>
          </h1>
          <p className="text-[15px] sm:text-[17px] lg:text-[19px] leading-[1.6] text-foreground/70 mt-5 sm:mt-7 max-w-lg mx-auto">
            Wandercast turns any walk into a narrated experience. Pick a place — anywhere in the world — and get an AI-crafted audio tour tailored to your curiosity.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <button
              onClick={onContinue}
              className="bg-primary text-white py-4 sm:py-[18px] rounded-full font-semibold uppercase tracking-[0.1em] text-[13px] sm:text-[14px] active:scale-[0.97] transition-all duration-150 hover:bg-primary/90 w-full max-w-sm"
            >
              Get started
            </button>
            <button
              onClick={onSignIn}
              className="bg-transparent text-foreground/70 py-2 text-[11px] sm:text-[12px] uppercase tracking-[0.1em] font-medium hover:text-foreground transition-colors"
            >
              Already have an account?{' '}
              <span className="text-foreground font-semibold">Sign in</span>
            </button>
          </div>
        </section>

        {/* ── Preview cards ── */}
        <section className="pb-8 sm:pb-12 lg:pb-16 px-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PREVIEW_CARDS.map((card, i) => (
              <div
                key={card.place}
                className="bg-card relative overflow-hidden"
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Image strip */}
                {card.image && (
                  <div className="relative h-[90px] overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.place}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, var(--surface-elevated), transparent 80%)' }}
                    />
                  </div>
                )}
                <div style={{ padding: '10px 16px 16px' }}>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-foreground/50 mb-0.5 block relative z-10 font-medium">
                    {card.city}
                  </span>
                  <span className="font-display text-[16px] sm:text-[18px] leading-[1.1] text-foreground relative z-10 block">
                    {card.place}
                  </span>
                  <p className="text-[10px] leading-[1.4] text-foreground/50 mt-2 relative z-10 line-clamp-2 italic">
                    {card.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value props — panel surface band ── */}
        <section className="pb-10 sm:pb-14 lg:pb-16">
          <div className="panel-surface corner-glow py-10 sm:py-12 lg:py-14 px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
                {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
                  <div key={title}>
                    <div className="w-11 h-11 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center mb-4 sm:mb-3 lg:mb-4">
                      <Icon className="w-5 h-5 sm:w-[18px] sm:h-[18px] lg:w-[22px] lg:h-[22px] text-foreground/70" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[15px] sm:text-[14px] lg:text-[16px] font-semibold text-foreground leading-snug">
                      {title}
                    </h3>
                    <p className="text-[13px] sm:text-[12px] lg:text-[14px] leading-[1.5] text-foreground/70 mt-1.5">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="px-6 pb-8 sm:pb-12 text-center">
          <p className="text-[12px] sm:text-[13px] text-foreground/70 font-medium tracking-wide">
            Works in any city. Free to start. No account required.
          </p>
        </section>
      </main>

      <div className="h-4" />
    </div>
  );
}
