import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ tours: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Use service role key for admin access, verify user from their JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'no user');
      throw new Error('Authentication failed');
    }

    console.log(`Fetching tours for user ${user.id}`);

    // Get tours with places
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('*, places (*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (toursError) {
      console.error('Failed to fetch tours:', toursError.message);
      throw new Error('Failed to fetch tours');
    }

    // Separate query for favorited tour IDs
    let favoritedIds: Set<string> = new Set();
    try {
      const { data: favorites } = await supabase
        .from('favorited_tours')
        .select('tour_id')
        .eq('user_id', user.id);
      if (favorites) {
        favoritedIds = new Set(favorites.map((f: any) => f.tour_id));
      }
    } catch (e) {
      console.warn('Could not fetch favorites:', e);
    }

    // Fetch tour progress
    let progressMap: Record<string, number> = {};
    try {
      const tourIds = (tours || []).map((t: any) => t.id);
      if (tourIds.length > 0) {
        const { data: progressData } = await supabase
          .from('tour_progress')
          .select('tour_id, current_stop_index')
          .eq('user_id', user.id)
          .in('tour_id', tourIds);
        if (progressData) {
          progressMap = Object.fromEntries(
            progressData.map((p: any) => [p.tour_id, p.current_stop_index])
          );
        }
      }
    } catch (e) {
      console.warn('Could not fetch progress:', e);
    }

    const enrichedTours = (tours || []).map((tour: any) => ({
      ...tour,
      isFavorited: favoritedIds.has(tour.id),
      currentStopIndex: progressMap[tour.id] ?? null,
    }));

    console.log(`Returning ${enrichedTours.length} tours`);

    return new Response(JSON.stringify({ tours: enrichedTours }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-tours function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
