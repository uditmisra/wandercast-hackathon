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
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'no user');
      throw new Error('Authentication failed');
    }

    // Get bookmarked places with place details and parent tour title
    const { data: places, error: placesError } = await supabase
      .from('bookmarked_places')
      .select(`
        id, created_at,
        places!inner (
          id, name, description, city, overview, audio_narration, audio_url, tour_id,
          tours!inner (id, title)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (placesError) {
      console.error('Error fetching bookmarked places:', placesError);
    }

    // Get favorited tour IDs
    const { data: favorites, error: favError } = await supabase
      .from('favorited_tours')
      .select('tour_id')
      .eq('user_id', user.id);

    if (favError) {
      console.error('Error fetching favorited tours:', favError);
    }

    const favoritedTourIds = (favorites || []).map((f: any) => f.tour_id);

    return new Response(JSON.stringify({
      places: places || [],
      favoritedTourIds,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-bookmarks function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
