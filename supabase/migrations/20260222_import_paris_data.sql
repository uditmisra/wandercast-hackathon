-- Migration: Import Paris city data and curated stories
-- Idempotent: deletes existing Paris stories before re-importing

DELETE FROM place_stories WHERE place_id LIKE 'paris_%';

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

-- Paris Stories Import
-- 12 places × 4 stories each = 48 curated stories
-- Run AFTER import-paris.sql (which creates the city + places)

-- ============================================================
-- 1. EIFFEL TOWER
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_eiffel_tower', ARRAY['history', 'architecture'], 'scholarly',
 'When Gustave Eiffel''s tower was completed for the 1889 World''s Fair, it was the tallest man-made structure on Earth at 300 metres — a record it held for 41 years until the Chrysler Building surpassed it. The design was largely the work of two engineers in Eiffel''s firm, Maurice Koechlin and Emile Nouguier, who calculated that the tower''s lattice iron structure would distribute wind loads so efficiently that the pressure on any single point would never exceed four kilograms per square centimetre. There are 18,038 individual iron pieces held together by 2.5 million rivets. The entire structure weighs 7,300 tonnes but exerts only four kilograms per square centimetre on the ground — about the same pressure as a person sitting in a chair. It was scheduled for demolition after twenty years but survived because Eiffel mounted a radio antenna on top, making it militarily useful.',
 'The Eiffel Tower was saved from demolition by a radio antenna — it exerts less pressure on the ground than a seated person.',
 'Look at the lattice ironwork at the base — 18,038 individual pieces and 2.5 million rivets, engineered to make wind pass through.'),

-- Story 2: local-life/culture (casual)
('paris_eiffel_tower', ARRAY['local-life', 'culture'], 'casual',
 'So here''s the thing about the Eiffel Tower — Parisians pretend they don''t care about it. They''ll tell you it''s for tourists, that they never look up. But watch what happens at sunset when the lights come on: everyone pauses. Every single time. The sparkle show runs for five minutes every hour on the hour after dark, and it''s technically illegal to photograph because the light display is copyrighted — though nobody enforces it. The best local move is to skip the queues entirely and picnic on the Champ de Mars instead. Grab a bottle of wine, some cheese from rue Cler nearby, and sit on the grass facing the tower. That''s what Parisians actually do on summer evenings. You''ll see couples, families, groups of friends, all spread across the lawn. The tower is better as a backdrop than a destination.',
 'The Eiffel Tower''s sparkle show is technically copyrighted — photographing it after dark is technically illegal.',
 'Spread out on the Champ de Mars lawn facing the tower — grab wine and cheese from rue Cler like the locals do.'),

-- Story 3: history/myths (witty)
('paris_eiffel_tower', ARRAY['history', 'myths'], 'witty',
 'When the tower was announced, 300 of Paris''s most prominent artists and intellectuals signed a petition calling it a "metal asparagus" and a "disgrace to the city." Guy de Maupassant reportedly ate lunch at the tower''s restaurant every day — not because he liked it, but because it was the only place in Paris where he couldn''t see the tower. The irony is thick. In 1925, a con man named Victor Lustig actually sold the Eiffel Tower for scrap metal. Twice. He posed as a government official, convinced a scrap dealer the tower was being demolished, collected a suitcase of cash, and fled to Vienna. The dealer was so embarrassed he never reported it, so Lustig came back and sold it again to a different buyer. The second victim did go to the police, but by then Lustig was long gone.',
 'A con man sold the Eiffel Tower for scrap metal — twice — and one victim was too embarrassed to call the police.',
 'Look up and imagine this whole thing being sold for scrap — Victor Lustig pulled it off twice in 1925.'),

-- Story 4: art/photography (dramatic)
('paris_eiffel_tower', ARRAY['art', 'photography'], 'dramatic',
 'On a clear day, the tower is visible from nearly every elevated point in Paris — it anchors the city the way a cathedral spire once did. But the most powerful moment is at dusk, that window of about fifteen minutes when the sky turns violet and the iron lattice goes from grey to gold to silhouette. The tower was never meant to be beautiful. Eiffel was an engineer, not an artist. He designed bridges and viaducts. The curves at the base aren''t decorative — they follow the mathematical profile of wind resistance. And yet those curves made it the most sketched, painted, and photographed structure in human history. Delaunay painted it fractured into prisms. Seurat dotted it into pointillist mist. Brassai photographed it at night and turned iron into light. Stand at the Trocadero across the river for the most dramatic view — the tower framed by the curved wings of the Palais de Chaillot, reflected in the long fountain pools below.',
 'Eiffel''s curves are pure wind engineering — yet they made the tower the most painted structure in history.',
 'Cross to the Trocadero for the definitive view — the tower framed by the Palais de Chaillot with fountain pools reflecting it.');

-- ============================================================
-- 2. NOTRE-DAME CATHEDRAL
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_notre_dame', ARRAY['history', 'architecture'], 'scholarly',
 'Construction began in 1163 under Bishop Maurice de Sully and wasn''t completed until roughly 1345 — nearly two centuries of continuous building. Notre-Dame was one of the first cathedrals to use flying buttresses, those arched exterior supports that transfer the weight of the vaulted ceiling outward, allowing the walls to be thinner and the windows larger. The rose windows are among the oldest and largest in Europe: the north rose dates to about 1250 and is thirteen metres in diameter. The April 2019 fire destroyed the Victorian-era spire designed by Viollet-le-Duc and most of the oak roof frame, which was built from roughly 1,300 oak trees — each beam from a different tree. The five-year restoration that followed used medieval techniques alongside laser scanning, reopening the cathedral in December 2024.',
 'Notre-Dame took 182 years to build — the 2019 fire destroyed a roof frame made from 1,300 individual oak trees.',
 'Look at the flying buttresses along the south side — they were engineering breakthroughs that made the rose windows possible.'),

-- Story 2: local-life/culture (casual)
('paris_notre_dame', ARRAY['local-life', 'culture'], 'casual',
 'Before the 2019 fire, most Parisians took Notre-Dame completely for granted. It was the background of their commute, the thing tourists photographed while blocking the bridges. Then the spire fell on live television, and the whole city stopped. People stood on the banks of the Seine and cried — people who hadn''t been inside the cathedral in decades. It revealed something Parisians don''t always admit: the building matters to them deeply, not as a church necessarily, but as a fixed point. It''s been there through revolutions, wars, occupations. The restoration brought craftspeople from across France — stone carvers, lead workers, oak framers using medieval joinery. If you visit the interior now, the cleaned stonework is startlingly bright. Centuries of candle soot are gone. It looks the way medieval worshippers would have seen it.',
 'The 2019 fire made Parisians cry for a building they hadn''t entered in decades — the restoration revealed medieval brightness.',
 'Step back to the parvis square and look at the facade — the cleaned stone after restoration is brighter than it''s been in centuries.'),

-- Story 3: architecture/myths (dramatic)
('paris_notre_dame', ARRAY['architecture', 'myths'], 'dramatic',
 'The gargoyles are not decorative. They''re functional rainwater spouts — water collects on the roof, channels through the stone grotesques, and shoots out through their open mouths, keeping moisture away from the walls. The chimeras on the gallery — the famous brooding figures you see in photographs, including the one resting its chin on its hands — were added by Viollet-le-Duc during his 19th-century restoration. They''re Victorian, not medieval. Viollet-le-Duc essentially reimagined what he thought the cathedral should have looked like, and his version became the one the world associates with Notre-Dame. The original medieval builders left no chimeras. The most photographed element of Notre-Dame was invented by a 19th-century architect filling in what he felt was missing. History and fiction, fused in stone.',
 'The famous brooding chimeras aren''t medieval — a Victorian architect invented them because he felt they were missing.',
 'Look up at the gallery between the towers — those brooding figures resting their chins on their hands are Victorian additions.'),

-- Story 4: art/music (witty)
('paris_notre_dame', ARRAY['art', 'music'], 'witty',
 'Victor Hugo essentially saved this building with a novel. By the 1830s, Notre-Dame was in such disrepair that the city was considering demolishing it. Hugo published The Hunchback of Notre-Dame in 1831, deliberately making the cathedral the real protagonist — not Quasimodo. Public sentiment shifted so dramatically that the government funded a full restoration. Hugo weaponised fiction to save architecture. The cathedral''s organ has 8,000 pipes and survived the 2019 fire intact, though coated in lead dust from the melted roof. It took years to clean each pipe individually. The organ had been in continuous use since the 15th century. During the Revolution, the cathedral was rededicated to the Cult of Reason, the organ played secular music, and the building was used as a wine warehouse. Notre-Dame has survived everything Paris has thrown at it.',
 'Victor Hugo wrote a novel specifically to stop Paris from demolishing Notre-Dame — the cathedral was the real protagonist.',
 'Face the west facade and imagine it crumbling in the 1830s — Hugo''s novel shamed Paris into saving what you see today.');

-- ============================================================
-- 3. LOUVRE MUSEUM
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_louvre', ARRAY['history', 'architecture'], 'scholarly',
 'The Louvre began as a 12th-century fortress built by Philip II in 1190 to protect Paris from Viking raids along the Seine. You can still see the medieval foundations in the basement — a circular keep and thick defensive walls that predate every painting in the collection by centuries. The fortress became a royal palace under Charles V in the 1360s, expanded dramatically under Francis I in the 1540s in the Renaissance style, and continued growing for the next three centuries. I.M. Pei''s glass pyramid, added in 1989, caused outrage comparable to the Eiffel Tower — critics called it an insult to French heritage. Today it receives ten million visitors per year, making it the most visited museum in the world. The collection contains over 380,000 objects, of which roughly 35,000 are on display at any time.',
 'The Louvre started as a Viking-defense fortress in 1190 — the medieval walls are still visible in the basement.',
 'Look at the contrast between the Renaissance stone facades and Pei''s glass pyramid — 800 years of architecture in one courtyard.'),

-- Story 2: local-life/food (casual)
('paris_louvre', ARRAY['local-life', 'food'], 'casual',
 'Here''s the local hack for the Louvre: don''t use the pyramid entrance. The Passage Richelieu entrance on the north side or the Carrousel du Louvre entrance underground from the shopping mall both have shorter lines. And honestly, most Parisians will tell you the best thing about the Louvre isn''t inside — it''s the Tuileries Garden just west of here. Grab a crepe from a vendor on rue de Rivoli, walk into the gardens, find one of those green metal chairs by the octagonal basin, and sit. That''s a Parisian afternoon. If you do go inside, skip the Mona Lisa crowd and head straight for the Winged Victory of Samothrace on the staircase — it''s more impressive, less mobbed, and you can actually stand in front of it for more than three seconds without being elbowed.',
 'Skip the pyramid queue — locals use the Passage Richelieu entrance and head for the Winged Victory instead of the Mona Lisa.',
 'Look north toward the Passage Richelieu entrance — shorter lines — then west toward the Tuileries for the real Parisian experience.'),

-- Story 3: art/history (dramatic)
('paris_louvre', ARRAY['art', 'history'], 'dramatic',
 'On the night of August 27, 1939, with war looming, the Louvre began the largest art evacuation in history. Over three days, staff packed the entire collection — including the Mona Lisa, the Winged Victory, and the Venus de Milo — into wooden crates and loaded them onto convoys of trucks. The Mona Lisa was given her own ambulance, padded with red velvet. She spent the war hidden in a series of chateaux across the Loire Valley, moving each time the Germans got close. The Louvre itself was used by the Nazis as a sorting depot for art looted from Jewish families — the Jeu de Paume gallery nearby became the central hub. Rose Valland, a French curator, secretly recorded every stolen piece, and her notes helped recover thousands of works after liberation.',
 'The Mona Lisa fled Paris in a velvet-lined ambulance in 1939 — a secret curator tracked every painting the Nazis stole.',
 'Stand in the Cour Napoleon and imagine it empty — in 1939, the entire collection was evacuated in three days.'),

-- Story 4: culture/photography (witty)
('paris_louvre', ARRAY['culture', 'photography'], 'witty',
 'The Mona Lisa is 77 by 53 centimetres. That''s roughly the size of a laptop screen. Every year, roughly six million people queue for up to an hour to spend an average of fifteen seconds looking at it through bulletproof glass while holding their phones above the crowd. The painting has been stolen once — in 1911, by an Italian handyman named Vincenzo Peruggia, who simply hid in a closet overnight and walked out with it under his coat. It was missing for two years. Pablo Picasso was briefly a suspect. The theft actually made the painting famous — before 1911, it was respected but not the global icon it became. The Louvre''s gift shop sells more Mona Lisa merchandise than any other item. You can buy her on mugs, socks, fridge magnets, and chocolate. Leonardo would have had opinions about the socks.',
 'The Mona Lisa is the size of a laptop screen — Picasso was briefly suspected when it was stolen in 1911.',
 'Face the pyramid and picture the crowd inside — six million people a year queue to spend fifteen seconds with a painting smaller than a suitcase.');

-- ============================================================
-- 4. SACRE-COEUR
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_sacre_coeur', ARRAY['history', 'architecture'], 'scholarly',
 'Sacre-Coeur was built as an act of political penance. After France''s humiliating defeat in the Franco-Prussian War of 1870 and the bloody suppression of the Paris Commune in 1871 — where tens of thousands were killed — the National Assembly voted in 1873 to build a basilica to "expiate the crimes of the Commune." The site was deliberately chosen: Montmartre was where the Commune had begun. Construction took from 1875 to 1914, and the Romano-Byzantine design by Paul Abadie was controversial from the start — critics saw it as a monument to conservative revenge, not spiritual devotion. The travertine limestone was chosen specifically because it exudes calcite when wet, meaning the building actually whitens itself in rain. Unlike most Parisian buildings, Sacre-Coeur gets brighter with age.',
 'Sacre-Coeur was built as political penance for the Commune massacre — its stone whitens itself in the rain.',
 'Look at the brilliant white stone — it''s travertine that exudes calcite when wet, making the basilica brighter with every rainfall.'),

-- Story 2: local-life/culture (casual)
('paris_sacre_coeur', ARRAY['local-life', 'culture'], 'casual',
 'The steps in front of Sacre-Coeur are basically the city''s living room. On any warm evening, hundreds of people sit on these stairs drinking wine, playing guitar, watching the sunset over Paris. It''s one of the best free shows in the city. The view from here covers everything — you can see the Eiffel Tower, the Pantheon, the skyscrapers of La Defense in the distance. But you have to navigate the string-bracelet guys first. They''ll try to tie a friendship bracelet on your wrist and then ask for money. Just keep your hands in your pockets and walk past — every Parisian has learned this move by age twelve. Inside the basilica there''s a massive mosaic on the ceiling that''s one of the largest in the world, but most people never look up because they''re too busy with the view outside.',
 'The steps are Paris''s living room at sunset — keep your hands in your pockets to dodge the bracelet sellers.',
 'Sit on the steps facing south and take in the panorama — Eiffel Tower on your right, Pantheon centre-left, La Defense in the distance.'),

-- Story 3: history/myths (dramatic)
('paris_sacre_coeur', ARRAY['history', 'myths'], 'dramatic',
 'In March 1871, the Paris Commune — a radical socialist government — rose to power on this very hill. The spark was two cannons that the National Guard had stationed on Montmartre to keep them from the Prussians. When the French government sent troops to seize the cannons, local women surrounded the soldiers and refused to move. The troops mutinied, two generals were shot, and Paris erupted into revolution. For seventy-two days, the Commune ran the city — free education, workers'' rights, separation of church and state. Then the French army retook Paris in the "Bloody Week" of May 1871. Between 10,000 and 20,000 Communards were killed, many executed against the walls of Pere Lachaise Cemetery. Sacre-Coeur was built directly over the ground where the revolution began. The basilica was, and remains, a contested symbol.',
 'The revolution that tore Paris apart started on this exact hillside — the basilica was built directly over it.',
 'You''re standing where the Paris Commune began in 1871 — the cannons were stationed on this hilltop before the uprising.'),

-- Story 4: photography/art (witty)
('paris_sacre_coeur', ARRAY['photography', 'art'], 'witty',
 'Sacre-Coeur has a problem that most buildings would envy: it''s too photogenic. The white domes against a blue sky, the sweeping steps, the panoramic view — it practically photographs itself. But here''s the thing photographers know: the building faces south, which means the facade is front-lit all day. No dramatic shadows, no moody contrasts. It''s architecturally flat in photos. The trick is to shoot it from below at dusk when the floodlights create depth, or from the side streets of Montmartre where the dome peeks above the rooftops. Utrillo painted this neighborhood obsessively — his white-washed buildings and winding streets defined how the world pictures Montmartre. He was an alcoholic who started painting as therapy at age eighteen. His mother Suzanne Valadon was also a painter and had modelled for Renoir and Toulouse-Lautrec. Montmartre runs on that kind of layered artistic biography.',
 'Sacre-Coeur is too photogenic for its own good — the trick is to shoot it from the side streets, not straight on.',
 'Turn around and look into the narrow streets behind you — those winding lanes are the Montmartre that Utrillo painted obsessively.');

-- ============================================================
-- 5. SAINTE-CHAPELLE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_sainte_chapelle', ARRAY['history', 'architecture'], 'scholarly',
 'Louis IX built Sainte-Chapelle between 1242 and 1248 to house what he believed were the Crown of Thorns and a fragment of the True Cross — relics he purchased from the Latin Emperor of Constantinople for 135,000 livres, roughly three times what the chapel itself cost to build. The container was more expensive than its contents'' housing. The upper chapel is essentially a glass cage: fifteen stained-glass windows, each fifteen metres tall, containing 1,113 individual scenes from the Bible. The stone walls between the windows are so thin they function more as mullions than as load-bearing structure. The engineering is extreme — the iron tie rods hidden within the walls are doing most of the structural work. When sunlight hits these windows, the upper chapel fills with coloured light so intense that visitors in the 13th century described it as stepping inside a jewel.',
 'The relics cost three times more than the chapel that houses them — 1,113 biblical scenes in fifteen glass walls.',
 'Look up at the fifteen windows rising to the ceiling — the stone between them is barely structural, iron tie rods do the real work.'),

-- Story 2: local-life/culture (casual)
('paris_sainte_chapelle', ARRAY['local-life', 'culture'], 'casual',
 'Sainte-Chapelle is one of those places Parisians send visitors when they want to genuinely impress them — not just check a box. It''s tucked inside the Palais de Justice complex, so you walk through courthouse security to reach a medieval chapel, which is a very Parisian experience. The lower chapel is dark and low-ceilinged, and most people rush through it. Don''t. The painted columns and ceiling down here are beautiful in their own right. But the upper chapel is the knockout. Go on a sunny afternoon — the west-facing windows catch the light and the whole space turns into a kaleidoscope. Evening concerts are held here regularly, and the acoustics are extraordinary because the glass walls vibrate slightly, adding a shimmer to the sound. Book in advance. Sit in the middle for the full effect. It''s one of the most underrated experiences in Paris.',
 'You walk through courthouse security to reach a 13th-century jewel box — go on a sunny afternoon for the full kaleidoscope.',
 'Enter through the lower chapel first — it''s dark and easy to rush, but look up at the painted ceiling before climbing to the light.'),

-- Story 3: art/history (dramatic)
('paris_sainte_chapelle', ARRAY['art', 'history'], 'dramatic',
 'During the French Revolution, Sainte-Chapelle came within days of being demolished. The revolutionaries saw it as a symbol of monarchical excess — a king spending a fortune on religious relics while the people starved. The relics were removed and scattered, the spire was torn down, and the chapel was converted into a flour warehouse, then a government archive. Clerks stacked filing cabinets against the stained glass. For decades, those 1,113 biblical scenes were hidden behind bureaucratic furniture. The restoration didn''t begin until the 1840s, and it took over twenty years. Some panels had been damaged beyond repair and were painstakingly recreated by craftsmen studying the surviving sections. About two-thirds of the glass you see today is original 13th-century work. The rest is 19th-century restoration so skilled that experts still debate which panels are which.',
 'Revolutionaries turned this chapel into a flour warehouse — filing cabinets hid the stained glass for decades.',
 'Try to spot the difference between 13th-century and 19th-century glass panels — experts still argue about which is which.'),

-- Story 4: architecture/music (witty)
('paris_sainte_chapelle', ARRAY['architecture', 'music'], 'witty',
 'Here''s a detail that most visitors miss: Sainte-Chapelle was never meant for the public. The upper chapel was exclusively for the king and his inner circle. Ordinary people were restricted to the lower chapel, which has a ceiling so low it feels like a crypt. The entire building is a hierarchy made physical — heaven above for the powerful, a dark cramped space below for everyone else. Louis IX, for all his saintliness (he was canonised in 1297), had a clear sense of who deserved the pretty windows. The chapel also has a peculiar acoustic property: sound in the upper chapel carries with almost no decay, which is why the classical concerts held here sound impossibly clear. The glass walls act as reflectors rather than absorbers. A chapel designed to display sacred relics accidentally became one of the finest concert halls in Paris.',
 'The upper chapel was strictly for the king — ordinary people got the dark basement. Louis the Saint knew his hierarchy.',
 'Listen to the silence in the upper chapel — the glass walls reflect sound with almost no decay, making it an accidental concert hall.');

-- ============================================================
-- 6. MUSEE D'ORSAY
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_musee_dorsay', ARRAY['history', 'architecture'], 'scholarly',
 'The building was the Gare d''Orsay, a railway terminus designed by Victor Laloux for the 1900 World''s Fair. It served the Paris-Orleans line, but by the 1930s, the platforms were too short for modern electric trains and the station was gradually abandoned. It served as a mailing centre during the war, a set for Orson Welles'' film adaptation of The Trial in 1962, and a temporary auction house before President Giscard d''Estaing decided in 1977 to convert it into a museum dedicated to art from 1848 to 1914 — bridging the gap between the Louvre and the Centre Pompidou. The Italian architect Gae Aulenti designed the interior conversion, threading gallery spaces through the original steel and glass vault. The great clock on the fifth floor still works, and looking through it gives you one of the most celebrated views in Paris — the Seine and Montmartre framed in a circle of Roman numerals.',
 'The building was abandoned because platforms were too short for modern trains — Orson Welles filmed here before it became a museum.',
 'Look up at the iron and glass vault overhead — that''s the original 1900 train station ceiling, now sheltering Impressionists.'),

-- Story 2: art/culture (casual)
('paris_musee_dorsay', ARRAY['art', 'culture'], 'casual',
 'The Musee d''Orsay is where the Impressionists live, and it''s the perfect size — big enough to hold the greatest collection of Impressionist and Post-Impressionist art in the world, small enough that you won''t collapse from museum fatigue. The top floor is where you want to go first. Monet''s water lilies, Renoir''s dancing couples, Degas'' ballet dancers, Van Gogh''s bedroom at Arles — they''re all up there, bathed in natural light from the roof. Here''s the insider move: go on a Thursday evening when the museum is open late. The crowds thin out after 6pm and you can actually stand in front of a Cezanne without someone''s selfie stick in your peripheral vision. The cafe behind the clock on the fifth floor serves decent coffee with that famous clock-face view. Sit there and pretend you''re in a film. Everyone does.',
 'Thursday evenings are the secret — crowds thin after 6pm and you get the Impressionists almost to yourself.',
 'Head straight to the top floor for the Impressionists — then find the cafe behind the great clock for the view.'),

-- Story 3: art/history (dramatic)
('paris_musee_dorsay', ARRAY['art', 'history'], 'dramatic',
 'In 1874, a group of painters who had been systematically rejected by the official Paris Salon held their own exhibition in a photographer''s studio on Boulevard des Capucines. Claude Monet showed a painting called Impression, Sunrise. A hostile critic seized on the title and called the whole group "Impressionists" — intending it as an insult. The name stuck. Those rejected painters — Monet, Renoir, Degas, Pissarro, Cezanne, Morisot — are now the most valuable and beloved artists in Western history, and their work fills the top floor of this building. The Salon jury that rejected them has been forgotten entirely. The Musee d''Orsay is, in a sense, history''s correction — a grand building dedicated to art that the establishment declared worthless. Every painting on that top floor was once considered a failure.',
 'Every Impressionist masterpiece upstairs was once rejected as worthless — the word "Impressionist" was meant as an insult.',
 'Face the building and imagine the Salon jury turning away Monet, Renoir, and Cezanne — their revenge is the entire top floor.'),

-- Story 4: photography/architecture (witty)
('paris_musee_dorsay', ARRAY['photography', 'architecture'], 'witty',
 'The great clock on the fifth floor is the single most Instagrammed object in the museum, which is saying something for a building full of Monets. People queue to stand behind the translucent face and take a silhouette photo with Montmartre visible through the Roman numerals. The museum staff have given up trying to manage it — they just let the queue form naturally. What most people don''t know is that there''s a second, smaller clock on the other side of the building that nobody photographs because it faces a less scenic direction. Same clock, same design, zero queue. That asymmetry of fame is very Orsay. The building itself is a lesson in repurposing — the platforms where trains once idled now hold sculpture. The departure board is gone but the ironwork that held it remains. A train station that failed at being a train station became the most beloved museum in Paris. Not a bad second act.',
 'There''s an identical clock on the other side with zero queue — same view, different direction, no waiting.',
 'Find the great clock on the fifth floor and look through it — Sacre-Coeur and Montmartre are framed in Roman numerals.');

-- ============================================================
-- 7. PERE LACHAISE CEMETERY
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/culture (scholarly)
('paris_pere_lachaise', ARRAY['history', 'culture'], 'scholarly',
 'Pere Lachaise opened in 1804, and initially nobody wanted to be buried here — it was too far from the city centre. To solve this, the authorities staged a marketing coup: they exhumed the remains of La Fontaine and Moliere and reinterred them here with great ceremony. The strategy worked immediately. Within years, the cemetery became the most prestigious burial ground in Paris. Today it holds over one million burials across 44 hectares, making it one of the densest concentrations of notable dead in the world. Oscar Wilde, Chopin, Edith Piaf, Jim Morrison, Marcel Proust, Gertrude Stein, and Balzac all rest here. The layout was designed by Alexandre-Theodore Brongniart as a landscaped garden in the English style — rolling paths, mature trees, and deliberate asymmetry, breaking with the rigid geometry of traditional French cemeteries.',
 'Nobody wanted to be buried here until they staged Moliere''s reburial — over a million people followed him in.',
 'Follow the winding main avenue uphill — the English-style landscape was designed to break with rigid French cemetery geometry.'),

-- Story 2: music/local-life (casual)
('paris_pere_lachaise', ARRAY['music', 'local-life'], 'casual',
 'Jim Morrison''s grave is the most visited spot in the cemetery, which would have amused and probably annoyed the people buried nearby, including several French marshals and a few members of the Rothschild family. Morrison''s grave is modest — a flat stone with a Greek inscription meaning "true to his own spirit." Fans leave notes, flowers, guitar picks, and occasionally whiskey bottles, which the groundskeepers quietly remove. The grave used to be surrounded by graffiti on neighbouring tombs until the cemetery installed barriers. Chopin''s grave, further along, attracts a different crowd — quieter, more reflective, sometimes leaving single flowers. Edith Piaf''s grave is always covered in metro tickets and lipstick-kissed notes. Each famous grave creates its own little subculture. The cemetery is basically a city of the dead with its own neighborhoods and social dynamics.',
 'Morrison, Chopin, and Piaf each attract different subcultures — guitar picks, single roses, and lipstick-kissed notes.',
 'Head east on the main path and follow the signs to Morrison — then loop north to Chopin and southwest to Piaf.'),

-- Story 3: history/myths (dramatic)
('paris_pere_lachaise', ARRAY['history', 'myths'], 'dramatic',
 'In the final days of the Paris Commune in May 1871, the last 147 Communards were lined up against the eastern wall of Pere Lachaise and shot by government troops. The Mur des Federes — the Communards'' Wall — still stands and has become one of the most politically charged memorial sites in France. Every year on the anniversary, thousands march to this wall. It''s not just a memorial; it''s a declaration. The Commune lasted only 72 days, but the massacre at this wall became a founding symbol for socialist and labour movements worldwide. Stand at the wall and you''ll see fresh flowers, red flags, and handwritten notes. The cemetery is a place of celebrity graves and tourist maps, but this corner belongs to a different history — one of working-class Paris, political violence, and the refusal to forget.',
 'The last 147 Communards were executed against the east wall in 1871 — thousands still march here every year.',
 'Walk to the far eastern edge of the cemetery to the Mur des Federes — the bullet marks and fresh flowers tell the story.'),

-- Story 4: art/photography (witty)
('paris_pere_lachaise', ARRAY['art', 'photography'], 'witty',
 'Oscar Wilde''s tomb is a massive Art Deco sphinx carved by Jacob Epstein in 1914, and for years it was covered in lipstick kisses. Visitors would apply fresh lipstick and plant a kiss on the stone, which sounds romantic until you learn that the grease was slowly dissolving the surface. In 2011, the tomb was cleaned and a glass barrier was installed, which solved the erosion problem and created a new tradition: people now kiss the glass instead. Epstein''s sphinx was originally anatomically complete, and the story goes that a pair of English ladies were so offended by a certain detail that one of them chipped it off with an umbrella and used it as a paperweight. The cemetery authorities have never confirmed this, which makes it almost certainly true. Wilde, who famously said "I have nothing to declare except my genius," would have appreciated every detail of this ongoing circus.',
 'Wilde''s tomb was being dissolved by lipstick kisses — a glass barrier now protects it from admirers.',
 'Find the Art Deco sphinx — the glass barrier is covered in fresh lipstick prints, and the stone behind it is finally healing.');

-- ============================================================
-- 8. LUXEMBOURG GARDENS
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/nature (scholarly)
('paris_luxembourg_gardens', ARRAY['history', 'nature'], 'scholarly',
 'The Luxembourg Gardens were created in 1612 for Marie de Medici, who commissioned the adjacent Luxembourg Palace as a residence that would remind her of the Palazzo Pitti in Florence. The garden design blends Italian and French formal styles: the central parterre with its geometric flower beds and octagonal basin is classic French, while the Medici Fountain grotto to the east reflects Marie''s Italian origins. The gardens cover 23 hectares and contain 106 statues, including a series of French queens and illustrious women ringing the central basin — added in the 19th century. The apple and pear orchard in the southern section has been cultivated since the 17th century and still produces fruit. The beekeeping school near the orchard, established in 1856, is one of the oldest in France and still trains urban beekeepers every summer.',
 'A Florentine queen created these gardens to cure her homesickness — the 17th-century orchard still produces fruit.',
 'Look for the Medici Fountain grotto to the east — Marie de Medici wanted a piece of Florence in Paris.'),

-- Story 2: local-life/culture (casual)
('paris_luxembourg_gardens', ARRAY['local-life', 'culture'], 'casual',
 'The green metal chairs are the whole point of Luxembourg Gardens. Unlike most parks where the benches are bolted down, these chairs are free-standing — you drag them wherever you want. That freedom is sacred to Parisians. You''ll see people arranging them into circles for group conversations, angling them to catch the sun, pulling them under trees for shade, or positioning them at the exact distance from strangers that says "alone but not lonely." It''s a social choreography that happens without a word. The toy sailboats on the octagonal basin have been a tradition since the 1920s — kids rent them for a few euros and push them across with sticks. Old men play petanque near the south side. Students from the Sorbonne study on the lawns (technically forbidden, universally tolerated). The gardens close at sunset, and the guards blow whistles to clear everyone out. It''s surprisingly effective.',
 'The moveable green chairs are sacred — Parisians choreograph their social lives by dragging them into position.',
 'Grab a green metal chair and drag it wherever you like — that freedom is the defining feature of these gardens.'),

-- Story 3: art/history (dramatic)
('paris_luxembourg_gardens', ARRAY['art', 'history'], 'dramatic',
 'During the German occupation of Paris from 1940 to 1944, the Luxembourg Palace became the headquarters of the Luftwaffe in France. German officers walked these paths. Anti-aircraft guns were positioned in the gardens. The palace that Marie de Medici built for beauty became a command centre for aerial bombardment. When the Allies liberated Paris in August 1944, some of the fiercest fighting in the city happened here — Free French forces and the Resistance fought running battles through these gardens and the surrounding streets. Bullet scars from that fighting are still visible on buildings along rue de Medicis, just outside the eastern gate. The gardens were replanted, the palace returned to the French Senate, and within months Parisians were back in their green chairs as if nothing had happened. That determination to resume normal life is as Parisian as the gardens themselves.',
 'The Luftwaffe headquartered here during the occupation — bullet scars from the liberation are still on the buildings outside.',
 'Exit through the eastern gate onto rue de Medicis and look at the building facades — some still carry bullet marks from 1944.'),

-- Story 4: nature/photography (witty)
('paris_luxembourg_gardens', ARRAY['nature', 'photography'], 'witty',
 'The Luxembourg Gardens have the most aggressively maintained lawns in Paris. The pelouse — the central grass — is off-limits, and the garden police will blow a whistle at you faster than you can sit down. This creates a peculiar Parisian scene: hundreds of people sitting in chairs around a lawn that nobody is allowed to touch, as if the grass were a very green, very flat work of art in an outdoor museum. The only people who get to walk on it are the gardeners, which gives them an air of quiet privilege. The garden contains over 100 statues, and most of them are of women — French queens, saints, and allegorical figures — which makes it one of the most female-populated public spaces in Paris, though none of them are moving. The beehives near the south end produce honey that''s sold once a year at the garden''s own shop. It sells out in hours.',
 'The lawns are forbidden — hundreds sit in chairs admiring grass nobody is allowed to touch, like an outdoor museum.',
 'Look at the central lawn and notice: chairs everywhere around it, nobody on it. The garden police whistle at transgressors.');

-- ============================================================
-- 9. LE MARAIS
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_le_marais', ARRAY['history', 'architecture'], 'scholarly',
 'Le Marais — "the swamp" — was exactly that until the 12th century, when the Knights Templar drained it and established their fortified enclave here. By the 17th century, it had become the most fashionable aristocratic quarter in Paris, centered on the Place des Vosges, which Henri IV commissioned in 1605 as the first planned square in Paris. The uniform red brick and stone facades were revolutionary — a deliberate architectural harmony in a city of chaotic medieval streets. After the Revolution, the aristocrats fled and the district declined into a working-class neighbourhood. It was saved from demolition in the 1960s by Andre Malraux''s historic preservation laws, becoming one of the first protected districts in France. Today it contains the highest concentration of pre-Revolutionary architecture in Paris and has become the centre of the city''s Jewish community and its LGBTQ+ community simultaneously.',
 'Le Marais was a literal swamp drained by the Knights Templar — the Place des Vosges was Paris''s first planned square.',
 'Walk to the Place des Vosges and look at the uniform red brick arcades — Henri IV''s 1605 vision of architectural harmony.'),

-- Story 2: food/local-life (casual)
('paris_le_marais', ARRAY['food', 'local-life'], 'casual',
 'Le Marais is where Parisians eat when they''re not performing Frenchness. Rue des Rosiers is the heart of the Jewish quarter and home to L''As du Fallafel, where the queue out the door is a permanent feature. Get the special with everything — aubergine, cabbage, hummus, tahini, hot sauce — and eat it walking. It''s messy and magnificent. The Marais is also one of the only areas in Paris where shops are open on Sundays, which makes it the city''s default weekend wandering zone. Concept stores, vintage boutiques, tiny galleries — the streets reward aimlessness. The Marche des Enfants Rouges on rue de Bretagne is the oldest covered market in Paris, dating to 1615. It''s tiny but the Moroccan stall and the Japanese bento stall are both excellent. Get there before noon on weekends or don''t bother — it''s standing room only by one.',
 'L''As du Fallafel has a permanent queue — get the special with everything and eat it walking down rue des Rosiers.',
 'Head to rue des Rosiers for the falafels, then loop north to the Marche des Enfants Rouges — arrive before noon.'),

-- Story 3: culture/history (dramatic)
('paris_le_marais', ARRAY['culture', 'history'], 'dramatic',
 'On July 16, 1942, French police rounded up 13,152 Jewish men, women, and children from the Marais and surrounding arrondissements in what became known as the Vel'' d''Hiv roundup. Families were taken from these streets — from apartments you can still see — and held in the Velodrome d''Hiver sports stadium before being transported to Auschwitz. Fewer than a hundred survived. The roundup was carried out entirely by French police on German orders, a fact that France officially denied until President Chirac''s landmark speech in 1995 acknowledging French responsibility. Small plaques on school buildings throughout the Marais mark where Jewish children were taken. They''re easy to miss — small bronze squares at child''s eye height. Once you notice one, you start seeing them everywhere. The neighbourhood''s vibrant Jewish community today exists in deliberate defiance of that history.',
 'Bronze plaques at child''s eye height mark where Jewish children were taken in 1942 — once you see one, you see them all.',
 'Look at the facades of school buildings along the street — small bronze plaques near the ground mark the children taken in 1942.'),

-- Story 4: art/photography (witty)
('paris_le_marais', ARRAY['art', 'photography'], 'witty',
 'Le Marais has the highest density of art galleries per square metre in Paris, which means you can''t walk fifty metres without stumbling into someone''s conceptual installation about the nature of emptiness. The Musee Picasso, housed in the Hotel Sale — a 17th-century mansion — is the anchor, but the real art scene happens in the dozens of small galleries on rue de Turenne, rue Debelleyme, and around the Perrotin gallery on rue de Turenne. Most are free to enter, and the openings on Thursday evenings come with free wine, which is how half of Parisian art criticism gets written. The architecture is the other draw: the medieval half-timbered houses on rue Francois Miron are some of the oldest in Paris, dating to the 14th century. They lean slightly, which either adds charm or suggests imminent collapse, depending on your outlook.',
 'Thursday gallery openings come with free wine — half of Parisian art criticism is written under its influence.',
 'Look for the medieval half-timbered houses on rue Francois Miron — they lean like 14th-century buildings that haven''t decided whether to fall.');

-- ============================================================
-- 10. PONT NEUF
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_pont_neuf', ARRAY['history', 'architecture'], 'scholarly',
 'Despite its name — "New Bridge" — Pont Neuf is the oldest standing bridge in Paris, completed in 1607 after 29 years of construction. Henri IV inaugurated it by riding his horse across, and it was revolutionary for several reasons: it was the first bridge in Paris without houses built on it, the first with pavements for pedestrians separated from the roadway, and the first to offer an unobstructed view of the river. Before Pont Neuf, crossing the Seine meant walking through a tunnel of buildings. The bridge has twelve arches — seven on the longer northern arm, five on the shorter southern — and rests on the western tip of the Ile de la Cite. The 381 mascarons — those grotesque stone faces along the cornice — are each unique and were carved to represent characters from Parisian life. Time has worn many beyond recognition, but several dozen retain remarkably sharp detail.',
 'Paris''s "New Bridge" is its oldest — the first without houses, the first to let people actually see the river.',
 'Look along the cornice at the mascarons — 381 unique carved faces, each representing a character from 17th-century Paris.'),

-- Story 2: local-life/culture (casual)
('paris_pont_neuf', ARRAY['local-life', 'culture'], 'casual',
 'Pont Neuf is where Parisians go to do nothing, beautifully. The stone benches in the semi-circular balconies that jut out over the river are prime real estate on warm evenings — people bring wine, bread, and cheese, and sit watching the bateaux mouches glide past. The tip of the Ile de la Cite below, the Square du Vert-Galant, is one of the most romantic spots in Paris — a tiny tree-lined park at water level where you can sit with your feet almost touching the Seine. It''s named after Henri IV, whose nickname "Vert-Galant" loosely translates as "old flirt," which tells you everything about his reputation. The bridge itself is permanently occupied by street artists, buskers, and people selling locks. The love-lock tradition has migrated here from the Pont des Arts, where the weight of the locks was literally threatening the structure.',
 'Henri IV''s nickname was "the Old Flirt" — the park below the bridge is named after his romantic reputation.',
 'Lean over the balcony on the downstream side and look down at the Square du Vert-Galant — that tiny park at water level is Paris at its most romantic.'),

-- Story 3: history/myths (dramatic)
('paris_pont_neuf', ARRAY['history', 'myths'], 'dramatic',
 'In 1985, the artist Christo wrapped the entire Pont Neuf in 40,876 square metres of golden sandstone-coloured fabric, secured with 13 kilometres of rope. The project took ten years of negotiations, permits, and political battles. Christo and his wife Jeanne-Claude had been petitioning since 1975, meeting with three different mayors and countless bureaucrats. When the wrapping was finally installed, it lasted only fourteen days. Paris was divided — some found it luminous and transformative, others called it absurd. But over the two weeks, three million people came to see it. The fabric caught the light differently every hour, turning the bridge into something between sculpture and architecture. Christo said wrapping the bridge made people see it for the first time — that the act of hiding something reveals its shape. The fabric is gone, but the bridge never looked quite the same to those who saw it.',
 'Christo spent ten years negotiating to wrap this bridge in fabric for just fourteen days — three million people came to see it.',
 'Look at the bridge''s silhouette and imagine it wrapped in golden fabric — three million people came to see its shape revealed.'),

-- Story 4: photography/nature (witty)
('paris_pont_neuf', ARRAY['photography', 'nature'], 'witty',
 'Pont Neuf is the most filmed bridge in Paris, which is remarkable given the competition. It appears in Les Amants du Pont-Neuf, a 1991 film so expensive to make they built a full-scale replica of the bridge in the south of France when filming on the real one became impossible. The director, Leos Carax, spent so much money that the production became a national scandal. The bridge is also the best spot in central Paris to watch the sun set behind the Eiffel Tower on clear evenings in late spring — the alignment works for a few weeks around May and June. Photographers call it "the slot." The stone balconies make natural tripod platforms, and the warm light bouncing off the Seine creates a glow that makes everyone look good in photos. It''s the bridge where Parisians bring first dates. If the date survives the walk from one bank to the other, it''s a good sign.',
 'A director built a full-scale replica of this bridge when filming on the real one got too expensive — a national scandal.',
 'Stand in one of the stone balconies facing west in the evening — for a few weeks in May, the sun sets directly behind the Eiffel Tower.');

-- ============================================================
-- 11. PALAIS ROYAL
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('paris_palais_royal', ARRAY['history', 'architecture'], 'scholarly',
 'Cardinal Richelieu built the Palais Royal in the 1630s as his personal residence, and it passed to the crown after his death. But the building''s most consequential chapter came in the 1780s when the Duc d''Orleans, deep in debt, enclosed the gardens with arcaded galleries and rented them out as shops, cafes, gambling dens, and brothels. Because the palace grounds were royal property, the city police had no jurisdiction — making the arcades a zone of uncensored speech, political debate, and vice. It was in these arcades, on July 12, 1789, that Camille Desmoulins climbed on a cafe table and called Parisians to arms. Two days later, they stormed the Bastille. The French Revolution arguably began in a shopping mall. The arcades today are serene and mostly upscale, but the architecture of provocation remains.',
 'The French Revolution began in a shopping mall — police couldn''t enter, so the arcades became a zone of radical free speech.',
 'Walk under the arcades and imagine them filled with gambling tables and radical pamphlets — the police couldn''t enter royal grounds.'),

-- Story 2: art/culture (casual)
('paris_palais_royal', ARRAY['art', 'culture'], 'casual',
 'The striped columns in the courtyard are by Daniel Buren, installed in 1986, and Parisians fought about them the way they fight about everything new: loudly and for decades. The 260 columns are all different heights, arranged in a grid pattern with hidden water channels beneath. Officially titled "Les Deux Plateaux," everyone calls them "the Buren columns." Kids treat them as an obstacle course. Tourists sit on them for photos. The original controversy has mellowed into affection, which is the typical Parisian pattern: hate it, protest it, accept it, claim it was always great. The garden behind is one of the quietest spots in central Paris — surrounded by the arcade buildings on all four sides, traffic noise simply doesn''t penetrate. Bring a book. Sit under the lime trees. You''re five minutes from the Louvre and nobody is rushing anywhere.',
 'Parisians hated the Buren columns for decades and now claim they always loved them — the classic Paris cycle.',
 'Walk into the courtyard and look at the 260 striped columns — kids use them as obstacles, tourists use them as seats.'),

-- Story 3: history/myths (dramatic)
('paris_palais_royal', ARRAY['history', 'myths'], 'dramatic',
 'On the afternoon of July 12, 1789, a 29-year-old lawyer named Camille Desmoulins jumped onto a table outside the Cafe de Foy in these arcades and shouted to the crowd that the king''s minister Necker had been dismissed — a signal, he said, that a massacre was imminent. He pulled a green leaf from one of the garden''s chestnut trees and pinned it to his hat as a cockade of hope. The crowd followed his lead, tearing leaves from the trees and surging into the streets. Two days later, they stormed the Bastille. Desmoulins became a hero of the Revolution, then fell out with Robespierre and was guillotined in 1794 at age 34. His wife Lucile was guillotined eight days later. The cafe where he stood is gone, but the trees in the garden are descendants of those same chestnuts. The leaves are still green in July.',
 'Desmoulins pinned a leaf from these gardens to his hat and sparked the French Revolution — he was guillotined five years later.',
 'Look at the chestnut trees in the garden — they descend from the same trees whose leaves became revolutionary cockades in 1789.'),

-- Story 4: photography/local-life (witty)
('paris_palais_royal', ARRAY['photography', 'local-life'], 'witty',
 'The Buren columns have become the most accidentally democratic public art in Paris. Buren intended a precise geometric meditation on space and perspective. What he got was a children''s playground, a photography studio, a lunch spot, and an impromptu catwalk for fashion bloggers. On any given afternoon you''ll see a fashion shoot, a yoga session, and a toddler''s birthday party all happening simultaneously among the columns. The contrast between the austere 17th-century arcades and the candy-striped columns below is what makes it photogenic — the tension between old and new, formal and playful. For the best shot, stand at the entrance gate and use the columns as leading lines toward the garden beyond. Early morning is ideal — the light comes in low through the east arcade, and you might have the courtyard to yourself for approximately ninety seconds before the first fashion blogger arrives.',
 'Buren designed a geometric meditation — he got a playground, a yoga studio, and an Instagram backdrop instead.',
 'Stand at the entrance gate and use the striped columns as leading lines toward the garden — get here early before the fashion shoots start.');

-- ============================================================
-- 12. MONTMARTRE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/art (scholarly)
('paris_montmartre', ARRAY['history', 'art'], 'scholarly',
 'Montmartre''s artistic significance is concentrated in roughly thirty years, from the 1880s to 1914. Cheap rent and lax policing attracted painters, poets, and anarchists to the hill. Renoir painted the Moulin de la Galette dance hall in 1876. Toulouse-Lautrec documented the Moulin Rouge, which opened in 1889, creating posters that essentially invented modern graphic design. Picasso lived and worked at the Bateau-Lavoir studio from 1904 to 1909, where he painted Les Demoiselles d''Avignon — the work that launched Cubism and arguably modern art itself. Van Gogh lived on rue Lepic with his brother Theo from 1886 to 1888 and painted the view from their apartment window. Modigliani, Braque, Juan Gris, and Max Jacob all worked within a few hundred metres of each other. After 1914, the artists migrated to Montparnasse, but the mythology stayed.',
 'Picasso painted the work that launched modern art in a studio on this hill — cheap rent attracted a revolution.',
 'Look for the Bateau-Lavoir studio site on rue Ravignan — Picasso, Modigliani, and Braque all worked within metres of each other.'),

-- Story 2: food/local-life (casual)
('paris_montmartre', ARRAY['food', 'local-life'], 'casual',
 'The Place du Tertre is the tourist trap, and everyone knows it. Portrait artists charge forty euros for a charcoal sketch, restaurants mark up their menus by three hundred percent, and the "authentic village atmosphere" is carefully manufactured. Skip it. Instead, walk two blocks south to rue Lepic, where the actual neighbourhood lives. The market street has fishmongers, cheese shops, bakeries, and the kind of butcher who wraps your chicken in paper and ties it with string. Cafe des Deux Moulins, where Amelie was filmed, is on rue Lepic, and it''s still a functioning local cafe — slightly touristy now but the coffee is honest. For the best croissant on the hill, go to Gontran Cherrier on rue Caulaincourt. Get there before 9am because they sell out. The back streets of Montmartre, away from the square, are still genuinely residential — ivy-covered houses, cats in windows, winding staircases.',
 'Skip Place du Tertre entirely — walk two blocks south to rue Lepic for the real Montmartre.',
 'Turn away from the Place du Tertre and head downhill on rue Lepic — the market street, the Amelie cafe, and actual Parisian life.'),

-- Story 3: history/culture (dramatic)
('paris_montmartre', ARRAY['history', 'culture'], 'dramatic',
 'The Moulin Rouge opened on October 5, 1889, and immediately scandalised Paris. The can-can — high kicks, splits, and the deliberate showing of undergarments — was considered so provocative that the police monitored performances for indecency. The dancers were celebrities: La Goulue, whose real name was Louise Weber, earned more than many senior politicians and reportedly drank champagne from other people''s glasses without asking, which is how she got her nickname — "the Glutton." Toulouse-Lautrec, barely five feet tall and walking with a cane due to a genetic bone condition, installed himself at a corner table night after night, sketching the dancers in motion. His posters for the Moulin Rouge were designed to be torn down from walls and collected — the first art explicitly made for the street. The building burned down in 1915 and was rebuilt. The red windmill on the roof is a replica, but the mythology is original.',
 'La Goulue earned more than politicians and drank from strangers'' glasses — Toulouse-Lautrec sketched her nightly from his corner table.',
 'Look for the red windmill of the Moulin Rouge downhill on Boulevard de Clichy — a replica of the 1889 original that burned in 1915.'),

-- Story 4: photography/myths (witty)
('paris_montmartre', ARRAY['photography', 'myths'], 'witty',
 'The most photographed wall in Paris isn''t in a museum — it''s the "I Love You Wall" in the Square Jehan Rictus, just off Place des Abbesses. The wall displays "I love you" in 250 languages on 612 tiles of blue-black lava stone. It was created by Frederic Baron, who spent three years collecting translations by asking strangers, consulting embassies, and writing to linguists. The red splashes on the wall represent the fragments of a broken heart. It''s intensely romantic and slightly cheesy, which is exactly how Montmartre has always operated. Around the corner, the Passage des Abbesses leads to one of the few remaining vineyard in Paris — the Clos Montmartre, planted in 1933 as a protest against property developers. It produces about 500 bottles of wine per year. The wine is, by all accounts, terrible, but the harvest festival every October draws thousands. Montmartre has always valued the gesture over the result.',
 'Paris still has a vineyard on this hill — planted to spite developers, it makes terrible wine that thousands celebrate yearly.',
 'Find the "I Love You Wall" in Square Jehan Rictus — 250 languages on blue-black tiles, with red fragments of a broken heart.');
