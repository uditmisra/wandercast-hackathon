import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, BarChart3, Bookmark, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { TourPlan } from '@/types/tour';
import { DashboardHistory } from '@/components/dashboard/DashboardHistory';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardBookmarks } from '@/components/dashboard/DashboardBookmarks';
import { DashboardSuggestions } from '@/components/dashboard/DashboardSuggestions';
import { GradientOrb } from '@/components/design/GradientOrb';
import { BrandLogo } from '@/components/BrandLogo';

const TABS = [
  { id: 'history', label: 'History', icon: History },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'for-you', label: 'For You', icon: Lightbulb },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleBookmark } = useBookmarks();
  const [activeTab, setActiveTab] = useState<TabId>('history');

  const handlePlayTour = (tour: TourPlan) => {
    navigate('/', { state: { playTour: tour } });
  };

  const handleToggleFavorite = (tourId: string) => {
    toggleBookmark({ type: 'tour', targetId: tourId });
  };

  const handleSuggestionClick = (prompt: string) => {
    navigate('/', { state: { prefillPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <BrandLogo size="sm" />
          </button>
          {/* Profile orb */}
          <div
            className="w-8 h-8 rounded-full gradient-orb-linear"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="relative pt-10 pb-8">
          <GradientOrb size={200} opacity={0.1} blur={60} className="-top-10 -right-10" />
          <span className="section-label text-foreground/50 mb-4">My Tours</span>
          <h1 className="font-display text-[36px] leading-[0.95] text-foreground mt-4">Your Dashboard</h1>
          <p className="text-sm text-[#999] mt-2">{user?.email}</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.1em] font-semibold transition-colors ${
                  isActive
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-[#888] border-b-2 border-transparent hover:text-foreground/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="pt-8 pb-16 animate-fade-in">
          {activeTab === 'history' && (
            <DashboardHistory onPlayTour={handlePlayTour} onToggleFavorite={handleToggleFavorite} />
          )}
          {activeTab === 'stats' && <DashboardStats />}
          {activeTab === 'saved' && <DashboardBookmarks onPlayTour={handlePlayTour} />}
          {activeTab === 'for-you' && <DashboardSuggestions onSuggestionClick={handleSuggestionClick} />}
        </div>
      </div>
    </div>
  );
}
