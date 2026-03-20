/**
 * TourCompletionCard
 *
 * Shown when a user finishes all stops on a tour.
 * Features:
 *   - Celebratory summary (tour name, city, stops visited, distance)
 *   - Social share card rendered via HTML Canvas (no extra dependency)
 *   - Share formats: Stories (9:16), Twitter/X (16:9), square (1:1)
 *   - Share via Web Share API → clipboard fallback
 *   - PostHog tracking for share_card_generated, share_initiated, share_completed
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Share2, Copy, CheckCircle, LayoutDashboard, RefreshCw } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { analytics } from '@/utils/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TourCompletionCardProps {
  tour: TourPlan;
  /** Approximate distance walked in km (optional, computed in EnhancedAudioGuide if available) */
  distanceKm?: number;
  onDismiss: () => void;
}

type ShareFormat = 'stories' | 'twitter' | 'square';

const FORMAT_DIMS: Record<ShareFormat, { width: number; height: number; label: string }> = {
  stories:  { width: 1080, height: 1920, label: 'Stories' },
  twitter:  { width: 1200, height: 675,  label: 'Twitter/X' },
  square:   { width: 1080, height: 1080, label: 'Square' },
};

/** Draw the share card onto a canvas and return it as a PNG blob URL */
async function renderShareCard(tour: TourPlan, format: ShareFormat, distanceKm?: number): Promise<string> {
  const { width, height } = FORMAT_DIMS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // ── Background gradient ──────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0A0A0A');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // ── Subtle dot grid ──────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 40; x < width; x += 60) {
    for (let y = 40; y < height; y += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Accent line ──────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, height * 0.15);
  ctx.lineTo(80, height * 0.85);
  ctx.stroke();

  const padding = width * 0.1;
  const contentX = padding + 30;
  const maxTextWidth = width - contentX - padding;

  // ── "WANDERCAST" brand tag ───────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `${Math.round(width * 0.022)}px sans-serif`;
  ctx.letterSpacing = '3px';
  ctx.fillText('WANDERCAST', contentX, height * 0.15);

  // ── Tour title ───────────────────────────────────────────────────────
  const titleFontSize = Math.round(width * (format === 'twitter' ? 0.065 : 0.055));
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.letterSpacing = '0px';
  const wrappedTitle = wrapText(ctx, tour.title, maxTextWidth);
  let titleY = height * 0.28;
  for (const line of wrappedTitle) {
    ctx.fillText(line, contentX, titleY);
    titleY += titleFontSize * 1.3;
  }

  // ── City ─────────────────────────────────────────────────────────────
  const city = tour.places[0]?.city ?? '';
  if (city) {
    const cityFontSize = Math.round(width * 0.032);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${cityFontSize}px sans-serif`;
    ctx.fillText(`📍 ${city}`, contentX, titleY + cityFontSize * 0.8);
    titleY += cityFontSize * 2;
  }

  // ── Stats row ────────────────────────────────────────────────────────
  const statFontSize = Math.round(width * 0.04);
  const statY = height * 0.65;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${statFontSize}px sans-serif`;

  const stats: Array<{ icon: string; value: string; label: string }> = [
    { icon: '🗺️', value: `${tour.places.length}`, label: 'stops' },
  ];
  if (distanceKm && distanceKm > 0) {
    stats.push({ icon: '🚶', value: distanceKm.toFixed(1), label: 'km walked' });
  }

  const statSpacing = width / (stats.length + 1);
  stats.forEach((s, i) => {
    const sx = statSpacing * (i + 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(width * 0.07)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(s.icon + ' ' + s.value, sx, statY);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `${Math.round(width * 0.025)}px sans-serif`;
    ctx.fillText(s.label.toUpperCase(), sx, statY + statFontSize * 1.4);
  });

  // ── CTA (bottom) ─────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = `${Math.round(width * 0.025)}px sans-serif`;
  ctx.fillText('wandercast.app', width / 2, height * 0.9);

  return canvas.toDataURL('image/png');
}

/** Wrap text to fit within maxWidth, returns array of lines */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function TourCompletionCard({ tour, distanceKm, onDismiss }: TourCompletionCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<ShareFormat>('stories');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const hasGeneratedSlug = useRef(false);

  // Generate the public share link once
  const getShareUrl = useCallback(async (): Promise<string> => {
    if (shareUrl) return shareUrl;
    if (!user || !tour.id) return window.location.href;

    try {
      const { data } = await supabase.functions.invoke('share-tour', {
        body: { tourId: tour.id },
      });
      if (data?.slug) {
        const url = `https://hdzfffutbzpevblbpgjc.supabase.co/functions/v1/shared-tour-og?slug=${data.slug}`;
        setShareUrl(url);
        return url;
      }
    } catch {
      // Fall through
    }
    return window.location.href;
  }, [user, tour.id, shareUrl]);

  const generatePreview = async (format: ShareFormat) => {
    setGeneratingPreview(true);
    setSelectedFormat(format);
    try {
      const url = await renderShareCard(tour, format, distanceKm);
      setPreviewUrl(url);
      analytics.shareCardGenerated({ tourId: tour.id, format });
    } catch (err) {
      console.error('Failed to render share card:', err);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleShare = async (format: ShareFormat) => {
    if (sharing) return;
    setSharing(true);
    try {
      analytics.shareInitiated({ tourId: tour.id, format, source: 'completion' });

      const link = await getShareUrl();
      const shareText = `Just completed "${tour.title}" on Wandercast — ${tour.places.length} stops through ${tour.places[0]?.city ?? 'the city'}. 🎧🗺️`;

      if (format === 'square' || format === 'stories' || format === 'twitter') {
        // Generate the share image
        const imgDataUrl = await renderShareCard(tour, format, distanceKm);

        // Convert data URL to blob for Web Share API (Files)
        const res = await fetch(imgDataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'wandercast-tour.png', { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: tour.title, text: shareText, url: link });
          analytics.shareCompleted({ tourId: tour.id, platform: 'native', source: 'completion' });
          return;
        }

        // Fallback: download the image + copy link
        const a = document.createElement('a');
        a.href = imgDataUrl;
        a.download = 'wandercast-tour.png';
        a.click();
        await navigator.clipboard.writeText(link).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        analytics.shareCompleted({ tourId: tour.id, platform: 'clipboard', source: 'completion' });
        return;
      }

      // Link-only share
      if (navigator.share) {
        await navigator.share({ title: tour.title, text: shareText, url: link });
        analytics.shareCompleted({ tourId: tour.id, platform: 'native', source: 'completion' });
      } else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        analytics.shareCompleted({ tourId: tour.id, platform: 'clipboard', source: 'completion' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const city = tour.places[0]?.city ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Confetti / glow orb */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #6366f1, #0ea5e9)' }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Completion header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-1">Tour Complete!</h2>
          <p className="text-white/60 text-sm">{tour.title}</p>
        </div>

        {/* Stats */}
        <div
          className="flex gap-3 mb-6 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <CompletionStat icon="🗺️" value={`${tour.places.length}`} label="stops" />
          {city && <CompletionStat icon="📍" value={city} label="city" />}
          {distanceKm && distanceKm > 0 && (
            <CompletionStat icon="🚶" value={`${distanceKm.toFixed(1)} km`} label="walked" />
          )}
        </div>

        {/* Share card preview */}
        {previewUrl && (
          <div className="mb-4 flex justify-center">
            <img
              src={previewUrl}
              alt="Share card preview"
              className="rounded-xl shadow-lg"
              style={{ maxHeight: 220, objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Format picker */}
        <div className="flex gap-2 mb-3">
          {(Object.keys(FORMAT_DIMS) as ShareFormat[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => generatePreview(fmt)}
              disabled={generatingPreview}
              className={`flex-1 text-[10px] uppercase tracking-wider font-semibold py-2 rounded-full transition-all active:scale-95 disabled:opacity-50 ${
                selectedFormat === fmt
                  ? 'bg-white text-black'
                  : 'text-white/50 hover:text-white'
              }`}
              style={selectedFormat !== fmt ? { border: '1px solid rgba(255,255,255,0.15)' } : {}}
            >
              {generatingPreview && selectedFormat === fmt ? '...' : FORMAT_DIMS[fmt].label}
            </button>
          ))}
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleShare(selectedFormat)}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60"
          >
            {sharing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Share Card
          </button>
          <button
            onClick={async () => {
              analytics.shareInitiated({ tourId: tour.id, format: 'link', source: 'completion' });
              const link = await getShareUrl();
              await navigator.clipboard.writeText(link).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
              analytics.shareCompleted({ tourId: tour.id, platform: 'clipboard', source: 'completion' });
            }}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-95"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Copy share link"
          >
            {copied
              ? <CheckCircle className="w-4 h-4 text-green-400" />
              : <Copy className="w-4 h-4 text-white/50" />
            }
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 justify-center">
          {user && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          )}
          <button
            onClick={onDismiss}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Explore More
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-0.5">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-bold text-white leading-tight">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-white/40 font-semibold">{label}</span>
    </div>
  );
}
