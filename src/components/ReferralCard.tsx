import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/utils/analytics';

interface ReferralStats {
  code: string;
  signupCount: number;
  rewardCount: number;
  creditsAvailable: number;
}

export function ReferralCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      // Fetch or create referral code
      const { data: codeData, error: codeError } = await supabase.functions.invoke(
        'get-or-create-referral-code'
      );
      if (codeError || !codeData?.code) {
        console.error('Failed to fetch referral code:', codeError);
        return;
      }

      if (!codeData._alreadyExisted) {
        analytics.referralLinkCreated({ code: codeData.code });
      }

      // Fetch referral event counts
      const { data: events } = await supabase
        .from('referral_events')
        .select('event_type')
        .eq('referrer_user_id', user!.id);

      const signupCount = events?.filter(e => e.event_type === 'signup').length ?? 0;
      const rewardCount = events?.filter(e => e.event_type === 'reward_granted').length ?? 0;

      // Fetch credits
      const { data: creditsRow } = await supabase
        .from('free_tour_credits')
        .select('credits_available')
        .eq('user_id', user!.id)
        .single();

      setStats({
        code: codeData.code,
        signupCount,
        rewardCount,
        creditsAvailable: creditsRow?.credits_available ?? 0,
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = stats
    ? `${window.location.origin}/r/${stats.code}`
    : '';

  const handleCopy = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      analytics.referralLinkShared({ code: stats.code, method: 'clipboard' });
    } catch {
      // Clipboard write failed — show toast or just ignore silently
    }
  };

  const handleShare = async () => {
    if (!stats) return;
    const shareText = `Discover the world through stories — use my Wandercast referral link and we both get a free tour! 🎧🗺️`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Wander with me', text: shareText, url: referralUrl });
        analytics.referralLinkShared({ code: stats.code, method: 'native-share' });
      } else {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        analytics.referralLinkShared({ code: stats.code, method: 'clipboard' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  if (!user) return null;

  return (
    <div className="py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-4 h-4 text-foreground/40" />
        <span className="text-sm font-medium text-foreground">Give a Tour, Get a Tour</span>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 flex-1 rounded-xl bg-foreground/5 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats row */}
          <div className="flex gap-3 mb-4">
            <StatPill label="Referrals" value={stats.signupCount} icon={<Users className="w-3 h-3" />} />
            <StatPill label="Rewards" value={stats.rewardCount} icon={<CheckCircle className="w-3 h-3" />} />
            <StatPill label="Credits" value={stats.creditsAvailable} icon={<Gift className="w-3 h-3" />} highlight={stats.creditsAvailable > 0} />
          </div>

          {/* Referral link */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-3"
            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <span className="text-xs text-foreground/50 font-mono truncate flex-1 min-w-0">
              {referralUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-foreground/5 transition-colors active:scale-95"
              aria-label="Copy referral link"
            >
              {copied
                ? <CheckCircle className="w-4 h-4 text-green-600" />
                : <Copy className="w-4 h-4 text-foreground/40" />
              }
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-4 py-2.5 rounded-full transition-all active:scale-95 bg-foreground text-background hover:bg-foreground/90"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Referral Link
          </button>

          {/* How it works */}
          <p className="text-[11px] text-foreground/35 mt-3 leading-relaxed">
            When a friend signs up via your link and completes their first tour, you both get 1 free premium tour. Max 10 rewards/month.
          </p>
        </>
      ) : (
        <p className="text-sm text-foreground/40">Could not load referral data. Try refreshing.</p>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl gap-1 ${highlight ? 'bg-amber-50' : ''}`}
      style={{ border: `1px solid ${highlight ? 'rgba(180,120,0,0.2)' : 'rgba(0,0,0,0.08)'}` }}
    >
      <span className={`text-[18px] font-bold leading-none ${highlight ? 'text-amber-700' : 'text-foreground'}`}>
        {value}
      </span>
      <div className={`flex items-center gap-1 ${highlight ? 'text-amber-600' : 'text-foreground/40'}`}>
        {icon}
        <span className="text-[9px] uppercase tracking-[0.07em] font-semibold">{label}</span>
      </div>
    </div>
  );
}
