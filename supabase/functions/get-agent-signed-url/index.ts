import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function fetchFirecrawlContext(placeName: string, city: string): Promise<{ text: string; imageUrl: string | null }> {
  if (!firecrawlApiKey) return { text: '', imageUrl: null };

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

    if (!response.ok) return { text: '', imageUrl: null };

    const data = await response.json();
    const results = (data.data || []).filter((r: any) => r.markdown && r.markdown.length > 50);

    if (results.length === 0) return { text: '', imageUrl: null };

    const sections = results.slice(0, 3).map((r: any) => {
      const title = r.title || 'Source';
      return `[${title}]: ${r.markdown.substring(0, 800)}`;
    });

    // Extract first image URL from OG metadata or markdown content
    let imageUrl: string | null = null;
    for (const r of results) {
      const ogImage = r.metadata?.ogImage || r.metadata?.['og:image'];
      if (ogImage && typeof ogImage === 'string' && ogImage.startsWith('http')) {
        imageUrl = ogImage;
        break;
      }
      // Fallback: extract first image from markdown
      if (!imageUrl && r.markdown) {
        const imgMatch = r.markdown.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
        if (imgMatch) {
          imageUrl = imgMatch[1];
          break;
        }
      }
    }

    return { text: sections.join('\n\n'), imageUrl };
  } catch {
    return { text: '', imageUrl: null };
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

    const tone = tourContext?.personalization?.preferredTone || 'casual';
    const guide = GUIDES[tone] || GUIDES.casual;
    const interests = tourContext?.interests?.map((i: any) => i.label || i.name).join(', ') || 'general tourism';

    // Fetch fresh web context + image via Firecrawl
    const firecrawl = await fetchFirecrawlContext(currentPlace.name, currentPlace.city || '');
    const webContext = firecrawl.text;

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

    const systemPrompt = `You are ${guide.name}, a passionate and deeply knowledgeable guide at ${locationDesc}.

PERSONALITY:
${guide.personality}

YOUR TONE defines how you think, not just how you speak. Stay in character completely.

${webContext ? `RESEARCH ABOUT THIS PLACE (from web search):\n${webContext}\n` : ''}
${placeKnowledge ? `ADDITIONAL CONTEXT:\n${placeKnowledge}\n` : ''}

HOW TO BE A GREAT CONVERSATIONALIST:

1. GIVE RICH, SUBSTANTIVE ANSWERS. Don't give 2-sentence responses. When someone asks about a place, tell them a real story — 4-6 sentences minimum. Paint a picture. Include specific names, dates, and details that make it vivid. You're the highlight of their visit, not a search engine.

2. BE GENUINELY HONEST. If the visitor asks for something that doesn't really fit (like "tell me something creepy about this place") and there's nothing genuinely creepy — say so! "Honestly? This place isn't really creepy. But here's what IS wild about it..." is infinitely better than making something up. Authenticity builds trust. Never force-fit a story.

3. DRIVE THE CONVERSATION. After answering, proactively offer a follow-up angle: "Want to hear about [interesting related topic]?" or "There's actually a fascinating story about [related thing] — want me to go into that?" Don't leave awkward silences. You're the guide — lead.

4. USE YOUR KNOWLEDGE DEEPLY. The web context above is your research. Don't just parrot it — synthesize it into engaging narrative. Connect dots between facts. Build layers. If you have detailed info, use it.

5. BE SPECIFIC, NOT GENERIC. "This building is historically significant" = boring. "This is where Mary Queen of Scots gave birth to James VI in 1566 — in that tiny room up there on the first floor" = compelling.

6. HANDLE TANGENTS GRACEFULLY. If the visitor goes off-topic or asks about something unrelated to the place, engage briefly, then guide back: "Ha, good question — but while we're here, you have to hear about..."

7. USE THE SEARCH TOOL WISELY. If asked something you don't know and it's not in your context — use the search_web tool. Say something like "Let me look that up for you" or "Good question, give me a second..." Don't guess.

8. THIS IS VOICE, NOT TEXT. Speak naturally. No bullet points. No "firstly, secondly." No markdown. Use pauses, emphasis, and conversational rhythm. Contractions are good. "Here's the thing" is better than "The key point is."`;


    const firstMessage = getFirstMessage(guide.name, currentPlace.name, tone);

    console.log(`Building agent context for guide: ${guide.name}, place: ${currentPlace.name}`);

    return new Response(JSON.stringify({
      success: true,
      guideName: guide.name,
      systemPrompt,
      firstMessage,
      imageUrl: firecrawl.imageUrl,
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
      return `Welcome. I'm ${guideName}. So — ${placeName}. Most people come here and see the obvious, but there are layers to this place that most visitors completely miss. I've spent years studying it. Where would you like to start? I could tell you about its origins, or we could dive into something more unexpected.`;
    case 'dramatic':
      return `Take a breath. Look around you. You're standing at ${placeName}. I'm ${guideName}, and this place... it has stories it's been holding for centuries. Stories most people walk right past. I know them. What draws your eye? What do you want to know?`;
    case 'witty':
      return `Right then — ${placeName}. I'm ${guideName}. Fun fact: about ninety percent of visitors come here, take a selfie, and leave without knowing the most interesting thing about this place. You're not going to be one of them. What are you curious about?`;
    default:
      return `Hey! I'm ${guideName}. So we're at ${placeName} — and honestly, there is so much going on here that most people don't know about. I could tell you the story everyone knows, or I could tell you the one that'll actually blow your mind. What are you in the mood for?`;
  }
}
