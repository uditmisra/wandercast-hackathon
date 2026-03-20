-- Add generated_content JSONB column to persist all rich content fields
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS generated_content JSONB;

-- Tour progress tracking
CREATE TABLE IF NOT EXISTS public.tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  current_stop_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

ALTER TABLE public.tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
ON public.tour_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
