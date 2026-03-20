import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

// Guide personalities — must match interactive-guide-conversation/index.ts
const GUIDES: Record<string, { name: string; personality: string }> = {
  casual: {
    name: 'Max',
    personality: 'Warm and conversational, like a smart friend showing someone around. Genuine enthusiasm, natural humor. You share answers the way you\'d tell them over drinks. Physical, grounding, immediate.',
  },
  scholarly: {
    name: 'Dr. Eleanor',
    personality: 'Deeply knowledgeable but never dry. Rich specific detail — dates, names, terms — delivered with wonder, not authority. You respect the listener\'s intelligence and love going deeper.',
  },
  dramatic: {
    name: 'Marco',
    personality: 'Atmospheric and cinematic. You answer with scene-setting and emotional weight. Sensory descriptions, evocative language. Slower, more deliberate. Let the answer breathe.',
  },
  witty: {
    name: 'Sophie',
    personality: 'Sharp, dry, playful. You find the absurdity and irony in everything. Quick answers with wry asides and unexpected comparisons. Delighted by how weird the world is. Never mean, always clever.',
  },
};

async function fetchFirecrawlContext(placeName: string, city: string): Promise<string> {
  if (!firecrawlApiKey) return '';

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);

  try {
    const query = city
      ? `${placeName} ${city} visitor guide history facts`
      : `${placeName} visitor guide history facts`;

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 3,
        scrapeOptions: { formats: ['markdown'] },
      }),
      signal: ctrl.signal,
    });

    if (!response.ok) return '';

    const data = await response.json();
    const results = (data.data || []).filter((r: any) => r.markdown && r.markdown.length > 50);

    if (results.length === 0) return '';

    const sections = results.slice(0, 3).map((r: any) => {
      const title = r.title || 'Source';
      return `[${title}]: ${r.markdown.substring(0, 800)}`;
    });

    return sections.join('\n\n');
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentPlace, tourContext } = await req.json();

    if (!currentPlace || !currentPlace.name) {
      throw new Error('Missing required field: currentPlace');
    }

    if (!elevenLabsApiKey || !agentId) {
      throw new Error('ElevenLabs Conversational AI not configured');
    }

    const tone = tourContext?.personalization?.preferredTone || 'casual';
    const guide = GUIDES[tone] || GUIDES.casual;
    const interests = tourContext?.interests?.map((i: any) => i.label || i.name).join(', ') || 'general tourism';

    // Fetch fresh web context via Firecrawl
    const webContext = await fetchFirecrawlContext(currentPlace.name, currentPlace.city || '');

    // Build place knowledge from generated content
    const gc = currentPlace.generatedContent || {};
    const placeKnowledge = [
      gc.audioNarration && `Narration: ${gc.audioNarration}`,
      gc.hook && `Hook: ${gc.hook}`,
      gc.directionalCue && `What to look at: ${gc.directionalCue}`,
      gc.funFacts?.length && `Fun facts: ${gc.funFacts.join('; ')}`,
      gc.lookCloserChallenge && `Look closer challenge: ${gc.lookCloserChallenge}`,
      gc.overview && `Overview: ${gc.overview}`,
      currentPlace.description && `Description: ${currentPlace.description}`,
    ].filter(Boolean).join('\n');

    const locationDesc = currentPlace.neighbourhood
      ? `${currentPlace.name} in the ${currentPlace.neighbourhood} area of ${currentPlace.city}`
      : `${currentPlace.name} in ${currentPlace.city}`;

    const systemPrompt = `You are ${guide.name}, an expert tour guide. You are currently standing with the visitor at ${locationDesc}.

PERSONALITY:
${guide.personality}

TONE IS CRITICAL: Your personality defines HOW you think and respond. A scholarly guide answers differently from a witty one. Stay in character at all times.

TOUR CONTEXT:
- Tour interests: ${interests}
- Travel style: ${tourContext?.personalization?.travelStyle || 'first-time visitor'}

KNOWLEDGE ABOUT THIS PLACE:
${placeKnowledge || 'No pre-loaded knowledge available.'}

${webContext ? `ADDITIONAL WEB CONTEXT (from recent search):\n${webContext}` : ''}

RULES:
1. Keep responses conversational and concise — 2-3 sentences, under 40 seconds of speech
2. Stay in character as ${guide.name} with the personality described above
3. Draw from the place knowledge and web context above to answer questions
4. If you don't know something, say so naturally in character — then use the search_web tool to find the answer
5. Include interesting anecdotes, local secrets, and fun facts when relevant
6. Be engaging and make the visitor feel like they're getting an insider's tour
7. When the visitor asks about practical info (hours, tickets, nearby food), try to help or suggest where to find current info
8. This is a real-time voice conversation — speak naturally, avoid lists or formatted text`;

    const firstMessage = getFirstMessage(guide.name, currentPlace.name, tone);

    console.log(`Getting signed URL for agent ${agentId}, guide: ${guide.name}, place: ${currentPlace.name}`);

    // Request signed URL from ElevenLabs Conversational AI API
    const signedUrlResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      }
    );

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error(`ElevenLabs signed URL error ${signedUrlResponse.status}: ${errorText}`);
      throw new Error(`Failed to get signed URL: ${signedUrlResponse.status}`);
    }

    const signedUrlData = await signedUrlResponse.json();
    const signedUrl = signedUrlData.signed_url;

    if (!signedUrl) {
      throw new Error('No signed URL returned from ElevenLabs');
    }

    return new Response(JSON.stringify({
      success: true,
      signedUrl,
      guideName: guide.name,
      systemPrompt,
      firstMessage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-agent-signed-url:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: safeMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFirstMessage(guideName: string, placeName: string, tone: string): string {
  switch (tone) {
    case 'scholarly':
      return `Welcome. I'm ${guideName}, and we're standing at ${placeName}. This is a place with remarkable layers of history — what would you like to explore?`;
    case 'dramatic':
      return `Close your eyes for a moment... and now open them. You're at ${placeName}. I'm ${guideName}, and I have stories to tell you about this place. What catches your eye?`;
    case 'witty':
      return `So here we are at ${placeName}. I'm ${guideName}. Most guides would start with the boring stuff — I won't. What do you want to know?`;
    default:
      return `Hey! I'm ${guideName}, and we're right here at ${placeName}. Pretty cool spot — ask me anything about it!`;
  }
}
