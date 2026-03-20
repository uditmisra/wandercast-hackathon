import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, limit = 5 } = await req.json();

    if (!query || typeof query !== 'string') {
      throw new Error('Missing required field: query');
    }

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY is not configured');
      throw new Error('Firecrawl service unavailable');
    }

    console.log(`Firecrawl search: "${query}" (location: ${location || 'none'}, limit: ${limit})`);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);

    try {
      const body: Record<string, unknown> = {
        query,
        limit: Math.min(limit, 10),
        scrapeOptions: {
          formats: ['markdown'],
        },
      };

      if (location) {
        body.location = location;
      }

      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Firecrawl API error ${response.status}: ${errorText}`);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.data || [];

      console.log(`Firecrawl returned ${results.length} results`);

      // Format results as markdown sections
      const formattedResults = results
        .filter((r: any) => r.markdown && r.markdown.length > 50)
        .slice(0, Math.min(limit, 5))
        .map((r: any) => ({
          title: r.title || r.metadata?.title || 'Untitled',
          url: r.url || r.metadata?.sourceURL || '',
          markdown: r.markdown.substring(0, 1500),
        }));

      // Log usage
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('api_usage_log').insert({
          service: 'firecrawl',
          function_name: 'firecrawl-search',
          characters_used: formattedResults.reduce((sum: number, r: any) => sum + r.markdown.length, 0),
          estimated_cost_usd: 0.001 * formattedResults.length,
          status: 'success',
          metadata: { query, resultCount: formattedResults.length },
        });
      } catch { /* non-fatal */ }

      return new Response(JSON.stringify({
        success: true,
        results: formattedResults,
        totalResults: results.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    console.error('Error in firecrawl-search:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: safeMessage,
      results: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
