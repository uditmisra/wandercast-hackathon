import { useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface VoiceAgentPanelProps {
  status: 'connecting' | 'connected' | 'disconnected';
  isSpeaking: boolean;
  guideName: string | null;
  placeName: string;
  error: string | null;
  onEnd: () => void;
  getInputByteFrequencyData?: () => Uint8Array | undefined;
  getOutputByteFrequencyData?: () => Uint8Array | undefined;
}

export function VoiceAgentPanel({
  status,
  isSpeaking,
  guideName,
  placeName,
  error,
  onEnd,
  getInputByteFrequencyData,
  getOutputByteFrequencyData,
}: VoiceAgentPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Animated orb visualization driven by audio frequency data
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Get audio level
    let level = 0;
    if (status === 'connected') {
      const freqData = isSpeaking
        ? getOutputByteFrequencyData?.()
        : getInputByteFrequencyData?.();
      if (freqData && freqData.length > 0) {
        const sum = freqData.reduce((a, b) => a + b, 0);
        level = sum / freqData.length / 255;
      }
    }

    const baseRadius = 60;
    const pulse = status === 'connecting' ? Math.sin(Date.now() / 300) * 0.15 : 0;
    const audioScale = level * 0.5;
    const radius = baseRadius * (1 + pulse + audioScale);

    // Outer glow
    const glowGradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2);
    if (isSpeaking) {
      glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    } else if (status === 'connected') {
      glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
      glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    } else {
      glowGradient.addColorStop(0, 'rgba(255, 183, 77, 0.1)');
      glowGradient.addColorStop(1, 'rgba(255, 183, 77, 0)');
    }
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main orb
    const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    if (isSpeaking) {
      gradient.addColorStop(0, 'rgba(167, 139, 250, 0.9)');
      gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(109, 40, 217, 0.6)');
    } else if (status === 'connected') {
      gradient.addColorStop(0, 'rgba(96, 165, 250, 0.9)');
      gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.6)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 214, 153, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 183, 77, 0.7)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.5)');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.2, cy - radius * 0.2, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(animate);
  }, [status, isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData]);

  useEffect(() => {
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
    if (status === 'connecting') return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isSpeaking) return <Phone className="w-4 h-4" />;
    if (status === 'connected') return <Mic className="w-4 h-4 animate-pulse" />;
    return <MicOff className="w-4 h-4" />;
  })();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Guide info */}
      <div className="text-center mb-8">
        <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Talking to</p>
        <h2 className="text-white text-2xl font-semibold">{guideName || 'Your Guide'}</h2>
        <p className="text-white/40 text-sm mt-1">{placeName}</p>
      </div>

      {/* Animated orb */}
      <div className="relative mb-8">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="w-[300px] h-[300px]"
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-10 px-4 py-2 rounded-full bg-white/5">
        {statusIcon}
        <span className={`text-sm ${error ? 'text-red-400' : 'text-white/70'}`}>
          {statusText}
        </span>
      </div>

      {/* End conversation button */}
      <button
        onClick={onEnd}
        className="flex items-center gap-2 px-8 py-3 rounded-full bg-red-500/90 hover:bg-red-500 text-white font-medium transition-colors"
      >
        <PhoneOff className="w-5 h-5" />
        End conversation
      </button>

      {/* Attribution */}
      <div className="absolute bottom-6 flex items-center gap-2 text-white/20 text-xs">
        <span>Powered by ElevenLabs + Firecrawl</span>
      </div>
    </div>
  );
}
