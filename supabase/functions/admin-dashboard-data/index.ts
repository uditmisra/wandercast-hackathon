import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Admin email allowlist (server-side copy) ──
const ADMIN_EMAILS = ['udit.misra93@gmail.com'];

function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: verify JWT + admin email ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Use service role client for DB queries, but verify the user's JWT
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[admin] Auth failed:', authError?.message);
      return json({ error: 'Authentication failed' }, 401);
    }

    if (!isAdmin(user.email)) {
      console.warn('[admin] Unauthorized access attempt by:', user.email);
      return json({ error: 'Forbidden' }, 403);
    }

    // ── Route to section handler ──
    const body = await req.json();
    const { section, ...params } = body;

    switch (section) {
      case 'overview':
        return json(await handleOverview(supabase));
      case 'api-costs':
        return json(await handleApiCosts(supabase));
      case 'users':
        return json(await handleUsers(supabase, params));
      case 'tours':
        return json(await handleTours(supabase, params));
      case 'content':
        return json(await handleContent(supabase));
      default:
        return json({ error: `Unknown section: ${section}` }, 400);
    }
  } catch (error: unknown) {
    console.error('[admin] Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal error';
    return json({ error: msg }, 500);
  }
});

// ── Section handlers ──

async function handleOverview(supabase: any) {
  // Total users
  const { count: totalUsers } = await supabase
    .from('tours')
    .select('user_id', { count: 'exact', head: true });

  // Get distinct user count from tours (users who created tours)
  const { data: distinctUsers } = await supabase
    .rpc('admin_count_users_placeholder', {})
    .maybeSingle();

  // Fallback: count users via auth.users (service role can list)
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1, page: 1 });
  const userCount = authUsers?.total ?? 0;

  // Total tours
  const { count: totalTours } = await supabase
    .from('tours')
    .select('*', { count: 'exact', head: true });

  // Total places
  const { count: totalPlaces } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true });

  // Tours this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: toursThisWeek } = await supabase
    .from('tours')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  // Tours per day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentTours } = await supabase
    .from('tours')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  const toursPerDay: Record<string, number> = {};
  for (const tour of recentTours || []) {
    const day = tour.created_at.slice(0, 10);
    toursPerDay[day] = (toursPerDay[day] || 0) + 1;
  }
  const toursPerDayArray = Object.entries(toursPerDay).map(([date, count]) => ({ date, count }));

  // Content source breakdown from generated_content JSONB
  const { data: placesWithContent } = await supabase
    .from('places')
    .select('generated_content')
    .not('generated_content', 'is', null)
    .limit(5000);

  const sources: Record<string, number> = { curated: 0, web: 0, gpt: 0, static: 0, unknown: 0 };
  for (const place of placesWithContent || []) {
    const gc = place.generated_content;
    if (!gc) continue;
    const src = gc._source || gc.source || 'unknown';
    if (src.includes('curated')) sources.curated++;
    else if (src.includes('web')) sources.web++;
    else if (src.includes('gpt') || src.includes('openai')) sources.gpt++;
    else if (src.includes('static') || src.includes('template')) sources.static++;
    else sources.unknown++;
  }
  const contentSources = Object.entries(sources)
    .filter(([_, count]) => count > 0)
    .map(([source, count]) => ({ source, count }));

  return {
    totalUsers: userCount,
    totalTours: totalTours ?? 0,
    totalPlaces: totalPlaces ?? 0,
    toursThisWeek: toursThisWeek ?? 0,
    toursPerDay: toursPerDayArray,
    contentSources,
  };
}

async function handleApiCosts(supabase: any) {
  // Use the api_usage_log table for real cost data
  const { data: usageSummary } = await supabase
    .from('api_usage_log')
    .select('service, estimated_cost_usd, created_at')
    .order('created_at', { ascending: false })
    .limit(10000);

  let totalCost = 0;
  let ttsCost = 0;
  let llmCost = 0;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  let monthCost = 0;

  for (const entry of usageSummary || []) {
    const cost = Number(entry.estimated_cost_usd) || 0;
    totalCost += cost;
    if (entry.service === 'elevenlabs') ttsCost += cost;
    else llmCost += cost;
    if (new Date(entry.created_at) >= monthStart) monthCost += cost;
  }

  // Recent tours with estimated costs
  const { data: recentTours } = await supabase
    .from('tours')
    .select('id, title, created_at, places(id)')
    .order('created_at', { ascending: false })
    .limit(20);

  const recentToursWithCost = (recentTours || []).map((tour: any) => {
    const placeCount = tour.places?.length || 0;
    // Cost model: ~$0.04 parsing + ~$0.05 content + ~$0.076/place TTS
    const estimated = 0.04 + (placeCount * 0.05) + (placeCount * 0.076);
    return {
      id: tour.id,
      title: tour.title,
      placeCount,
      createdAt: tour.created_at,
      estimatedCost: Math.round(estimated * 1000) / 1000,
    };
  });

  return {
    estimatedTotalCost: Math.round(totalCost * 100) / 100,
    estimatedMonthCost: Math.round(monthCost * 100) / 100,
    ttsCost: Math.round(ttsCost * 100) / 100,
    llmCost: Math.round(llmCost * 100) / 100,
    recentTours: recentToursWithCost,
  };
}

async function handleUsers(supabase: any, params: any) {
  const page = params.page ?? 0;
  const search = params.search ?? '';
  const perPage = 20;

  // List users via admin API
  const { data: authResult } = await supabase.auth.admin.listUsers({
    page: page + 1, // Supabase uses 1-indexed pages
    perPage,
  });

  const users = authResult?.users || [];
  const total = authResult?.total ?? 0;

  // Get tour counts per user
  const userIds = users.map((u: any) => u.id);
  let tourCounts: Record<string, number> = {};
  let placeCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: tours } = await supabase
      .from('tours')
      .select('user_id, places(id)')
      .in('user_id', userIds);

    for (const tour of tours || []) {
      tourCounts[tour.user_id] = (tourCounts[tour.user_id] || 0) + 1;
      placeCounts[tour.user_id] = (placeCounts[tour.user_id] || 0) + (tour.places?.length || 0);
    }
  }

  let result = users.map((u: any) => ({
    id: u.id,
    email: u.email || 'N/A',
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at || null,
    tourCount: tourCounts[u.id] || 0,
    placeCount: placeCounts[u.id] || 0,
  }));

  // Client-side search filter (admin.listUsers doesn't support search)
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((u: any) => u.email.toLowerCase().includes(q));
  }

  return { users: result, total };
}

async function handleTours(supabase: any, params: any) {
  const page = params.page ?? 0;
  const search = params.search ?? '';
  const perPage = 20;
  const offset = page * perPage;

  let query = supabase
    .from('tours')
    .select('id, title, user_id, created_at, places(id, name, city, audio_narration, generated_content)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: tours, count } = await query;

  // Get creator emails
  const userIds = [...new Set((tours || []).map((t: any) => t.user_id).filter(Boolean))];
  let emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    // Batch lookup via admin API
    const { data: authResult } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authResult?.users || []) {
      if (userIds.includes(u.id)) {
        emailMap[u.id] = u.email || 'N/A';
      }
    }
  }

  const result = (tours || []).map((tour: any) => {
    const places = (tour.places || []).map((p: any) => {
      const gc = p.generated_content;
      let contentSource = 'none';
      if (gc) {
        const src = gc._source || gc.source || '';
        if (src.includes('curated')) contentSource = 'curated';
        else if (src.includes('web')) contentSource = 'web';
        else if (src.includes('gpt') || src.includes('openai')) contentSource = 'gpt';
        else if (src.includes('static') || src.includes('template')) contentSource = 'static';
        else if (gc.audioNarration) contentSource = 'generated';
        else contentSource = 'unknown';
      }
      return {
        id: p.id,
        name: p.name,
        city: p.city || '',
        hasAudio: !!(p.audio_narration || gc?.audioNarration),
        contentSource,
      };
    });

    return {
      id: tour.id,
      title: tour.title || 'Untitled',
      creatorEmail: emailMap[tour.user_id] || 'anonymous',
      placeCount: places.length,
      createdAt: tour.created_at,
      places,
    };
  });

  return { tours: result, total: count ?? 0 };
}

async function handleContent(supabase: any) {
  // Cities
  const { count: citiesCount } = await supabase
    .from('cities')
    .select('*', { count: 'exact', head: true });

  // City places
  const { count: placesCount } = await supabase
    .from('city_places')
    .select('*', { count: 'exact', head: true });

  // Stories
  const { count: storiesCount } = await supabase
    .from('place_stories')
    .select('*', { count: 'exact', head: true });

  const avgStoriesPerPlace = placesCount && placesCount > 0
    ? Math.round((storiesCount ?? 0) / placesCount * 10) / 10
    : 0;

  // Web context cache
  const { count: webCacheEntries } = await supabase
    .from('web_context_cache')
    .select('*', { count: 'exact', head: true });

  const { data: oldestCache } = await supabase
    .from('web_context_cache')
    .select('fetched_at')
    .order('fetched_at', { ascending: true })
    .limit(1);

  const { data: newestCache } = await supabase
    .from('web_context_cache')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1);

  // City breakdown
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name');

  const cityBreakdown = [];
  for (const city of cities || []) {
    const { count: cp } = await supabase
      .from('city_places')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', city.id);

    const { data: cityPlaces } = await supabase
      .from('city_places')
      .select('place_id')
      .eq('city_id', city.id);

    let storyCount = 0;
    if (cityPlaces && cityPlaces.length > 0) {
      const placeIds = cityPlaces.map((p: any) => p.place_id);
      const { count: sc } = await supabase
        .from('place_stories')
        .select('*', { count: 'exact', head: true })
        .in('place_id', placeIds);
      storyCount = sc ?? 0;
    }

    cityBreakdown.push({
      city: city.name,
      places: cp ?? 0,
      stories: storyCount,
    });
  }

  return {
    cities: citiesCount ?? 0,
    places: placesCount ?? 0,
    stories: storiesCount ?? 0,
    avgStoriesPerPlace,
    webCacheEntries: webCacheEntries ?? 0,
    webCacheOldest: oldestCache?.[0]?.fetched_at || null,
    webCacheNewest: newestCache?.[0]?.fetched_at || null,
    cityBreakdown,
  };
}
