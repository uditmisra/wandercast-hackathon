import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Validation constants
const MIN_NARRATION_LENGTH = 400;
const MAX_NARRATION_LENGTH = 700;
const REQUIRED_PLACE_FIELDS = ['place_id', 'name', 'lat', 'lng', 'category', 'neighborhood'];
const REQUIRED_STORY_FIELDS = ['place_id', 'interests', 'tone', 'hook', 'directional_cue', 'audio_narration'];
const VALID_TONES = ['casual', 'scholarly', 'dramatic', 'witty'];

interface City {
  slug: string;
  name: string;
  country: string;
}

interface Place {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  trigger_radius_m?: number;
  category: string;
  must_see?: boolean;
  neighborhood: string;
}

interface Story {
  place_id: string;
  interests: string[];
  tone: string;
  hook: string;
  directional_cue: string;
  audio_narration: string;
}

interface ImportRequest {
  city: City;
  places?: Place[];
  stories?: Story[];
  validate_only?: boolean;
}

interface ValidationError {
  type: 'place' | 'story';
  index: number;
  field: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require service role key or admin secret in Authorization header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (token !== supabaseKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: string[] = [];
  const errors: ValidationError[] = [];

  try {
    const body: ImportRequest = await req.json();

    // Validate request structure
    if (!body.city || !body.city.slug || !body.city.name || !body.city.country) {
      throw new Error('City object required with slug, name, and country');
    }

    const { city, places = [], stories = [], validate_only = false } = body;

    results.push(`=== Import for ${city.name}, ${city.country} ===`);
    results.push(`Places: ${places.length}, Stories: ${stories.length}`);
    results.push(`Mode: ${validate_only ? 'VALIDATE ONLY' : 'LIVE IMPORT'}`);

    // Validate places
    const placeIds = new Set<string>();
    places.forEach((place, index) => {
      // Check required fields
      for (const field of REQUIRED_PLACE_FIELDS) {
        if (!place[field as keyof Place]) {
          errors.push({ type: 'place', index, field, message: `Missing required field: ${field}` });
        }
      }

      // Check for duplicate place_ids
      if (placeIds.has(place.place_id)) {
        errors.push({ type: 'place', index, field: 'place_id', message: `Duplicate place_id: ${place.place_id}` });
      }
      placeIds.add(place.place_id);

      // Validate coordinates
      if (place.lat && (place.lat < -90 || place.lat > 90)) {
        errors.push({ type: 'place', index, field: 'lat', message: `Invalid latitude: ${place.lat}` });
      }
      if (place.lng && (place.lng < -180 || place.lng > 180)) {
        errors.push({ type: 'place', index, field: 'lng', message: `Invalid longitude: ${place.lng}` });
      }
    });

    // Validate stories
    stories.forEach((story, index) => {
      // Check required fields
      for (const field of REQUIRED_STORY_FIELDS) {
        if (!story[field as keyof Story]) {
          errors.push({ type: 'story', index, field, message: `Missing required field: ${field}` });
        }
      }

      // Validate tone
      if (story.tone && !VALID_TONES.includes(story.tone)) {
        errors.push({ type: 'story', index, field: 'tone', message: `Invalid tone: ${story.tone}. Valid: ${VALID_TONES.join(', ')}` });
      }

      // Validate interests array
      if (story.interests && !Array.isArray(story.interests)) {
        errors.push({ type: 'story', index, field: 'interests', message: 'Interests must be an array' });
      }

      // Validate narration length
      if (story.audio_narration) {
        const len = story.audio_narration.length;
        if (len < MIN_NARRATION_LENGTH) {
          errors.push({ type: 'story', index, field: 'audio_narration', message: `Too short: ${len} chars (min: ${MIN_NARRATION_LENGTH})` });
        }
        if (len > MAX_NARRATION_LENGTH) {
          errors.push({ type: 'story', index, field: 'audio_narration', message: `Too long: ${len} chars (max: ${MAX_NARRATION_LENGTH})` });
        }
      }

      // Check story references valid place_id (if places provided)
      if (places.length > 0 && story.place_id && !placeIds.has(story.place_id)) {
        errors.push({ type: 'story', index, field: 'place_id', message: `References unknown place_id: ${story.place_id}` });
      }
    });

    // Report validation errors
    if (errors.length > 0) {
      results.push(`\n--- VALIDATION ERRORS (${errors.length}) ---`);
      errors.forEach(e => {
        results.push(`[${e.type} ${e.index}] ${e.field}: ${e.message}`);
      });
    } else {
      results.push(`\nValidation: OK`);
    }

    // If validate_only or errors, stop here
    if (validate_only) {
      return new Response(JSON.stringify({
        success: errors.length === 0,
        validation_only: true,
        errors,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        errors,
        results
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === LIVE IMPORT ===
    results.push(`\n--- IMPORTING ---`);

    // 1. Upsert city
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .upsert({ slug: city.slug, name: city.name, country: city.country }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (cityError) {
      throw new Error(`City error: ${cityError.message}`);
    }

    const cityId = cityData.id;
    results.push(`City: ${city.name} (${cityId})`);

    // 2. Upsert places
    let placesOk = 0, placesFail = 0;
    for (const place of places) {
      const { error } = await supabase
        .from('city_places')
        .upsert({
          ...place,
          city_id: cityId,
          trigger_radius_m: place.trigger_radius_m || 100,
          must_see: place.must_see ?? true
        }, { onConflict: 'place_id' });

      if (error) {
        placesFail++;
        results.push(`X Place "${place.name}": ${error.message}`);
      } else {
        placesOk++;
      }
    }
    results.push(`Places: ${placesOk} OK, ${placesFail} failed`);

    // 3. Insert stories (upsert by place_id + tone + first interest)
    let storiesOk = 0, storiesFail = 0;
    for (const story of stories) {
      // Check if story exists (same place_id, tone, and primary interest)
      const primaryInterest = story.interests[0] || 'general';
      const { data: existing } = await supabase
        .from('place_stories')
        .select('id')
        .eq('place_id', story.place_id)
        .eq('tone', story.tone)
        .contains('interests', [primaryInterest])
        .limit(1)
        .single();

      let error;
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('place_stories')
          .update({
            interests: story.interests,
            hook: story.hook,
            directional_cue: story.directional_cue,
            audio_narration: story.audio_narration
          })
          .eq('id', existing.id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('place_stories')
          .insert(story);
        error = insertError;
      }

      if (error) {
        storiesFail++;
        if (storiesFail <= 3) {
          results.push(`X Story "${story.place_id}/${story.tone}": ${error.message}`);
        }
      } else {
        storiesOk++;
      }
    }
    results.push(`Stories: ${storiesOk} OK, ${storiesFail} failed`);

    // 4. Final counts
    const { count: totalPlaces } = await supabase.from('city_places').select('*', { count: 'exact', head: true });
    const { count: totalStories } = await supabase.from('place_stories').select('*', { count: 'exact', head: true });

    results.push(`\n--- TOTALS ---`);
    results.push(`Total places in DB: ${totalPlaces}`);
    results.push(`Total stories in DB: ${totalStories}`);

    return new Response(JSON.stringify({
      success: true,
      imported: { places: placesOk, stories: storiesOk },
      totals: { places: totalPlaces, stories: totalStories },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg, results }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
