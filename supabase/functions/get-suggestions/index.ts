import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_INTERESTS = [
  'architecture', 'history', 'culture', 'food', 'art',
  'shopping', 'ghost stories', 'local secrets', 'nature', 'religion',
];

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

    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('interests, places (city, description)')
      .eq('user_id', user.id);

    if (toursError) {
      console.error('Failed to fetch tours:', toursError.message);
      throw new Error('Failed to fetch suggestions');
    }

    if (!tours || tours.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cityInterests: Record<string, Set<string>> = {};

    for (const tour of tours) {
      const cities = new Set<string>();
      for (const place of (tour.places || [])) {
        const city = (place as any).city || (place as any).description?.split(',')[0]?.trim();
        if (city && city !== 'Unknown') cities.add(city);
      }

      const interests = (tour.interests || []).map((i: any) =>
        typeof i === 'string' ? i : i?.name
      ).filter(Boolean);

      for (const city of cities) {
        if (!cityInterests[city]) cityInterests[city] = new Set();
        for (const interest of interests) {
          cityInterests[city].add(interest.toLowerCase());
        }
      }
    }

    const suggestions = [];
    for (const [city, explored] of Object.entries(cityInterests)) {
      const unexplored = ALL_INTERESTS.filter(i => !explored.has(i));
      if (unexplored.length > 0) {
        suggestions.push({
          city,
          suggestedThemes: unexplored.slice(0, 5),
        });
      }
    }

    suggestions.sort((a, b) => {
      const aExplored = cityInterests[a.city]?.size || 0;
      const bExplored = cityInterests[b.city]?.size || 0;
      return bExplored - aExplored;
    });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-suggestions function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
