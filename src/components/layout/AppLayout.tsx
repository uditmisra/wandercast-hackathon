import React, { useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { CreateTourSheet } from '@/components/CreateTourSheet';
import { TourPlan } from '@/types/tour';

const OpenCreateChatContext = createContext<(() => void) | null>(null);

/** Hook for child components to open the Create Tour chat sheet */
export function useOpenCreateChat() {
  const fn = useContext(OpenCreateChatContext);
  return fn || (() => {});
}

interface AppLayoutProps {
  children: React.ReactNode;
  onTourGenerated?: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
}

// Pages that manage their own navigation (player, auth)
const HIDE_NAV_PATHS = ['/auth'];

export function AppLayout({ children, onTourGenerated, onTourUpdated }: AppLayoutProps) {
  const location = useLocation();
  const [createChatOpen, setCreateChatOpen] = useState(false);

  const hideNav = HIDE_NAV_PATHS.includes(location.pathname);
  const isGuideView = (location.state as any)?.hideNav;

  const showNav = !hideNav && !isGuideView;

  const handleOpenCreateChat = () => setCreateChatOpen(true);

  const handleTourGenerated = (tour: TourPlan) => {
    setCreateChatOpen(false);
    onTourGenerated?.(tour);
  };

  return (
    <OpenCreateChatContext.Provider value={handleOpenCreateChat}>
      <div className="min-h-screen bg-background">
        {showNav && <TopNav onOpenCreateChat={handleOpenCreateChat} />}
        <main>{children}</main>
        {showNav && <BottomNav onOpenCreateChat={handleOpenCreateChat} />}

        <CreateTourSheet
          open={createChatOpen}
          onOpenChange={setCreateChatOpen}
          onTourGenerated={handleTourGenerated}
          onTourUpdated={onTourUpdated}
        />
      </div>
    </OpenCreateChatContext.Provider>
  );
}
