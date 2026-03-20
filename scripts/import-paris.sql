-- Import Paris city and places

-- 1. Insert Paris city
INSERT INTO cities (slug, name, country)
VALUES ('paris', 'Paris', 'France')
ON CONFLICT (slug) DO NOTHING;

-- 2. Get the city_id for Paris
DO $$
DECLARE
  paris_id UUID;
BEGIN
  SELECT id INTO paris_id FROM cities WHERE slug = 'paris';

  -- 3. Insert places
  INSERT INTO city_places (city_id, place_id, name, lat, lng, trigger_radius_m, category, must_see, neighborhood)
  VALUES
    (paris_id, 'paris_eiffel_tower', 'Eiffel Tower', 48.8584, 2.2945, 200, 'landmark', true, 'Champ de Mars'),
    (paris_id, 'paris_notre_dame', 'Notre-Dame Cathedral', 48.8530, 2.3499, 150, 'church', true, 'Ile de la Cité'),
    (paris_id, 'paris_louvre', 'Louvre Museum', 48.8606, 2.3376, 200, 'museum', true, 'Tuileries'),
    (paris_id, 'paris_sacre_coeur', 'Sacré-Cœur', 48.8867, 2.3431, 150, 'church', true, 'Montmartre'),
    (paris_id, 'paris_sainte_chapelle', 'Sainte-Chapelle', 48.8554, 2.3450, 100, 'church', true, 'Ile de la Cité'),
    (paris_id, 'paris_musee_dorsay', 'Musée d''Orsay', 48.8600, 2.3266, 150, 'museum', true, 'Saint-Germain-des-Prés'),
    (paris_id, 'paris_pere_lachaise', 'Père Lachaise Cemetery', 48.8611, 2.3936, 200, 'cemetery', false, 'Père Lachaise'),
    (paris_id, 'paris_luxembourg_gardens', 'Luxembourg Gardens', 48.8462, 2.3372, 200, 'park', true, 'Latin Quarter'),
    (paris_id, 'paris_le_marais', 'Le Marais', 48.8603, 2.3628, 200, 'district', true, 'Le Marais'),
    (paris_id, 'paris_pont_neuf', 'Pont Neuf', 48.8572, 2.3414, 120, 'bridge', true, 'Ile de la Cité'),
    (paris_id, 'paris_palais_royal', 'Palais Royal', 48.8628, 2.3372, 120, 'landmark', false, 'Palais-Royal'),
    (paris_id, 'paris_montmartre', 'Montmartre', 48.8864, 2.3408, 250, 'district', true, 'Montmartre')
  ON CONFLICT (place_id) DO UPDATE SET
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    trigger_radius_m = EXCLUDED.trigger_radius_m,
    category = EXCLUDED.category,
    must_see = EXCLUDED.must_see,
    neighborhood = EXCLUDED.neighborhood;
END $$;

-- Verify
SELECT 'Cities:' as info, count(*) as count FROM cities;
SELECT 'Places:' as info, count(*) as count FROM city_places;
