import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSlug(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
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

    const { tourId } = await req.json();
    if (!tourId) {
      return new Response(JSON.stringify({ error: 'tourId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if tour exists and belongs to user
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('id, share_slug, is_public, user_id')
      .eq('id', tourId)
      .single();

    if (tourError || !tour) {
      return new Response(JSON.stringify({ error: 'Tour not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tour.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized to share this tour' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If already shared, return existing slug
    if (tour.share_slug && tour.is_public) {
      return new Response(JSON.stringify({ slug: tour.share_slug }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique slug with retry
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('tours')
        .select('id')
        .eq('share_slug', slug)
        .single();

      if (!existing) break;
      slug = generateSlug();
      attempts++;
    }

    // Update tour with share slug
    const { error: updateError } = await supabase
      .from('tours')
      .update({ share_slug: slug, is_public: true })
      .eq('id', tourId);

    if (updateError) {
      console.error('Failed to share tour:', updateError.message);
      throw new Error('Failed to share tour');
    }

    console.log(`Tour ${tourId} shared with slug: ${slug}`);

    return new Response(JSON.stringify({ slug }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in share-tour:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
