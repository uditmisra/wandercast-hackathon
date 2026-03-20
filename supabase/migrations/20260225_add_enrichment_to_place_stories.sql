-- Add enrichment columns to place_stories for pre-curated interactive content.
-- With these columns populated, curated tours skip the background enrichment call entirely.

ALTER TABLE place_stories ADD COLUMN IF NOT EXISTS story_type TEXT;
ALTER TABLE place_stories ADD COLUMN IF NOT EXISTS fun_facts TEXT[];
ALTER TABLE place_stories ADD COLUMN IF NOT EXISTS look_closer_challenge TEXT;
ALTER TABLE place_stories ADD COLUMN IF NOT EXISTS suggested_questions TEXT[];
