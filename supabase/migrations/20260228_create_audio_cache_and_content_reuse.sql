-- ═══════════════════════════════════════════════════════════════════
-- Audio cache + Generated content reuse
-- Prevents regenerating TTS audio on tour revisits,
-- and allows AI-generated content to be reused across users/tours.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Supabase Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-cache',
  'audio-cache',
  true,                          -- public read (no auth needed to play audio)
  5242880,                       -- 5 MB max per file
  ARRAY['audio/mpeg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, only service role can write
CREATE POLICY "Public read access for audio cache"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-cache');

CREATE POLICY "Service role write access for audio cache"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-cache');

-- 2. Audio cache lookup table (fast DB lookup instead of storage HEAD)
CREATE TABLE IF NOT EXISTS audio_cache (
  cache_key TEXT PRIMARY KEY,                -- SHA-256 of narration_text|voice_id
  storage_path TEXT NOT NULL,                -- path within audio-cache bucket
  voice_id TEXT NOT NULL,
  character_count INTEGER NOT NULL,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed — service role only writes, edge function reads
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for audio_cache"
ON audio_cache FOR SELECT USING (true);

CREATE POLICY "Service role insert for audio_cache"
ON audio_cache FOR INSERT
WITH CHECK (true);

-- 3. Generated place content — stores AI-generated content for reuse across users
CREATE TABLE IF NOT EXISTS generated_place_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_name_normalized TEXT NOT NULL,       -- lowercase trimmed place name
  city_normalized TEXT NOT NULL,             -- lowercase trimmed city name
  tone TEXT NOT NULL,
  generated_content JSONB NOT NULL,          -- full ContentResult (narration, hook, facts, etc.)
  source TEXT NOT NULL,                      -- 'curated+claude', 'web+claude', 'generated'
  audio_cache_key TEXT REFERENCES audio_cache(cache_key),  -- link to cached audio
  use_count INTEGER DEFAULT 1,              -- how many tours have used this content
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(place_name_normalized, city_normalized, tone)
);

ALTER TABLE generated_place_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for generated_place_content"
ON generated_place_content FOR SELECT USING (true);

CREATE POLICY "Service role write for generated_place_content"
ON generated_place_content FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update for generated_place_content"
ON generated_place_content FOR UPDATE USING (true);

-- Index for fast lookup by place + city
CREATE INDEX IF NOT EXISTS idx_generated_content_lookup
ON generated_place_content(place_name_normalized, city_normalized);

-- Trigger for updated_at
CREATE TRIGGER update_generated_place_content_updated_at
  BEFORE UPDATE ON generated_place_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
