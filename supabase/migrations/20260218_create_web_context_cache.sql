CREATE TABLE IF NOT EXISTS web_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_key TEXT UNIQUE NOT NULL,
  context TEXT NOT NULL,
  source_count INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_web_context_cache_key ON web_context_cache(place_key);
ALTER TABLE web_context_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON web_context_cache USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
