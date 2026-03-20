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
    const { placeName, city, country, userInterests } = await req.json();

    if (!placeName || !city) {
      throw new Error('Missing required fields: placeName and city');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching facts for ${placeName}, ${city}`);

    // Query place-specific facts
    const { data: facts, error: factsError } = await supabase
      .from('place_facts')
      .select('*')
      .eq('place_name', placeName)
      .eq('city', city)
      .order('reddit_score', { ascending: false });

    if (factsError) {
      console.error('Error fetching place facts:', factsError);
    }

    // Query city-wide secrets that might apply to this place
    const { data: secrets, error: secretsError } = await supabase
      .from('city_secrets')
      .select('*')
      .eq('city', city)
      .eq('country', country);

    if (secretsError) {
      console.error('Error fetching city secrets:', secretsError);
    }

    // Filter secrets that apply to this place
    const relevantSecrets = secrets?.filter(secret =>
      !secret.applies_to_places ||
      secret.applies_to_places.includes(placeName)
    ) || [];

    // Select best fact based on user interests (if provided)
    let selectedFact = null;
    if (facts && facts.length > 0) {
      // If user interests include architecture, prefer construction/architecture facts
      // If user interests include history, prefer historical drama facts
      // Otherwise, use highest reddit score
      selectedFact = facts[0]; // Default to highest scored

      if (userInterests && userInterests.length > 0) {
        const interestLabels = userInterests.map((i: any) => i.label?.toLowerCase() || i.name?.toLowerCase());

        if (interestLabels.includes('architecture') || interestLabels.includes('art')) {
          const architectureFact = facts.find(f =>
            f.fact_category?.includes('construction') ||
            f.fact_category?.includes('architecture')
          );
          if (architectureFact) selectedFact = architectureFact;
        } else if (interestLabels.includes('history') || interestLabels.includes('culture')) {
          const historyFact = facts.find(f =>
            f.fact_category?.includes('historical') ||
            f.fact_category?.includes('drama') ||
            f.fact_category?.includes('incident')
          );
          if (historyFact) selectedFact = historyFact;
        }
      }
    }

    console.log(`Found ${facts?.length || 0} facts, ${relevantSecrets.length} secrets`);
    console.log(`Selected fact: ${selectedFact?.fact_category || 'none'}`);

    return new Response(JSON.stringify({
      hasCachedFacts: facts && facts.length > 0,
      selectedFact,
      allFacts: facts || [],
      citySecrets: relevantSecrets,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-place-facts:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch place facts',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
