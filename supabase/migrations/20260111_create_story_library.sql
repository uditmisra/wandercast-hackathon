-- Story Library Schema
-- Stores pre-curated audio tour content for cities worldwide

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- City places table (for geofencing/triggering)
CREATE TABLE IF NOT EXISTS city_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  trigger_radius_m INTEGER DEFAULT 120,
  category TEXT,
  neighborhood TEXT,
  must_see BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Place stories table
CREATE TABLE IF NOT EXISTS place_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL REFERENCES city_places(place_id) ON DELETE CASCADE,
  interests TEXT[] NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('casual', 'scholarly', 'dramatic', 'witty')),
  audio_narration TEXT NOT NULL,
  hook TEXT NOT NULL,
  directional_cue TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_city_places_city_id ON city_places(city_id);
CREATE INDEX IF NOT EXISTS idx_city_places_name ON city_places(name);
CREATE INDEX IF NOT EXISTS idx_place_stories_place_id ON place_stories(place_id);
CREATE INDEX IF NOT EXISTS idx_place_stories_tone ON place_stories(tone);
CREATE INDEX IF NOT EXISTS idx_place_stories_interests ON place_stories USING GIN(interests);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_stories ENABLE ROW LEVEL SECURITY;

-- Public read access (these are curated content, not user data)
CREATE POLICY "Public read access for cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read access for city_places" ON city_places FOR SELECT USING (true);
CREATE POLICY "Public read access for place_stories" ON place_stories FOR SELECT USING (true);
