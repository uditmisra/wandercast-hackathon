import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, LogIn, UserPlus, Gift } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/utils/analytics';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Capture referral code from ?ref= query param and default to signup mode
  const refCode = searchParams.get('ref');
  React.useEffect(() => {
    if (refCode) {
      localStorage.setItem('pending_referral_code', refCode.toUpperCase());
      setMode('signup');
    }
  }, [refCode]);

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  /** After a successful signup, fire the track-referral-signup edge function if a code was stored */
  const maybeTrackReferral = async () => {
    const code = localStorage.getItem('pending_referral_code');
    if (!code) return;
    try {
      await supabase.functions.invoke('track-referral-signup', {
        body: { referralCode: code },
      });
      analytics.referralSignup({ referralCode: code });
      localStorage.removeItem('pending_referral_code');
    } catch (err) {
      console.error('Failed to track referral signup:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) { setError(error.message); }
      else { toast({ title: 'Welcome back!' }); navigate('/'); }
    } else {
      const { data, error } = await signUp(email, password);
      if (error) { setError(error.message); }
      else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (data?.session) {
        // Confirmations disabled — user is signed in immediately
        analytics.signupComplete({ method: 'email' });
        await maybeTrackReferral();
        toast({ title: 'Welcome to Wandercast!' }); navigate('/');
      } else {
        // Confirmations enabled — user needs to check email
        toast({ title: 'Check your email', description: 'We sent you a confirmation link to finish signing up.' });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors mb-8 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Brand */}
        <div className="mb-8">
          <BrandLogo size="md" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-foreground/50 mb-8">
          {mode === 'signin'
            ? 'Pick up where you left off.'
            : 'Save tours. Track progress. Get better recommendations.'}
        </p>

        {/* Google OAuth */}
        <button
          onClick={async () => {
            setLoading(true);
            setError('');
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

        {/* Form card */}
        <div className="border border-white/10 rounded-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-white/10 focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Password</label>
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
                : <><UserPlus className="w-4 h-4" />{loading ? 'Creating account…' : 'Create account'}</>
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

        {/* Referral banner */}
        {mode === 'signup' && refCode && (
          <div className="mt-4 flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
            <Gift className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground/80">You were invited!</p>
              <p className="text-xs text-foreground/50 mt-0.5">
                Sign up and complete your first tour — you'll both get a free premium tour unlock. 🎁
              </p>
            </div>
          </div>
        )}

        {/* Benefits (signup only) */}
        {mode === 'signup' && (
          <div className="mt-6 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-2">What you get</p>
            <ul className="text-sm text-foreground/60 space-y-1">
              <li>• Your tours, saved and synced</li>
              <li>• Pick up mid-story where you left off</li>
              <li>• Smarter suggestions over time</li>
              <li>• Bookmark the places that surprised you</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
