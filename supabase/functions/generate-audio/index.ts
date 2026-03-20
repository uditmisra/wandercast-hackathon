
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Helper function to convert large array buffers to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/** Compute SHA-256 hex hash of a string */
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Fire-and-forget: log API usage */
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

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (!elevenLabsApiKey) {
      console.error('ElevenLabs API key is not configured');
      throw new Error('Service unavailable');
    }

    const { text, voiceId, placeId } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    if (text.length > 5000) {
      throw new Error('Text is too long for audio generation (max 5000 characters)');
    }

    const selectedVoice = voiceId || 'EST9Ui6982FZPSi7gCHi';
    const charCount = text.length;

    // ─── Cache check ───
    const cacheKey = await sha256(`${text}|${selectedVoice}`);
    const storagePath = `${cacheKey}.mp3`;

    try {
      const { data: cached } = await supabase
        .from('audio_cache')
        .select('storage_path')
        .eq('cache_key', cacheKey)
        .single();

      if (cached) {
        // Cache hit — return the public URL (no ElevenLabs call needed)
        const audioUrl = `${supabaseUrl}/storage/v1/object/public/audio-cache/${cached.storage_path}`;
        console.log(`[Cache HIT] ${placeId} → ${audioUrl}`);

        logUsage({
          service: 'elevenlabs',
          function_name: 'generate-audio',
          characters_used: 0,
          estimated_cost_usd: 0,
          status: 'cache_hit',
          metadata: { placeId, voiceId: selectedVoice, cacheKey },
        });

        return new Response(JSON.stringify({
          audioUrl,
          placeId,
          voiceId: selectedVoice,
          cached: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Cache miss or table doesn't exist yet — proceed to generate
    }

    // ─── Cache miss: generate via ElevenLabs ───
    console.log(`[Cache MISS] Generating audio for ${placeId}, voice ${selectedVoice}, ${charCount} chars`);

    const requestBody = {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.80,
        style: 0.70,
        use_speaker_boost: true,
      },
    };

    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('ElevenLabs API error:', audioResponse.status, errorText);

      let errorCode = 'AUDIO_GENERATION_FAILED';
      let userMessage = 'Audio generation failed';
      let logStatus = 'error';
      if (audioResponse.status === 401) {
        errorCode = 'ELEVENLABS_AUTH_ERROR';
        userMessage = 'ElevenLabs API key is invalid or expired';
      } else if (audioResponse.status === 429) {
        errorCode = 'ELEVENLABS_RATE_LIMIT';
        userMessage = 'ElevenLabs rate limit exceeded — too many requests';
        logStatus = 'rate_limited';
      } else if (audioResponse.status === 422 || errorText.includes('quota') || errorText.includes('limit') || errorText.includes('credit') || errorText.includes('characters')) {
        errorCode = 'ELEVENLABS_QUOTA_EXCEEDED';
        userMessage = 'ElevenLabs character quota exceeded — credits may be exhausted';
        logStatus = 'quota_exceeded';
      }

      logUsage({
        service: 'elevenlabs',
        function_name: 'generate-audio',
        characters_used: charCount,
        status: logStatus,
        error_code: errorCode,
        metadata: { placeId, voiceId: selectedVoice, httpStatus: audioResponse.status },
      });

      return new Response(JSON.stringify({
        error: userMessage,
        errorCode,
        success: false,
        elevenLabsStatus: audioResponse.status,
      }), {
        status: audioResponse.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get audio buffer
    const audioBuffer = await audioResponse.arrayBuffer();
    console.log(`Audio generated: ${audioBuffer.byteLength} bytes`);

    // Convert to base64 for backwards-compatible response
    const base64Audio = arrayBufferToBase64(audioBuffer);
    if (!base64Audio || base64Audio.length === 0) {
      throw new Error('Failed to generate base64 audio data');
    }

    // ─── Upload to Supabase Storage (fire-and-forget, non-blocking) ───
    let audioUrl: string | undefined;
    try {
      const { error: uploadError } = await supabase.storage
        .from('audio-cache')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[Storage] Upload failed (non-fatal):', uploadError.message);
      } else {
        audioUrl = `${supabaseUrl}/storage/v1/object/public/audio-cache/${storagePath}`;

        // Record in audio_cache table for fast future lookups
        await supabase.from('audio_cache').upsert({
          cache_key: cacheKey,
          storage_path: storagePath,
          voice_id: selectedVoice,
          character_count: charCount,
          file_size_bytes: audioBuffer.byteLength,
        }, { onConflict: 'cache_key' });

        console.log(`[Storage] Cached: ${audioUrl}`);
      }
    } catch (storageErr) {
      console.warn('[Storage] Cache write failed (non-fatal):', storageErr);
    }

    // Log successful ElevenLabs call
    const estimatedCost = (charCount / 1000) * 0.30;
    logUsage({
      service: 'elevenlabs',
      function_name: 'generate-audio',
      characters_used: charCount,
      estimated_cost_usd: estimatedCost,
      status: 'success',
      metadata: { placeId, voiceId: selectedVoice, audioBytes: audioBuffer.byteLength, cached: false },
    });

    return new Response(JSON.stringify({
      audioContent: base64Audio,
      audioUrl,
      placeId,
      voiceId: selectedVoice,
      audioSize: audioBuffer.byteLength,
      cached: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-audio function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    logUsage({
      service: 'elevenlabs',
      function_name: 'generate-audio',
      status: 'error',
      error_code: 'EXCEPTION',
      metadata: { error: safeMessage },
    });

    return new Response(JSON.stringify({
      error: safeMessage,
      errorCode: 'EXCEPTION',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
