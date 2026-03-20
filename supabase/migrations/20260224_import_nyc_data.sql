-- Migration: Import NYC city data and curated stories
-- Idempotent: deletes existing NYC stories before re-importing

DELETE FROM place_stories WHERE place_id LIKE 'nyc_%';

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

-- New York City Stories Import
-- 12 places x 4 stories each = 48 curated stories
-- Run AFTER import-nyc.sql (which creates the city + places)

-- ============================================================
-- 1. STATUE OF LIBERTY
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_statue_of_liberty', ARRAY['history', 'architecture'], 'scholarly',
 'The Statue of Liberty was a diplomatic gift from France, conceived by political thinker Edouard de Laboulaye in 1865 as a rebuke to Napoleon III''s authoritarian rule. The sculptor Frederic Auguste Bartholdi designed the exterior, but it was Gustave Eiffel — yes, that Eiffel — who engineered the internal iron framework that allows the copper skin to move independently in the wind. The statue arrived in 214 crates in June 1885 and took four months to reassemble on what was then called Bedloe''s Island. The copper shell is just 2.4 millimetres thick, roughly the width of two pennies. The green patina you see is copper carbonate formed by over a century of oxidation. It actually protects the metal underneath from further corrosion.',
 'Gustave Eiffel built the skeleton inside Lady Liberty — the copper skin is only 2.4 millimetres thick.',
 'Look at the green patina covering the statue — that layer of oxidation has been protecting the copper underneath for over a century.'),

-- Story 2: culture/local-life (casual)
('nyc_statue_of_liberty', ARRAY['culture', 'local-life'], 'casual',
 'Here''s a thing New Yorkers almost never do: visit the Statue of Liberty. It''s one of those landmarks that locals walk past metaphorically for decades. The ferry ride from Battery Park takes about 15 minutes, and the island itself is surprisingly small and windswept. If you''ve snagged crown tickets, you''re climbing 354 steps inside a narrow spiral staircase with no air conditioning — in summer it can hit 50 degrees Celsius inside the copper shell. The torch has been closed to visitors since 1916 after German saboteurs blew up a nearby munitions depot on Black Tom Island, and the explosion damaged the arm. That''s right — a World War I act of sabotage is the reason you can''t climb into the torch today. Most people don''t know that.',
 'The torch has been closed since 1916 because a German sabotage explosion on nearby Black Tom Island damaged the arm.',
 'Look up at the torch — it''s been off-limits to visitors for over a century, sealed shut after a wartime explosion.'),

-- Story 3: history/myths (witty)
('nyc_statue_of_liberty', ARRAY['history', 'myths'], 'witty',
 'The statue was supposed to be a lighthouse. Seriously. For 16 years after its unveiling in 1886, Liberty''s torch served as a navigational aid for ships entering New York Harbor, operated by the U.S. Lighthouse Board. It was a terrible lighthouse — the light was too high and too dim to be useful — and they gave up in 1902. The famous poem by Emma Lazarus, the one about "huddled masses," was written in 1883 for a fundraising auction and then completely forgotten. It wasn''t attached to the pedestal until 1903, twenty years later, and even then it was a small bronze plaque nobody noticed. The poem didn''t become iconic until the 1930s and 1940s when immigration politics gave it new meaning. Lady Liberty''s greatest symbol was basically an afterthought.',
 'The Statue of Liberty was officially a lighthouse for 16 years — and a terrible one at that.',
 'Look at the torch — for 16 years it was technically a navigational light, operated by the U.S. Lighthouse Board.'),

-- Story 4: culture/photography (dramatic)
('nyc_statue_of_liberty', ARRAY['culture', 'photography'], 'dramatic',
 'Between 1892 and 1954, roughly 12 million immigrants entered the United States through Ellis Island, just a few hundred metres from where the statue stands. For most of them, Liberty was the first thing they saw after weeks in the hold of a ship — a copper figure emerging from the fog at dawn. Survivors'' accounts describe grown men weeping on deck. Children were lifted onto shoulders to see her. The statue wasn''t built as an immigration symbol; it was France''s gift celebrating republican ideals. But it became one, involuntarily, through the sheer emotional weight of 12 million first impressions. Stand on the ferry as it approaches the island and face the statue. Imagine seeing it after six weeks at sea, owning nothing, knowing no one. That''s the real monument.',
 'Twelve million immigrants saw the statue as their first glimpse of America — many wept on the ship decks.',
 'Face the statue from the ferry approach and imagine arriving after weeks at sea — that perspective is the real monument.');

-- ============================================================
-- 2. CENTRAL PARK
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_central_park', ARRAY['history', 'architecture'], 'scholarly',
 'Central Park is entirely artificial. Every hill, every lake, every stand of trees was designed and placed by Frederick Law Olmsted and Calvert Vaux, who won the park commission in 1858 with their "Greensward Plan." Before construction, the site was home to roughly 1,600 residents in settlements including Seneca Village, a thriving community of predominantly Black property owners established in 1825. They were displaced through eminent domain. The park required moving 10 million cartloads of earth and planting over 270,000 trees and shrubs. Olmsted designed the four sunken transverse roads so that crosstown traffic would pass through the park without being visible from ground level — an engineering solution that still works seamlessly today, over 160 years later.',
 'Central Park is completely man-made — 10 million cartloads of earth were moved to create it, displacing an entire community.',
 'Look at the landscape around you — every hill, lake, and tree line was engineered by Olmsted and Vaux starting in 1858.'),

-- Story 2: nature/local-life (casual)
('nyc_central_park', ARRAY['nature', 'local-life'], 'casual',
 'Central Park is 843 acres, which means it''s bigger than the principality of Monaco. On a typical weekend, about 250,000 people pass through it. The Ramble, that dense wooded area near the lake, is one of the best birdwatching spots on the entire East Coast — over 230 species have been spotted there, because the park sits directly on the Atlantic Flyway migration route. In spring, serious birders show up before dawn with scopes and field guides. You''ll also find turtles sunning themselves on rocks in Turtle Pond, red-tailed hawks nesting on Fifth Avenue buildings, and coyotes — yes, actual coyotes — that wandered in from the Bronx sometime in the 2010s and decided to stay. The park is wilder than it looks.',
 'Over 230 bird species have been spotted in Central Park — it sits on the Atlantic Flyway, and coyotes live here now.',
 'Head toward the Ramble near the lake — that dense wooded area is one of the best birdwatching spots on the East Coast.'),

-- Story 3: history/myths (witty)
('nyc_central_park', ARRAY['history', 'myths'], 'witty',
 'The park has a secret room inside the Belvedere Castle — well, it used to be secret. The castle itself is a Victorian folly, built in 1869 as a decorative ruin that served no practical purpose. Then the National Weather Service moved in and used it as an official weather station until 2020. So for over a century, New York City''s weather was measured from a fake castle in the middle of a fake landscape. The park also has a Swedish Cottage that was built for the 1876 Philadelphia World''s Fair and shipped to New York afterward — it''s now a marionette theatre. There''s a 3,500-year-old Egyptian obelisk near the Met called Cleopatra''s Needle, which has nothing to do with Cleopatra. New York is full of things that aren''t what they claim to be.',
 'NYC''s weather was measured from a fake castle in Central Park for over a century — and there''s a 3,500-year-old obelisk that has nothing to do with Cleopatra.',
 'Find Belvedere Castle perched on Vista Rock — it''s a decorative ruin that doubled as an official weather station until 2020.'),

-- Story 4: art/photography (dramatic)
('nyc_central_park', ARRAY['art', 'photography'], 'dramatic',
 'In February 2005, artists Christo and Jeanne-Claude installed 7,503 saffron-colored fabric gates along 23 miles of Central Park walkways. For sixteen days, the park became a river of orange flowing through bare winter trees. Over four million people walked through the gates. Christo had been trying to get permission since 1979 — it took 26 years of proposals, rejections, and negotiation. The project cost 21 million dollars, entirely self-funded, and every piece was removed without a trace. That''s the thing about Central Park: it has always been a canvas. From concerts on the Great Lawn — Simon and Garfunkel played to half a million people in 1981 — to Shakespeare in the Park every summer, the space transforms constantly. Stand still for ten minutes and watch what happens around you. The park performs.',
 'Christo waited 26 years to drape Central Park in 7,503 saffron gates — four million people walked through them.',
 'Stand on any long walkway and imagine it lined with saffron fabric gates — that''s what four million visitors saw in 2005.');

-- ============================================================
-- 3. BROOKLYN BRIDGE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_brooklyn_bridge', ARRAY['history', 'architecture'], 'scholarly',
 'The Brooklyn Bridge was the longest suspension bridge in the world when it opened in 1883, spanning 1,595 feet across the East River. Its designer, John Augustus Roebling, died of tetanus from a foot injury sustained during initial surveying before construction even began. His son Washington Roebling took over and was paralyzed by decompression sickness from working in the underwater caissons — the pressurized chambers sunk into the riverbed to build the foundations. Washington supervised the remaining construction from his apartment using a telescope while his wife Emily relayed his instructions to the engineers. The bridge''s four main cables each contain 5,434 individual steel wires. The Gothic stone towers are 276 feet tall and were the tallest structures in the Western Hemisphere at the time.',
 'Three Roeblings built this bridge — one died, one was paralyzed, and Emily ran the project from the site.',
 'Look at the Gothic stone towers — at 276 feet, they were the tallest structures in the Western Hemisphere when built.'),

-- Story 2: culture/local-life (casual)
('nyc_brooklyn_bridge', ARRAY['culture', 'local-life'], 'casual',
 'Walking the Brooklyn Bridge is a rite of passage, but here''s the insider trick: walk from Brooklyn to Manhattan, not the other way. You get the skyline head-on, growing larger with every step, and you end up downtown instead of in DUMBO trying to figure out the subway. The walk takes about 30 to 40 minutes depending on how often you stop for photos, which will be a lot. The pedestrian path runs above the car lanes, which gives you this strange floating feeling. At rush hour, the bike lane becomes a warzone — cyclists do not slow down, and tourists wandering into the bike lane is genuinely the most reliable source of conflict in New York City. Stay in the pedestrian lane. Seriously. The wooden slat walkway creaks underfoot, and that''s by design — the original planners wanted you to feel the bridge.',
 'Walk Brooklyn to Manhattan for the skyline head-on — and stay out of the bike lane if you value your life.',
 'Look down at the wooden slat walkway beneath your feet — that creak is original, designed to make you feel the bridge.'),

-- Story 3: history/myths (dramatic)
('nyc_brooklyn_bridge', ARRAY['history', 'myths'], 'dramatic',
 'Six days after the Brooklyn Bridge opened on May 24, 1883, a woman stumbled on the stairs at the Manhattan end and screamed. Someone shouted that the bridge was collapsing. In the stampede that followed, twelve people were crushed to death and dozens more were injured. The bridge was fine — it was panic that killed them. To restore public confidence, P.T. Barnum marched 21 elephants across the bridge the following year. If the bridge could hold elephants, the logic went, it could hold anything. The workers who built the bridge had it worse. At least 27 men died during construction, many from caisson disease — the bends — caused by working in pressurized chambers beneath the riverbed. They called it "the bridge of sighs." Stand on the walkway and feel the cables hum in the wind. That vibration is the bridge breathing.',
 'Twelve people died in a stampede six days after opening — P.T. Barnum walked 21 elephants across to prove it safe.',
 'Stand still on the walkway and feel the cables vibrate in the wind — the bridge has been breathing like this since 1883.'),

-- Story 4: architecture/photography (witty)
('nyc_brooklyn_bridge', ARRAY['architecture', 'photography'], 'witty',
 'The Brooklyn Bridge has wine vaults. During construction, the city realized the stone arches on both ends created massive dry spaces, so they rented them out as wine storage to help pay for the bridge. A.A. Low and Brother, a Manhattan wine merchant, stored thousands of bottles in the Brooklyn-side vaults. The temperature underground was naturally cool and stable — perfect for wine. The rental income was actually significant: it helped offset construction costs that had ballooned to over 15 million dollars. The vaults were sealed up after Prohibition and largely forgotten until workers rediscovered them during renovations. For the best photograph of the bridge, skip the obvious Manhattan-side shot. Walk to Washington Street in DUMBO and shoot through the gap in the buildings — the Manhattan Bridge frames the Empire State Building with the Brooklyn Bridge in the foreground. Every photographer knows this spot.',
 'The Brooklyn Bridge has secret wine vaults built into its arches — the rent helped pay for construction.',
 'Look at the stone arches at the bridge''s base — behind them are vaults that once stored thousands of bottles of wine.');

-- ============================================================
-- 4. TIMES SQUARE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/culture (scholarly)
('nyc_times_square', ARRAY['history', 'culture'], 'scholarly',
 'Times Square was called Longacre Square until 1904, when the New York Times moved its headquarters to the newly built One Times Square tower and the city renamed the intersection. The paper hosted a New Year''s Eve celebration that year with fireworks, starting the tradition. The illuminated ball drop began in 1907 after the city banned fireworks. The original ball was iron and wood, studded with 100 light bulbs. Today''s ball is 12 feet in diameter, weighs nearly 12,000 pounds, and is covered in 2,688 Waterford Crystal triangles. The newspaper moved out of One Times Square decades ago, but the building remains because its facade earns an estimated 23 million dollars annually in advertising revenue. The building is essentially hollow — nothing but billboards wrapped around a steel frame.',
 'One Times Square is nearly empty inside — the building earns 23 million dollars a year as a billboard.',
 'Look at the narrow One Times Square tower at the intersection''s south end — it''s essentially hollow, kept alive by advertising revenue.'),

-- Story 2: local-life/music (casual)
('nyc_times_square', ARRAY['local-life', 'music'], 'casual',
 'New Yorkers avoid Times Square like it''s a disease. If you live here, you route around it — take Eighth Avenue, take Sixth Avenue, anything but walking through the square itself. The pedestrian density is insane: about 330,000 people pass through daily, and on New Year''s Eve that spikes to over a million, all standing in pens with no bathroom access for up to ten hours. The street performers are licensed, mostly. The costumed characters — the Elmos, the Statues of Liberty, the bootleg superheroes — work for tips and can get aggressive about it. But here''s the thing: stand on the TKTS steps in the middle and just look up. The sheer volume of light is overwhelming. Every surface is a screen. It''s the only district in New York where businesses are required by zoning law to display illuminated signs. Darkness is literally illegal here.',
 'Times Square is the only place in New York where businesses are legally required to display illuminated signs.',
 'Climb the red TKTS steps in the center of the square and look up — every surface is a screen, darkness is illegal here.'),

-- Story 3: history/art (dramatic)
('nyc_times_square', ARRAY['history', 'art'], 'dramatic',
 'On August 14, 1945, news of Japan''s surrender flashed across the Times Square ticker, and the square erupted. Thousands of strangers poured into the streets, dancing, shouting, kissing. Alfred Eisenstaedt''s photograph of a sailor kissing a nurse in a white dress became one of the most famous images of the 20th century. The celebration was spontaneous and chaotic — confetti rained from office windows, car horns blared for hours, and the crowd swelled until the streets were impassable. Before that night, Times Square had been the heart of New York''s theatre district since the 1920s, but the V-J Day celebration transformed it into something else: a symbol of collective emotion. Every New Year''s Eve since has tried to recapture that energy. The countdown, the ball, the kiss — it''s all an echo of one night in 1945.',
 'The famous V-J Day kiss photo was taken right here — thousands of strangers flooded the square when Japan surrendered.',
 'Stand in the center of the square and look around — on August 14, 1945, every inch of this space was filled with celebrating strangers.'),

-- Story 4: architecture/photography (witty)
('nyc_times_square', ARRAY['architecture', 'photography'], 'witty',
 'Times Square''s famous brightness is actually a zoning requirement called the "spectacle lighting" rule, enacted in 2004. Every new building in the district must cover a percentage of its lower facade with illuminated signage. The rule exists because in the 1990s, when Times Square was cleaned up from its decades of seediness, the new corporate towers threatened to make it boring. So the city mandated visual chaos by law. The Nasdaq building alone has a display surface of over 10,000 square feet. The total energy consumption of Times Square''s signs could power a small town. Here''s the photography trick: come at blue hour, about 30 minutes after sunset, when the sky still has color. The screens pop against the deep blue instead of competing with black. Shoot from the TKTS steps facing north for the classic canyon-of-light composition.',
 'Times Square''s visual chaos is legally mandated — a 2004 zoning law requires buildings to be covered in illuminated signs.',
 'Face north from the TKTS steps at blue hour — the screens pop against the deep blue sky instead of black.');

-- ============================================================
-- 5. GRAND CENTRAL TERMINAL
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_grand_central', ARRAY['history', 'architecture'], 'scholarly',
 'Grand Central Terminal opened on February 2, 1913, replacing an older station on the same site. The Beaux-Arts design by Reed and Stem, with Warren and Wetmore, was revolutionary not just aesthetically but as urban planning. The terminal pioneered the concept of ramp circulation — passengers move between levels on ramps rather than stairs, allowing smoother crowd flow. Below ground, there are two levels of tracks: 44 platforms on the upper level and 26 on the lower. The famous celestial ceiling in the Main Concourse, painted by Paul Cesar Helle, depicts 2,500 stars from the Mediterranean sky — but mirrored. The constellations are reversed, which astronomers noticed immediately. The official explanation was that it represents God''s view looking down. The actual reason was almost certainly a mistake.',
 'The celestial ceiling has its constellations backwards — the official story is divine perspective, the real reason is likely a mistake.',
 'Look up at the Main Concourse ceiling — those 2,500 painted stars are astronomically reversed, and nobody is sure why.'),

-- Story 2: local-life/food (casual)
('nyc_grand_central', ARRAY['local-life', 'food'], 'casual',
 'Grand Central is secretly one of the best food destinations in Manhattan. The lower level has a dining concourse with everything from sushi to barbecue, but the real find is the Grand Central Oyster Bar, which has been serving bivalves in a tiled Guastavino vault since 1913. The vaulted ceiling creates a whisper effect — stand at one corner and speak into the arch, and someone at the diagonal corner 30 feet away can hear you clearly. Commuters use it as a party trick. The Grand Central Market on the east side sells artisanal cheeses, spices, and fresh produce that rivals anything at a farmers market. About 750,000 people pass through the terminal daily, making it the busiest train station in North America. Most of them are moving too fast to look up, which is a genuine tragedy given that ceiling.',
 'The Oyster Bar''s vaulted ceiling carries whispers across 30 feet — commuters use it as a party trick.',
 'Head to the lower level and find the Oyster Bar''s tiled arches — stand in one corner and whisper into the vault.'),

-- Story 3: history/myths (dramatic)
('nyc_grand_central', ARRAY['history', 'myths'], 'dramatic',
 'In the 1970s, Grand Central was nearly demolished. Penn Central Railroad, facing bankruptcy, planned to build a 55-story office tower directly on top of the terminal. Jacqueline Kennedy Onassis led a preservation campaign that went all the way to the Supreme Court. In the landmark 1978 case Penn Central Transportation Co. v. New York City, the court upheld the city''s right to designate landmarks and prevent their destruction. That ruling didn''t just save Grand Central — it established the legal foundation for historic preservation across the entire United States. Without Jackie Kennedy standing on the steps and telling reporters that she didn''t care if the building was beautiful or ugly, that a city has the right to protect its history, there would be a glass tower here instead. Every preserved building in America owes something to this one.',
 'Jackie Kennedy''s fight to save Grand Central from demolition created the legal basis for historic preservation in America.',
 'Stand in the Main Concourse and look around — a 55-story tower was planned for this exact spot before the Supreme Court intervened.'),

-- Story 4: architecture/art (witty)
('nyc_grand_central', ARRAY['architecture', 'art'], 'witty',
 'There''s a dark patch on the celestial ceiling in the northwest corner — a single rectangle of grime left deliberately uncleaned during the 1998 restoration. The rest of the ceiling had been black for decades. Everyone assumed the mural was painted in dark tones. When restorers tested a small section, the teal and gold original emerged under layers of tobacco tar and diesel soot. The entire restoration took twelve years. That little dirty rectangle is there so people can see how bad it was. The terminal also has a secret platform — Track 61 — beneath the Waldorf Astoria hotel, built so President Franklin Roosevelt could arrive in the city without being seen in his wheelchair. The armored rail car and the platform are still down there, unused, gathering dust in the dark. Grand Central is full of things hiding in plain sight.',
 'A patch of grime was left on the ceiling deliberately — so you can see how filthy the mural was before restoration.',
 'Find the dark rectangle in the northwest corner of the ceiling — it''s the only uncleaned patch, left as proof of what was hidden.');

-- ============================================================
-- 6. THE HIGH LINE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_high_line', ARRAY['history', 'architecture'], 'scholarly',
 'The High Line was built in the 1930s as an elevated freight railroad running through Manhattan''s Meatpacking District and West Chelsea, replacing street-level tracks that had been so dangerous they required horseback riders — called "West Side Cowboys" — to ride ahead of the trains waving red flags. The last train ran in 1980 carrying three carloads of frozen turkeys. The line was abandoned and scheduled for demolition until residents Joshua David and Robert Hammond founded Friends of the High Line in 1999. The park, designed by landscape architects James Corner Field Operations with Diller Scofidio + Renfro, opened in stages between 2009 and 2014. The design preserves sections of the original rail tracks, integrating them into the planting beds and walkways so the industrial infrastructure becomes part of the garden.',
 'The last freight train on the High Line carried frozen turkeys in 1980 — "West Side Cowboys" once rode ahead of trains waving red flags.',
 'Look down at the rail tracks embedded in the walkway — they''re the original 1930s freight lines, now part of the garden design.'),

-- Story 2: nature/local-life (casual)
('nyc_high_line', ARRAY['nature', 'local-life'], 'casual',
 'The planting on the High Line is inspired by the wild landscape that grew on the abandoned tracks before the park existed. When the railroad was derelict, seeds blew in and a self-seeded meadow of grasses, wildflowers, and even small trees took root in the rail bed gravel. Landscape designer Piet Oudolf used that wild aesthetic as his model — the gardens here are deliberately unmanicured, with grasses left to go to seed and perennials allowed to brown naturally in winter. It looks accidental but every plant is placed with precision. Walk the full length and you''ll pass through distinct planting zones that shift with the seasons. The best time is late September when the grasses turn gold and catch the afternoon light. Locals jog here before work. Tourists take selfies. The two groups coexist in mutual incomprehension.',
 'The High Line''s wild-looking gardens are modeled on the meadow that grew when the railroad was abandoned.',
 'Look at the plantings along the rail beds — they mimic the wild grasses that self-seeded here during decades of abandonment.'),

-- Story 3: culture/art (dramatic)
('nyc_high_line', ARRAY['culture', 'art'], 'dramatic',
 'The High Line transformed Chelsea from a rough neighborhood of auto shops and nightclubs into one of the most expensive real estate corridors in Manhattan. Property values within a few blocks of the park tripled within years of its opening. Over 30 new buildings have been constructed along the route, including Zaha Hadid''s sculptural condo at 520 West 28th Street and Renzo Piano''s Whitney Museum at the southern terminus. The park itself commissions large-scale artworks that change seasonally, displayed on the elevated structure and visible from the street. But the High Line''s greatest piece of public art might be the Tenth Avenue Square — a section with stadium-style seating and a glass wall that frames the street below like a living screen. You sit and watch traffic, pedestrians, taxis. The city becomes the show.',
 'Property values tripled along the High Line — a park built on an abandoned railroad created Manhattan''s most expensive corridor.',
 'Find the stadium seating at the Tenth Avenue Square — the glass wall frames the street below like a living screen.'),

-- Story 4: architecture/photography (witty)
('nyc_high_line', ARRAY['architecture', 'photography'], 'witty',
 'The High Line has an unexpected problem: it''s too successful. The park attracts over 8 million visitors annually to a path that''s only 1.45 miles long and rarely wider than 30 feet. At peak times, walking speed slows to what urban planners politely call "museum pace" and what New Yorkers less politely call "tourist shuffle." The park has inadvertently created a neighborhood where apartments overlooking the walkway cost millions, and residents then complain about being looked at by the millions of visitors walking past their windows. The Standard Hotel, which straddles the High Line at 13th Street, had to frost its lower windows after guests were spotted in various states of undress by parkgoers below. For the best photos, come at opening time — 7am in summer — when you might actually get a section of walkway to yourself.',
 'The Standard Hotel had to frost its windows after High Line visitors kept spotting undressed guests inside.',
 'Look toward the Standard Hotel straddling the path near 13th Street — its frosted lower windows tell a story about privacy and parks.');

-- ============================================================
-- 7. DUMBO
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_dumbo', ARRAY['history', 'architecture'], 'scholarly',
 'DUMBO stands for Down Under the Manhattan Bridge Overpass, a name reportedly coined by local artists in the 1970s who wanted to make the neighborhood sound as unappealing as possible to discourage developers. It didn''t work. The area was originally an industrial waterfront — coffee warehouses, cardboard box factories, and a massive Con Edison power station. The Belgian-block cobblestone streets you''re walking on are original 19th-century paving. The Manhattan Bridge approach, completed in 1909, created the distinctive underpass that defines the neighborhood. Most of DUMBO''s warehouse buildings were constructed between 1880 and 1920 and feature load-bearing masonry walls, cast-iron columns, and large industrial windows. Their conversion to lofts and offices in the 1990s and 2000s made DUMBO a template for post-industrial urban renewal worldwide.',
 'Artists coined the name DUMBO specifically to repel developers — the cobblestone streets are original 19th-century Belgian block.',
 'Look down at the cobblestones beneath your feet — they''re original Belgian-block paving from the 19th century.'),

-- Story 2: local-life/food (casual)
('nyc_dumbo', ARRAY['local-life', 'food'], 'casual',
 'DUMBO is tiny — maybe eight square blocks — but it packs in an absurd density of things to do. The waterfront at Brooklyn Bridge Park has a restored 1920s Jane''s Carousel housed in a glass pavilion designed by Jean Nouvel. Grimaldi''s pizzeria has been serving coal-fired pies under the bridge since 1990, and the line is always around the block. Locals skip Grimaldi''s and go to Juliana''s next door, which was opened by the original Grimaldi''s founder Patsy Grimaldi after a dispute. So two legendary pizza places sit side by side with the same origin story and competing claims to authenticity. The ice cream at Brooklyn Ice Cream Factory on the Old Fulton Street pier is excellent and the view from the water''s edge is one of the best in all five boroughs. Come at sunset. Face Manhattan. You''re welcome.',
 'Two rival pizza legends sit side by side in DUMBO — both claim the same founder and the same authenticity.',
 'Walk to the waterfront at Brooklyn Bridge Park — the ice cream pier and Jane''s Carousel are both right at the water''s edge.'),

-- Story 3: culture/photography (dramatic)
('nyc_dumbo', ARRAY['culture', 'photography'], 'dramatic',
 'There is one photograph that defines DUMBO, and you''ve almost certainly seen it: standing on Washington Street looking north, the Manhattan Bridge fills the gap between two brick warehouse buildings, and through its cables you can see the Empire State Building perfectly framed in the distance. That single composition has been photographed millions of times. It appears on postcards, Instagram feeds, and travel blogs so frequently that the intersection has become a permanent photography destination with tourists lining up to stand in the middle of the street. Cars honk. People don''t move. The shot works because of the layering: cobblestones in the foreground, red brick on the sides, the steel bridge in the middle ground, and the Art Deco spire floating behind it. That kind of visual depth doesn''t happen by accident — or rather, in this case, it did. Nobody planned it.',
 'The most photographed view in Brooklyn happened by accident — the Manhattan Bridge frames the Empire State Building through a gap in warehouses.',
 'Walk to Washington Street and face north — the Manhattan Bridge frames the Empire State Building in what may be Brooklyn''s most famous view.'),

-- Story 4: art/music (witty)
('nyc_dumbo', ARRAY['art', 'music'], 'witty',
 'DUMBO''s transformation from industrial wasteland to creative hub happened because one company — Two Trees Management, run by David Walentas — bought nearly the entire neighborhood in the 1980s for bargain prices and offered cheap leases to artists. Galleries, studios, and performance spaces filled the warehouses. Then, as always happens, the artists made the neighborhood cool, rents rose, and most of the artists were priced out. It''s the oldest story in urban development, played on fast-forward. The neighborhood now hosts the annual Art Under the Bridge festival and has galleries tucked into former loading docks. St. Ann''s Warehouse, a converted tobacco warehouse on the waterfront, is one of New York''s most acclaimed performance venues. The irony is thick: the artists who made DUMBO desirable now can''t afford to live or work in the neighborhood they created.',
 'One developer bought nearly all of DUMBO in the 1980s and seeded it with artists — who made it too expensive for themselves.',
 'Look at the converted warehouses around you — artists filled these spaces in the 1990s, then were priced out by the neighborhood they created.');

-- ============================================================
-- 8. GREENWICH VILLAGE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/culture (scholarly)
('nyc_greenwich_village', ARRAY['history', 'culture'], 'scholarly',
 'Greenwich Village has been the center of American counterculture for over a century. In the 1910s, it was home to radical publications like The Masses and bohemian figures including Eugene O''Neill, who staged his earliest plays at the Provincetown Playhouse on MacDougal Street. The Beat Generation congregated here in the 1950s — Jack Kerouac and Allen Ginsberg were regulars at the San Remo Cafe on the corner of MacDougal and Bleecker. In the 1960s, Bob Dylan played his first New York shows at Gerde''s Folk City on West 4th Street. The Stonewall Inn on Christopher Street was the site of the June 1969 uprising that launched the modern LGBTQ+ rights movement. The Village''s irregular street grid — it predates Manhattan''s 1811 grid plan — physically embodies its resistance to conformity.',
 'Greenwich Village''s streets predate the Manhattan grid — even the urban plan embodies nonconformity.',
 'Notice how the streets here don''t follow the grid — the Village''s irregular layout predates Manhattan''s 1811 plan.'),

-- Story 2: music/local-life (casual)
('nyc_greenwich_village', ARRAY['music', 'local-life'], 'casual',
 'The Village is where Bob Dylan went electric, where Jimi Hendrix jammed at the Cafe Wha?, and where the New York punk scene was born at CBGB on the Bowery. Bleecker Street between Sixth and Seventh avenues was the folk music capital of the world in the early 1960s. The Bitter End, which is still open, hosted Dylan, Joni Mitchell, Nina Simone, and Bill Cosby. The Blue Note jazz club on West 3rd books world-class acts nightly and charges accordingly. For something cheaper, hit Smalls Jazz Club on West 10th — it''s in a basement, the cover is reasonable, and the late sets go past midnight. The Village Vanguard on Seventh Avenue South has been running since 1935 and has live recordings that are essential jazz history. If you care about live music at all, this neighborhood is sacred ground.',
 'The Bitter End on Bleecker hosted Dylan, Joni Mitchell, and Nina Simone — it''s still booking acts today.',
 'Walk down Bleecker Street between Sixth and Seventh — the clubs that shaped folk, jazz, and punk are still within a few blocks.'),

-- Story 3: history/myths (dramatic)
('nyc_greenwich_village', ARRAY['history', 'myths'], 'dramatic',
 'In the early hours of June 28, 1969, police raided the Stonewall Inn on Christopher Street — a routine harassment of a gay bar. But that night, the patrons fought back. Marsha P. Johnson, a Black transgender woman, and Stormie DeLarverie, a biracial lesbian, were among those who resisted. The confrontation escalated into six days of protests that spread through the Village. The Stonewall uprising didn''t start the LGBTQ+ rights movement — organizations like the Mattachine Society had existed since the 1950s — but it electrified it. Within two years, gay rights organizations had been founded in every major American city. The Stonewall Inn was designated a National Monument in 2016. The small triangular park across the street now holds statues of same-sex couples. Stand there and watch people lay flowers. It still matters.',
 'The Stonewall uprising in 1969 didn''t start the LGBTQ+ movement, but it electrified it into a national force.',
 'Find the Stonewall Inn on Christopher Street — the small park opposite holds statues and flowers that visitors still leave daily.'),

-- Story 4: architecture/food (witty)
('nyc_greenwich_village', ARRAY['architecture', 'food'], 'witty',
 'The Village has a street that crosses itself. West 4th Street and West 10th Street intersect, which makes no geometric sense until you realize the Village grid angles differently from the rest of Manhattan. GPS breaks down here. Taxi drivers curse. It''s the only neighborhood where you can walk north and end up going west. The food situation is equally disorienting in the best way. Joe''s Pizza on Carmine Street has been selling dollar slices since 1975 and has a legitimate claim to the best plain slice in the city. Mamoun''s Falafel on MacDougal has been open since 1971 and the line is always worth it. The intersection of Bleecker and MacDougal is basically a hall of fame for affordable eating. Just avoid anything with a "famous original" sign — if they have to tell you, it probably isn''t.',
 'West 4th Street and West 10th Street intersect in the Village — a geometric impossibility that breaks GPS and infuriates taxi drivers.',
 'Stand at the corner of West 4th and look at the street signs — the Village grid defies Manhattan''s logic in every direction.');

-- ============================================================
-- 9. 9/11 MEMORIAL
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_911_memorial', ARRAY['history', 'architecture'], 'scholarly',
 'The 9/11 Memorial occupies the exact footprints of the original Twin Towers. Designed by architect Michael Arad and landscape architect Peter Walker, the memorial features two recessed pools — each nearly an acre in size — where water cascades 30 feet into a central void. The falling water creates a sound barrier that muffles the city noise, so as you approach, the urban soundscape gradually fades. The names of the 2,977 victims are inscribed on bronze parapets surrounding the pools, arranged not alphabetically but by "meaningful adjacency" — people who knew each other, worked together, or were related are grouped together. Families were consulted on every placement. The adjacent museum descends seven stories to the original bedrock and contains artifacts including the last structural column removed from the site, still covered in messages from recovery workers.',
 'The 2,977 names are arranged by meaningful adjacency — people who knew each other are inscribed side by side.',
 'Stand at the edge of a pool and read the names — they''re grouped by relationship, not alphabetically, so colleagues and friends remain together.'),

-- Story 2: culture/local-life (casual)
('nyc_911_memorial', ARRAY['culture', 'local-life'], 'casual',
 'The memorial plaza is open to the public daily and doesn''t require tickets. The museum does. What most visitors don''t realize is that the 400 swamp white oak trees on the plaza were specifically chosen because they change with the seasons — bare in winter, green in summer, golden in autumn — so the memorial looks different every time you visit. One tree is different from the rest: the Survivor Tree, a Callery pear that was pulled from the rubble barely alive in October 2001, nursed back to health in a Bronx park for a decade, and replanted at the memorial in 2010. It''s smaller than the oaks and has a distinctive shape. New Yorkers have a complicated relationship with the site. Many avoid it. Some come regularly. The memorial works because it gives you space to feel whatever you feel without telling you what that should be.',
 'The Survivor Tree was pulled from the rubble barely alive and nursed back to health for a decade before replanting.',
 'Find the Callery pear tree that''s smaller and shaped differently from the oaks — it''s the Survivor Tree, rescued from the rubble in 2001.'),

-- Story 3: history/art (dramatic)
('nyc_911_memorial', ARRAY['history', 'art'], 'dramatic',
 'On the morning of September 11, 2001, the first plane struck the North Tower at 8:46 AM. The second hit the South Tower at 9:03 AM. The South Tower collapsed at 9:59 AM, the North Tower at 10:28 AM. In 102 minutes, 2,977 people from 93 nations were killed in the deadliest terrorist attack in history. The site burned for 99 days. Recovery work continued for eight months. Firefighters and first responders who worked the pile have since suffered devastating rates of cancer and respiratory illness — the toxic dust contained asbestos, lead, and pulverized concrete. The Tribute in Light, two columns of 88 searchlights that echo the towers'' silhouette, appears every September 11th and is visible for 60 miles. It was originally temporary. Like so much about this place, the temporary became permanent because people needed it to be.',
 'The Tribute in Light was meant to be temporary — it became permanent because people needed it to exist.',
 'On September 11th evenings, look south for the Tribute in Light — two columns visible for 60 miles, echoing the towers'' silhouette.'),

-- Story 4: architecture/photography (witty)
('nyc_911_memorial', ARRAY['architecture', 'photography'], 'witty',
 'One World Trade Center, the tower that rises beside the memorial, is exactly 1,776 feet tall — a deliberate reference to the year of American independence. The architect David Childs designed the building''s base as a 200-foot concrete and steel fortification, and the tower''s form tapers as it rises, creating eight isosceles triangles that catch light differently throughout the day. The observation deck on floors 100 through 102 offers views across all five boroughs and into New Jersey. But the most powerful view isn''t from the top — it''s from ground level, standing at the memorial pool and looking up at the tower rising directly overhead. The scale shift from the sunken void to the ascending spire is intentional. Arad designed the memorial to pull your gaze down; Childs designed the tower to pull it back up. The architecture is having a conversation about grief and resilience, and it''s doing it without a single word.',
 'One World Trade stands at 1,776 feet — the memorial pulls your gaze down while the tower pulls it back up.',
 'Stand at the pool''s edge and look straight up at One World Trade — the shift from sunken void to ascending spire is a deliberate conversation.');

-- ============================================================
-- 10. FLATIRON BUILDING
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_flatiron', ARRAY['history', 'architecture'], 'scholarly',
 'The Flatiron Building was completed in 1902 and, at 285 feet, was one of the tallest buildings in New York City at the time. Designed by Daniel Burnham in the Beaux-Arts style, its steel frame construction was cutting-edge for the era — the facade of terra cotta and limestone is essentially a curtain wall hung on a skeleton of steel. The building''s triangular footprint, dictated by the acute angle where Broadway crosses Fifth Avenue at 23rd Street, gives it a prow-like northern tip that''s only six feet wide. The name Flatiron came from its resemblance to a clothes iron, and it stuck so thoroughly that the entire surrounding neighborhood is now called the Flatiron District. Burnham''s original name for the building was the Fuller Building, after the construction company that financed it. Almost nobody remembers that.',
 'The Flatiron''s northern tip is only six feet wide — a steel-framed triangle that renamed an entire neighborhood.',
 'Walk to the northern point of the building where Broadway and Fifth Avenue meet — the tip narrows to just six feet.'),

-- Story 2: local-life/photography (casual)
('nyc_flatiron', ARRAY['local-life', 'photography'], 'casual',
 'The Flatiron creates its own weather. The triangular shape funnels wind around the building, creating downdrafts that are noticeably stronger than the surrounding streets. In the early 1900s, men would loiter near the building hoping the wind gusts would lift women''s skirts — police had to shoo them away, reportedly saying "23 skidoo," which may be the origin of that slang phrase, though etymologists argue about it endlessly. Madison Square Park across the street is one of the best lunch spots in Midtown — the original Shake Shack started as a hot dog cart there in 2001 and the permanent kiosk still has a line year-round. For the classic Flatiron photo, stand in the middle of the pedestrian plaza on the north side. The building''s sharp edge fills the frame perfectly. Every photographer from Alfred Stieglitz to random tourists has stood in roughly the same spot.',
 'Men used to loiter here hoping wind gusts would lift skirts — police shooing them away may have coined "23 skidoo."',
 'Stand in the pedestrian plaza on the north side — the building''s sharp edge fills the frame exactly as Stieglitz photographed it.'),

-- Story 3: history/myths (dramatic)
('nyc_flatiron', ARRAY['history', 'myths'], 'dramatic',
 'When the Flatiron was going up, New Yorkers were convinced it would blow over. The building''s narrow profile and extreme height made people genuinely nervous — crowds would gather across the street in Madison Square Park, waiting for the inevitable collapse. It never came, obviously. The steel frame, designed to withstand 100 miles per hour winds, was far stronger than the masonry construction New Yorkers were used to. But the fear was real. Newspapers ran editorials questioning whether such a building should be allowed. The building became a test case for whether steel-framed skyscrapers were safe, and its survival helped convince the public that building tall was possible. Without the Flatiron, the Woolworth Building, the Chrysler Building, and the Empire State Building might have faced far more opposition. Every skyscraper in Manhattan owes this strange little triangle a debt.',
 'Crowds gathered in Madison Square Park expecting the Flatiron to collapse — its survival convinced New York that skyscrapers were safe.',
 'Look at the building from Madison Square Park — this is where skeptical New Yorkers once waited for it to blow over.'),

-- Story 4: art/culture (witty)
('nyc_flatiron', ARRAY['art', 'culture'], 'witty',
 'Alfred Stieglitz photographed the Flatiron Building in 1903, and that image — the building rising through bare winter trees like the prow of a ship — became one of the most iconic photographs in art history. Stieglitz shot it from Madison Square Park during a snowstorm. He later said the building looked like it was "moving toward me like the bow of a monster ocean steamer." Edward Steichen photographed it the same year from roughly the same angle. The two images launched architectural photography as an art form. Today the building has been closed for renovation since 2023 after a complicated sale at auction where the winning bidder failed to pay the 190 million dollar price. The building''s future remains uncertain, which feels oddly appropriate for a structure that people have been predicting the demise of since 1902. The Flatiron has outlasted every doubt about it.',
 'Stieglitz and Steichen both photographed the Flatiron in 1903 — those two images launched architectural photography as an art form.',
 'Stand in Madison Square Park near the bare trees and face the building — you''re roughly where Stieglitz stood in 1903.');

-- ============================================================
-- 11. CHELSEA MARKET
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/food (scholarly)
('nyc_chelsea_market', ARRAY['history', 'food'], 'scholarly',
 'Chelsea Market occupies the former National Biscuit Company factory — Nabisco — where the Oreo cookie was invented in 1912. The factory complex spans an entire city block between Ninth and Tenth Avenues on 15th and 16th Streets. The building was constructed in stages between 1890 and 1930 and at its peak employed thousands of workers producing crackers, cookies, and biscuits. The market conversion, completed in 1997 by developer Irwin Cohen, preserved the industrial character: exposed brick, original steel beams, visible ductwork, and even sections of the old rail spur that delivered supplies. The design philosophy was deliberate roughness — Cohen wanted the space to feel like a factory that happened to contain food vendors rather than a polished retail environment. Google purchased the building in 2018 for 2.4 billion dollars, making it one of the most expensive single-building real estate transactions in New York history.',
 'The Oreo was invented in this building in 1912 — Google bought it for 2.4 billion dollars in 2018.',
 'Look up at the exposed steel beams and brick walls — this was the Nabisco factory where the Oreo cookie was created.'),

-- Story 2: food/local-life (casual)
('nyc_chelsea_market', ARRAY['food', 'local-life'], 'casual',
 'Chelsea Market has about 35 food vendors crammed into a ground-floor concourse that runs the full length of the block. The trick is knowing what to skip. Los Tacos No. 1 usually has the longest line and it''s worth it — the adobada tacos are some of the best in the city. The Lobster Place does excellent raw bar and sushi, which is unexpected in a former cookie factory. Li-Lac Chocolates has been making sweets in the Village since 1923 and their outpost here sells handmade truffles. The upper floors are offices — YouTube and Google employees work above the food hall, which is either motivating or torturous depending on your self-control. On weekdays before noon, the market is manageable. On weekends after 11am, it becomes a slow-motion stampede. Locals do their actual grocery shopping at the smaller vendors near the Tenth Avenue end, where you''ll find artisan bread, cheese, and spices without the crowd.',
 'Google and YouTube employees work upstairs above the food hall — on weekends, the ground floor is a slow-motion stampede.',
 'Head toward the Tenth Avenue end for the quieter vendors — artisan bread, cheese, and spices without the weekend crowds.'),

-- Story 3: culture/art (dramatic)
('nyc_chelsea_market', ARRAY['culture', 'art'], 'dramatic',
 'Chelsea Market sits at the southern end of the High Line, and together they''ve transformed the far west side of Manhattan from a rough meatpacking district into one of the most visited neighborhoods in the city. In the 1990s, the streets around the market were lined with wholesale meat operations — sides of beef hanging in doorways, blood on the cobblestones, refrigerated trucks idling at dawn. Transgender sex workers and underground clubs shared the blocks with the slaughterhouses. The neighborhood had an energy that was equal parts dangerous and electric. The market was one of the first conversions, and it proved that the area''s industrial bones could support a new kind of urban life. The cobblestone streets outside still have the old meatpacking district character, especially in the early morning before the crowds arrive. History leaves a residue you can feel even after the buildings change hands.',
 'In the 1990s, sides of beef hung in doorways on these blocks — the market proved industrial bones could support new life.',
 'Step outside to the cobblestone streets — especially early morning, the meatpacking district''s original character still lingers.'),

-- Story 4: architecture/photography (witty)
('nyc_chelsea_market', ARRAY['architecture', 'photography'], 'witty',
 'The best-kept secret of Chelsea Market is the waterfall. About halfway through the concourse, there''s an indoor waterfall cascading over salvaged industrial pipes and metalwork into a small pool. It was installed by artist Mark di Suvero and is genuinely surprising — you''re walking through a crowded food hall and suddenly there''s a two-story water feature. Most people walk past without registering it because they''re focused on deciding between tacos and lobster rolls. The market''s interior design is a masterclass in productive imperfection. The rough concrete floors, the exposed ceiling infrastructure, the slightly chaotic vendor layout — it all creates an atmosphere that feels discovered rather than designed. That deliberate roughness is actually very expensive to achieve. The 2.4 billion dollar sale price tells you everything: this artfully imperfect food hall sits on some of the most valuable commercial real estate on the planet.',
 'There''s a two-story waterfall in the middle of the food hall — most people walk past it without noticing.',
 'Look for the indoor waterfall about halfway through the concourse — it cascades over salvaged industrial pipes into a pool below.');

-- ============================================================
-- 12. ROCKEFELLER CENTER
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('nyc_rockefeller_center', ARRAY['history', 'architecture'], 'scholarly',
 'Rockefeller Center is a complex of 19 commercial buildings covering 22 acres in Midtown Manhattan, built between 1931 and 1940. John D. Rockefeller Jr. financed the project during the Great Depression, employing 40,000 construction workers at a time when one in four Americans was unemployed. The centerpiece, 30 Rockefeller Plaza — known as 30 Rock — rises 850 feet and was the largest privately funded construction project in modern history at the time. The complex pioneered the concept of the integrated urban development: underground shopping concourses, rooftop gardens, public plazas, and buildings designed to work as an ensemble rather than individual towers. The Art Deco design is consistent throughout, with limestone facades, aluminum spandrels, and decorative programs by over 30 artists. The entire complex was designated a National Historic Landmark in 1987.',
 'Rockefeller Center employed 40,000 workers during the Depression — the largest privately funded construction project of its era.',
 'Look at the limestone and aluminum Art Deco facades surrounding the plaza — 30 artists contributed decorative programs across 19 buildings.'),

-- Story 2: local-life/food (casual)
('nyc_rockefeller_center', ARRAY['local-life', 'food'], 'casual',
 'The skating rink at Rockefeller Center is iconic but absurdly small — it''s about the size of a modest suburban swimming pool, and it was never part of the original plan. It started as a temporary installation in 1936 to draw people to the then-struggling retail concourse below. It worked so well they kept it. In winter, the line to skate can stretch an hour, and the rink holds maybe 150 people at a time, so you''re essentially doing laps in a circle while tourists photograph you from above. The Christmas tree has been a tradition since 1933, when construction workers pooled their money to buy a small tree for the site. Now it''s a 75-to-100-foot Norway Spruce lit with over 50,000 LED lights. The tree-lighting ceremony draws tens of thousands, and Rockefeller Plaza becomes one of the densest pedestrian spaces on Earth for about three hours.',
 'The skating rink was a temporary installation in 1936 to attract shoppers — it''s still there because it worked too well.',
 'Look at the rink below the plaza — it''s surprisingly tiny, about the size of a backyard swimming pool, and it was never supposed to be permanent.'),

-- Story 3: art/history (dramatic)
('nyc_rockefeller_center', ARRAY['art', 'history'], 'dramatic',
 'In 1933, Rockefeller commissioned Diego Rivera to paint a mural in the lobby of 30 Rock titled "Man at the Crossroads." Rivera, a committed communist, included a portrait of Lenin in the composition. Nelson Rockefeller asked him to remove it. Rivera refused. Rockefeller had the unfinished mural covered, then destroyed. Rivera recreated a version in Mexico City''s Palacio de Bellas Artes, where it still exists. The replacement mural in the 30 Rock lobby, by Jose Maria Sert, depicts a safer vision of human progress. The Rivera incident became a defining moment in the debate over artistic freedom versus patron control. Look at the remaining Art Deco artwork throughout the complex — the Atlas statue on Fifth Avenue by Lee Lawrie, the gilded Prometheus in the sunken plaza by Paul Manship — and consider that for every piece that survived, there''s a Diego Rivera that didn''t.',
 'Rockefeller destroyed a Diego Rivera mural because it contained Lenin''s portrait — Rivera recreated it in Mexico City.',
 'Find the gilded Prometheus statue in the sunken plaza — then look toward the lobby of 30 Rock, where a Rivera mural was destroyed.'),

-- Story 4: culture/photography (witty)
('nyc_rockefeller_center', ARRAY['culture', 'photography'], 'witty',
 'Top of the Rock, the observation deck on the 70th floor, offers what many New Yorkers consider a better view than the Empire State Building — because from Top of the Rock, you can actually see the Empire State Building. From the Empire State, you''re on the Empire State, which means the best building in the skyline is the one you''re standing on. The observation deck also gives you Central Park stretching north, the Hudson and East Rivers on both sides, and the full length of Manhattan laid out like a circuit board. The outdoor terrace has no glass barriers, just clear panels, so photographs come out clean. NBC has broadcast from 30 Rock since 1933 — Saturday Night Live, the Tonight Show, and the Today Show all originate from this complex. The Today Show''s street-level studio on 49th Street lets tourists wave at cameras through the glass, which is either charming or dystopian depending on your mood.',
 'Top of the Rock beats the Empire State Building because you can actually see the Empire State Building from here.',
 'Head to the 70th-floor observation deck and look south — the Empire State Building rises in full view, something you can''t see from its own roof.');

-- Verify
