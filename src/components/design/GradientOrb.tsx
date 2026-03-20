import { cn } from '@/lib/utils';

interface GradientOrbProps {
  size?: number;
  className?: string;
  opacity?: number;
  blur?: number;
}

export function GradientOrb({ size = 300, className, opacity = 0.2, blur }: GradientOrbProps) {
  return (
    <div
      className={cn('absolute rounded-full pointer-events-none gradient-orb animate-orb-float', className)}
      style={{
        width: size,
        height: size,
        opacity,
        filter: `blur(${blur ?? Math.round(size * 0.27)}px)`,
      }}
    />
  );
}
