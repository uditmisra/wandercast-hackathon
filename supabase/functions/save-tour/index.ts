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
      return new Response(JSON.stringify({ success: true, skipped: true }), {
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

    const { title, description, places, interests, personalization } = await req.json();

    if (!title || !places || !Array.isArray(places)) {
      throw new Error('Title and places are required');
    }

    console.log(`Saving tour "${title}" for user ${user.id} with ${places.length} places`);

    // Create tour
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .insert({
        title,
        description,
        user_id: user.id,
        interests: interests || []
      })
      .select()
      .single();

    if (tourError) {
      console.error('Failed to create tour:', tourError.message);
      throw new Error('Failed to save tour');
    }

    // Save places
    const placesToInsert = places.map((place: any) => ({
      tour_id: tour.id,
      name: place.name,
      description: place.description,
      city: place.city || null,
      latitude: place.latitude,
      longitude: place.longitude,
      audio_url: place.audioUrl,
      audio_narration: place.generatedContent?.audioNarration,
      overview: place.generatedContent?.overview,
      generated_content: place.generatedContent || null
    }));

    const { data: savedPlaces, error: placesError } = await supabase
      .from('places')
      .insert(placesToInsert)
      .select();

    if (placesError) {
      console.error('Failed to save places:', placesError.message);
      throw new Error('Failed to save tour');
    }

    // Save user preferences if interests provided
    if (interests && Array.isArray(interests)) {
      const prefsData: any = {
          user_id: user.id,
          interests: interests,
        };
      if (personalization?.preferredTone) {
        prefsData.preferred_tone = personalization.preferredTone;
      }
      if (personalization?.favoriteStoryTypes?.length) {
        prefsData.favorite_story_types = personalization.favoriteStoryTypes;
      }
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert(prefsData);

      if (prefsError) {
        console.warn('Failed to save user preferences:', prefsError.message);
      }
    }

    return new Response(JSON.stringify({
      tour: {
        ...tour,
        places: savedPlaces
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in save-tour function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
