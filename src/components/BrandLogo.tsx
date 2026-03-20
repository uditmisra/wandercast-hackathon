interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { icon: 16, text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 20, text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 28, text: 'text-2xl', gap: 'gap-2.5' },
};

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M512 100 L580 440 L920 512 L580 584 L512 924 L444 584 L104 512 L444 440 Z"
          fill="var(--accent-orange)"
        />
        <path
          d="M320 380 L420 700 L512 500 L604 700 L704 380 L620 380 L560 580 L512 460 L464 580 L404 380 Z"
          fill="currentColor"
        />
      </svg>
      <span className={`font-display font-black uppercase tracking-wide ${s.text}`}>
        Wandercast
      </span>
    </span>
  );
}
