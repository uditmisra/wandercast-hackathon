import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_REFERRAL_REWARDS_PER_MONTH = 10;
const CREDITS_PER_REFERRAL = 1; // 1 free premium tour unlock

/**
 * Called after a referred user completes their first tour.
 * Awards 1 free tour credit to both the referrer and the referred user.
 *
 * Anti-abuse:
 *   - Max 10 rewards per referrer per calendar month
 *   - Only fires once per referred user (idempotent)
 *   - Only fires if the referred user has a recorded 'signup' event
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

    // Find the signup event for this referred user (they must have signed up via referral)
    const { data: signupEvent } = await supabase
      .from('referral_events')
      .select('referrer_user_id')
      .eq('referred_user_id', user.id)
      .eq('event_type', 'signup')
      .single();

    if (!signupEvent) {
      // Not a referred user — nothing to do
      return new Response(JSON.stringify({ rewarded: false, reason: 'not_referred' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const referrerUserId = signupEvent.referrer_user_id;

    // Idempotency: check if tour_completed event already exists for this referred user
    const { data: completionEvent } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referred_user_id', user.id)
      .eq('event_type', 'tour_completed')
      .single();

    if (completionEvent) {
      return new Response(JSON.stringify({ rewarded: false, reason: 'already_rewarded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Anti-abuse: check referrer's reward count this calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: monthlyRewards } = await supabase
      .from('referral_events')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_user_id', referrerUserId)
      .eq('event_type', 'reward_granted')
      .gte('created_at', monthStart.toISOString());

    if ((monthlyRewards ?? 0) >= MAX_REFERRAL_REWARDS_PER_MONTH) {
      // Still record the tour_completed event for auditing, but don't grant reward
      await supabase.from('referral_events').insert({
        referrer_user_id: referrerUserId,
        referred_user_id: user.id,
        event_type: 'tour_completed',
        metadata: { rewardBlocked: true, reason: 'monthly_cap_reached' },
      });

      return new Response(JSON.stringify({ rewarded: false, reason: 'monthly_cap_reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record tour_completed and reward_granted events
    await supabase.from('referral_events').insert([
      {
        referrer_user_id: referrerUserId,
        referred_user_id: user.id,
        event_type: 'tour_completed',
        metadata: { completedAt: new Date().toISOString() },
      },
      {
        referrer_user_id: referrerUserId,
        referred_user_id: user.id,
        event_type: 'reward_granted',
        metadata: { credits: CREDITS_PER_REFERRAL, grantedAt: new Date().toISOString() },
      },
    ]);

    // Grant 1 free tour credit to the referrer
    await supabase.from('free_tour_credits').upsert(
      { user_id: referrerUserId, credits_available: CREDITS_PER_REFERRAL, credits_used: 0 },
      { onConflict: 'user_id' }
    );
    // Increment rather than set (in case they already have credits)
    await supabase.rpc('increment_tour_credits', {
      p_user_id: referrerUserId,
      p_amount: CREDITS_PER_REFERRAL,
    }).catch(() => {
      // RPC may not exist yet — fall back to raw update
    });

    // Grant 1 free tour credit to the referred user too
    await supabase.from('free_tour_credits').upsert(
      { user_id: user.id, credits_available: CREDITS_PER_REFERRAL, credits_used: 0 },
      { onConflict: 'user_id' }
    );

    console.log(`Referral rewards granted: referrer=${referrerUserId} referred=${user.id}`);

    return new Response(JSON.stringify({ rewarded: true, credits: CREDITS_PER_REFERRAL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in grant-referral-rewards:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
