-- Import New York City and places

-- 1. Insert New York city
INSERT INTO cities (slug, name, country)
VALUES ('new-york', 'New York', 'United States')
ON CONFLICT (slug) DO NOTHING;

-- 2. Get the city_id for New York
DO $$
DECLARE
  nyc_id UUID;
BEGIN
  SELECT id INTO nyc_id FROM cities WHERE slug = 'new-york';

  -- 3. Insert places
  INSERT INTO city_places (city_id, place_id, name, lat, lng, trigger_radius_m, category, must_see, neighborhood)
  VALUES
    (nyc_id, 'nyc_statue_of_liberty', 'Statue of Liberty', 40.6892, -74.0445, 200, 'landmark', true, 'Lower Manhattan'),
    (nyc_id, 'nyc_central_park', 'Central Park', 40.7829, -73.9654, 300, 'park', true, 'Upper Manhattan'),
    (nyc_id, 'nyc_brooklyn_bridge', 'Brooklyn Bridge', 40.7061, -73.9969, 180, 'bridge', true, 'Lower Manhattan'),
    (nyc_id, 'nyc_times_square', 'Times Square', 40.7580, -73.9855, 200, 'district', true, 'Midtown'),
    (nyc_id, 'nyc_grand_central', 'Grand Central Terminal', 40.7527, -73.9772, 150, 'landmark', true, 'Midtown'),
    (nyc_id, 'nyc_high_line', 'The High Line', 40.7480, -74.0048, 160, 'park', true, 'Chelsea'),
    (nyc_id, 'nyc_dumbo', 'DUMBO', 40.7033, -73.9894, 200, 'district', false, 'Brooklyn'),
    (nyc_id, 'nyc_greenwich_village', 'Greenwich Village', 40.7336, -74.0027, 250, 'district', false, 'Greenwich Village'),
    (nyc_id, 'nyc_911_memorial', '9/11 Memorial', 40.7115, -74.0134, 160, 'memorial', true, 'Lower Manhattan'),
    (nyc_id, 'nyc_flatiron', 'Flatiron Building', 40.7411, -73.9897, 120, 'landmark', true, 'Flatiron District'),
    (nyc_id, 'nyc_chelsea_market', 'Chelsea Market', 40.7422, -74.0061, 120, 'market', false, 'Chelsea'),
    (nyc_id, 'nyc_rockefeller_center', 'Rockefeller Center', 40.7587, -73.9787, 160, 'landmark', true, 'Midtown')
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
SELECT 'NYC Places:' as info, count(*) as count FROM city_places WHERE place_id LIKE 'nyc_%';
