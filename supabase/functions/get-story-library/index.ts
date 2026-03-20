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

    let citySlug: string | undefined;
    try {
      const body = await req.json();
      citySlug = body.city_slug;
    } catch {
      // No body or invalid JSON — fetch all cities
    }

    // 1. Fetch cities
    let citiesQuery = supabase.from('cities').select('*');
    if (citySlug) {
      citiesQuery = citiesQuery.eq('slug', citySlug);
    }
    const { data: cities, error: citiesError } = await citiesQuery;
    if (citiesError) {
      console.error('Failed to fetch cities:', citiesError.message);
      throw new Error('Failed to fetch story library');
    }
    if (!cities || cities.length === 0) {
      return new Response(JSON.stringify({ cities: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch all places for these cities
    const cityIds = cities.map((c: any) => c.id);
    const { data: places, error: placesError } = await supabase
      .from('city_places')
      .select('*')
      .in('city_id', cityIds)
      .order('must_see', { ascending: false });

    if (placesError) {
      console.error('Failed to fetch places:', placesError.message);
      throw new Error('Failed to fetch story library');
    }

    // 3. Fetch all stories for these places
    const placeIds = (places || []).map((p: any) => p.place_id);
    let stories: any[] = [];
    if (placeIds.length > 0) {
      const { data: storiesData, error: storiesError } = await supabase
        .from('place_stories')
        .select('*')
        .in('place_id', placeIds);

      if (storiesError) {
        console.error('Failed to fetch stories:', storiesError.message);
        throw new Error('Failed to fetch story library');
      }
      stories = storiesData || [];
    }

    // 4. Nest: stories into places, places into cities
    const storiesByPlace: Record<string, any[]> = {};
    for (const story of stories) {
      if (!storiesByPlace[story.place_id]) storiesByPlace[story.place_id] = [];
      storiesByPlace[story.place_id].push({
        id: story.id,
        place_id: story.place_id,
        interests: story.interests,
        tone: story.tone,
        audio_narration: story.audio_narration,
        hook: story.hook,
        directional_cue: story.directional_cue,
        story_type: story.story_type || undefined,
        fun_facts: story.fun_facts || undefined,
        look_closer_challenge: story.look_closer_challenge || undefined,
        suggested_questions: story.suggested_questions || undefined,
      });
    }

    const placesByCity: Record<string, any[]> = {};
    for (const place of (places || [])) {
      if (!placesByCity[place.city_id]) placesByCity[place.city_id] = [];
      placesByCity[place.city_id].push({
        place_id: place.place_id,
        name: place.name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lng),
        category: place.category,
        neighborhood: place.neighborhood,
        must_see: place.must_see,
        stories: storiesByPlace[place.place_id] || [],
      });
    }

    const result = cities.map((city: any) => ({
      id: city.id,
      slug: city.slug,
      name: city.name,
      country: city.country,
      places: placesByCity[city.id] || [],
    }));

    // Sort by content richness (most places first)
    result.sort((a: any, b: any) => b.places.length - a.places.length);

    console.log(`Returning ${result.length} cities, ${(places || []).length} places, ${stories.length} stories`);

    return new Response(JSON.stringify({ cities: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-story-library:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
