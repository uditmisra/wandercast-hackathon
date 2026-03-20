interface WaveformVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
  /** 'micro' renders 3 light-colored bars for embedding inside a dark button */
  variant?: 'full' | 'micro';
}

export function WaveformVisualizer({ isPlaying, barCount = 16, className = '', variant = 'full' }: WaveformVisualizerProps) {
  if (variant === 'micro') {
    return (
      <div className={`flex items-end gap-[2px] ${className}`}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-[2px] rounded-full bg-current animate-waveform-bounce"
            style={{
              height: '100%',
              animationDelay: `${(i * 0.15).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isPlaying ? 'animate-waveform-bounce bg-foreground opacity-80' : 'bg-foreground/10'
          }`}
          style={{
            height: isPlaying ? '100%' : '30%',
            animationDelay: isPlaying ? `${(i * 0.06).toFixed(2)}s` : undefined,
            transform: isPlaying ? undefined : `scaleY(${0.2 + Math.random() * 0.3})`,
          }}
        />
      ))}
    </div>
  );
}
