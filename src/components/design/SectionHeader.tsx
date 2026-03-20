import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <span className={cn('section-label text-foreground/70', className)}>
      {children}
    </span>
  );
}
