import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TourPlan } from '@/types/tour';

async function invokeFunction(name: string, options?: { body?: any }) {
  const { data, error } = await supabase.functions.invoke(name, options);
  if (error) {
    // FunctionsHttpError wraps the response — try to extract the real message
    let msg = error.message || 'Unknown error';
    try {
      if ('context' in error && (error as any).context instanceof Response) {
        const body = await (error as any).context.json();
        msg = body?.error || msg;
      }
    } catch {}
    console.error(`[${name}] Error:`, msg);
    throw new Error(msg);
  }
  if (data?.error) {
    console.error(`[${name}] Server error:`, data.error);
    throw new Error(data.error);
  }
  return data;
}

function transformTour(tour: any): TourPlan & { isFavorited: boolean; currentStopIndex: number | null } {
  return {
    id: tour.id,
    title: tour.title,
    description: tour.description || '',
    places: (tour.places || []).map((place: any) => ({
      id: place.id,
      name: place.name,
      city: place.city || place.description?.split(',')[0] || 'Unknown',
      country: place.description?.split(',')[1]?.trim() || 'Unknown',
      description: place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      estimatedDuration: 30,
      generatedContent: place.generated_content || (place.overview || place.audio_narration ? {
        overview: place.overview || '',
        audioNarration: place.audio_narration || '',
      } : undefined),
      audioUrl: place.audio_url,
    })),
    interests: (tour.interests || []).map((interest: any) => {
      if (typeof interest === 'string') {
        return { id: interest, name: interest, label: interest, description: '', icon: '' };
      }
      return interest;
    }),
    totalDuration: (tour.places || []).length * 30,
    createdAt: new Date(tour.created_at),
    isFavorited: tour.isFavorited || false,
    currentStopIndex: tour.currentStopIndex ?? null,
  };
}

export { invokeFunction };

export function useTours() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tours', user?.id],
    queryFn: async () => {
      console.log('[useTours] Fetching tours...');
      const data = await invokeFunction('get-tours');
      console.log('[useTours] Got', data?.tours?.length ?? 0, 'tours');
      return (data?.tours || []).map(transformTour) as (TourPlan & { isFavorited: boolean; currentStopIndex: number | null })[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: string) => {
      await invokeFunction('delete-tour', { body: { tourId } });
      return tourId;
    },
    onMutate: async (tourId: string) => {
      // Optimistic update — remove immediately from cache
      await queryClient.cancelQueries({ queryKey: ['tours', user?.id] });
      const previous = queryClient.getQueryData(['tours', user?.id]);
      queryClient.setQueryData(['tours', user?.id], (old: any[]) =>
        (old || []).filter((t: any) => t.id !== tourId)
      );
      return { previous };
    },
    onError: (_err, _tourId, context: any) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['tours', user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
