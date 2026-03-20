import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, prompt } = await req.json();
    
    if (!image) {
      throw new Error('No image data provided');
    }

    console.log('Analyzing image with OpenAI Vision...');

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
            content: 'You are an expert travel guide and landmark identification assistant. Analyze images and identify tourist destinations, landmarks, and places of interest. Provide detailed information about the location including the name, city, country, and interesting facts.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'What landmark or tourist destination is shown in this image? Please identify the location and provide details about it including name, city, country, and why it would be interesting to visit.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Vision API error:', errorText);
      throw new Error(`Vision API error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;
    
    console.log('Image analysis result:', analysis);

    return new Response(JSON.stringify({ 
      analysis,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-image function:', error);
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});