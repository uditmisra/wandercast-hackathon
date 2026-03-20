-- Import Rome city and places

-- 1. Insert Rome city
INSERT INTO cities (slug, name, country)
VALUES ('rome', 'Rome', 'Italy')
ON CONFLICT (slug) DO NOTHING;

-- 2. Get the city_id for Rome
DO $$
DECLARE
  rome_id UUID;
BEGIN
  SELECT id INTO rome_id FROM cities WHERE slug = 'rome';

  -- 3. Insert places
  INSERT INTO city_places (city_id, place_id, name, lat, lng, trigger_radius_m, category, must_see, neighborhood)
  VALUES
    (rome_id, 'rome_colosseum', 'Colosseum', 41.8902, 12.4922, 150, 'landmark', true, 'Centro Storico'),
    (rome_id, 'rome_pantheon', 'Pantheon', 41.8986, 12.4769, 100, 'landmark', true, 'Centro Storico'),
    (rome_id, 'rome_trevi_fountain', 'Trevi Fountain', 41.9009, 12.4833, 80, 'landmark', true, 'Trevi'),
    (rome_id, 'rome_vatican_st_peters', 'St Peter''s Basilica', 41.9022, 12.4539, 200, 'church', true, 'Vatican City'),
    (rome_id, 'rome_roman_forum', 'Roman Forum', 41.8925, 12.4853, 200, 'landmark', true, 'Centro Storico'),
    (rome_id, 'rome_trastevere', 'Trastevere', 41.8814, 12.4697, 300, 'district', true, 'Trastevere'),
    (rome_id, 'rome_spanish_steps', 'Spanish Steps', 41.9060, 12.4822, 100, 'landmark', true, 'Spagna'),
    (rome_id, 'rome_piazza_navona', 'Piazza Navona', 41.8992, 12.4731, 120, 'landmark', true, 'Centro Storico'),
    (rome_id, 'rome_campo_de_fiori', 'Campo de'' Fiori', 41.8956, 12.4722, 100, 'market', false, 'Centro Storico'),
    (rome_id, 'rome_borghese_gallery', 'Borghese Gallery', 41.9142, 12.4922, 120, 'museum', true, 'Villa Borghese'),
    (rome_id, 'rome_aventine_keyhole', 'Aventine Keyhole', 41.8828, 12.4794, 80, 'landmark', false, 'Aventine'),
    (rome_id, 'rome_mouth_of_truth', 'Mouth of Truth', 41.8881, 12.4814, 80, 'landmark', false, 'Centro Storico')
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
SELECT 'Rome places:' as info, count(*) as count FROM city_places WHERE place_id LIKE 'rome_%';
