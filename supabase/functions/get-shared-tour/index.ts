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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { slug } = await req.json();
    if (!slug) {
      return new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch public tour by slug
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('id, title, description, interests, is_public, share_slug')
      .eq('share_slug', slug)
      .eq('is_public', true)
      .single();

    if (tourError || !tour) {
      return new Response(JSON.stringify({ error: 'Tour not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch places for this tour
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('*')
      .eq('tour_id', tour.id)
      .order('id', { ascending: true });

    if (placesError) {
      console.error('Failed to fetch places:', placesError.message);
      throw new Error('Failed to fetch tour details');
    }

    console.log(`Shared tour "${tour.title}" (slug: ${slug}) with ${places?.length || 0} places`);

    return new Response(JSON.stringify({
      tour: {
        ...tour,
        places: places || [],
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-shared-tour:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
