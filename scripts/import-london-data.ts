import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Run with: deno run --allow-net --allow-env scripts/import-london-data.ts

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hdzfffutbzpevblbpgjc.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// London city data
const londonCity = {
  slug: 'london',
  name: 'London',
  country: 'United Kingdom'
};

// CityPlaces data from user
const londonPlaces = [
  {
    place_id: "london_buckingham_palace",
    name: "Buckingham Palace",
    lat: 51.501111,
    lng: -0.141944,
    trigger_radius_m: 120,
    category: "landmark",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_st_jamess_park",
    name: "St James's Park",
    lat: 51.5025,
    lng: -0.135,
    trigger_radius_m: 200,
    category: "park",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_westminster_abbey",
    name: "Westminster Abbey",
    lat: 51.4994,
    lng: -0.127367,
    trigger_radius_m: 120,
    category: "church",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_palace_of_westminster",
    name: "Palace of Westminster / Big Ben",
    lat: 51.49962,
    lng: -0.12367,
    trigger_radius_m: 160,
    category: "landmark",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_whitehall",
    name: "Whitehall",
    lat: 51.504167,
    lng: -0.126389,
    trigger_radius_m: 200,
    category: "district",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_10_downing_street_viewpoint",
    name: "10 Downing Street (No.10 viewpoint)",
    lat: 51.503333,
    lng: -0.127778,
    trigger_radius_m: 120,
    category: "government",
    must_see: false,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_churchill_war_rooms",
    name: "Churchill War Rooms",
    lat: 51.502219,
    lng: -0.1293,
    trigger_radius_m: 90,
    category: "museum",
    must_see: true,
    neighborhood: "Westminster"
  },
  {
    place_id: "london_london_eye",
    name: "London Eye",
    lat: 51.503333,
    lng: -0.119722,
    trigger_radius_m: 120,
    category: "landmark",
    must_see: true,
    neighborhood: "South Bank"
  },
  {
    place_id: "london_south_bank",
    name: "South Bank (riverside district)",
    lat: 51.504167,
    lng: -0.116667,
    trigger_radius_m: 280,
    category: "district",
    must_see: true,
    neighborhood: "South Bank"
  },
  {
    place_id: "london_millennium_bridge",
    name: "Millennium Bridge",
    lat: 51.510278,
    lng: -0.098333,
    trigger_radius_m: 110,
    category: "bridge",
    must_see: true,
    neighborhood: "City of London / Bankside"
  },
  {
    place_id: "london_tate_modern",
    name: "Tate Modern",
    lat: 51.507778,
    lng: -0.099444,
    trigger_radius_m: 130,
    category: "museum",
    must_see: true,
    neighborhood: "Bankside"
  },
  {
    place_id: "london_shakespeares_globe",
    name: "Shakespeare's Globe",
    lat: 51.508111,
    lng: -0.097194,
    trigger_radius_m: 110,
    category: "theatre",
    must_see: true,
    neighborhood: "Bankside"
  }
];

async function importData() {
  console.log('Starting London data import...\n');

  // 1. Insert or get London city
  console.log('1. Creating London city entry...');
  const { data: existingCity } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', 'london')
    .single();

  let cityId: string;

  if (existingCity) {
    cityId = existingCity.id;
    console.log(`   London already exists with id: ${cityId}`);
  } else {
    const { data: newCity, error: cityError } = await supabase
      .from('cities')
      .insert(londonCity)
      .select('id')
      .single();

    if (cityError) {
      console.error('Error creating city:', cityError);
      return;
    }
    cityId = newCity.id;
    console.log(`   Created London with id: ${cityId}`);
  }

  // 2. Insert places
  console.log('\n2. Inserting London places...');

  for (const place of londonPlaces) {
    const { error } = await supabase
      .from('city_places')
      .upsert({
        ...place,
        city_id: cityId
      }, {
        onConflict: 'place_id'
      });

    if (error) {
      console.error(`   Error inserting ${place.name}:`, error.message);
    } else {
      console.log(`   ✓ ${place.name}`);
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   City: London (${cityId})`);
  console.log(`   Places: ${londonPlaces.length}`);
  console.log('\nNext: Add stories to place_stories table');
}

importData();
