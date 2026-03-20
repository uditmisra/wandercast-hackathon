import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeFunction } from './useTours';

export interface Suggestion {
  city: string;
  suggestedThemes: string[];
}

export function useSuggestions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggestions', user?.id],
    queryFn: async () => {
      console.log('[useSuggestions] Fetching suggestions...');
      const data = await invokeFunction('get-suggestions');
      console.log('[useSuggestions] Got suggestions:', data);
      return (data?.suggestions || []) as Suggestion[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}
