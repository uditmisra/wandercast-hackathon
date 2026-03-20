-- Dashboard feature: add columns + new tables for bookmarks, favorites, and better stats

-- Add interests to tours (currently only saved to user_preferences, not per-tour)
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;

-- Add city to places (currently parsed heuristically from description)
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS city TEXT;

-- Bookmarked places: users can save individual stops
CREATE TABLE public.bookmarked_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

-- Favorited tours: users can star entire tours
CREATE TABLE public.favorited_tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

-- Enable RLS
ALTER TABLE public.bookmarked_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorited_tours ENABLE ROW LEVEL SECURITY;

-- RLS for bookmarked_places
CREATE POLICY "Users can view their own bookmarked places"
ON public.bookmarked_places FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark places"
ON public.bookmarked_places FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their bookmarks"
ON public.bookmarked_places FOR DELETE
USING (auth.uid() = user_id);

-- RLS for favorited_tours
CREATE POLICY "Users can view their own favorites"
ON public.favorited_tours FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can favorite tours"
ON public.favorited_tours FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfavorite tours"
ON public.favorited_tours FOR DELETE
USING (auth.uid() = user_id);
