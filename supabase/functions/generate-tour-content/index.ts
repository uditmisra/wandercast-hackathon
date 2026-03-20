import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface Place {
  id: string;
  name: string;
  city: string;
  neighbourhood?: string;
  country: string;
  description?: string;
  estimatedDuration: number;
}

interface Interest {
  id: string;
  name: string;
  label?: string;
}

interface Personalization {
  preferredTone?: string;
  travelStyle?: string;
  pacePreference?: string;
  favoriteStoryTypes?: string[];
  requestMood?: string;
}

interface ContentResult {
  audioNarration: string;
  hook: string;
  directionalCue: string;
  storyType?: string;
  funFacts?: string[];
  lookCloserChallenge?: string;
  suggestedQuestions?: string[];
  transitionToNext?: string;
}

const MIN_WORD_COUNT = 100;
const MAX_RETRIES = 2;

// Track Claude failures per request to skip after repeated errors
let claudeFailures = 0;
const MAX_CLAUDE_FAILURES = 2;

// ============================================================
// CONTENT RELEVANCE VALIDATION
// ============================================================

/**
 * Basic English stemming: reduce common suffixes so "studios"↔"studio",
 * "gardens"↔"garden", "churches"↔"church", "galleries"↔"gallery" all match.
 * Not a full Porter stemmer — just the patterns that matter for place names.
 */
function stemToken(token: string): string {
  // Order matters: check longer suffixes first
  if (token.endsWith('ies') && token.length > 4) return token.slice(0, -3) + 'y'; // galleries→gallery
  if (token.endsWith('ches') || token.endsWith('shes') || token.endsWith('sses')) return token.slice(0, -2); // churches→church
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1); // studios→studio, gardens→garden
  return token;
}

/**
 * Validates that generated/cached content is actually about the requested place.
 * Catches hallucination (LLM writes about London Eye when asked about a synagogue)
 * and stale cache mismatches.
 *
 * Strategy:
 * 1. First check if the full place name appears as a phrase (strongest signal).
 * 2. Extract distinctive tokens from the place name, apply basic stemming,
 *    and check how many stems appear in the narration.
 * 3. Threshold: at least 50% of tokens (min 1) must match.
 *    For 1 token: 1. For 2: 1. For 3: 2. For 4: 2.
 *
 * IMPORTANT: When no distinctive tokens can be extracted, this returns FALSE
 * (guilty until proven innocent). This prevents generic/short place names from
 * bypassing validation entirely.
 */
function contentMatchesPlace(placeName: string, narration: string): boolean {
  if (!narration || narration.length < 100) return true; // too short to judge

  const narratLower = narration.toLowerCase();

  // Fast path: if the full place name appears verbatim, it's definitely about this place.
  const nameNorm = placeName.toLowerCase().trim();
  if (nameNorm.length >= 5 && narratLower.includes(nameNorm)) {
    return true;
  }

  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'of', 'in', 'at', 'on', 'to', 'for', 'and', 'or',
    'new', 'old', 'great', 'big', 'little', 'saint', 'st', 'sir', 'ye',
    'north', 'south', 'east', 'west', 'upper', 'lower', 'royal', 'olde',
    'street', 'road', 'lane', 'avenue', 'square', 'place', 'way', 'row',
    'city', 'town', 'village', 'del', 'de', 'la', 'le', 'les', 'des', 'di',
  ]);

  const tokens = nameNorm
    .replace(/[''´`\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOP_WORDS.has(t));

  // No distinctive tokens = can't validate. Safer to reject and let Tier 2/3 handle it.
  if (tokens.length === 0) {
    console.warn(`[relevance] No distinctive tokens in "${placeName}" — cannot validate, rejecting`);
    return false;
  }

  // Stem each token and check if the stem (or the original) appears in the narration.
  const matchCount = tokens.filter(t => {
    if (narratLower.includes(t)) return true;
    const stemmed = stemToken(t);
    if (stemmed !== t && narratLower.includes(stemmed)) return true;
    return false;
  }).length;

  // Require at least 50% of distinctive tokens (min 1).
  // For 1 token: 1. For 2: 1. For 3: 2. For 4: 2. For 5: 3.
  const threshold = Math.max(1, Math.ceil(tokens.length * 0.5));
  const passes = matchCount >= threshold;

  if (!passes) {
    const matched = tokens.filter(t => narratLower.includes(t) || narratLower.includes(stemToken(t)));
    console.warn(
      `[relevance] MISMATCH: "${placeName}" — found ${matchCount}/${tokens.length} tokens (need ${threshold}). ` +
      `Tokens: [${tokens.join(', ')}], matched: [${matched.join(', ')}]`
    );
  } else {
    console.log(`[relevance] OK: "${placeName}" — ${matchCount}/${tokens.length} tokens matched (need ${threshold})`);
  }

  return passes;
}

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

const CLAUDE_SYSTEM_PROMPT = `You are a world-class storytelling guide. Your gift is finding the ONE story at every place that makes someone stop walking and lean in. You adapt your voice to match what the listener wants.

## CORE PRINCIPLES

1. **Tell STORIES, not facts.** Every place has a Wikipedia page. Nobody needs another one. Find the human moment, the turning point, the detail that changes how someone sees what's in front of them.
2. **Talk TO people.** "See that window?" "Look up." "Notice how the light hits that stone?" You are walking beside them, not lecturing from a podium.
3. **Ground the listener physically.** They are STANDING somewhere specific. Use that. Direct their eyes, their body, their attention to real things they can see and touch.
4. **Find the angle nobody else would pick.** The first story that comes to mind is what every other guide tells. Go one layer deeper. The second or third most interesting thing about a place is usually the most memorable.
5. **NEVER summarize — PERFORM.** The difference between "this building was important" and "see that crack in the wall? A cannonball did that, and the owner refused to fix it out of spite" is everything.

## TONE ADAPTATION

The listener's tone preference FUNDAMENTALLY changes how you tell the story — not just the vocabulary, but the rhythm, the emotional register, and what you choose to emphasize. A casual narration and a dramatic narration about the same place should feel like different experiences, not the same script with different adjectives.

Read the tone description in the LISTENER PROFILE carefully. It is your performance direction.

## INTEREST-AWARE STORYTELLING

The listener's interests shape WHAT you notice and WHERE you lead their attention:

- **Food/drink**: Lead with sensory detail. Smells, textures, the specific moment of tasting. Weave history through ingredients and recipes. "Smell that? That's the same spice traders were fighting over in this exact alley four hundred years ago."
- **Architecture/engineering**: Command them to LOOK. Specific visual details, structural surprises, design decisions that reveal intent. "See how that arch is slightly off-center? That's not a mistake — that's a compromise between two architects who hated each other."
- **History/culture**: Find the human moment. A specific person's decision, a turning point, not a timeline. History is people making choices under pressure.
- **Art**: The story behind the creation. The argument, the mistake, the accident that became genius. Art is never just what's on the wall — it's everything that happened before it got there.
- **Ghost/mystery/secrets**: Atmosphere first. Build dread or intrigue. Whisper. Let silence do work. The less you explain, the more powerful it becomes.
- **Nature**: Slow down. Sensory immersion. Sound, light, seasonal change. "Stand still for a second. Hear that? That bird has been nesting in this same wall for — well, not this exact bird, but this species — for longer than the building has existed."
- **Religion**: Reverence mixed with human stories. The builders, the believers, the moments of crisis and faith. Sacred spaces carry weight — honor it, but find the person inside the institution.

When interests overlap (e.g., food + history), BLEND them. Lead with the primary interest, weave in the secondary.

## STORY STRUCTURE (the narration field)

Your narration MUST follow this three-act structure:

**Hook** (30-50 words): Ground them in the moment. This does NOT have to be a physical command — it can be a provocative question, a startling fact, a sensory detail, a scene-setting moment, or an unexpected claim. VARY your openings across stops. If one stop starts with "Look up", the next must NOT start with a visual command. Mix approaches: questions ("You know what used to happen here?"), sensory ("Smell that?"), provocative claims ("This wall killed three people"), scene-setting ("It's 1666. The baker's asleep."), or commands ("Stop. Listen."). The one detail that makes them lean in.

**Story** (80-120 words): ONE story. Not a summary — a PERFORMANCE. Setup, escalation, reveal. Vary your sentence rhythm. Rhetorical questions. Specific names, dates, sensory details. Build toward something.

**Punchline** (20-30 words): The reframe. The irony. The moment that changes how they see what they just heard. Make it land. One or two sentences max.

Total narration: 130-200 words (~45-60 seconds of audio).

## STORY TYPE

Before writing, pick the angle that best serves this listener's interests and tone:
- scandal: corruption, affairs, cover-ups, hypocrisy
- engineering: "how did they build that?" — structural marvels, design secrets
- forgotten-person: someone history overlooked or screwed over
- origin-story: how something we take for granted started here, often by accident
- cultural-clash: when two worlds collided at this spot
- mystery: something unexplained, debated, or deliberately hidden
- near-miss: the time this place almost ceased to exist
- hidden-in-plain-sight: something everyone walks past without realizing what it is
- gruesome: dark history — executions, plagues, the uncomfortable truth
- sensory-journey: a tour of tastes, smells, sounds at this place — what it FEELS like to be here
- quiet-beauty: the thing that reveals itself only if you slow down and pay attention
- local-ritual: something residents do here that visitors never see

When in doubt, go SPECIFIC. A single vivid detail beats a broad dramatic claim.

## MOOD AWARENESS

The listener's REQUEST MOOD (if provided) reveals the emotional experience they're looking for. It OVERRIDES default story angle selection:

- **joyful**: Beauty, wonder, positive human stories, sensory delight. The view, the light, the thing that makes you smile.
- **curious**: Engineering, origin-stories, hidden-in-plain-sight. "Wait, why is it like that?" The intellectual itch.
- **adventurous**: Mystery, forgotten-person, local-ritual. Off the beaten path. The thing only locals know.
- **dark**: Gruesome, scandal, mystery. Executions, plagues, cover-ups. ONLY when explicitly requested.
- **romantic**: Quiet-beauty, sensory-journey. Intimacy, softness, the kind of story you whisper.
- **relaxed**: Sensory-journey, quiet-beauty, local-ritual. Slow down. Breathe. Notice.

**DEFAULT BIAS**: Unless the listener explicitly asks for dark/spooky content OR their interests include ghost/mystery/secrets, default to POSITIVE, UPLIFTING, or CURIOUS story angles. Most people want to feel GOOD about the places they visit. A place can have dark history AND beautiful stories — choose the one that matches the mood. Save gruesome for tours that explicitly ask for it.

If no mood is provided and no ghost/mystery interest is present, prefer these story types: origin-story, hidden-in-plain-sight, engineering, quiet-beauty, sensory-journey, local-ritual. Only use gruesome or scandal when the mood or interests make it the obvious fit.

## ANTI-PATTERNS (instant disqualification)
- NEVER start with when something was built or opened — boring
- NEVER give a chronological summary — you're not a textbook
- NEVER lead with the place name — "The Tower of London is..." is dead on arrival (but DO mention the place's full name naturally within the first half of the narration — the listener needs to know where they are)
- NEVER use: "hidden gem", "best-kept secret", "step back in time", "rich tapestry", "bustling", "vibrant", "iconic", "nestled", "boasts", "storied history", "a testament to" — tourist brochure garbage
- NEVER list facts in sequence — build to something
- NEVER force a tone that doesn't fit the place. A solemn memorial doesn't need jokes. A lively market doesn't need gravitas. Read the room.
- NEVER default to dark, gruesome, or macabre stories unless the listener's mood or interests explicitly call for it. "Interesting" does not mean "dark."
- NEVER start consecutive narrations the same way. If one stop opens with "Look up", the next MUST open differently. Vary between questions, sensory details, provocative claims, and scene-setting. "Look up. No, higher —" is a cliché if used more than once per tour.

## OTHER FIELDS

- storyHook: max 120 chars. The single most compelling true claim about this place. The thing that makes someone say "wait, really?"
- lookAt: starts with action verb. A specific physical command. "Look up at the third window." "Find the gargoyle above the doorway." "Check out the worn stone on the left column."
- storyType: which story type you chose (from the list above).
- funFacts: 3 mini-stories (2-3 sentences each). Each its own surprising moment — NOT trivia from the main narration. Go DIFFERENT: if the narration is about history, make fun facts about engineering or local culture. Each one should make someone want to share it.
- lookCloserChallenge: A specific visual scavenger hunt. "Find the bullet hole in the third pillar." "Look for the face carved into the keystone — it's supposedly a caricature of the architect's rival." Something they'll actually want to find.
- suggestedQuestions: 2 questions the listener would actually ASK, phrased naturally. "So... did they ever catch the guy?" not "What is the historical significance of..."
- transitionToNext: if next stop provided, 1-2 sentences that TEASE the next stop while giving directions. Match the tour's tone — a food tour transition might mention what you'll smell; a ghost tour might build anticipation. Omit if no next stop.

## SOURCING & ACCURACY
- The grounding material provides FACTS. Your job is to find the most COMPELLING angle — not invent new facts.
- The depth comes from FRAMING AND STORYTELLING. The same facts told as "here is what happened" vs "here is the moment everything changed" are completely different experiences.
- NEVER invent a specific person's name, date, or event. If it's not in the grounding material and you're not confident it's well-documented, don't include it.
- You MAY add: widely-known historical context, architectural observations, engineering principles, cultural common knowledge. Low-hallucination stuff.
- You may NOT add: specific anecdotes about named people, specific dates, quotes, or statistics unless they're either in the grounding material or are famous facts (e.g., "the Great Fire of 1666" is fine).
- For funFacts: surprising angles on REAL facts. Not fabricated obscurities.
- When uncertain, lean into it: "Now, legend has it..." "The story goes..." "Nobody can prove this, but..." — hedging is honest storytelling and listeners respect it.

## EXAMPLES

### Example 1: Sagrada Familia, Barcelona (engineering) — scholarly tone, architecture interest

NEXT STOP: Hospital de Sant Pau — 600m north, about 8 min walk.

{"narration": "Tilt your head back. Further. See where those columns branch into the ceiling like a stone forest? Here's what's extraordinary — Gaudi didn't draw that. He hung chains upside down from the ceiling of his workshop, let gravity shape the curves, then flipped the photograph. The catenary arches you're looking at are literally gravity's own design, inverted. He spent forty-three years on this building and knew he'd never see it finished. When someone asked why he bothered, he said his client — meaning God — was in no hurry. What you're standing inside is the longest architectural experiment in modern history: a building designed by a man who envisioned something so structurally radical that engineers couldn't figure out how to build it until computers caught up with his intuition. They're still working. The cranes are part of the design now, in a way.", "storyHook": "Gaudi designed these arches by hanging chains upside down and letting gravity do the engineering.", "lookAt": "Look straight up where the columns branch — each one splits at a different angle, calculated to distribute weight like a living tree.", "storyType": "engineering", "funFacts": ["The facade facing the park — the Nativity facade — is the only one Gaudi completed himself. Run your fingers along the stone if you can reach it. He cast real plants, real animals, even a real chicken in plaster to get the textures right. Those leaves aren't carved. They're fossilized impressions of actual leaves.", "The building was almost never finished at all. During the Spanish Civil War, anarchists broke into Gaudi's workshop and destroyed most of his original models and plans. Engineers spent decades piecing fragments back together, like an architectural jigsaw puzzle, before computers let them extrapolate the rest.", "Gaudi is buried in the crypt beneath your feet. He was hit by a tram in 1926 and was so shabbily dressed that nobody recognized him — he was taken to a charity hospital. By the time they realized who he was, he refused to leave, saying the hospital was where he belonged. He died two days later."], "lookCloserChallenge": "Find the tortoise at the base of the columns on the Nativity facade. There are two — one represents the sea, one the land. They carry the weight of the entire structure on their backs.", "suggestedQuestions": ["How do the current architects know what Gaudi intended?", "When is it actually supposed to be finished?"], "transitionToNext": "Head north out of the main entrance. About eight minutes on foot. You'll spot a building ahead that looks like it belongs in a fairy tale — that's Hospital de Sant Pau. It was designed by Gaudi's rival, and the two of them couldn't even agree on which direction their buildings should face."}

### Example 2: La Boqueria, Barcelona (sensory-journey) — casual tone, food interest

NEXT STOP: Placa Reial — 300m south, about 4 min walk.

{"narration": "Stop right here. Close your eyes for two seconds. Smell that? That's jamon — legs of it, hanging above your head like some kind of cured-meat chandelier. Now open your eyes and look at the stall on your left. See those peppers? The tiny wrinkled ones? Those are padron peppers, and here's the game: most of them are mild, sweet, harmless. But roughly one in ten will light your mouth on fire. Nobody knows which one. Not even the vendor. Locals order a plate, eat them one by one, and wait for someone at the table to flinch. It's like Russian roulette, but with tapas. This market has been feeding Barcelona since 1217 — it started as a few farmers selling goats by the old city gate. Eight hundred years later, the goats are gone but the principle is the same: you show up, you taste something you've never tasted, and you leave a little bit changed.", "storyHook": "One in ten of those little peppers will set your mouth on fire. Nobody knows which. That's the game.", "lookAt": "Look up — those jamon legs hanging from the ceiling have been curing for at least eighteen months. The black-hoofed ones are iberico. Those pigs ate nothing but acorns.", "storyType": "sensory-journey", "funFacts": ["The juice stalls at the front of the market are a tourist trap and every local knows it. The real food is in the back — the stalls that don't have menus in four languages. If you see a counter where old men are eating sardines at 10am, that's the one.", "La Boqueria technically sits on the site of a medieval convent. The nuns were evicted in 1836 during a period of aggressive secularization, and the city turned their cloister into a food market. From prayer to peppers. The nuns were reportedly not thrilled.", "Those elaborate fruit displays — the perfect pyramids of dragon fruit and mango — are rebuilt from scratch every single morning. Each vendor considers their arrangement a work of art. Mess one up and you'll learn some extremely creative Catalan vocabulary."], "lookCloserChallenge": "Find the original iron-and-glass entrance arch on La Rambla. Look at the sign — it still says 'Mercat de Sant Josep.' That was the convent's name. The nuns' ghost, basically, in wrought iron.", "suggestedQuestions": ["What should I actually eat here — what do locals order?", "Is it true the front stalls charge tourist prices?"], "transitionToNext": "Work your way back toward La Rambla and head south. Four minutes. Keep an eye out for a grand archway on your left — that's Placa Reial. Same square where a very young Gaudi designed his first public commission. You'll spot it. The lampposts. They're unmistakable."}

### Example 3: Ye Olde Cheshire Cheese, London (hidden-in-plain-sight) — witty tone, history interest

NEXT STOP: None (last stop).

{"narration": "Duck. I'm serious — that door frame is original, and it was built for people who topped out at five foot four. Now look up at the ceiling. See those beams? Black. Not painted black — stained black by three and a half centuries of pipe smoke, spilled ale, and the collective despair of Fleet Street journalists. This pub has been serving drinks since 1667, rebuilt right after the Great Fire — which, for the record, was probably started by a baker who fell asleep on the job. But here's the thing nobody tells you. This pub's most famous regular? Not Samuel Johnson. Not Dickens. Not Yeats. It was a PARROT. Polly the grey parrot lived above the bar for forty years. She learned to pop champagne corks, swore at customers, and when she finally died in 1926, the BBC interrupted national programming to announce it. A parrot. Got an obituary on national radio. Which is more than most of us will manage.", "storyHook": "This pub's most famous regular wasn't Dickens — it was a parrot who got a BBC obituary.", "lookAt": "Duck through the door and look straight up — those beams haven't been cleaned since 1667 and nobody is allowed to touch them.", "storyType": "hidden-in-plain-sight", "funFacts": ["The pub goes DOWN. Multiple levels, built over medieval cellars. Some of those vaulted basement rooms probably predate the Great Fire — meaning you can drink beer in a space that survived the disaster that flattened eighty percent of the city. The beer's better down there too, supposedly.", "One landlord in the 1920s tried to clean the fireplace. The regulars nearly rioted. The accumulated soot of centuries was apparently part of the charm. It hasn't been cleaned since. This is a pub that treats dirt as a heritage feature, which is honestly the most British thing imaginable.", "The 'Ye Olde' in the name is a complete fabrication. Victorian marketing invention — the pub was just called the Cheshire Cheese for two hundred years. Adding 'Ye Olde' was the 1800s equivalent of putting 'artisan' on your packaging. And just like today, it worked."], "lookCloserChallenge": "Ground floor bar. Find the small plaque listing every monarch who has reigned during this pub's lifetime. It starts with Charles II. It's a long list.", "suggestedQuestions": ["Which writers actually drank here regularly — and which ones are just marketing?", "What's in the basement levels?"]}

Respond with ONLY this JSON (no markdown, no code blocks):
{"narration": "...", "storyHook": "...", "lookAt": "...", "storyType": "...", "funFacts": ["...", "...", "..."], "lookCloserChallenge": "...", "suggestedQuestions": ["...", "..."], "transitionToNext": "..."}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { places, interests, personalization, spatialContext } = await req.json();

    if (!places || !Array.isArray(places) || places.length === 0) {
      throw new Error('Places array is required');
    }

    if (!interests || !Array.isArray(interests)) {
      throw new Error('Interests array is required');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tone = personalization?.preferredTone || 'casual';
    const interestNames = interests.map((i: Interest) => (i.name || i.label || '').toLowerCase());
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    console.log(`=== GENERATE TOUR CONTENT [${requestId}] ===`);
    console.log(`Places: ${places.map((p: Place) => `"${p.name}" (${p.city || 'NO CITY'})`).join(', ')}`);
    console.log(`Interests: ${interestNames.join(', ')}, Tone: ${tone}, Claude: ${!!anthropicApiKey}`);

    // Reset per-request failure counter
    claudeFailures = 0;

    const results = [];

    for (let i = 0; i < places.length; i++) {
      const place = places[i];

      try {
        console.log(`\n--- Place ${i + 1}/${places.length}: ${place.name} ---`);

        const nextPlaceName = i < places.length - 1 ? places[i + 1].name : undefined;
        const { content, source } = await generateContent(
          supabase, place, interestNames, interests, tone, personalization, nextPlaceName, spatialContext
        );

        console.log(`✓ Content ready: ${content.audioNarration.length} chars [${source}]`);

        results.push({
          placeId: place.id,
          content,
          success: true,
          source
        });

        // Rate limiting after any LLM call
        if (source !== 'curated' && source !== 'fallback' && i < places.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error: unknown) {
        console.error(`Error for ${place.name}:`, error instanceof Error ? error.message : error);

        results.push({
          placeId: place.id,
          content: createFallbackContent(place),
          success: false,
          error: 'Content generation failed'
        });
      }
    }

    console.log(`\n=== COMPLETE [${requestId}]: ${results.filter(r => r.success).length}/${results.length} successful ===`);
    console.log(`Sources: ${results.map(r => `${r.placeId}→${r.source}`).join(', ')}`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Fatal error in generate-tour-content:', error);
    return new Response(JSON.stringify({ error: 'Content generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// CONTENT GENERATION ORCHESTRATOR (4-tier pipeline)
// ============================================================

interface SpatialContext {
  distanceToNextMeters?: number;
  directionToNext?: string;
  walkingMinutesToNext?: number;
  nextPlaceName?: string;
}

async function generateContent(
  supabase: any,
  place: Place,
  interestNames: string[],
  interests: Interest[],
  tone: string,
  personalization: Personalization | undefined,
  nextPlaceName?: string,
  spatialContext?: SpatialContext
): Promise<{ content: ContentResult; source: string }> {

  const placeNorm = place.name.toLowerCase().trim();
  const cityNorm = (place.city || '').toLowerCase().trim();

  /** Store generated content for future reuse (fire-and-forget) */
  const cacheContent = async (content: ContentResult, source: string) => {
    if (!placeNorm || !cityNorm) return;
    try {
      await supabase.from('generated_place_content').upsert({
        place_name_normalized: placeNorm,
        city_normalized: cityNorm,
        tone,
        generated_content: content,
        source,
        use_count: 1,
      }, { onConflict: 'place_name_normalized,city_normalized,tone' });
    } catch (err) {
      console.warn('[content-cache] Failed to cache content (non-fatal):', err);
    }
  };

  // Step 0: Check for previously generated content (reuse across users/tours)
  if (placeNorm && cityNorm) {
    try {
      const { data: cached } = await supabase
        .from('generated_place_content')
        .select('generated_content, source')
        .eq('place_name_normalized', placeNorm)
        .eq('city_normalized', cityNorm)
        .eq('tone', tone)
        .single();

      if (cached?.generated_content?.audioNarration) {
        // Validate cached content is actually about this place (catches stale mismatches)
        if (contentMatchesPlace(place.name, cached.generated_content.audioNarration)) {
          console.log(`[Reuse] Found cached content for "${place.name}" (${tone})`);
          return { content: cached.generated_content as ContentResult, source: `reused:${cached.source}` };
        }
        console.warn(`[Reuse] REJECTED cached content for "${place.name}" — content doesn't match place. Regenerating.`);
        // Delete the bad cache entry so it doesn't keep being served
        try {
          await supabase.from('generated_place_content')
            .delete()
            .eq('place_name_normalized', placeNorm)
            .eq('city_normalized', cityNorm)
            .eq('tone', tone);
        } catch { /* non-fatal */ }
      }
    } catch {
      // No cached content — proceed with normal pipeline
    }
  }

  // Step 1: Look for curated stories
  const curated = await findCuratedStories(supabase, place);

  if (curated) {
    // Tier 1: Curated + Claude
    if (anthropicApiKey && claudeFailures < MAX_CLAUDE_FAILURES) {
      try {
        console.log(`Tier 1: Curated stories + Claude for ${place.name}`);
        const content = await callClaude(
          CLAUDE_SYSTEM_PROMPT,
          buildTier1Prompt(place, curated.stories, interestNames, tone, personalization, nextPlaceName, spatialContext)
        );
        // Validate content is about the right place
        if (!contentMatchesPlace(place.name, content.audioNarration)) {
          throw new Error(`Content relevance check failed — narration doesn't match "${place.name}"`);
        }
        // Fire-and-forget usage logging
        logUsage({
          service: 'anthropic',
          function_name: 'generate-tour-content',
          characters_used: content.audioNarration.length,
          estimated_cost_usd: 0.003,
          status: 'success',
          metadata: { tier: 'curated+claude', place: place.name, city: place.city },
        });
        cacheContent(content, 'curated+claude');
        return { content, source: 'curated+claude' };
      } catch (error) {
        claudeFailures++;
        console.error(`Tier 1 failed (Claude failure ${claudeFailures}):`, error);
        // Fire-and-forget usage logging for tier 1 failure
        logUsage({
          service: 'anthropic',
          function_name: 'generate-tour-content',
          characters_used: 0,
          estimated_cost_usd: 0,
          status: 'error',
          error_code: error instanceof Error ? error.message : 'unknown',
          metadata: { tier: 'curated+claude', place: place.name, city: place.city },
        });
      }
    }

    // Tier 1.5: Curated verbatim (safety net) — MUST also pass content validation
    console.log(`Tier 1.5: Curated verbatim for ${place.name}`);
    const bestStory = scoreBestStory(curated.stories, interestNames, tone);
    if (contentMatchesPlace(place.name, bestStory.audio_narration)) {
      return {
        content: {
          audioNarration: bestStory.audio_narration,
          hook: bestStory.hook,
          directionalCue: bestStory.directional_cue,
          storyType: bestStory.story_type || undefined,
          funFacts: bestStory.fun_facts || undefined,
          lookCloserChallenge: bestStory.look_closer_challenge || undefined,
          suggestedQuestions: bestStory.suggested_questions || undefined,
        },
        source: 'curated'
      };
    }
    console.warn(`[Tier 1.5] Curated story for "${curated.cityPlace.name}" doesn't match requested place "${place.name}" — skipping to Tier 2`);
  }

  // Tier 2: Multi-source web context + Claude (with caching)
  if (anthropicApiKey && claudeFailures < MAX_CLAUDE_FAILURES) {
    try {
      console.log(`Tier 2: Web context + Claude for ${place.name}`);
      const placeKey = `${place.name.toLowerCase()}|${place.city.toLowerCase()}`;

      // Check cache first
      let webContext: string | null = null;
      try {
        const { data: cached } = await supabase
          .from('web_context_cache')
          .select('context, source_count, expires_at')
          .eq('place_key', placeKey)
          .single();

        if (cached && new Date(cached.expires_at) > new Date()) {
          // Validate cached web context mentions the place (catches wrong Wikipedia article)
          if (contentMatchesPlace(place.name, cached.context)) {
            console.log(`Cache hit for "${placeKey}" (${cached.source_count} sources)`);
            webContext = cached.context;
          } else {
            console.warn(`[web-cache] REJECTED cached context for "${placeKey}" — doesn't match place name. Refetching.`);
            try {
              await supabase.from('web_context_cache').delete().eq('place_key', placeKey);
            } catch { /* non-fatal */ }
          }
        }
      } catch { /* cache miss or table doesn't exist yet — proceed to fetch */ }

      // If no cache hit, fetch from web sources
      if (!webContext) {
        const result = await fetchWebContext(place.name, place.city);
        if (result && contentMatchesPlace(place.name, result.context)) {
          webContext = result.context;
        } else if (result) {
          console.warn(`[web-fetch] REJECTED fetched context for "${place.name}" — Wikipedia returned content about a different place`);
        }
        if (webContext) {
          // Store in cache (upsert)
          try {
            await supabase
              .from('web_context_cache')
              .upsert({
                place_key: placeKey,
                context: result.context,
                source_count: result.sourceCount,
                fetched_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }, { onConflict: 'place_key' });
            console.log(`Cached web context for "${placeKey}"`);
          } catch (cacheErr) {
            console.log('Cache write failed (non-fatal):', cacheErr);
          }
        }
      }

      if (webContext) {
        const content = await callClaude(
          CLAUDE_SYSTEM_PROMPT,
          buildTier2Prompt(place, webContext, interestNames, tone, personalization, nextPlaceName, spatialContext)
        );
        // Validate content is about the right place
        if (!contentMatchesPlace(place.name, content.audioNarration)) {
          throw new Error(`Content relevance check failed — narration doesn't match "${place.name}"`);
        }
        // Fire-and-forget usage logging
        logUsage({
          service: 'anthropic',
          function_name: 'generate-tour-content',
          characters_used: content.audioNarration.length,
          estimated_cost_usd: 0.003,
          status: 'success',
          metadata: { tier: 'web+claude', place: place.name, city: place.city },
        });
        cacheContent(content, 'web+claude');
        return { content, source: 'web+claude' };
      }
      console.log('No web context found, falling through...');
    } catch (error) {
      claudeFailures++;
      console.error(`Tier 2 failed (Claude failure ${claudeFailures}):`, error);
      // Fire-and-forget usage logging for tier 2 failure
      logUsage({
        service: 'anthropic',
        function_name: 'generate-tour-content',
        characters_used: 0,
        estimated_cost_usd: 0,
        status: 'error',
        error_code: error instanceof Error ? error.message : 'unknown',
        metadata: { tier: 'web+claude', place: place.name, city: place.city },
      });
    }
  }

  // Tier 3: OpenAI GPT fallback
  try {
    console.log(`Tier 3: GPT-5.2 fallback for ${place.name}`);
    const content = await generateWithRetry(place, interestNames, tone, personalization, nextPlaceName, spatialContext);
    // Validate content is about the right place
    if (!contentMatchesPlace(place.name, content.audioNarration)) {
      throw new Error(`Content relevance check failed — narration doesn't match "${place.name}"`);
    }
    // Fire-and-forget usage logging
    logUsage({
      service: 'openai',
      function_name: 'generate-tour-content',
      characters_used: content.audioNarration.length,
      estimated_cost_usd: 0.005,
      status: 'success',
      metadata: { tier: 'gpt-5.2', place: place.name, city: place.city },
    });
    cacheContent(content, 'generated');
    return { content, source: 'generated' };
  } catch (error) {
    console.error('Tier 3 (GPT) failed:', error);
    // Fire-and-forget usage logging for tier 3 failure
    logUsage({
      service: 'openai',
      function_name: 'generate-tour-content',
      characters_used: 0,
      estimated_cost_usd: 0,
      status: 'error',
      error_code: error instanceof Error ? error.message : 'unknown',
      metadata: { tier: 'gpt-5.2', place: place.name, city: place.city },
    });
  }

  // Tier 4: Static template
  console.log(`Tier 4: Static fallback for ${place.name}`);
  return { content: createFallbackContent(place), source: 'fallback' };
}

// ============================================================
// FUZZY PLACE MATCHING
// ============================================================

function normalizeName(name: string): { primary: string; variants: string[]; tokens: Set<string> } {
  const lower = name.toLowerCase().trim();
  const aliases: string[] = [];

  // Extract parenthetical content as alias: "Big Ben (Elizabeth Tower)" → alias "elizabeth tower"
  const parenMatch = lower.match(/\(([^)]+)\)/);
  if (parenMatch) aliases.push(parenMatch[1].trim());

  // Strip parens, articles, apostrophes
  const cleaned = lower
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/[''´`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split on " / " for multi-name entries like "Palace of Westminster / Big Ben"
  const slashParts = cleaned.split(/\s*\/\s*/);
  const allVariants = [...slashParts, ...aliases.map(a =>
    a.replace(/\b(the|a|an)\b/g, '').replace(/[''´`]/g, '').replace(/\s+/g, ' ').trim()
  )].filter(Boolean);

  const allTokens = new Set(allVariants.flatMap(v => v.split(/\s+/).filter(Boolean)));

  return { primary: cleaned, variants: allVariants, tokens: allTokens };
}

function scorePlaceMatch(inputName: string, candidateName: string): number {
  const input = normalizeName(inputName);
  const candidate = normalizeName(candidateName);

  let bestScore = 0;

  for (const iv of input.variants) {
    for (const cv of candidate.variants) {
      const iTokens = new Set(iv.split(/\s+/).filter(Boolean));
      const cTokens = new Set(cv.split(/\s+/).filter(Boolean));

      // Exact variant match
      if (iv === cv) return 1.0;

      // Jaccard similarity: |intersection| / |union|
      const intersection = [...iTokens].filter(t => cTokens.has(t)).length;
      const union = new Set([...iTokens, ...cTokens]).size;
      let score = union > 0 ? intersection / union : 0;

      // Containment boost: all tokens from one side found in the other
      const inputInCandidate = [...iTokens].every(t => cTokens.has(t));
      const candidateInInput = [...cTokens].every(t => iTokens.has(t));
      if (inputInCandidate || candidateInInput) {
        score += 0.3;
      } else {
        // Partial containment: >50% of input tokens found in candidate
        const inputOverlap = [...iTokens].filter(t => cTokens.has(t)).length / iTokens.size;
        const candidateOverlap = [...cTokens].filter(t => iTokens.has(t)).length / cTokens.size;
        if (inputOverlap >= 0.5 || candidateOverlap >= 0.5) score += 0.15;
      }

      bestScore = Math.max(bestScore, score);
    }
  }

  return Math.min(bestScore, 1.0);
}

// ============================================================
// CURATED STORY LOOKUP — strict matching + LLM verification
// ============================================================
//
// Three-step approach:
//  1. Exact normalized name match (within same city)
//  2. Containment match (one name is a substring of the other)
//  3. Claude Haiku verification for ambiguous candidates
//
// If none match confidently, returns null → falls through to Tier 2 (web+Claude).
// This prevents the old fuzzy-matching false positives (e.g., "Abbey Road Studios"
// matching "Westminster Abbey" via shared "abbey" token).
// ============================================================

async function findCuratedStories(
  supabase: any,
  place: Place
): Promise<{ cityPlace: any; stories: any[] } | null> {
  try {
    const cityNorm = (place.city || '').toLowerCase().trim();

    // Without a city, curated matching is unreliable — skip to Tier 2
    if (!cityNorm) {
      console.log(`[curated] Skipping — no city for "${place.name}"`);
      return null;
    }

    const { data: allPlaces, error: placesError } = await supabase
      .from('city_places')
      .select('place_id, name, city_id, cities(name)');

    if (placesError || !allPlaces?.length) {
      console.log('[curated] No city_places in database');
      return null;
    }

    // Step 0: Filter to same city (hard requirement)
    const sameCityPlaces = allPlaces.filter((cp: any) => {
      const cpCity = (cp.cities?.name || '').toLowerCase().trim();
      return cpCity === cityNorm || cpCity.includes(cityNorm) || cityNorm.includes(cpCity);
    });

    if (sameCityPlaces.length === 0) {
      console.log(`[curated] No curated places in city "${place.city}"`);
      return null;
    }

    console.log(`[curated] ${sameCityPlaces.length} candidates in "${place.city}" for "${place.name}"`);

    const inputNorm = normalizeName(place.name);
    let match: any = null;

    // Step 1: Exact normalized match (fast path)
    match = sameCityPlaces.find((cp: any) => {
      const cpNorm = normalizeName(cp.name);
      // Primary name matches
      if (inputNorm.primary === cpNorm.primary) return true;
      // Any variant matches any variant (handles "Big Ben" / "Palace of Westminster / Big Ben")
      return inputNorm.variants.some(iv => cpNorm.variants.some(cv => iv === cv));
    });

    if (match) {
      console.log(`[curated] Exact match: "${place.name}" → "${match.name}"`);
    }

    // Step 2: Containment match (one name contains the other, e.g., "Sagrada Familia" in "La Sagrada Familia")
    if (!match) {
      match = sameCityPlaces.find((cp: any) => {
        const cpPrimary = normalizeName(cp.name).primary;
        return cpPrimary.includes(inputNorm.primary) || inputNorm.primary.includes(cpPrimary);
      });
      if (match) {
        console.log(`[curated] Containment match: "${place.name}" → "${match.name}"`);
      }
    }

    // Step 3: Claude Haiku verification — only when we have ambiguous candidates
    // Uses the cheapest/fastest model to answer: "is X the same real-world place as Y?"
    if (!match && anthropicApiKey && sameCityPlaces.length <= 50) {
      const candidateList = sameCityPlaces.map((cp: any, i: number) => `${i + 1}. ${cp.name}`).join('\n');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const verifyResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey!,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 10,
            temperature: 0,
            messages: [{
              role: 'user',
              content: `Which numbered place below is the SAME real-world location as "${place.name}" in ${place.city}? Reply with ONLY the number, or "NONE" if no match.\n\n${candidateList}`
            }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const answer = (verifyData.content?.[0]?.text || '').trim();

          if (answer && answer.toUpperCase() !== 'NONE') {
            const idx = parseInt(answer, 10) - 1;
            if (idx >= 0 && idx < sameCityPlaces.length) {
              match = sameCityPlaces[idx];
              console.log(`[curated] Haiku verified: "${place.name}" → "${match.name}"`);
            }
          } else {
            console.log(`[curated] Haiku says no match for "${place.name}" among ${sameCityPlaces.length} candidates`);
          }
        }
      } catch (err) {
        console.warn('[curated] Haiku verification failed (non-fatal, skipping curated):', err);
      }
    }

    if (!match) {
      console.log(`[curated] No confident match for "${place.name}" in "${place.city}" — falling through to Tier 2`);
      return null;
    }

    // Fetch ALL stories for this place
    const { data: stories, error: storiesError } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', match.place_id);

    if (storiesError || !stories || stories.length === 0) {
      console.log(`[curated] No stories found for "${match.name}" (${match.place_id})`);
      return null;
    }

    console.log(`[curated] Found ${stories.length} stories for "${match.name}"`);
    return { cityPlace: match, stories };
  } catch (error) {
    console.error('[curated] Error finding curated stories:', error);
    return null;
  }
}

// Score and return the single best story (for Tier 1.5 verbatim fallback)
function scoreBestStory(stories: any[], interests: string[], tone: string): any {
  const scoredStories = stories.map((story: any) => {
    let score = 0;
    if (story.tone === tone) score += 5;
    const storyInterests = story.interests.map((i: string) => i.toLowerCase());
    const overlap = interests.filter(i => storyInterests.includes(i)).length;
    score += overlap * 5;
    return { ...story, score };
  });
  scoredStories.sort((a: any, b: any) => b.score - a.score);
  return scoredStories[0];
}

// ============================================================
// CLAUDE API (Anthropic Messages API)
// ============================================================

async function callClaude(systemPrompt: string, userPrompt: string): Promise<ContentResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        temperature: 0.85,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    console.log(`Raw Claude response length: ${content.length}`);

    // Parse JSON, handling possible markdown wrapping
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanContent);

    if (!parsed.narration) {
      throw new Error('Missing narration in Claude response');
    }

    console.log(`Claude narration: ${parsed.narration.length} chars`);

    const result: ContentResult = {
      audioNarration: parsed.narration,
      hook: parsed.storyHook || parsed.hook || '',
      directionalCue: parsed.lookAt || parsed.directionalCue || ''
    };

    if (parsed.storyType) {
      result.storyType = parsed.storyType;
    }
    if (Array.isArray(parsed.funFacts) && parsed.funFacts.length > 0) {
      result.funFacts = parsed.funFacts.slice(0, 3);
    }
    if (parsed.lookCloserChallenge) {
      result.lookCloserChallenge = parsed.lookCloserChallenge;
    }
    if (Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length > 0) {
      result.suggestedQuestions = parsed.suggestedQuestions.slice(0, 2);
    }
    if (parsed.transitionToNext) {
      result.transitionToNext = parsed.transitionToNext;
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// MULTI-SOURCE WEB CONTEXT FETCHING (Firecrawl → Wikipedia fallback)
// ============================================================

async function fetchViaFirecrawl(placeName: string, city: string): Promise<{ context: string; sourceCount: number } | null> {
  if (!firecrawlApiKey) {
    console.log('Firecrawl: No API key configured, skipping');
    return null;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);

  try {
    const query = city ? `${placeName} ${city} history culture travel guide` : `${placeName} history culture travel`;
    const body: Record<string, unknown> = {
      query,
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    };
    if (city) {
      body.location = city;
    }

    console.log(`Firecrawl search: "${query}"`);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!response.ok) {
      console.error(`Firecrawl API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = (data.data || []).filter((r: any) => r.markdown && r.markdown.length > 50);

    if (results.length === 0) {
      console.log('Firecrawl: No usable results');
      return null;
    }

    const sections: string[] = [];
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i];
      const title = r.title || r.metadata?.title || 'Untitled';
      const url = r.url || r.metadata?.sourceURL || '';
      sections.push(`=== FIRECRAWL: ${title} (${url}) ===\n${r.markdown.substring(0, 1500)}`);
    }

    const context = sections.join('\n\n');
    console.log(`Firecrawl: ${results.length} results, ${context.length} total chars`);

    // Fire-and-forget usage logging
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('api_usage_log').insert({
        service: 'firecrawl',
        function_name: 'generate-tour-content',
        characters_used: context.length,
        estimated_cost_usd: 0.001 * Math.min(3, results.length),
        status: 'success',
        metadata: { query, resultCount: results.length, place: placeName, city },
      });
    } catch { /* non-fatal */ }

    return { context, sourceCount: Math.min(3, results.length) };
  } catch (err) {
    console.error('Firecrawl fetch error:', err);
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchViaWikipedia(placeName: string, city: string): Promise<{ context: string; sourceCount: number } | null> {
  console.log(`Wikipedia fallback for: ${placeName} (${city})`);

  async function fetchWikipediaSummary(): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const searchQuery = encodeURIComponent(city ? `${placeName} ${city}` : placeName);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&srlimit=1`;
      const resp = await fetch(searchUrl, { signal: ctrl.signal });
      if (!resp.ok) return null;
      const searchData = await resp.json();
      const results = searchData.query?.search;
      if (!results || results.length === 0) return null;
      const resultTitle = encodeURIComponent(results[0].title);
      const summaryResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${resultTitle}`, { signal: ctrl.signal });
      if (!summaryResp.ok) return null;
      const summaryData = await summaryResp.json();
      if (summaryData.extract && summaryData.extract.length > 50) {
        console.log(`Wikipedia summary (${results[0].title}): ${summaryData.extract.length} chars`);
        return summaryData.extract.substring(0, 1500);
      }
      return null;
    } catch { return null; } finally { clearTimeout(t); }
  }

  async function fetchWikivoyage(): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      if (!city) return null;
      const cityTitle = encodeURIComponent(city);
      const resp = await fetch(`https://en.wikivoyage.org/api/rest_v1/page/summary/${cityTitle}`, { signal: ctrl.signal });
      if (resp.ok) {
        const data = await resp.json();
        if (data.extract && data.extract.length > 50) {
          console.log(`Wikivoyage city hit: ${data.extract.length} chars`);
          return data.extract.substring(0, 1000);
        }
      }
      return null;
    } catch { return null; } finally { clearTimeout(t); }
  }

  async function fetchWikipediaExtended(): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const searchQuery = encodeURIComponent(city ? `${placeName} ${city}` : placeName);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&srlimit=1`;
      const searchResp = await fetch(searchUrl, { signal: ctrl.signal });
      if (!searchResp.ok) return null;
      const searchData = await searchResp.json();
      const results = searchData.query?.search;
      if (!results || results.length === 0) return null;
      const resolvedTitle = encodeURIComponent(results[0].title);
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${resolvedTitle}&format=json`;
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) return null;
      const data = await resp.json();
      const pages = data.query?.pages;
      if (!pages) return null;
      const pageId = Object.keys(pages)[0];
      if (pageId === '-1') return null;
      const extract = pages[pageId]?.extract;
      if (extract && extract.length > 100) {
        console.log(`Wikipedia extended hit (${results[0].title}): ${extract.length} chars`);
        return extract.substring(0, 2000);
      }
      return null;
    } catch { return null; } finally { clearTimeout(t); }
  }

  const [wikiResult, voyageResult, extendedResult] = await Promise.allSettled([
    fetchWikipediaSummary(),
    fetchWikivoyage(),
    fetchWikipediaExtended()
  ]);

  const wikiText = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
  const voyageText = voyageResult.status === 'fulfilled' ? voyageResult.value : null;
  const extendedText = extendedResult.status === 'fulfilled' ? extendedResult.value : null;

  let sourceCount = 0;
  const sections: string[] = [];

  if (wikiText) { sections.push(`=== WIKIPEDIA ===\n${wikiText}`); sourceCount++; }
  if (voyageText) { sections.push(`=== WIKIVOYAGE (traveler perspective) ===\n${voyageText}`); sourceCount++; }
  if (extendedText) { sections.push(`=== WIKIPEDIA (extended) ===\n${extendedText}`); sourceCount++; }

  if (sections.length === 0) {
    console.log('All Wikipedia sources failed');
    return null;
  }

  const context = sections.join('\n\n');
  console.log(`Wikipedia context: ${sourceCount} sources, ${context.length} total chars`);
  return { context, sourceCount };
}

async function fetchWebContext(placeName: string, city: string): Promise<{ context: string; sourceCount: number } | null> {
  console.log(`Web context fetch: ${placeName} (${city})`);

  // Try Firecrawl first (richer, real-time web data)
  const firecrawlResult = await fetchViaFirecrawl(placeName, city);
  if (firecrawlResult) return firecrawlResult;

  // Fall back to Wikipedia + Wikivoyage
  console.log('Firecrawl unavailable or returned no results, falling back to Wikipedia...');
  return await fetchViaWikipedia(placeName, city);
}

// ============================================================
// CLAUDE PROMPT BUILDERS
// ============================================================

/** Build a location line like "Tell a story about X in Soho, London, UK." */
function buildLocationLine(place: Place): string {
  const parts = [place.name];
  if (place.neighbourhood) parts.push(`in the ${place.neighbourhood} area of ${place.city}`);
  else parts.push(`in ${place.city}`);
  if (place.country) parts.push(place.country);
  return parts.join(', ');
}

function buildSpatialHint(nextPlaceName?: string, spatial?: SpatialContext): string {
  if (!nextPlaceName && !spatial?.nextPlaceName) return '\nThis is the LAST stop — omit transitionToNext.';

  const name = nextPlaceName || spatial?.nextPlaceName;
  if (spatial?.distanceToNextMeters && spatial?.directionToNext && spatial?.walkingMinutesToNext) {
    return `\nNEXT STOP: ${name} — ${spatial.distanceToNextMeters}m ${spatial.directionToNext}, about ${spatial.walkingMinutesToNext} min walk. Include a transitionToNext that references the direction and walking time. Be specific: "Head ${spatial.directionToNext}..." or mention a landmark along the way.`;
  }

  return `\nNEXT STOP: ${name} (include a transitionToNext hint about walking there)`;
}

function buildTier1Prompt(
  place: Place,
  stories: any[],
  interests: string[],
  tone: string,
  personalization: Personalization | undefined,
  nextPlaceName?: string,
  spatialContext?: SpatialContext
): string {
  const storySummaries = stories.map((s, i) =>
    `Story ${i + 1} [tone: ${s.tone}, interests: ${s.interests.join(', ')}]:\n` +
    `Hook: ${s.hook}\n` +
    `Narration: ${s.audio_narration}\n` +
    `Directional cue: ${s.directional_cue}`
  ).join('\n\n');

  return `Tell a story about ${buildLocationLine(place)}.

CURATED STORIES (use as inspiration, but go deeper with your own knowledge):
${storySummaries}

LISTENER PROFILE:
- Interests: ${interests.join(', ')}
- Preferred tone: ${tone} — ${getToneDescription(tone)}
${personalization?.requestMood ? `- Request mood: ${personalization.requestMood} — choose story angles that match this emotional intent` : '- Request mood: (not specified — default to positive, curious, or uplifting angles)'}
${personalization?.travelStyle ? `- Travel style: ${personalization.travelStyle}` : ''}
${personalization?.favoriteStoryTypes?.length ? `- Preferred story types: ${personalization.favoriteStoryTypes.join(', ')}. Lean toward these angles when the place supports it.` : ''}
${buildSpatialHint(nextPlaceName, spatialContext)}

INSTRUCTIONS:
- The curated stories contain real facts. Find the most COMPELLING angle for this listener's interests, tone, and mood. Match the tone description closely — a food tour should feel sensory and warm, not like dark comedy. A ghost tour should build atmosphere. An architecture walk should make them look up.
- Don't just rephrase — reframe. Find the tension, the irony, the human moment buried in the facts above.
- Structure your narration as: Opening (ground them + hook) → Story (one arc with tension) → Punchline (the twist).
- For funFacts, find surprising ANGLES on real facts from the curated material. You may add well-known historical context, architectural observations, or cultural practices — but never invent specific names, dates, or anecdotes.
- Adapt delivery to the listener's tone preference.
- The lookCloserChallenge should reference a specific visible detail at this location.`;
}

function buildTier2Prompt(
  place: Place,
  wikiContext: string,
  interests: string[],
  tone: string,
  personalization: Personalization | undefined,
  nextPlaceName?: string,
  spatialContext?: SpatialContext
): string {
  return `Tell a story about ${buildLocationLine(place)}.

FACTUAL ANCHOR (use to verify facts, NOT as your primary story source):
${wikiContext}

LISTENER PROFILE:
- Interests: ${interests.join(', ')}
- Preferred tone: ${tone} — ${getToneDescription(tone)}
${personalization?.requestMood ? `- Request mood: ${personalization.requestMood} — choose story angles that match this emotional intent` : '- Request mood: (not specified — default to positive, curious, or uplifting angles)'}
${personalization?.travelStyle ? `- Travel style: ${personalization.travelStyle}` : ''}
${personalization?.favoriteStoryTypes?.length ? `- Preferred story types: ${personalization.favoriteStoryTypes.join(', ')}. Lean toward these angles when the place supports it.` : ''}
${buildSpatialHint(nextPlaceName, spatialContext)}

INSTRUCTIONS:
- The extract above contains real facts. Don't summarize them — find the ONE detail with the most narrative potential and build a STORY around it.
- Find the most COMPELLING angle for this listener's interests, tone, and mood. Match the tone description closely — a food tour should feel sensory and warm, not like dark comedy. A ghost tour should build atmosphere. An architecture walk should make them look up.
- Structure your narration as: Opening (ground them + hook) → Story (one arc with tension) → Punchline (the twist).
- For funFacts, find surprising angles on facts from the source material. You may add well-known historical context or architectural observations, but never invent specific names, dates, or anecdotes not present in the source. When adding context you're less certain about, use hedging ("Legend has it...", "It's said that...").
- Adapt delivery to the listener's tone preference.
- The lookCloserChallenge should reference a specific visible detail at this location.`;
}

// ============================================================
// OPENAI GPT FALLBACK (Tier 3 — existing code preserved)
// ============================================================

async function generateWithRetry(
  place: Place,
  interestNames: string[],
  tone: string,
  personalization: Personalization | undefined,
  nextPlaceName?: string,
  spatialContext?: SpatialContext
): Promise<ContentResult> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`GPT-5.2 attempt ${attempt}/${MAX_RETRIES}...`);

    const prompt = buildTier3Prompt(place, interestNames, tone, personalization, attempt > 1, nextPlaceName, spatialContext);
    const content = await callOpenAI(prompt);

    const wordCount = content.audioNarration.split(/\s+/).length;
    if (wordCount >= MIN_WORD_COUNT) {
      return content;
    }

    console.log(`Too short (${wordCount} words), ${attempt < MAX_RETRIES ? 'retrying...' : 'using anyway'}`);
  }

  const finalPrompt = buildTier3Prompt(place, interestNames, tone, personalization, true, nextPlaceName, spatialContext);
  return await callOpenAI(finalPrompt);
}

function buildTier3Prompt(
  place: Place,
  interestNames: string[],
  tone: string,
  personalization: Personalization | undefined,
  emphasizeLength: boolean,
  nextPlaceName?: string,
  spatialContext?: SpatialContext
): string {
  const lengthEmphasis = emphasizeLength
    ? `\n\n⚠️ YOUR PREVIOUS RESPONSE WAS TOO SHORT. Write at least 150 words this time.`
    : '';

  return `Tell a story about ${buildLocationLine(place)}.

IMPORTANT: This is specifically ${place.name} in ${place.city}${place.neighbourhood ? ` (${place.neighbourhood})` : ''}, ${place.country}. Do NOT confuse with similarly-named places in other cities or countries.${lengthEmphasis}

LISTENER PROFILE:
- Interests: ${interestNames.join(', ')}
- Preferred tone: ${tone} — ${getToneDescription(tone)}
${personalization?.requestMood ? `- Request mood: ${personalization.requestMood} — choose story angles that match this emotional intent` : '- Request mood: (not specified — default to positive, curious, or uplifting angles)'}
${personalization?.travelStyle ? `- Travel style: ${personalization.travelStyle}` : ''}
${personalization?.favoriteStoryTypes?.length ? `- Preferred story types: ${personalization.favoriteStoryTypes.join(', ')}. Lean toward these angles when the place supports it.` : ''}
${buildSpatialHint(nextPlaceName, spatialContext)}

INSTRUCTIONS:
- Use your knowledge of ${place.name} in ${place.city}${place.neighbourhood ? ` (${place.neighbourhood})` : ''} to find the most COMPELLING story for this listener that matches their mood.
- Match the tone description closely — a food tour should feel sensory and warm, a ghost tour should build atmosphere, an architecture walk should make them look up. A scenic/joyful request should NOT get dark or macabre stories.
- Structure your narration as: Opening (ground them + hook) → Story (one arc with tension) → Punchline (the twist).
- For funFacts, use real, verifiable facts about this specific place in ${place.neighbourhood || place.city}. When uncertain, hedge with "Legend has it..." or "It's said that..."
- Adapt delivery to the listener's tone preference.
- The lookCloserChallenge should reference a specific visible detail at this location.`;
}

function getToneDescription(tone: string): string {
  const tones: Record<string, string> = {
    'casual': 'Warm, conversational, like a smart friend showing you around. Humor is natural, not forced. You share stories the way you\'d tell them over drinks — with genuine enthusiasm and the occasional "wait, it gets better." Physical, grounding, immediate.',
    'scholarly': 'Deeply knowledgeable but never dry. You\'re the professor who makes people lean forward. Rich specific detail — dates, names, architectural terms — but delivered with wonder, not authority. "Here\'s what\'s fascinating about this..." You respect the listener\'s intelligence.',
    'dramatic': 'Atmospheric and cinematic. You build scenes. The weather, the light, the silence before something happens. Suspense, tension, revelation. Lean into the emotional weight of places. Slower rhythm. Longer sentences that build, then short ones that land.',
    'witty': 'Sharp, dry, playful. Pop-culture bridges. Anachronistic comparisons. You find the absurdity in history without being mean about it. Quick sentences. Wry asides. "Which is, of course, exactly as dramatic as it sounds." Delighted by how weird the world is.',
  };
  return tones[tone] || tones.casual;
}

async function callOpenAI(prompt: string): Promise<ContentResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: CLAUDE_SYSTEM_PROMPT
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 2048,
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;

  console.log(`Raw GPT response length: ${rawContent.length}`);

  try {
    // Strip markdown wrapping if present (GPT-5.2 sometimes wraps JSON)
    let content = rawContent.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(content);

    if (!parsed.narration) {
      throw new Error('Missing narration');
    }

    const wordCount = parsed.narration.split(/\s+/).length;
    console.log(`GPT narration: ${wordCount} words, ${parsed.narration.length} chars`);

    const result: ContentResult = {
      audioNarration: parsed.narration,
      hook: parsed.storyHook,
      directionalCue: parsed.lookAt
    };

    if (parsed.storyType) result.storyType = parsed.storyType;
    if (Array.isArray(parsed.funFacts)) result.funFacts = parsed.funFacts.slice(0, 3);
    if (parsed.lookCloserChallenge) result.lookCloserChallenge = parsed.lookCloserChallenge;
    if (Array.isArray(parsed.suggestedQuestions)) result.suggestedQuestions = parsed.suggestedQuestions.slice(0, 2);
    if (parsed.transitionToNext) result.transitionToNext = parsed.transitionToNext;

    return result;
  } catch (parseError) {
    console.error('JSON parse error. Raw content:', content.substring(0, 200));
    throw new Error('Invalid JSON from OpenAI');
  }
}

// ============================================================
// STATIC FALLBACK (Tier 4)
// ============================================================

function createFallbackContent(place: Place): ContentResult {
  return {
    audioNarration: `Okay, stop here for a second and look at ${place.name}. Really look at it. Here's the thing most people miss — every single stone, every worn edge, every bit of patina on this place got there because of someone's hands, someone's decision, someone's story. We don't know all those stories anymore, and that's the honest truth. But stand here long enough and you start to feel them anyway. The ${place.city} locals who've walked past this spot ten thousand times without looking up. The travelers who stood right where you're standing, wondering the same things you're wondering. Before you move on, find one small detail nobody else is looking at. A crack, a shadow, a bit of ironwork. That's yours now. That's your version of this place.`,
    hook: `The invisible stories embedded in every surface`,
    directionalCue: `Find one small detail nobody else is noticing`
  };
}
