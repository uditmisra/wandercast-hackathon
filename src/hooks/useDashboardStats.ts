import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeFunction } from './useTours';

export interface DashboardStats {
  toursTaken: number;
  placesVisited: number;
  citiesExplored: number;
  totalListeningMinutes: number;
  mostExploredInterest: { name: string; count: number } | null;
  currentStreak: number;
  placesPerCity: { city: string; count: number }[];
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      console.log('[useDashboardStats] Fetching stats...');
      const data = await invokeFunction('get-dashboard-stats');
      console.log('[useDashboardStats] Got stats:', data);
      return data as DashboardStats;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}
