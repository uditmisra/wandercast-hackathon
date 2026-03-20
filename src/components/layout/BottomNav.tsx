import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTourBuilderContext } from '@/contexts/TourBuilderContext';

interface BottomNavProps {
  onOpenCreateChat: () => void;
}

export function BottomNav({ onOpenCreateChat: _onOpenCreateChat }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const builder = useTourBuilderContext();

  const isHome = location.pathname === '/';
  const isExplore = location.pathname === '/explore';
  const isDashboard = location.pathname === '/dashboard';
  const stopCount = builder.selectedStops.length;

  return (
    <div className="md:hidden fixed left-1/2 -translate-x-1/2 z-50" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-lg rounded-full px-2 py-1.5 shadow-xl shadow-black/20 border border-border">
        <PillTab
          icon={<Home className="w-[18px] h-[18px]" />}
          label="Home"
          active={isHome}
          onClick={() => navigate('/')}
        />
        <PillTab
          icon={<Compass className="w-[18px] h-[18px]" />}
          label="Explore"
          active={isExplore}
          onClick={() => navigate('/explore')}
          badge={stopCount > 0 ? stopCount : undefined}
        />
        <PillTab
          icon={<Headphones className="w-[18px] h-[18px]" />}
          label="Library"
          active={isDashboard}
          onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
        />
      </div>
    </div>
  );
}

function PillTab({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-150 active:scale-90 ${
        active ? 'text-white' : 'text-white/50'
      }`}
    >
      <div className="relative">
        {icon}
        {badge != null && (
          <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
      {active && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  );
}
