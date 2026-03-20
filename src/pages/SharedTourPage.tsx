import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TourPlan, Place, Interest } from '@/types/tour';
import { EnhancedAudioGuide } from '@/components/EnhancedAudioGuide';
import { TourItinerary } from '@/components/TourItinerary';

export default function SharedTourPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchTour = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-shared-tour', {
          body: { slug }
        });

        if (fetchError || data?.error) {
          setError(data?.error || 'Tour not found');
          return;
        }

        const dbTour = data.tour;
        const places: Place[] = (dbTour.places || []).map((p: any, index: number) => ({
          id: p.id || `shared-${index}`,
          name: p.name,
          city: p.city || '',
          country: '',
          description: p.description || p.overview || '',
          latitude: p.latitude ? parseFloat(p.latitude) : undefined,
          longitude: p.longitude ? parseFloat(p.longitude) : undefined,
          estimatedDuration: 5,
          generatedContent: p.generated_content || {
            overview: p.overview || '',
            audioNarration: p.audio_narration || '',
          },
          audioUrl: p.audio_url,
        }));

        const interests: Interest[] = (dbTour.interests || []).map((i: any) =>
          typeof i === 'string'
            ? { id: i, name: i, label: i.charAt(0).toUpperCase() + i.slice(1), description: '', icon: '' }
            : i
        );

        const tourPlan: TourPlan = {
          id: dbTour.id,
          title: dbTour.title,
          description: dbTour.description || '',
          places,
          interests,
          totalDuration: places.length * 5,
          createdAt: new Date(),
        };

        setTour(tourPlan);
      } catch (err) {
        console.error('Failed to load shared tour:', err);
        setError('Failed to load tour');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-foreground/50">Loading shared tour...</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Tour Not Found</h1>
          <p className="text-sm text-foreground/50 mb-6">
            This tour may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Explore Tours
          </button>
        </div>
      </div>
    );
  }

  if (showGuide) {
    return (
      <EnhancedAudioGuide
        tour={tour}
        onBack={() => setShowGuide(false)}
      />
    );
  }

  return (
    <TourItinerary
      tour={tour}
      onStart={() => setShowGuide(true)}
      onBack={() => navigate('/')}
    />
  );
}
