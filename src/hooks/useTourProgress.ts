import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useTourProgress(tourId: string | undefined) {
  const { user } = useAuth();

  const saveProgress = useCallback(async (stopIndex: number) => {
    if (!user || !tourId) return;
    try {
      await supabase.from('tour_progress').upsert({
        user_id: user.id,
        tour_id: tourId,
        current_stop_index: stopIndex,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,tour_id' });
    } catch (err) {
      console.warn('Failed to save tour progress:', err);
    }
  }, [user, tourId]);

  return { saveProgress };
}
