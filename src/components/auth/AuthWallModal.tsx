import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, LogIn, UserPlus, Headphones, Bookmark, Sparkles, RotateCcw } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/utils/analytics';

type AuthMode = 'signin' | 'signup';

interface AuthWallModalProps {
  /** Which variant of the wall to show */
  variant: 'stop-gate' | 'tour-gate';
  /** Called when user successfully authenticates */
  onAuthenticated: () => void;
  /** Called when user dismisses (goes back to free content) */
  onDismiss: () => void;
}

const ANON_KEY = 'wandercast_anon_usage';

/** Clear anonymous usage tracking after sign-up */
export function clearAnonUsage() {
  localStorage.removeItem(ANON_KEY);
}

/** Get anonymous usage stats */
export function getAnonUsage(): { toursPlayed: number } {
  try {
    const raw = localStorage.getItem(ANON_KEY);
    if (!raw) return { toursPlayed: 0 };
    return JSON.parse(raw);
  } catch {
    return { toursPlayed: 0 };
  }
}

/** Increment anonymous tour count */
export function trackAnonTour() {
  const usage = getAnonUsage();
  usage.toursPlayed++;
  localStorage.setItem(ANON_KEY, JSON.stringify(usage));
}

export function AuthWallModal({ variant, onAuthenticated, onDismiss }: AuthWallModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Track auth wall impression once on mount
  useEffect(() => {
    analytics.authWallShown({ variant });
  }, [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        clearAnonUsage();
        analytics.authWallConverted({ variant, method: 'email' });
        onAuthenticated();
      }
    } else {
      const { data, error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try signing in.');
      } else if (data?.session) {
        clearAnonUsage();
        analytics.authWallConverted({ variant, method: 'email' });
        onAuthenticated();
      } else {
        // Email confirmation required
        setError('Check your email for a confirmation link, then sign in.');
        setMode('signin');
      }
    }

    setLoading(false);
  };

  const heading = variant === 'stop-gate'
    ? 'Your first stop was free'
    : 'Ready for your next tour?';

  const subheading = variant === 'stop-gate'
    ? 'Sign up to keep listening — it takes 10 seconds.'
    : 'Create an account to generate more tours.';

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Back button */}
        <button
          onClick={() => { analytics.authWallDismissed({ variant }); onDismiss(); }}
          className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors mb-6 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Brand */}
        <BrandLogo size="sm" className="mb-6 opacity-60" />

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground mb-1">{heading}</h1>
        <p className="text-foreground/50 mb-6">{subheading}</p>

        {/* Value props */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Headphones, text: 'Unlimited audio tours' },
            { icon: RotateCcw, text: 'Resume mid-story' },
            { icon: Bookmark, text: 'Save your favorites' },
            { icon: Sparkles, text: 'Smarter over time' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-foreground/50">
              <Icon className="w-3.5 h-3.5 text-foreground/30 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Google OAuth */}
        <button
          onClick={async () => {
            setLoading(true);
            setError('');
            analytics.authWallConverted({ variant, method: 'google' });
            const { error } = await signInWithGoogle();
            if (error) { setError(error.message); setLoading(false); }
          }}
          disabled={loading}
          className="w-full h-11 rounded-full border border-white/15 bg-white/5 text-foreground font-medium hover:bg-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-60 mb-4"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-foreground/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <div className="border border-white/10 rounded-2xl p-5 mb-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11 rounded-xl border-white/10 focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
              <Input
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 6 : undefined}
                className="h-11 rounded-xl border-white/10 focus:border-white/30"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {mode === 'signin'
                ? <><LogIn className="w-4 h-4" />{loading ? 'Signing in…' : 'Sign in'}</>
                : <><UserPlus className="w-4 h-4" />{loading ? 'Creating account…' : 'Create free account'}</>
              }
            </button>
          </form>
        </div>

        {/* Mode toggle */}
        <p className="text-center text-sm text-foreground/50">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
