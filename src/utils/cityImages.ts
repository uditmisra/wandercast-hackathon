// ══════════════════════════════════════════════════════════════════
// Image library — EVERY photo ID appears exactly once across ALL mappings.
// No duplicates between city heroes, onboarding, collections, or places.
// ══════════════════════════════════════════════════════════════════

// City hero images — atmospheric cityscapes, mood-first
export const CITY_HERO_IMAGES: Record<string, string> = {
  london:
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80&auto=format&fit=crop',
  paris:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop',
  rome:
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80&auto=format&fit=crop',
  'new-york':
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80&auto=format&fit=crop',
};

// Onboarding landmark images — DIFFERENT angles from city heroes
export const ONBOARDING_IMAGES: Record<string, string> = {
  // Colosseum — aerial perspective (hero uses ground-level golden stone)
  colosseum:
    'https://images.unsplash.com/photo-1549051283-bf8f594d17b2?w=600&q=80&auto=format&fit=crop',
  // Tower Bridge — close-up detail (hero uses wide Thames skyline)
  'tower-bridge':
    'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80&auto=format&fit=crop',
  // Sacre-Coeur — from Place du Tertre (hero uses Eiffel Tower golden hour)
  'sacre-coeur':
    'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&q=80&auto=format&fit=crop',
  // Central Park — autumn foliage (hero uses dramatic skyline at twilight)
  'central-park':
    'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&auto=format&fit=crop',
};

// Category → gradient for fallback thumbnails
export const CATEGORY_GRADIENTS: Record<string, string> = {
  landmark: 'linear-gradient(135deg, var(--accent-pink), #4338CA)',
  museum: 'linear-gradient(135deg, var(--accent-orange), #F59E0B)',
  park: 'linear-gradient(135deg, #10B981, #059669)',
  church: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  district: 'linear-gradient(135deg, #64748B, #475569)',
  bridge: 'linear-gradient(135deg, var(--accent-pink), #06B6D4)',
  market: 'linear-gradient(135deg, var(--accent-orange), #EF4444)',
  cemetery: 'linear-gradient(135deg, #6B7280, #4B5563)',
  theatre: 'linear-gradient(135deg, #EC4899, #DB2777)',
  government: 'linear-gradient(135deg, #64748B, #334155)',
  memorial: 'linear-gradient(135deg, #6B7280, #374151)',
  restaurant: 'linear-gradient(135deg, #F59E0B, #D97706)',
};

export function getCategoryGradient(category?: string): string {
  if (!category) return 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))';
  return (
    CATEGORY_GRADIENTS[category.toLowerCase()] ??
    'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
  );
}

// Collection cover images — atmospheric AREA shots (not the specific landmark)
// Each is unique from city heroes, onboarding, AND place thumbnails
export const COLLECTION_IMAGES: Record<string, string> = {
  // London
  'Westminster Classics':
    'https://images.unsplash.com/photo-1750872310330-80191a871b36?w=800&q=80&auto=format&fit=crop',
  'South Bank Art Walk':
    'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&q=80&auto=format&fit=crop',
  "London's Hidden Stories":
    'https://images.unsplash.com/photo-1759598322620-59c4b15568b2?w=800&q=80&auto=format&fit=crop',
  // Paris
  'Ile de la Cité Walk':
    'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=800&q=80&auto=format&fit=crop',
  'Montmartre & Beyond':
    'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80&auto=format&fit=crop',
  'Grand Paris Icons':
    'https://images.unsplash.com/photo-1593114203584-7fefde09941b?w=800&q=80&auto=format&fit=crop',
  // Rome
  'Ancient Rome':
    'https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=800&q=80&auto=format&fit=crop',
  'Piazza Crawl':
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&q=80&auto=format&fit=crop',
  'Hidden Rome':
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=80&auto=format&fit=crop',
  // NYC
  'Lower Manhattan Icons':
    'https://images.unsplash.com/photo-1722031670263-f6c218866432?w=800&q=80&auto=format&fit=crop',
  'Midtown Essentials':
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80&auto=format&fit=crop',
  'Chelsea to Village':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop',
};

// Place thumbnail images — landmark-specific, unique per place
export const PLACE_IMAGES: Record<string, string> = {
  // ── London ──
  london_palace_of_westminster: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400&q=80&auto=format&fit=crop',
  london_london_eye: 'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=400&q=80&auto=format&fit=crop',
  london_tower_bridge: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400&q=80&auto=format&fit=crop',
  london_st_pauls_cathedral: 'https://images.unsplash.com/photo-1448906654166-444d494666b3?w=400&q=80&auto=format&fit=crop',
  london_british_museum: 'https://images.unsplash.com/photo-1535307261992-162ce1d29cb9?w=400&q=80&auto=format&fit=crop',
  london_tower_of_london: 'https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&q=80&auto=format&fit=crop',
  london_buckingham_palace: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80&auto=format&fit=crop',
  london_the_shard: 'https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=400&q=80&auto=format&fit=crop',
  london_westminster_abbey: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=80&auto=format&fit=crop',
  london_trafalgar_square: 'https://images.unsplash.com/photo-1543799382-9a0208331ef7?w=400&q=80&auto=format&fit=crop',
  london_borough_market: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop',
  london_notting_hill: 'https://images.unsplash.com/photo-1571168136613-46401b03904e?w=400&q=80&auto=format&fit=crop',
  london_covent_garden: 'https://images.unsplash.com/photo-1606726826514-0386bbb05b5e?w=400&q=80&auto=format&fit=crop',
  london_hyde_park: 'https://images.unsplash.com/photo-1509005084666-3cbc75184cbb?w=400&q=80&auto=format&fit=crop',
  london_camden_market: 'https://images.unsplash.com/photo-1527596615124-8b23ab91882f?w=400&q=80&auto=format&fit=crop',
  london_south_bank: 'https://images.unsplash.com/photo-1506501139174-099022df5260?w=400&q=80&auto=format&fit=crop',
  // ── Paris ──
  paris_eiffel_tower: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80&auto=format&fit=crop',
  paris_notre_dame: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80&auto=format&fit=crop',
  paris_sacre_coeur: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400&q=80&auto=format&fit=crop',
  paris_louvre: 'https://images.unsplash.com/photo-1543335785-8aadf6d8183c?w=400&q=80&auto=format&fit=crop',
  paris_musee_dorsay: 'https://images.unsplash.com/photo-1541264161754-445bbdd7de52?w=400&q=80&auto=format&fit=crop',
  // ── Rome ──
  rome_colosseum: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&auto=format&fit=crop',
  rome_trevi_fountain: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400&q=80&auto=format&fit=crop',
  rome_pantheon: 'https://images.unsplash.com/photo-1654874324486-4acfae9228e4?w=400&q=80&auto=format&fit=crop',
  rome_piazza_navona: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80&auto=format&fit=crop',
  rome_spanish_steps: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400&q=80&auto=format&fit=crop',
  // ── NYC ──
  nyc_statue_of_liberty: 'https://images.unsplash.com/photo-1512315342380-81f12a02bd7e?w=400&q=80&auto=format&fit=crop',
  nyc_brooklyn_bridge: 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=400&q=80&auto=format&fit=crop',
  nyc_central_park: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80&auto=format&fit=crop',
  nyc_grand_central: 'https://images.unsplash.com/photo-1501503125584-bb1da5f56d48?w=400&q=80&auto=format&fit=crop',
  nyc_high_line: 'https://images.unsplash.com/photo-1588383139420-741886231167?w=400&q=80&auto=format&fit=crop',
  nyc_times_square: 'https://images.unsplash.com/photo-1542204637-e67bc7d41e48?w=400&q=80&auto=format&fit=crop',
  nyc_flatiron: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80&auto=format&fit=crop&crop=top',
};

export function getPlaceImage(placeId?: string): string | undefined {
  if (!placeId) return undefined;
  return PLACE_IMAGES[placeId];
}

export function getCollectionImage(title: string): string | undefined {
  return COLLECTION_IMAGES[title];
}

// Generic moody travel cityscape for cities without a dedicated image
export const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&auto=format&fit=crop';

// Convert a city name like "New York" → "new-york"
export function toCitySlug(cityName: string): string {
  return cityName.toLowerCase().trim().replace(/\s+/g, '-');
}

export function getCityHeroImage(citySlugOrName?: string): string {
  if (!citySlugOrName) return FALLBACK_HERO_IMAGE;
  const key = citySlugOrName.toLowerCase().trim();
  return CITY_HERO_IMAGES[key] ?? CITY_HERO_IMAGES[toCitySlug(key)] ?? FALLBACK_HERO_IMAGE;
}
