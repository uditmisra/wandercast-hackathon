import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { invokeFunction } from './useTours';

export function useBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      console.log('[useBookmarks] Fetching bookmarks...');
      const data = await invokeFunction('get-bookmarks');
      console.log('[useBookmarks] Got bookmarks:', data);
      return data as { places: any[]; favoritedTourIds: string[] };
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ type, targetId }: { type: 'place' | 'tour'; targetId: string }) => {
      const data = await invokeFunction('toggle-bookmark', { body: { type, targetId } });
      return data as { bookmarked: boolean };
    },
    onMutate: async ({ type, targetId }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['bookmarks', user?.id] });
      const previousBookmarks = queryClient.getQueryData(['bookmarks', user?.id]);

      // Optimistically flip the bookmark state in cache
      queryClient.setQueryData(['bookmarks', user?.id], (old: any) => {
        if (!old) return old;
        if (type === 'place') {
          const exists = old.places?.some((b: any) => b.places?.id === targetId);
          return {
            ...old,
            places: exists
              ? old.places.filter((b: any) => b.places?.id !== targetId)
              : [...(old.places || []), { places: { id: targetId } }],
          };
        }
        if (type === 'tour') {
          const exists = old.favoritedTourIds?.includes(targetId);
          return {
            ...old,
            favoritedTourIds: exists
              ? old.favoritedTourIds.filter((id: string) => id !== targetId)
              : [...(old.favoritedTourIds || []), targetId],
          };
        }
        return old;
      });

      return { previousBookmarks };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks', user?.id], context.previousBookmarks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    },
  });

  const isPlaceBookmarked = (placeId: string): boolean => {
    return bookmarksQuery.data?.places?.some((b: any) => b.places?.id === placeId) || false;
  };

  const isTourFavorited = (tourId: string): boolean => {
    return bookmarksQuery.data?.favoritedTourIds?.includes(tourId) || false;
  };

  return {
    ...bookmarksQuery,
    toggleBookmark: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isPlaceBookmarked,
    isTourFavorited,
  };
}
