import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Dynamic OG meta tags for shared tour links.
 *
 * Social bots (Facebook, Twitter, Slack, iMessage) don't execute JavaScript,
 * so an SPA's client-side <head> tags never reach them. This edge function
 * serves a lightweight HTML page with tour-specific OG tags, then redirects
 * real browsers to the SPA route via <meta http-equiv="refresh">.
 *
 * URL: /functions/v1/shared-tour-og?slug=abc123
 */

serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Single query: fetch tour ID + metadata
  const { data: tour } = await supabase
    .from('tours')
    .select('id, title, description, interests, share_slug')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single();

  // Build the canonical SPA URL — always redirect browsers here
  const siteOrigin = Deno.env.get('SITE_ORIGIN') || 'https://wandercast.app';
  const canonicalUrl = `${siteOrigin}/tour/${slug}`;

  // Unknown/deleted tours — redirect to home
  if (!tour) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': siteOrigin },
    });
  }

  // Fetch places for richer OG description
  let placeCount = 0;
  let firstCity = '';
  let placeNames: string[] = [];

  const { data: places } = await supabase
    .from('places')
    .select('name, city')
    .eq('tour_id', tour.id)
    .order('id', { ascending: true });

  if (places) {
    placeCount = places.length;
    firstCity = places[0]?.city || '';
    placeNames = places.map(p => p.name).filter(Boolean);
  }

  // Build OG content
  const ogTitle = tour.title || 'Wandercast Tour';
  const cityLabel = firstCity ? ` in ${firstCity}` : '';
  const stopsLabel = placeCount > 0 ? `${placeCount} stops${cityLabel}` : '';
  const ogDescription = tour.description
    || (stopsLabel
      ? `${stopsLabel} — ${placeNames.slice(0, 3).join(', ')}${placeNames.length > 3 ? '…' : ''}`
      : 'AI-powered audio tour guide. Create personalized audio journeys for any city.');

  // Escape HTML entities to prevent XSS from tour titles/descriptions
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=${esc(canonicalUrl)}" />
  <title>${esc(ogTitle)} — Wandercast</title>
  <meta name="description" content="${esc(ogDescription)}" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(ogDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(canonicalUrl)}" />
  <meta property="og:image" content="${siteOrigin}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Wandercast" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(ogDescription)}" />
  <meta name="twitter:image" content="${siteOrigin}/og-image.png" />
  <link rel="canonical" href="${esc(canonicalUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${esc(canonicalUrl)}">${esc(ogTitle)}</a>…</p>
  <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
});
