-- Import London city and places

-- 1. Insert London city
INSERT INTO cities (slug, name, country)
VALUES ('london', 'London', 'United Kingdom')
ON CONFLICT (slug) DO NOTHING;

-- 2. Get the city_id for London
DO $$
DECLARE
  london_id UUID;
BEGIN
  SELECT id INTO london_id FROM cities WHERE slug = 'london';

  -- 3. Insert places
  INSERT INTO city_places (city_id, place_id, name, lat, lng, trigger_radius_m, category, must_see, neighborhood)
  VALUES
    (london_id, 'london_buckingham_palace', 'Buckingham Palace', 51.501111, -0.141944, 120, 'landmark', true, 'Westminster'),
    (london_id, 'london_st_jamess_park', 'St James''s Park', 51.5025, -0.135, 200, 'park', true, 'Westminster'),
    (london_id, 'london_westminster_abbey', 'Westminster Abbey', 51.4994, -0.127367, 120, 'church', true, 'Westminster'),
    (london_id, 'london_palace_of_westminster', 'Palace of Westminster / Big Ben', 51.49962, -0.12367, 160, 'landmark', true, 'Westminster'),
    (london_id, 'london_whitehall', 'Whitehall', 51.504167, -0.126389, 200, 'district', true, 'Westminster'),
    (london_id, 'london_10_downing_street_viewpoint', '10 Downing Street (No.10 viewpoint)', 51.503333, -0.127778, 120, 'government', false, 'Westminster'),
    (london_id, 'london_churchill_war_rooms', 'Churchill War Rooms', 51.502219, -0.1293, 90, 'museum', true, 'Westminster'),
    (london_id, 'london_london_eye', 'London Eye', 51.503333, -0.119722, 120, 'landmark', true, 'South Bank'),
    (london_id, 'london_south_bank', 'South Bank (riverside district)', 51.504167, -0.116667, 280, 'district', true, 'South Bank'),
    (london_id, 'london_millennium_bridge', 'Millennium Bridge', 51.510278, -0.098333, 110, 'bridge', true, 'City of London / Bankside'),
    (london_id, 'london_tate_modern', 'Tate Modern', 51.507778, -0.099444, 130, 'museum', true, 'Bankside'),
    (london_id, 'london_shakespeares_globe', 'Shakespeare''s Globe', 51.508111, -0.097194, 110, 'theatre', true, 'Bankside')
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
