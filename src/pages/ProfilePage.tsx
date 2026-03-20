import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ChevronRight, Bell, Globe, Mic, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { GradientOrb } from '@/components/design/GradientOrb';
import { ReferralCard } from '@/components/ReferralCard';

const TONE_OPTIONS = ['casual', 'witty', 'dramatic', 'scholarly'] as const;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'W';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-black text-sm uppercase tracking-wide">Back</span>
          </button>
          <span className="font-display font-black text-sm uppercase tracking-wide">Profile</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">
        {/* Profile Hero */}
        <div className="relative pt-10 pb-10 flex flex-col items-center text-center">
          <GradientOrb size={200} opacity={0.15} blur={60} className="top-0 left-1/2 -translate-x-1/2" />

          {/* Avatar */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center mb-5 gradient-orb-linear"
            style={{ border: '2px solid #0A0A0A' }}
          >
            <span className="font-display text-[28px] text-white">{userInitial}</span>
          </div>

          <h1 className="font-display text-[28px] leading-none text-foreground mb-1">
            {user?.user_metadata?.full_name || 'Explorer'}
          </h1>
          <p className="text-sm text-foreground/40">{user?.email}</p>
        </div>

        {/* Preferences Section */}
        <div className="pb-10">
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 8 }}
          >
            Preferences
          </span>

          {/* Narration Tone */}
          <div className="py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <div className="flex items-center gap-3 mb-3">
              <Mic className="w-4 h-4 text-foreground/40" />
              <span className="text-sm font-medium text-foreground">Narration Style</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {TONE_OPTIONS.map(tone => (
                <button
                  key={tone}
                  onClick={() => updatePreferences({ preferredTone: tone })}
                  className={`text-[11px] uppercase tracking-[0.05em] font-semibold px-4 py-2 rounded-full transition-all active:scale-95 ${
                    preferences.preferredTone === tone
                      ? 'bg-foreground text-background'
                      : 'text-foreground/50 hover:text-foreground'
                  }`}
                  style={preferences.preferredTone !== tone ? { border: '1px solid rgba(0,0,0,0.1)' } : { border: '1px solid #0A0A0A' }}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          {preferences.interests && preferences.interests.length > 0 && (
            <div className="py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-4 h-4 text-foreground/40" />
                <span className="text-sm font-medium text-foreground">Your Interests</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {preferences.interests.map((interest: string) => (
                  <span
                    key={interest}
                    className="text-[11px] px-3 py-1.5 rounded-full text-foreground/60 capitalize"
                    style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Referral Program */}
        <div className="pb-10">
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 8 }}
          >
            Referrals
          </span>
          <ReferralCard />
        </div>

        {/* Navigation Links */}
        <div className="pb-10">
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 8 }}
          >
            Account
          </span>

          <NavLink
            icon={<Bell className="w-4 h-4" />}
            label="Notifications"
            onClick={() => {}}
          />
          <NavLink
            icon={<Shield className="w-4 h-4" />}
            label="Privacy & Data"
            onClick={() => {}}
          />
          <NavLink
            label="Upgrade Plan"
            onClick={() => navigate('/upgrade', { state: { upgradeReferrer: 'settings' } })}
            highlight
          />
        </div>

        {/* Sign Out */}
        <div className="pb-16">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
          <p className="text-[10px] text-foreground/20 mt-6">Wandercast v1.0</p>
        </div>
      </div>
    </div>
  );
}

function NavLink({ icon, label, onClick, highlight }: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-4 group"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-foreground/40">{icon}</span>}
        <span className={`text-sm font-medium ${highlight ? 'text-foreground' : 'text-foreground/70'} group-hover:text-foreground transition-colors`}>
          {label}
        </span>
        {highlight && (
          <span
            className="text-[9px] uppercase tracking-[0.1em] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: '#C5A059' }}
          >
            Pro
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
    </button>
  );
}
