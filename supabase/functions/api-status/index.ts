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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    const results: Record<string, unknown> = {};

    // ── 1. ElevenLabs subscription/usage info ──
    try {
      const subResp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': elevenLabsApiKey! },
      });
      if (subResp.ok) {
        const sub = await subResp.json();
        results.elevenlabs = {
          status: 'ok',
          tier: sub.tier,
          character_count: sub.character_count,
          character_limit: sub.character_limit,
          characters_remaining: sub.character_limit - sub.character_count,
          usage_percent: Math.round((sub.character_count / sub.character_limit) * 100),
          next_reset: sub.next_character_count_reset_unix
            ? new Date(sub.next_character_count_reset_unix * 1000).toISOString()
            : null,
          can_extend: sub.can_extend_character_limit,
        };

        // Alert thresholds
        const pctUsed = (sub.character_count / sub.character_limit) * 100;
        if (pctUsed >= 95) {
          results.elevenlabs_alert = 'CRITICAL: Less than 5% of ElevenLabs characters remaining!';
        } else if (pctUsed >= 80) {
          results.elevenlabs_alert = 'WARNING: Over 80% of ElevenLabs characters used.';
        }
      } else {
        results.elevenlabs = { status: 'error', httpStatus: subResp.status };
      }
    } catch (err) {
      results.elevenlabs = { status: 'error', message: String(err) };
    }

    // ── 2. Usage stats from our log (last 24h, 7d, 30d) ──
    try {
      const now = new Date();
      const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [last24h, last7d, last30d, recentErrors] = await Promise.all([
        sb.from('api_usage_log').select('service, characters_used, estimated_cost_usd, status')
          .gte('created_at', day1),
        sb.from('api_usage_log').select('service, characters_used, estimated_cost_usd, status')
          .gte('created_at', day7),
        sb.from('api_usage_log').select('service, characters_used, estimated_cost_usd, status')
          .gte('created_at', day30),
        sb.from('api_usage_log').select('*')
          .neq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const summarize = (rows: any[]) => {
        const byService: Record<string, { calls: number; chars: number; cost: number; errors: number }> = {};
        for (const r of rows || []) {
          const s = r.service || 'unknown';
          if (!byService[s]) byService[s] = { calls: 0, chars: 0, cost: 0, errors: 0 };
          byService[s].calls++;
          byService[s].chars += r.characters_used || 0;
          byService[s].cost += parseFloat(r.estimated_cost_usd) || 0;
          if (r.status !== 'success') byService[s].errors++;
        }
        return byService;
      };

      results.usage = {
        last_24h: summarize(last24h.data || []),
        last_7d: summarize(last7d.data || []),
        last_30d: summarize(last30d.data || []),
      };

      results.recent_errors = (recentErrors.data || []).map((e: any) => ({
        service: e.service,
        error_code: e.error_code,
        status: e.status,
        created_at: e.created_at,
        metadata: e.metadata,
      }));
    } catch (err) {
      results.usage = { error: String(err) };
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
