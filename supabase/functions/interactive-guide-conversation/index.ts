import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Models to try in order — first success wins
const MODELS = ['gpt-4o', 'gpt-4o-mini'];

async function callOpenAI(messages: any[], model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI ${model} error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, currentPlace, tourContext, conversationHistory } = await req.json();

    if (!question || typeof question !== 'string') {
      throw new Error('Missing required fields: question and currentPlace');
    }

    if (!currentPlace || typeof currentPlace !== 'object') {
      throw new Error('Missing required fields: question and currentPlace');
    }

    if (tourContext !== undefined && (tourContext === null || typeof tourContext !== 'object')) {
      throw new Error('Invalid tour context');
    }

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('Service unavailable');
    }

    console.log(`Processing question for ${currentPlace.name}: "${question}"`);

    const systemPrompt = buildSystemPrompt(currentPlace, tourContext);

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: question }
    ];

    // Try models in order until one succeeds
    let response: string | null = null;
    let lastError: string = '';

    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        response = await callOpenAI(conversationMessages, model);
        console.log(`Success with ${model} (${response.length} chars)`);
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${model} failed: ${lastError}`);
      }
    }

    if (!response) {
      console.error('All models failed. Last error:', lastError);
      throw new Error('Failed to generate response');
    }

    return new Response(JSON.stringify({
      response,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in interactive-guide-conversation:', error);
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

function buildSystemPrompt(currentPlace: any, tourContext: any): string {
  const guideName = getGuideName(tourContext?.personalization?.preferredTone || 'casual');
  const personality = getPersonalityDescription(tourContext?.personalization?.preferredTone || 'casual');

  const interests = tourContext?.interests?.map((i: any) => i.label || i.name).join(', ') || 'general tourism';
  const travelStyle = tourContext?.personalization?.travelStyle || 'first-time';

  const gc = currentPlace.generatedContent || {};
  const placeOverview = gc.overview || gc.hook ||
                        currentPlace.description ||
                        `${currentPlace.name} in ${currentPlace.city}`;

  const narrationContext = gc.audioNarration
    ? `\n- Full narration: ${gc.audioNarration}`
    : '';
  const hookContext = gc.hook ? `\n- Hook: ${gc.hook}` : '';
  const cueContext = gc.directionalCue ? `\n- What to look at: ${gc.directionalCue}` : '';
  const factsContext = gc.funFacts?.length
    ? `\n- Fun facts: ${gc.funFacts.join('; ')}`
    : '';
  const challengeContext = gc.lookCloserChallenge
    ? `\n- Look closer challenge: ${gc.lookCloserChallenge}`
    : '';

  return `You are ${guideName}, an expert tour guide currently at ${currentPlace.name} in ${currentPlace.city}.

Tour Context:
- Tour focus: ${interests}
- Current location: ${currentPlace.name}
- Overview: ${placeOverview}${hookContext}${cueContext}${narrationContext}${factsContext}${challengeContext}

Your personality and tone:
${personality}

This is CRITICAL: Your answers must match this tone consistently. A scholarly tour guide answers differently from a witty one. A dramatic guide builds atmosphere even in short answers. The tone is not decoration — it shapes how you think and respond.

User's travel style: ${travelStyle}

CRITICAL RULES:
1. Respond in 2-3 sentences MAX (under 300 characters total)
2. Stay in character as ${guideName} — match the tone description above in every answer
3. Answer based on the current location context above
4. If you don't know specific details, acknowledge naturally in character — a scholarly guide says "The historical record is unclear on that, but..." while a casual guide says "Honestly? I'm not sure, but here's what I do know..."
5. Include interesting anecdotes, facts, or local secrets when relevant
6. Be engaging about the location in a way that matches your tone
7. If asked about practical info (bathrooms, tickets, hours), provide helpful guidance or suggest where to find current info

Remember: Keep responses SHORT and CONVERSATIONAL. This is spoken audio, not written text.`;
}

function getGuideName(tone: string): string {
  const guides: Record<string, string> = {
    'casual': 'Max',
    'scholarly': 'Dr. Eleanor',
    'dramatic': 'Marco',
    'witty': 'Sophie'
  };
  return guides[tone] || 'Max';
}

function getPersonalityDescription(tone: string): string {
  const personalities: Record<string, string> = {
    'casual': 'Warm and conversational, like a smart friend showing someone around. Genuine enthusiasm, natural humor. You share answers the way you\'d tell them over drinks — "Oh, great question, so here\'s the thing..." Physical, grounding, immediate.',
    'scholarly': 'Deeply knowledgeable but never dry. You\'re the expert who makes people lean forward. Rich specific detail — dates, names, terms — delivered with wonder, not authority. "Here\'s what\'s fascinating about that..." You respect the listener\'s intelligence and love going deeper.',
    'dramatic': 'Atmospheric and cinematic. You answer with scene-setting and emotional weight. Sensory descriptions, evocative language. You make even a simple fact feel like a revelation. Slower, more deliberate. Let the answer breathe.',
    'witty': 'Sharp, dry, playful. You find the absurdity and irony in everything. Quick answers with wry asides and unexpected comparisons. Delighted by how weird the world is. Never mean, always clever.'
  };
  return personalities[tone] || personalities.casual;
}
