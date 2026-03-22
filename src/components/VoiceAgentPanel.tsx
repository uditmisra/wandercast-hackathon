import { useEffect, useRef, useCallback, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, X } from 'lucide-react';
import type { VoiceMessage } from '@/hooks/useVoiceAgent';

/** Fetch place image — try Firecrawl prop first, fallback to Wikipedia. Only one image shown. */
function usePlaceImage(firecrawlUrl: string | null | undefined, placeName: string) {
  const [url, setUrl] = useState<string | null>(null);
  const resolvedRef = useRef(false);

  // If Firecrawl provides one, use it and skip Wikipedia
  useEffect(() => {
    if (firecrawlUrl && !resolvedRef.current) {
      resolvedRef.current = true;
      setUrl(firecrawlUrl);
    }
  }, [firecrawlUrl]);

  // Fetch from Wikipedia only if Firecrawl hasn't provided one after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (resolvedRef.current) return;
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (resolvedRef.current) return;
          const src = data?.originalimage?.source || data?.thumbnail?.source;
          if (src) {
            resolvedRef.current = true;
            setUrl(src);
          }
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [placeName]);

  return url;
}

interface VoiceAgentPanelProps {
  status: 'connecting' | 'connected' | 'disconnected';
  isSpeaking: boolean;
  guideName: string | null;
  placeName: string;
  imageUrl?: string | null;
  error: string | null;
  messages: VoiceMessage[];
  onEnd: () => void;
  getInputByteFrequencyData?: () => Uint8Array | undefined;
  getOutputByteFrequencyData?: () => Uint8Array | undefined;
}

export function VoiceAgentPanel({
  status,
  isSpeaking,
  guideName,
  placeName,
  imageUrl,
  error,
  messages,
  onEnd,
  getInputByteFrequencyData,
  getOutputByteFrequencyData,
}: VoiceAgentPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const smoothLevelRef = useRef(0);
  const bgImage = usePlaceImage(imageUrl, placeName);

  // Enhanced orb animation with smooth audio reactivity
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Get audio level with smoothing
    let rawLevel = 0;
    if (status === 'connected') {
      const freqData = isSpeaking
        ? getOutputByteFrequencyData?.()
        : getInputByteFrequencyData?.();
      if (freqData && freqData.length > 0) {
        const sum = freqData.reduce((a, b) => a + b, 0);
        rawLevel = sum / freqData.length / 255;
      }
    }
    // Smooth the level for fluid animation
    smoothLevelRef.current += (rawLevel - smoothLevelRef.current) * 0.15;
    const level = smoothLevelRef.current;

    const t = Date.now() / 1000;
    const baseRadius = 55;
    const breathe = Math.sin(t * 0.8) * 3 + Math.sin(t * 1.3) * 2; // organic breathing
    const pulse = status === 'connecting' ? Math.sin(t * 3) * 8 : 0;
    const audioExpand = level * 35;
    const radius = baseRadius + breathe + pulse + audioExpand;

    // Color palette based on state
    let primaryHue = 230; // blue (listening)
    let primarySat = 80;
    if (isSpeaking) { primaryHue = 270; primarySat = 70; } // violet (speaking)
    else if (status === 'connecting') { primaryHue = 35; primarySat = 90; } // amber (connecting)

    // Multiple layered glows for depth
    for (let i = 3; i >= 0; i--) {
      const glowRadius = radius * (1.5 + i * 0.7);
      const alpha = 0.04 - i * 0.008 + level * 0.03;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      grad.addColorStop(0, `hsla(${primaryHue}, ${primarySat}%, 60%, ${alpha})`);
      grad.addColorStop(1, `hsla(${primaryHue}, ${primarySat}%, 40%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main orb with internal gradient
    const orbGrad = ctx.createRadialGradient(
      cx - radius * 0.25, cy - radius * 0.25, radius * 0.1,
      cx, cy, radius
    );
    orbGrad.addColorStop(0, `hsla(${primaryHue + 20}, ${primarySat}%, 75%, 0.9)`);
    orbGrad.addColorStop(0.5, `hsla(${primaryHue}, ${primarySat}%, 55%, 0.8)`);
    orbGrad.addColorStop(1, `hsla(${primaryHue - 15}, ${primarySat}%, 35%, 0.5)`);
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle ring that expands with audio
    if (status === 'connected') {
      const ringRadius = radius + 8 + level * 20;
      ctx.strokeStyle = `hsla(${primaryHue}, ${primarySat}%, 60%, ${0.1 + level * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner specular highlight
    const specGrad = ctx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, 0,
      cx - radius * 0.1, cy - radius * 0.1, radius * 0.6
    );
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(animate);
  }, [status, isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData]);

  useEffect(() => {
    // Set up canvas for retina
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 300 * dpr;
      canvas.height = 300 * dpr;
    }
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const statusText = (() => {
    if (error) return error;
    if (status === 'connecting') return 'Connecting to your guide...';
    if (isSpeaking) return `${guideName || 'Guide'} is speaking...`;
    if (status === 'connected') return 'Listening...';
    return 'Disconnected';
  })();

  const statusIcon = (() => {
    if (status === 'connecting') return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (isSpeaking) return <Phone className="w-3.5 h-3.5" />;
    if (status === 'connected') return <Mic className="w-3.5 h-3.5 animate-pulse" />;
    return <MicOff className="w-3.5 h-3.5" />;
  })();

  // Show last 3 messages as live captions
  const recentMessages = messages.slice(-3);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between py-safe animate-in fade-in duration-500" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
      {/* Place photo backdrop */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${bgImage})`,
            opacity: 0.55,
            filter: 'blur(8px) saturate(0.8) brightness(1.1)',
          }}
        />
      )}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

      {/* Top: Back button + guide info */}
      <div className="relative z-10 w-full px-4 sm:px-6">
        <button
          onClick={onEnd}
          className="absolute left-4 sm:left-6 top-0 p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
          aria-label="End conversation"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
        <div className="text-center pt-1">
          <p className="text-white/30 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] mb-1">Talking to</p>
          <h2 className="text-white text-lg sm:text-xl font-semibold tracking-tight">{guideName || 'Your Guide'}</h2>
          <p className="text-white/25 text-xs sm:text-sm mt-0.5">{placeName}</p>
        </div>
      </div>

      {/* Center: Orb + status */}
      <div className="relative z-10 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px]"
        />
        <div className="flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          {statusIcon}
          <span className={`text-xs font-medium ${error ? 'text-red-400' : 'text-white/50'}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Bottom: Captions + end button */}
      <div className="relative z-10 w-full flex flex-col items-center px-5 sm:px-6">
        {/* Live captions */}
        <div className="w-full max-w-sm min-h-[60px] sm:min-h-[80px] mb-4 sm:mb-6">
          {recentMessages.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2.5">
              {recentMessages.map((msg, i) => {
                const isLatest = i === recentMessages.length - 1;
                const isAgent = msg.role === 'agent';
                return (
                  <p
                    key={msg.timestamp}
                    className={`text-center leading-relaxed transition-all duration-700 ${
                      isLatest ? 'opacity-100' : i === recentMessages.length - 2 ? 'opacity-25' : 'opacity-10'
                    } ${isLatest ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'}`}
                  >
                    {!isAgent && (
                      <span className="text-violet-400/50 text-[10px] uppercase tracking-wider mr-1.5">You: </span>
                    )}
                    <span className={isAgent ? 'text-white/70' : 'text-violet-300/50'}>
                      {msg.content}
                    </span>
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* End button */}
        <button
          onClick={onEnd}
          className="flex items-center gap-2.5 px-7 sm:px-8 py-3 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/20"
        >
          <PhoneOff className="w-4 h-4" />
          End conversation
        </button>

        {/* Attribution */}
        <p className="mt-4 text-white/10 text-[10px] tracking-wider">
          Powered by ElevenLabs + Firecrawl
        </p>
      </div>
    </div>
  );
}
