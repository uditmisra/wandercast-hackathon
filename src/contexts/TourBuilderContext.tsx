import React, { createContext, useContext, ReactNode } from 'react';
import { useTourBuilder } from '@/hooks/useTourBuilder';

type TourBuilderContextType = ReturnType<typeof useTourBuilder>;

const TourBuilderContext = createContext<TourBuilderContextType | null>(null);

export function TourBuilderProvider({ children }: { children: ReactNode }) {
  const builder = useTourBuilder();
  return (
    <TourBuilderContext.Provider value={builder}>
      {children}
    </TourBuilderContext.Provider>
  );
}

export function useTourBuilderContext() {
  const context = useContext(TourBuilderContext);
  if (!context) {
    throw new Error('useTourBuilderContext must be used within a TourBuilderProvider');
  }
  return context;
}
