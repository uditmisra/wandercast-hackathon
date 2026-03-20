import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Generate a human-readable 8-char referral code (uppercase, no ambiguous chars) */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
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
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return existing code if one already exists
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single();

    if (existing?.code) {
      return new Response(JSON.stringify({ code: existing.code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a unique code (retry up to 5 times on collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: collision } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();
      if (!collision) break;
      code = generateCode();
      attempts++;
    }

    const { error: insertError } = await supabase
      .from('referral_codes')
      .insert({ user_id: user.id, code });

    if (insertError) {
      console.error('Failed to insert referral code:', insertError.message);
      throw new Error('Failed to create referral code');
    }

    // Also fetch/initialise their credits row so it exists
    await supabase
      .from('free_tour_credits')
      .upsert({ user_id: user.id, credits_available: 0, credits_used: 0 }, { onConflict: 'user_id' });

    console.log(`Referral code created for user ${user.id}: ${code}`);

    return new Response(JSON.stringify({ code }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-or-create-referral-code:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
