-- Add personalization columns to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS preferred_tone TEXT DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS favorite_story_types JSONB DEFAULT '[]'::jsonb;
