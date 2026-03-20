import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CityWithPlaces } from '@/types/library';

export function useStoryLibrary(citySlug?: string) {
  return useQuery({
    queryKey: ['story-library', citySlug],
    queryFn: async (): Promise<CityWithPlaces[]> => {
      const { data, error } = await supabase.functions.invoke('get-story-library', {
        body: citySlug ? { city_slug: citySlug } : {},
      });

      if (error) throw new Error(`Failed to fetch story library: ${error.message}`);
      return data?.cities || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
