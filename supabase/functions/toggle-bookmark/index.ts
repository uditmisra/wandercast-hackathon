import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
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
      console.error('Authentication failed:', authError?.message || 'no user');
      throw new Error('Authentication failed');
    }

    const { type, targetId } = await req.json();

    if (!type || !targetId) {
      throw new Error('type and targetId are required');
    }

    const table = type === 'place' ? 'bookmarked_places' : 'favorited_tours';
    const idColumn = type === 'place' ? 'place_id' : 'tour_id';

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', user.id)
      .eq(idColumn, targetId)
      .single();

    let bookmarked: boolean;

    if (existing) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', existing.id);
      if (error) {
        console.error('Failed to remove bookmark:', error.message);
        throw new Error('Failed to update bookmark');
      }
      bookmarked = false;
    } else {
      const { error } = await supabase
        .from(table)
        .insert({ user_id: user.id, [idColumn]: targetId });
      if (error) {
        console.error('Failed to add bookmark:', error.message);
        throw new Error('Failed to update bookmark');
      }
      bookmarked = true;
    }

    return new Response(JSON.stringify({ bookmarked }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in toggle-bookmark function:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
