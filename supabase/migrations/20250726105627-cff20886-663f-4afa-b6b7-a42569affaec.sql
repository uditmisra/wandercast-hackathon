-- Create tours table for storing user-generated tours
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create places table for storing tour locations with cached content
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  overview TEXT,
  audio_narration TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  interests JSONB DEFAULT '[]'::jsonb,
  preferred_voice_id TEXT DEFAULT 'Aria',
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tours
CREATE POLICY "Users can view their own tours" 
ON public.tours 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tours" 
ON public.tours 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tours" 
ON public.tours 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tours" 
ON public.tours 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for places
CREATE POLICY "Users can view places from their tours" 
ON public.places 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tours 
  WHERE tours.id = places.tour_id 
  AND tours.user_id = auth.uid()
));

CREATE POLICY "Users can create places for their tours" 
ON public.places 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tours 
  WHERE tours.id = places.tour_id 
  AND tours.user_id = auth.uid()
));

CREATE POLICY "Users can update places from their tours" 
ON public.places 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tours 
  WHERE tours.id = places.tour_id 
  AND tours.user_id = auth.uid()
));

CREATE POLICY "Users can delete places from their tours" 
ON public.places 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.tours 
  WHERE tours.id = places.tour_id 
  AND tours.user_id = auth.uid()
));

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();