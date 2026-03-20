import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';

interface TopNavProps {
  onOpenCreateChat: () => void;
}

export function TopNav({ onOpenCreateChat: _onOpenCreateChat }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')}>
          <BrandLogo size="sm" />
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
            icon={<Home className="w-4 h-4" />}
            label="Home"
          />
          <NavLink
            active={location.pathname === '/explore'}
            onClick={() => navigate('/explore')}
            icon={<Compass className="w-4 h-4" />}
            label="Explore"
          />
          {user && (
            <NavLink
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="My Tours"
            />
          )}
        </div>

        {/* Profile / Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full gradient-orb-linear cursor-pointer hover:opacity-80 active:scale-95 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Profile"
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-foreground/60 hover:text-foreground font-medium"
            >
              <User className="w-4 h-4 mr-1.5" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-foreground text-background'
          : 'text-foreground/50 hover:text-foreground hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
