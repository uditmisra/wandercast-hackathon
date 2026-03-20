import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Called after a referred user signs up.
 * Body: { referralCode: string }
 *
 * - Validates the referral code exists
 * - Checks email is verified (email_confirmed_at is set)
 * - Avoids double-counting the same referred user
 * - Records a 'signup' event in referral_events
 */
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

    const { referralCode } = await req.json();
    if (!referralCode || typeof referralCode !== 'string') {
      return new Response(JSON.stringify({ error: 'referralCode is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedCode = referralCode.trim().toUpperCase();

    // Look up referrer
    const { data: codeRow, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', normalizedCode)
      .single();

    if (codeError || !codeRow) {
      return new Response(JSON.stringify({ error: 'Invalid referral code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const referrerUserId = codeRow.user_id;

    // Prevent self-referral
    if (referrerUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot use your own referral code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check email is verified (anti-abuse)
    const { data: authUserData } = await supabase.auth.admin.getUserById(user.id);
    const emailConfirmed = authUserData?.user?.email_confirmed_at;
    if (!emailConfirmed) {
      return new Response(JSON.stringify({ error: 'Email verification required before referral tracking' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check this user hasn't already been tracked for a signup (dedup)
    const { data: existingEvent } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referred_user_id', user.id)
      .eq('event_type', 'signup')
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ message: 'Referral signup already recorded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record signup event
    const { error: insertError } = await supabase
      .from('referral_events')
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: user.id,
        event_type: 'signup',
        metadata: { referralCode: normalizedCode, signedUpAt: new Date().toISOString() },
      });

    if (insertError) {
      console.error('Failed to record referral signup:', insertError.message);
      throw new Error('Failed to record referral signup');
    }

    console.log(`Referral signup recorded: referrer=${referrerUserId} referred=${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in track-referral-signup:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
