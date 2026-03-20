import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </div>

        {/* 404 */}
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-extrabold text-primary">404</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          You've wandered off the map
        </h1>
        <p className="text-foreground/50 mb-8 leading-relaxed">
          This page doesn't exist, but there are plenty of stories that do.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all duration-150"
          >
            <Compass className="w-4 h-4" />
            Find a story
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center h-11 px-6 rounded-full border border-white/10 text-foreground font-semibold hover:border-white/20 active:scale-95 transition-all duration-150"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
