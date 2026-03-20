
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/** Haversine distance in meters */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

const AVAILABLE_INTERESTS = [
  'architecture', 'history', 'culture', 'food', 'art', 'shopping',
  'ghost', 'secrets', 'nature', 'religion'
];

async function logUsage(entry: {
  service: string;
  function_name: string;
  characters_used?: number;
  estimated_cost_usd?: number;
  status: string;
  error_code?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    await sb.from('api_usage_log').insert({
      service: entry.service,
      function_name: entry.function_name,
      characters_used: entry.characters_used || 0,
      estimated_cost_usd: entry.estimated_cost_usd || 0,
      status: entry.status,
      error_code: entry.error_code || null,
      metadata: entry.metadata || {},
    });
  } catch (err) {
    console.warn('[usage-log] Failed to log usage (non-fatal):', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, userLocation } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('No message provided');
    }

    console.log('Parsing tour request:', message);
    console.log('Conversation history:', conversationHistory?.length || 0, 'messages');

    // ── Look up curated places for the mentioned city ──
    let curatedContext = '';
    let locationContext = '';
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: cities } = await supabase.from('cities').select('id, name, slug');

      if (cities?.length) {
        const hasUserLoc = !!(userLocation?.lat && userLocation?.lng);

        // Detect city from conversation text
        const fullText = (conversationHistory || [{ role: 'user', content: message }])
          .map((m: any) => m.content).join(' ').toLowerCase();

        let matchedCity = cities.find((c: any) =>
          fullText.includes(c.name.toLowerCase())
        );

        // If no city found in text but GPS is available, find nearest curated city + neighborhood
        if (!matchedCity && hasUserLoc) {
          console.log('No city in text, using GPS to find nearest places:', userLocation);

          // Get ALL curated places across all cities to find the nearest ones
          const { data: allPlaces } = await supabase
            .from('city_places')
            .select('name, neighborhood, city_id, lat, lng, must_see');

          if (!allPlaces?.length) {
            // No curated places at all — use reverse-geocoded context if available
            const geoCity = userLocation.city || '';
            const geoCountry = userLocation.country || '';
            const geoNeighbourhood = userLocation.neighbourhood || '';
            if (geoCity) {
              locationContext = `\n\nUSER LOCATION: The user is in ${geoNeighbourhood ? `${geoNeighbourhood}, ` : ''}${geoCity}${geoCountry ? `, ${geoCountry}` : ''} (lat: ${userLocation.lat.toFixed(4)}, lng: ${userLocation.lng.toFixed(4)}). Create a tour for this location using your general knowledge. The city is "${geoCity}"${geoCountry ? ` in ${geoCountry}` : ''} — use this for the "city" and "country" fields. Set needsMoreInfo to false.`;
              console.log(`No curated places, using reverse-geocoded location: ${geoCity}`);
            }
          }

          if (allPlaces?.length) {
            // Calculate distance from user to each curated place
            const withDist = allPlaces
              .filter((p: any) => p.lat && p.lng)
              .map((p: any) => ({
                ...p,
                dist: haversineMeters(userLocation.lat, userLocation.lng, parseFloat(p.lat), parseFloat(p.lng)),
              }))
              .sort((a: any, b: any) => a.dist - b.dist);

            if (withDist.length > 0 && withDist[0].dist < 100_000) {
              // Find the city of the nearest place
              const nearestCityId = withDist[0].city_id;
              matchedCity = cities.find((c: any) => c.id === nearestCityId);

              // Identify the nearest neighborhoods (unique, ordered by closest place)
              const nearbyInCity = withDist.filter((p: any) => p.city_id === nearestCityId);
              const seenNeighborhoods = new Set<string>();
              const nearestNeighborhoods: string[] = [];
              for (const p of nearbyInCity) {
                if (p.neighborhood && !seenNeighborhoods.has(p.neighborhood)) {
                  seenNeighborhoods.add(p.neighborhood);
                  nearestNeighborhoods.push(p.neighborhood);
                  if (nearestNeighborhoods.length >= 3) break;
                }
              }

              // Top 5 nearest places for context
              const closestPlaces = nearbyInCity.slice(0, 5).map((p: any) =>
                `${p.name} (${p.neighborhood}, ${formatDistance(p.dist)})`
              );

              const neighborhoodStr = nearestNeighborhoods.length > 0
                ? nearestNeighborhoods.join(', ')
                : 'the city center';

              const primaryNeighborhood = nearestNeighborhoods[0] || 'the city center';

              locationContext = `\n\nUSER LOCATION: The user is in ${primaryNeighborhood}, ${matchedCity!.name} (lat: ${userLocation.lat.toFixed(4)}, lng: ${userLocation.lng.toFixed(4)}).

NEIGHBOURHOOD-LEVEL WALKING TOUR — this is critical:
This tour MUST feel like exploring ONE neighbourhood on foot, not a city-wide hop.

1. ALL stops MUST be in or adjacent to ${primaryNeighborhood}${nearestNeighborhoods.length > 1 ? ` (or its immediate neighbours: ${nearestNeighborhoods.slice(1).join(', ')})` : ''}
2. ALL stops MUST be within a 10-15 minute walk (~800m-1.2km) of each other
3. The total tour radius MUST be under 2km from the user's current position
4. Prefer 3-4 excellent nearby stops over 5+ mediocre ones spread further apart
5. Include local character: a cafe, a hidden courtyard, a street corner with a story — not just major landmarks

Their nearest curated places: ${closestPlaces.join('; ')}.

FIELD RULES:
- "city" MUST be "${matchedCity!.name}" (the city name, used for content matching)
- "neighbourhood" MUST be the actual neighbourhood/district each place is in (e.g. "${primaryNeighborhood}", "Marylebone", "Mayfair")
Do NOT ask which city they are in — you already know. Set needsMoreInfo to false.`;

              console.log(`GPS matched: ${matchedCity!.name}, near ${neighborhoodStr}, closest: ${closestPlaces[0]}`);
            } else if (withDist.length > 0) {
              // User is far from all curated cities — use reverse-geocoded context if available
              const geoCity = userLocation.city || '';
              const geoCountry = userLocation.country || '';
              const geoNeighbourhood = userLocation.neighbourhood || '';
              const locationDesc = geoCity
                ? `${geoNeighbourhood ? `${geoNeighbourhood}, ` : ''}${geoCity}${geoCountry ? `, ${geoCountry}` : ''}`
                : `lat ${userLocation.lat.toFixed(4)}, lng ${userLocation.lng.toFixed(4)}`;
              locationContext = `\n\nUSER LOCATION: The user is in ${locationDesc} (lat: ${userLocation.lat.toFixed(4)}, lng: ${userLocation.lng.toFixed(4)}). They are not near any of our curated cities (nearest is ${formatDistance(withDist[0].dist)} away). When they ask about "near me", create a tour for their current location using your general knowledge.${geoCity ? ` The city is "${geoCity}"${geoCountry ? ` in ${geoCountry}` : ''} — use this for the "city" and "country" fields.` : ''} Set needsMoreInfo to false — you know where they are.`;
              console.log(`GPS user far from curated cities (${locationDesc}), nearest place: ${formatDistance(withDist[0].dist)}`);
            }
          }
        }

        if (matchedCity) {
          const { data: places } = await supabase
            .from('city_places')
            .select('name, category, neighborhood, must_see, lat, lng')
            .eq('city_id', matchedCity.id);

          if (places?.length) {
            // Sort by distance from user if location available
            const annotated = places.map((p: any) => {
              const dist = hasUserLoc && p.lat && p.lng
                ? haversineMeters(userLocation.lat, userLocation.lng, parseFloat(p.lat), parseFloat(p.lng))
                : null;
              return { ...p, dist };
            });
            if (hasUserLoc) annotated.sort((a: any, b: any) => (a.dist ?? Infinity) - (b.dist ?? Infinity));

            // When GPS is available, split into walkable vs distant
            const WALKING_RADIUS_M = 2500; // 2.5km — comfortable walking radius
            const nearby = hasUserLoc ? annotated.filter((p: any) => p.dist != null && p.dist <= WALKING_RADIUS_M) : annotated;
            const distant = hasUserLoc ? annotated.filter((p: any) => p.dist == null || p.dist > WALKING_RADIUS_M) : [];

            if (hasUserLoc && nearby.length > 0) {
              curatedContext = `\n\nWALKABLE CURATED PLACES near the user (within ${formatDistance(WALKING_RADIUS_M)}, ${nearby.length} places with expert-written audio stories):\n` +
                nearby.map((p: any) =>
                  `- ${p.name} [${p.category}${p.neighborhood ? `, ${p.neighborhood}` : ''}${p.must_see ? ', MUST-SEE' : ''}, ${formatDistance(p.dist!)} from user]`
                ).join('\n') +
                (distant.length > 0 ? `\n\nOTHER CURATED PLACES in ${matchedCity.name} (further away — only include if the user EXPLICITLY asks for a city-wide tour):\n` +
                  distant.slice(0, 10).map((p: any) =>
                    `- ${p.name} [${p.category}${p.neighborhood ? `, ${p.neighborhood}` : ''}${p.dist != null ? `, ${formatDistance(p.dist)}` : ''}]`
                  ).join('\n') : '') +
                `\n\nFor "near me" requests, ONLY use places from the WALKABLE section above. STRONGLY prefer curated places — they have expert-written stories. You may include 1-2 non-curated places if highly relevant and nearby. Filter by category when relevant (e.g. for "pubs" prefer category "pub").`;
            } else {
              curatedContext = `\n\nCURATED PLACES DATABASE for ${matchedCity.name} (${annotated.length} places with expert-written audio stories):\n` +
                annotated.map((p: any) =>
                  `- ${p.name} [${p.category}${p.neighborhood ? `, ${p.neighborhood}` : ''}${p.must_see ? ', MUST-SEE' : ''}${p.dist != null ? `, ${formatDistance(p.dist)} from user` : ''}]`
                ).join('\n') +
                `\n\nSTRONGLY prefer curated places — they have expert-written stories. You may include 1-2 non-curated places if highly relevant. Filter by category when relevant.`;
            }

            console.log(`Found ${annotated.length} curated places for ${matchedCity.name} (${nearby.length} walkable)${hasUserLoc ? ' (distance-annotated)' : ''}`);
          }
        }
      }
    } catch (err) {
      console.log('Curated place lookup failed (non-fatal):', err);
    }

    const userPrompt = `You are analyzing a conversation about tour planning. Based on the ENTIRE conversation history, extract structured tour information.

Parse this conversation and extract structured information. Return a JSON object with the following structure:

{
  "places": [
    {
      "name": "Place Name",
      "city": "City",
      "neighbourhood": "Neighbourhood or district within the city",
      "country": "Country",
      "description": "Brief description",
      "estimatedDuration": 30
    }
  ],
  "interests": ["architecture", "history", "culture", "food", "art", "shopping", "ghost", "secrets", "nature", "religion"],
  "tourTitle": "Suggested tour title",
  "tourDescription": "Brief tour description",
  "mood": "one of: joyful, curious, adventurous, dark, romantic, relaxed — the emotional intent inferred from the user's request",
  "needsMoreInfo": false,
  "followUpQuestion": "Optional question if more info needed"
}

IMPORTANT DURATION GUIDELINES:
- Museums, castles, major attractions: 30-45 minutes
- Churches, small historical sites: 15-30 minutes
- Parks, outdoor spaces: 20-40 minutes
- Markets, shopping areas: 20-35 minutes
- Restaurants, cafes: 15-25 minutes
- NEVER exceed 45 minutes for any single location
- Consider realistic visit times, not opening hours

Available interests: ${AVAILABLE_INTERESTS.join(', ')}

CONVERSATION CONTEXT:
${conversationHistory ? conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : `user: ${message}`}

INSTRUCTIONS:
- Review the ENTIRE conversation above to understand what the user wants
- Extract city, country, and places from ALL messages in the conversation
- If the user mentioned a city earlier (like "Rome"), remember it for subsequent messages
- Set needsMoreInfo to false if you have enough information to create a tour (city + general idea of what they want)
- Only set needsMoreInfo to true if you truly cannot determine the city/location
- Provide realistic visit durations based on the type of location
- Extract the emotional MOOD from the user's request: "view from the top" / "scenic" / "beautiful" → joyful. "hidden" / "secret" / "off beaten path" → adventurous. "ghost" / "dark" / "haunted" → dark. "food" / "eating" / "pubs" → relaxed. "romantic" / "sunset" → romantic. Default to "curious" if unclear.
- Respond with ONLY valid JSON — no markdown, no code blocks, no explanation
${locationContext}${curatedContext}`;

    // Retry with exponential backoff for transient errors (429 rate-limit, 529 overloaded, 5xx)
    const MAX_RETRIES = 2;
    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 0.3,
      system: 'You are an expert travel planner with perfect memory and deep local knowledge. Analyze the ENTIRE conversation history to understand what the user wants. Remember all details mentioned earlier (cities, preferences, duration, etc). Extract structured tour information based on the full context. Always respond with ONLY valid JSON — no markdown, no code blocks, no explanation. Provide realistic visit durations - most single locations should take 15-45 minutes, with major attractions on the higher end. When a curated places database is provided, STRONGLY prefer those places — they have expert-written audio stories that create a premium experience. Use the exact place names from the database. When generating a tourTitle, make it evocative and specific to the user\'s request — not generic. A food tour should sound like a food tour, a ghost tour should sound like a ghost tour. Examples: "Bites & Backstreets of Barcelona" not "Barcelona Tour", "Haunted Edinburgh After Dark" not "Edinburgh Walking Tour".',
      messages: [{ role: 'user', content: userPrompt }]
    });

    // deno-lint-ignore prefer-const
    let response!: Response;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: requestBody,
      });

      if (response.ok || (response.status < 429 && response.status !== 408)) break;

      // Transient error — wait and retry
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * 2 ** attempt; // 1s, 2s
        console.warn(`Claude API ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    let content: string;
    let usedModel = 'claude-sonnet-4-6';

    if (!response.ok) {
      // Claude failed after retries — fall back to GPT
      if (!openaiApiKey) {
        const errorText = await response.text();
        console.error('Claude API error (no GPT fallback available):', errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      console.warn(`Claude API ${response.status} after retries, falling back to GPT`);
      usedModel = 'gpt-4o';

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_completion_tokens: 2048,
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'You are an expert travel planner with perfect memory and deep local knowledge. Analyze the ENTIRE conversation history to understand what the user wants. Remember all details mentioned earlier (cities, preferences, duration, etc). Extract structured tour information based on the full context. Always respond with ONLY valid JSON — no markdown, no code blocks, no explanation. Provide realistic visit durations - most single locations should take 15-45 minutes, with major attractions on the higher end. When a curated places database is provided, STRONGLY prefer those places — they have expert-written audio stories that create a premium experience. Use the exact place names from the database. When generating a tourTitle, make it evocative and specific to the user\'s request — not generic. A food tour should sound like a food tour, a ghost tour should sound like a ghost tour. Examples: "Bites & Backstreets of Barcelona" not "Barcelona Tour", "Haunted Edinburgh After Dark" not "Edinburgh Walking Tour".' },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!gptResponse.ok) {
        const gptError = await gptResponse.text();
        console.error('GPT fallback also failed:', gptError);
        throw new Error(`Both Claude (${response.status}) and GPT (${gptResponse.status}) failed`);
      }

      const gptResult = await gptResponse.json();
      content = gptResult.choices?.[0]?.message?.content || '';
    } else {
      const result = await response.json();
      content = result.content[0].text;
    }

    try {
      // Handle possible markdown wrapping
      let cleanContent = content.trim();

      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedData = JSON.parse(cleanContent);

      // Validate and cap durations
      if (parsedData.places) {
        parsedData.places = parsedData.places.map((place: any) => ({
          ...place,
          estimatedDuration: Math.min(place.estimatedDuration || 30, 45) // Cap at 45 minutes
        }));
      }

      console.log('Parsed tour data:', parsedData);

      // Fire-and-forget usage logging
      logUsage({
        service: usedModel.startsWith('gpt') ? 'openai' : 'anthropic',
        function_name: 'parse-tour-request',
        characters_used: message.length,
        estimated_cost_usd: (message.length / 1000) * 0.003,
        status: 'success',
        metadata: { model: usedModel, places_count: parsedData.places?.length || 0, needs_more_info: parsedData.needsMoreInfo || false },
      });

      return new Response(JSON.stringify({
        data: parsedData,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', content);

      // Fire-and-forget usage logging for parse error
      logUsage({
        service: 'anthropic',
        function_name: 'parse-tour-request',
        characters_used: message.length,
        estimated_cost_usd: (message.length / 1000) * 0.003,
        status: 'error',
        error_code: 'json_parse_error',
      });

      throw new Error('Invalid JSON response from Claude');
    }

  } catch (error: unknown) {
    console.error('Error in parse-tour-request function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({
      error: safeMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
