-- Create tables for caching interesting facts and city secrets

-- Place-specific facts cache
CREATE TABLE IF NOT EXISTS place_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  fact_category TEXT, -- 'near-demolition', 'secret-room', 'famous-incident', 'construction-drama', etc.
  hook TEXT NOT NULL, -- Short engaging hook: "You're standing where they almost blew this up"
  story TEXT NOT NULL, -- Full 2-3 sentence story with stakes and tension
  directional_cue TEXT, -- Optional: "Look up at the third level - see those supports?"
  source_url TEXT, -- Reddit thread, article, or book reference
  reddit_score INTEGER DEFAULT 0, -- Track engagement/quality
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(place_name, city, fact_category)
);

-- City-wide secrets and insider tips
CREATE TABLE IF NOT EXISTS city_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  secret_type TEXT, -- 'hidden-spot', 'local-habit', 'insider-tip', 'best-view'
  content TEXT NOT NULL,
  applies_to_places TEXT[], -- Array of place names where this is relevant
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_place_facts_location ON place_facts(place_name, city);
CREATE INDEX IF NOT EXISTS idx_place_facts_category ON place_facts(fact_category);
CREATE INDEX IF NOT EXISTS idx_city_secrets_location ON city_secrets(city, country);

-- Row Level Security
ALTER TABLE place_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_secrets ENABLE ROW LEVEL SECURITY;

-- Allow public read access (facts are public knowledge)
CREATE POLICY "Public read access to place facts"
  ON place_facts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to city secrets"
  ON city_secrets FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert/update (for future admin panel)
CREATE POLICY "Authenticated users can manage place facts"
  ON place_facts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage city secrets"
  ON city_secrets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed with some initial facts for testing
INSERT INTO place_facts (place_name, city, country, fact_category, hook, story, directional_cue, source_url, reddit_score)
VALUES
  (
    'Eiffel Tower',
    'Paris',
    'France',
    'near-demolition',
    'You''re looking at a building that was almost torn down',
    'The Eiffel Tower was supposed to be demolished in 1909. It was only saved because the military needed it as a radio tower. Look up - those iron girders were meant to be scrap metal.',
    'Look up at the ironwork - each rivet was hand-placed by workers who thought this would only stand for 20 years',
    'https://www.reddit.com/r/todayilearned/comments/1a2b3c4',
    127
  ),
  (
    'Edinburgh Castle',
    'Edinburgh',
    'Scotland',
    'secret-room',
    'There''s a room in this castle that was sealed for 200 years',
    'In 2015, they found a hidden chamber beneath the Great Hall, sealed since 1755. Inside? Perfectly preserved military equipment and a set of playing cards from the Jacobite uprising. Nobody knows why it was sealed.',
    'Face the Great Hall entrance - 20 feet below your feet is that sealed chamber',
    'https://www.scotsman.com/news/hidden-room-discovered',
    89
  ),
  (
    'Colosseum',
    'Rome',
    'Italy',
    'construction-drama',
    'This arena was built by slaves using a loophole',
    'The Colosseum was funded entirely with treasure looted from Jerusalem. Emperor Vespasian needed a propaganda win after civil war, so he built this in just 8 years using Jewish prisoners as forced labor. The irony? The entrance they used is still visible.',
    'Look at the lower arches on the north side - that was the prisoners'' entrance',
    'https://www.smithsonianmag.com/colosseum-secrets',
    156
  )
ON CONFLICT (place_name, city, fact_category) DO NOTHING;

-- Insert some city-wide secrets
INSERT INTO city_secrets (city, country, secret_type, content, applies_to_places)
VALUES
  (
    'Paris',
    'France',
    'hidden-spot',
    'Most tourists don''t know there''s a free observation deck at Galeries Lafayette with better views than the Eiffel Tower and no line.',
    ARRAY['Eiffel Tower', 'Arc de Triomphe', 'Louvre Museum']
  ),
  (
    'Edinburgh',
    'Scotland',
    'local-habit',
    'Locals never walk on the Royal Mile during August (festival month). They use the parallel streets - George IV Bridge is the local''s shortcut.',
    ARRAY['Edinburgh Castle', 'Royal Mile', 'St Giles Cathedral']
  ),
  (
    'Rome',
    'Italy',
    'insider-tip',
    'The best sunset view isn''t from any monument - it''s from Giardino degli Aranci (Orange Garden) on Aventine Hill. Locals go there with wine and snacks.',
    ARRAY['Colosseum', 'Roman Forum', 'Trevi Fountain']
  )
ON CONFLICT DO NOTHING;
