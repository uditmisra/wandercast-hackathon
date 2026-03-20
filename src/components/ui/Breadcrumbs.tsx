import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1 text-sm mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'font-medium text-gray-900' : 'text-gray-400'}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(item.href!)}
                className="text-gray-500 hover:text-gray-900 transition-colors active:scale-95 duration-150"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
