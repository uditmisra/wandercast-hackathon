import { cn } from '@/lib/utils';

interface ArchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ArchCard({ children, className, onClick }: ArchCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-arch bg-white border border-black/10 overflow-hidden relative',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform duration-150',
        className
      )}
    >
      {children}
    </div>
  );
}
