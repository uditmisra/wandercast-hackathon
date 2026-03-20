import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Headphones, Globe, Mic, Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TourPlan } from '@/types/tour';
import { useNavigate } from 'react-router-dom';
import { InlineTourChat } from '@/components/InlineTourChat';
import { GradientOrb } from '@/components/design/GradientOrb';

interface HomePageProps {
  onCreateTour: () => void;
  onPlayTour: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
  savedTours?: TourPlan[];
  prefillPrompt?: string;
  onBrowseLibrary?: () => void;
}

export default function HomePage({ onCreateTour, onPlayTour, onTourUpdated, savedTours = [], prefillPrompt, onBrowseLibrary }: HomePageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(!!prefillPrompt);

  const handleTourGenerated = (tour: TourPlan) => {
    onPlayTour(tour);
  };

  return (
    <div>
      {/* Hero — desktop: 2 columns */}
      <div className="relative overflow-hidden">
        <GradientOrb size={500} opacity={0.3} blur={80} className="-top-40 right-[-10%] lg:right-[5%]" />
        <GradientOrb size={300} opacity={0.15} blur={40} className="top-20 -left-20" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

        {/* Left: Hero text */}
        <div className="relative z-10 lg:text-left text-center">
          <h1 className="font-display text-[42px] md:text-6xl lg:text-7xl leading-[0.95] font-normal text-foreground">
            Create your
            <br />
            audio journey
          </h1>
          <p className="mt-6 text-lg text-foreground/50 max-w-xl lg:max-w-md leading-relaxed">
            Explore curated walking tours or create your own with AI. Rich narration for every stop.
          </p>

          {!showChat && (
            <div className="mt-10 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-start justify-center items-center">
              <Button
                size="lg"
                onClick={onBrowseLibrary}
                className="h-14 px-8 text-base font-semibold rounded-full"
              >
                <Compass className="w-5 h-5 mr-2" />
                Browse Tours
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowChat(true)}
                className="h-14 px-8 text-base font-semibold rounded-full border-white/10"
              >
                <Mic className="w-5 h-5 mr-2" />
                Create with AI
              </Button>
            </div>
          )}

          {showChat && (
            <div className="mt-10 max-w-2xl lg:max-w-full">
              <InlineTourChat onTourGenerated={handleTourGenerated} onTourUpdated={onTourUpdated} prefillPrompt={prefillPrompt} />
            </div>
          )}
        </div>

        {/* Right: Featured preview (desktop only, when chat is hidden) */}
        {!showChat && (
          <div className="hidden lg:block relative">
            <div className="relative overflow-hidden p-8 bg-card" style={{ borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
              <GradientOrb size={200} opacity={0.3} blur={20} className="-top-5 -right-5" />
              <div className="relative z-10">
                <span className="section-label text-foreground/50 mb-4">Featured</span>
                <h3 className="font-display text-2xl mt-4 text-foreground">London Walking Tours</h3>
                <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                  48 curated stories across iconic landmarks, hidden passages, and local favourites.
                </p>
                <Button
                  variant="outline"
                  onClick={onBrowseLibrary}
                  className="mt-6 rounded-full border-white/10"
                >
                  Explore
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6">
      {!showChat && (
        <>
          <div className="py-16 border-t border-white/5">
            <span className="section-label text-foreground/50 mb-8">How it works</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
              <div className="text-center lg:text-left">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-5">
                  <Compass className="w-7 h-7 text-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Browse or create</h3>
                <p className="text-foreground/50 leading-relaxed">
                  Pick from curated walking tours or describe your ideal experience and let AI build it.
                </p>
              </div>

              <div className="text-center lg:text-left">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-5">
                  <Headphones className="w-7 h-7 text-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Listen & explore</h3>
                <p className="text-foreground/50 leading-relaxed">
                  Rich narration for every stop. Ask follow-up questions mid-tour and get spoken answers.
                </p>
              </div>

              <div className="text-center lg:text-left">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-5">
                  <Globe className="w-7 h-7 text-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Any city, any vibe</h3>
                <p className="text-foreground/50 leading-relaxed">
                  Choose your tone — casual, scholarly, dramatic, or witty. Every story told your way.
                </p>
              </div>
            </div>
          </div>

          {/* Saved Tours — list format matching design */}
          {user && savedTours.length > 0 && (
            <div className="py-12">
              <div className="flex items-baseline justify-between mb-6" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold">Your Library</span>
              </div>

              <div className="flex flex-col">
                {savedTours.slice(0, 4).map((tour) => {
                  const isRecent = tour.createdAt && (Date.now() - new Date(tour.createdAt).getTime()) < 24 * 60 * 60 * 1000;
                  return (
                    <button
                      key={tour.id}
                      onClick={() => onPlayTour(tour)}
                      className="group flex items-center justify-between py-5 text-left cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                            style={{ background: isRecent ? 'radial-gradient(circle at 30% 30%, var(--accent-pink), var(--accent-pink-light, #E74D8B), var(--accent-orange))' : '#555' }}
                          />
                          <span className="text-[10px] uppercase tracking-[0.05em] text-foreground/50">
                            {isRecent ? 'Generated Today' : `${tour.places.length} stops`}
                          </span>
                        </div>
                        <h3 className="font-display text-[22px] leading-none text-foreground">{tour.title}</h3>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-foreground group-hover:text-background"
                        style={{ border: '1px solid var(--border-subtle)' }}
                      >
                        <Play className="w-2.5 h-3 ml-0.5" fill="currentColor" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA for non-authenticated */}
          {!user && (
            <div className="py-16 border-t border-white/5 text-center">
              <h3 className="font-display text-3xl text-foreground mb-3">Save your tours forever</h3>
              <p className="text-foreground/50 mb-8 max-w-md mx-auto">
                Create a free account to save tours, track your stats, and get personalized suggestions.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/auth')}
                  className="rounded-full px-6 h-11 font-semibold"
                >
                  Sign Up Free
                </Button>
                <Button
                  variant="outline"
                  onClick={onBrowseLibrary}
                  className="rounded-full px-6 h-11 font-semibold border-white/10"
                >
                  Browse tours first
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
