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

    // Fetch tours with places in one query
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, created_at, interests, places (id, name, city, description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (toursError) {
      console.error('Failed to fetch tours:', toursError.message);
      throw new Error('Failed to fetch dashboard stats');
    }

    const allTours = tours || [];
    const toursTaken = allTours.length;
    const allPlaces = allTours.flatMap((t: any) => t.places || []);
    const uniquePlaceNames = new Set(allPlaces.map((p: any) => p.name?.toLowerCase()));
    const placesVisited = uniquePlaceNames.size;

    const citySet = new Set<string>();
    allPlaces.forEach((p: any) => {
      const city = p.city || p.description?.split(',')[0]?.trim();
      if (city && city !== 'Unknown') citySet.add(city);
    });
    const citiesExplored = citySet.size;

    const totalListeningMinutes = allPlaces.length * 5;

    const interestCounts: Record<string, number> = {};
    allTours.forEach((t: any) => {
      const interests = t.interests || [];
      interests.forEach((interest: any) => {
        const name = typeof interest === 'string' ? interest : interest?.name;
        if (name) {
          interestCounts[name] = (interestCounts[name] || 0) + 1;
        }
      });
    });

    let mostExploredInterest: { name: string; count: number } | null = null;
    let maxCount = 0;
    for (const [name, count] of Object.entries(interestCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostExploredInterest = { name, count };
      }
    }

    const tourDates = [...new Set(
      allTours.map((t: any) => new Date(t.created_at).toISOString().split('T')[0])
    )].sort().reverse();

    let currentStreak = 0;
    if (tourDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (tourDates[0] === today || tourDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < tourDates.length; i++) {
          const prevDate = new Date(tourDates[i - 1]);
          const currDate = new Date(tourDates[i]);
          const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;
          if (diffDays === 1) { currentStreak++; } else { break; }
        }
      }
    }

    const cityPlaceCounts: Record<string, Set<string>> = {};
    allPlaces.forEach((p: any) => {
      const city = p.city || p.description?.split(',')[0]?.trim();
      if (city && city !== 'Unknown') {
        if (!cityPlaceCounts[city]) cityPlaceCounts[city] = new Set();
        cityPlaceCounts[city].add(p.name?.toLowerCase());
      }
    });

    const placesPerCity = Object.entries(cityPlaceCounts)
      .map(([city, places]) => ({ city, count: places.size }))
      .sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({
      toursTaken, placesVisited, citiesExplored, totalListeningMinutes,
      mostExploredInterest, currentStreak, placesPerCity,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-dashboard-stats function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
