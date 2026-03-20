-- Add sharing columns to tours table
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_tours_share_slug ON public.tours (share_slug) WHERE share_slug IS NOT NULL;

-- RLS: anyone can read public tours (no auth required)
CREATE POLICY "Anyone can view public tours"
  ON public.tours
  FOR SELECT
  USING (is_public = true);

-- RLS: anyone can read places belonging to public tours
CREATE POLICY "Anyone can view places of public tours"
  ON public.places
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE tours.id = places.tour_id
        AND tours.is_public = true
    )
  );
