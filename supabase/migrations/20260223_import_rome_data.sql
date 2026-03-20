-- Migration: Import Rome city data and curated stories
-- Idempotent: deletes existing Rome stories before re-importing

DELETE FROM place_stories WHERE place_id LIKE 'rome_%';

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

-- Rome Stories Import
-- 12 places x 4 stories each = 48 curated stories
-- Run AFTER import-rome.sql (which creates the city + places)

-- ============================================================
-- 1. COLOSSEUM
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_colosseum', ARRAY['history', 'architecture'], 'scholarly',
 'The Flavian Amphitheatre — its proper name — was completed in 80 AD under Emperor Titus, built on the site of Nero''s private lake as a deliberate political statement: public spectacle replacing imperial vanity. The structure held between 50,000 and 80,000 spectators and could be filled or emptied in fifteen minutes through 80 vomitoria — numbered archways that matched tickets made of pottery shards. The outer wall originally stood four storeys tall, clad in travertine limestone quarried from Tivoli, 30 kilometres away. Each level uses a different classical order: Doric on the ground floor, Ionic above, then Corinthian, then pilasters. That hierarchy wasn''t decorative whim — it was a Roman engineering grammar that distributed visual weight upward.',
 'Built on Nero''s drained private lake as a political statement — public spectacle replacing imperial vanity.',
 'Look at the three surviving levels of arches — each uses a different column order: Doric, Ionic, then Corinthian.'),

-- Story 2: culture/local-life (casual)
('rome_colosseum', ARRAY['culture', 'local-life'], 'casual',
 'Here''s something Romans know that tourists don''t: half the Colosseum is missing because it was used as a quarry for over a thousand years. St Peter''s Basilica, Palazzo Venezia, even parts of the Roman bridges — they''re all made from stolen Colosseum stone. The holes you can see pockmarking the surface are where iron clamps were gouged out and melted down for reuse. The building was essentially a hardware store for medieval and Renaissance Rome. Today, about 7 million people visit each year, making it the most visited monument in Italy. The cats that live in the ruins around the base are a Roman institution — there''s a legal colony protected by city ordinance. Locals bring them food every evening. Look for them in the shaded archways.',
 'Half the Colosseum is missing because Renaissance Rome used it as a quarry — even St Peter''s contains its stone.',
 'Look at the pockmarks across the stone surface — each hole is where an iron clamp was gouged out and melted down.'),

-- Story 3: myths/history (dramatic)
('rome_colosseum', ARRAY['myths', 'history'], 'dramatic',
 'When Titus inaugurated the Colosseum in 80 AD, the opening games lasted one hundred days. Ancient sources claim 9,000 animals were killed during the festivities — lions, elephants, bears, and crocodiles shipped from across the empire. The arena floor was a wooden platform covered in sand — the Latin word for sand is harena, which gives us the word arena. Beneath that floor, the hypogeum was a labyrinth of tunnels, cages, and mechanical lifts operated by pulleys and counterweights. Animals and gladiators could be raised through trapdoors directly into the arena. The floor could even be flooded for mock naval battles. Stand at the edge and look down into those exposed tunnels — that is the backstage machinery of Roman spectacle, laid bare by centuries of decay.',
 'The opening games lasted 100 days — the arena floor could be flooded for naval battles or opened for animal lifts.',
 'Look down into the exposed tunnels beneath the arena floor — that labyrinth is the hypogeum, Rome''s backstage machinery.'),

-- Story 4: photography/architecture (witty)
('rome_colosseum', ARRAY['photography', 'architecture'], 'witty',
 'The Colosseum has a good side and a bad side, photographically speaking. The north wall is mostly intact — four storeys of arches looking properly cinematic. The south side is a ragged cross-section that exposes the internal corridors like an architectural diagram. Most tourists stand on the Via dei Fori Imperiali side and shoot the postcard angle, but the best photograph is actually from the Palatine Hill, where you get the Colosseum framed against the city skyline with umbrella pines in the foreground. At sunset, the travertine turns the colour of burnt honey. The Romans installed 240 mast sockets around the top level to support a massive retractable awning — the velarium — operated by a detachment of sailors. So yes, the Romans invented the retractable stadium roof. Every modern sports dome is a footnote.',
 'The Romans invented the retractable stadium roof — sailors operated a massive awning from 240 mast sockets on top.',
 'Walk around to the Palatine Hill side for the best photograph — the Colosseum framed with umbrella pines and the city skyline.');

-- ============================================================
-- 2. PANTHEON
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_pantheon', ARRAY['history', 'architecture'], 'scholarly',
 'The Pantheon you see was built by Emperor Hadrian around 125 AD, replacing two earlier temples that burned down. The inscription on the portico credits Marcus Agrippa, who built the original in 27 BC — Hadrian kept the old inscription as a gesture of humility, which tells you something about the complexity of Roman ego. The dome is 43.3 metres in diameter and 43.3 metres in height — a perfect sphere would fit inside the building. It remained the largest unreinforced concrete dome in the world for nearly 1,900 years. The concrete thins from 6.4 metres at the base to 1.2 metres at the oculus and incorporates progressively lighter aggregate — heavy basalt at the bottom, light pumice at the top. This is not primitive engineering. This is material science.',
 'The dome has been the world''s largest unreinforced concrete dome for nearly 1,900 years — the proportions form a perfect sphere.',
 'Look straight up at the dome from the centre of the floor — the interior height equals the diameter at exactly 43.3 metres.'),

-- Story 2: culture/local-life (casual)
('rome_pantheon', ARRAY['culture', 'local-life'], 'casual',
 'When it rains, water falls straight through the oculus — that nine-metre hole in the roof — and hits the marble floor. There are drain holes cut into the slightly convex floor that most visitors never notice. On heavy rain days, a column of mist forms beneath the opening and the interior fills with a sound that''s halfway between a whisper and a hiss. Romans treat the Pantheon like a living room: people sit on the steps, eat gelato from the shops on the piazza, and barely glance up. The building has been in continuous use for almost two millennia — first as a temple, then as a church since 609 AD. Entry is free, which makes it one of the great bargains in European tourism. The best time to visit is early morning when the light through the oculus hits the floor in a solid beam.',
 'When it rains, water falls straight through the nine-metre oculus — there are hidden drains in the marble floor.',
 'Look at the marble floor and find the subtle drain holes — they handle the rain that falls through the oculus above.'),

-- Story 3: myths/art (dramatic)
('rome_pantheon', ARRAY['myths', 'art'], 'dramatic',
 'Raphael chose to be buried here. The greatest painter of the High Renaissance could have been interred in any church in Italy, and he picked the Pantheon. His tomb sits in a recess in the wall with an inscription that reads: "Here lies Raphael, by whom Nature feared to be outdone while he lived, and when he died, feared that she herself would die." He was 37. Two Italian kings are also buried here — Vittorio Emanuele II and Umberto I — their tombs flanking the nave like bookends of a unified Italy. But it''s Raphael''s tomb that people seek out. There are always fresh flowers. Five hundred years after his death, someone still brings flowers to the painter who made the Vatican Stanze glow.',
 'Raphael chose the Pantheon for his tomb at 37 — five hundred years later, someone still brings fresh flowers.',
 'Find Raphael''s tomb in the wall recess to the left of the altar — there are almost always fresh flowers placed there.'),

-- Story 4: architecture/photography (witty)
('rome_pantheon', ARRAY['architecture', 'photography'], 'witty',
 'The Pantheon''s portico has sixteen granite columns, each 11.8 metres tall, weighing 60 tonnes, quarried in Egypt, shipped across the Mediterranean, hauled up the Tiber, and dragged through the streets of Rome. The logistics of moving a single column were staggering; they moved sixteen. Three columns on the left side are replacements from the 1600s — if you look carefully, the granite is a slightly different shade. Pope Urban VIII melted down the bronze ceiling of the portico in 1625 to make cannons for Castel Sant''Angelo and Bernini''s baldachin in St Peter''s. This prompted the famous Roman quip: "What the barbarians didn''t do, the Barberini did." Urban VIII''s family name was Barberini. Two thousand years of survival and the biggest threat was a pope with a shopping list.',
 'A pope melted the Pantheon''s bronze ceiling for cannons — Romans quipped: "What the barbarians didn''t do, the Barberini did."',
 'Compare the portico columns — three on the left are 1600s replacements in a slightly different shade of granite.');

-- ============================================================
-- 3. TREVI FOUNTAIN
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_trevi_fountain', ARRAY['history', 'architecture'], 'scholarly',
 'The Trevi Fountain is the terminal point of the Aqua Virgo, an aqueduct built by Marcus Agrippa in 19 BC to supply water to the Roman baths. The aqueduct runs for 21 kilometres, mostly underground, from a spring near Salone. The fountain you see was designed by Nicola Salvi and completed in 1762 after thirty years of construction. It occupies the entire facade of Palazzo Poli, standing 26 metres high and 49 metres wide. The central figure is Neptune, riding a shell chariot pulled by two sea horses — one calm, one agitated — guided by tritons. The contrast represents the two moods of the sea. Salvi died before completion and Giuseppe Pannini finished the work. The travertine came from the quarries near Tivoli, the same stone that built the Colosseum.',
 'The fountain is the end point of a Roman aqueduct from 19 BC — 21 kilometres of underground water channel still feeding it.',
 'Look at how the fountain merges with the palace facade behind it — the entire building wall is part of the sculptural composition.'),

-- Story 2: culture/local-life (casual)
('rome_trevi_fountain', ARRAY['culture', 'local-life'], 'casual',
 'About 3,000 euros in coins are thrown into the Trevi Fountain every day. That''s roughly a million euros a year. The money is collected every Monday morning by workers in wading boots, and it goes to Caritas, a Catholic charity that funds a supermarket for Rome''s poor. The tradition says: one coin over your right shoulder with your left hand guarantees you''ll return to Rome. Two coins means you''ll fall in love with a Roman. Three means you''ll marry them. Nobody does three. The square is packed from about 10am onwards, but if you come at 6am you might have it nearly to yourself — the sound of rushing water echoing off the buildings without the crowd noise is a completely different experience. The gelato shop on the corner has been there since the 1950s.',
 'About 3,000 euros land in the fountain daily — collected every Monday and donated to feed Rome''s poor.',
 'Toss a coin over your right shoulder with your left hand — one coin to return, two to find love, three to marry a Roman.'),

-- Story 3: art/myths (dramatic)
('rome_trevi_fountain', ARRAY['art', 'myths'], 'dramatic',
 'The legend of the Aqua Virgo says that Roman soldiers, desperately searching for water, encountered a young maiden who led them to a hidden spring. The relief on the right side of the fountain depicts this scene — the virgin pointing to the source. The water has been flowing from that same aquifer for over two thousand years. At night, the fountain is illuminated from beneath the water, and Neptune''s face catches the light in a way that makes him look alive. Anita Ekberg waded into this fountain in Fellini''s La Dolce Vita in 1960, and it became the most iconic fountain scene in cinema history. The water was freezing — it was shot in winter — and Ekberg wore a wetsuit under her gown. Mastroianni refused to get in without vodka.',
 'Ekberg wore a wetsuit under her gown for La Dolce Vita — Mastroianni refused to wade in without vodka.',
 'Find the relief panel on the right side — it shows the maiden who led Roman soldiers to the spring two thousand years ago.'),

-- Story 4: food/culture (witty)
('rome_trevi_fountain', ARRAY['food', 'culture'], 'witty',
 'Here''s a local trick: don''t eat at any restaurant within sight of the Trevi Fountain. They survive on tourist traffic and most of them know it. Walk three blocks in any direction and the quality doubles while the price halves. The side streets northeast of here lead to some of the best supplì — fried rice balls with a molten mozzarella centre — in the city. Romans judge a neighbourhood by its supplì. The fountain itself was nearly built somewhere else entirely; Pope Urban VIII started a project with Bernini in the 1640s, but when Urban died, the new pope scrapped it because everything Bernini touched reminded him of the previous administration. Roman politics hasn''t changed much. The current fountain was a compromise design that took three decades and outlived its architect. Classic Rome.',
 'The fountain was almost a Bernini design — scrapped because the new pope hated everything linked to his predecessor.',
 'Walk three blocks northeast from here for the best supplì in Rome — never eat at a restaurant within sight of the fountain.');

-- ============================================================
-- 4. ST PETER'S BASILICA
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_vatican_st_peters', ARRAY['history', 'architecture'], 'scholarly',
 'St Peter''s Basilica took 120 years to build, from 1506 to 1626, and involved a relay of architects including Bramante, Raphael, Sangallo, Michelangelo, Maderno, and Bernini. Michelangelo designed the dome — 41.5 metres in diameter, 136 metres to the top of the cross — though he died in 1564 before it was completed. The basilica covers 23,000 square metres, making it the largest church in the world by interior area. It sits directly over the site where, according to tradition, St Peter was crucified and buried in 64 AD. Excavations in the 1940s beneath the basilica found a first-century Roman cemetery and bones that Pope Paul VI declared to be Peter''s remains. The building is technically not a cathedral — it''s a papal basilica. The actual cathedral of Rome is San Giovanni in Laterano.',
 'It took 120 years and six architects — Michelangelo designed the dome but died 26 years before it was finished.',
 'Look up at the dome from the piazza — Michelangelo''s design rises 136 metres to the cross, the tallest dome in the world.'),

-- Story 2: art/culture (casual)
('rome_vatican_st_peters', ARRAY['art', 'culture'], 'casual',
 'Michelangelo''s Pieta is inside the basilica, in the first chapel on your right. He carved it when he was 24 years old. Twenty-four. It''s the only work he ever signed — you can see his name carved across the sash on the Virgin''s chest. He supposedly overheard visitors attributing it to another sculptor and carved his name that night in a fit of ego. He later regretted it and never signed another piece. The sculpture is now behind bulletproof glass because in 1972 a man attacked it with a hammer, breaking the Virgin''s nose and left arm. The restoration took three years. If you make it inside, stand to the left of the glass for the best angle — most people crowd the centre. The way the marble catches the light on her draped clothing doesn''t look like stone at all.',
 'Michelangelo carved the Pieta at 24 and signed it in anger — it''s his only signed work, now behind bulletproof glass.',
 'The Pieta is in the first chapel on the right as you enter — stand to the left of the glass for the best viewing angle.'),

-- Story 3: history/myths (dramatic)
('rome_vatican_st_peters', ARRAY['history', 'myths'], 'dramatic',
 'Bernini''s colonnade wraps around St Peter''s Square like two arms reaching out to embrace the faithful. That''s not a metaphor — Bernini explicitly described it that way. The colonnade contains 284 columns and 88 pilasters arranged in four rows. There are 140 saints standing on top, each 3.2 metres tall, each carved by a different sculptor working from Bernini''s designs. Stand on one of the two circular paving stones set into the piazza — they mark the focal points of the ellipse — and the four rows of columns align perfectly into one. The entire colonnade appears to be a single row. It''s an optical illusion built at architectural scale. Bernini designed this piazza to make arriving pilgrims feel simultaneously overwhelmed and welcomed. He succeeded.',
 'Stand on the focal-point disc in the piazza and the four rows of columns collapse into one — a building-sized optical illusion.',
 'Find the circular stone disc set into the piazza pavement — stand on it and watch 284 columns align into a single row.'),

-- Story 4: architecture/photography (witty)
('rome_vatican_st_peters', ARRAY['architecture', 'photography'], 'witty',
 'Everything inside St Peter''s is bigger than it looks, which is disorienting. The cherubs near the holy water stoups are almost two metres tall — roughly the height of a professional basketball player. The baldachin — Bernini''s bronze canopy over the papal altar — is 29 metres tall, the height of a ten-storey building. But because the basilica is so enormous, it all looks proportional. The bronze for the baldachin was stripped from the Pantheon''s portico ceiling, which upset Romans so much they coined that phrase about the Barberini. If you want the best photograph of the facade, don''t shoot from the piazza. Walk to the end of Via della Conciliazione and use the long perspective. Mussolini demolished an entire medieval neighbourhood to create that street in the 1930s. Controversial, but the photo angle is undeniably good.',
 'The cherubs near the holy water are two metres tall — everything is oversized but the basilica makes it look normal.',
 'Walk back to Via della Conciliazione for the best facade photograph — Mussolini demolished a neighbourhood to create that view.');

-- ============================================================
-- 5. ROMAN FORUM
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_roman_forum', ARRAY['history', 'architecture'], 'scholarly',
 'For nearly a thousand years, this was the centre of Roman public life. The Forum began as a marketplace in the 7th century BC, built over a drained marsh between the Palatine and Capitoline hills. By the late Republic it had become the political, religious, and commercial heart of an empire that stretched from Britain to Mesopotamia. The Temple of Saturn, whose eight columns still stand at the western end, housed the state treasury. The Rostra — the speakers'' platform — was decorated with the bronze prows of captured warships; the word rostrum comes from the Latin for ship''s beak. Julius Caesar was cremated here in 44 BC, at a spot near the Temple of Divus Iulius. The column of Phocas, erected in 608 AD, was the last monument added to the Forum before it fell into ruin.',
 'The word "rostrum" comes from the bronze ship prows that decorated the speakers'' platform here.',
 'Look for the eight standing columns of the Temple of Saturn at the western end — that building held the Roman state treasury.'),

-- Story 2: culture/local-life (casual)
('rome_roman_forum', ARRAY['culture', 'local-life'], 'casual',
 'By the Middle Ages, the Forum had sunk so deep under accumulated debris and soil that cows grazed where senators once debated. It was literally called the Campo Vaccino — the cow field. Systematic excavations didn''t begin until the 19th century, and they''re still ongoing. There are layers beneath what you see that haven''t been touched. The best way to visit is to enter from the Palatine Hill side, which gives you an elevated view before you descend into the ruins. Romans themselves rarely come here — it''s considered purely tourist territory, which is ironic given that it was once the most Roman place on earth. If you visit in late afternoon, the shadows lengthen across the columns and the crowds thin out. That''s when you can actually hear the silence of the place.',
 'In the Middle Ages, cows grazed here — it was called Campo Vaccino, the cow field, for centuries.',
 'Enter from the Palatine Hill side for an elevated view first — then descend into the ruins as the afternoon shadows lengthen.'),

-- Story 3: history/myths (dramatic)
('rome_roman_forum', ARRAY['history', 'myths'], 'dramatic',
 'On the Ides of March, 44 BC, Julius Caesar was stabbed 23 times on the steps of the Theatre of Pompey, about a kilometre from here. His body was carried to the Forum and cremated on a pyre near where the Temple of Divus Iulius now stands. According to Suetonius, the crowd was so grief-stricken they threw furniture, clothing, and jewellery onto the fire. Mark Antony delivered his funeral oration from the Rostra — the "Friends, Romans, countrymen" speech that Shakespeare later immortalized, though the real version was likely less eloquent and more political. Visitors still leave flowers at the altar of Caesar''s temple. Two thousand years later, people mourn a dictator who was murdered by men who believed they were saving the Republic. History is rarely that clean.',
 'Visitors still leave flowers at Caesar''s altar — two thousand years after his assassination, people still mourn.',
 'Find the low brick altar near the Temple of Divus Iulius — Caesar was cremated here and visitors still leave flowers.'),

-- Story 4: photography/culture (witty)
('rome_roman_forum', ARRAY['photography', 'culture'], 'witty',
 'Here''s the thing about the Forum that nobody tells you: it''s confusing. The ruins are fragmentary, the labelling is minimal, and without a map you''re essentially walking through an expensive rubble field wondering which pile of bricks was important. That''s the charm of it. Unlike the Colosseum, which announces itself, the Forum requires imagination. Those three columns standing alone near the centre? That''s the Temple of Castor and Pollux — twin gods who supposedly appeared on horseback to help Rome win the Battle of Lake Regillus in 496 BC. The best view of the whole site is free: climb to the terrace behind the Capitoline Museums and look down. You get the entire Forum spread out with the Colosseum rising behind it. Bring a zoom lens and skip the entrance fee.',
 'The best view of the Forum is free — the terrace behind the Capitoline Museums gives you everything plus the Colosseum.',
 'Spot the three standing columns near the centre — that''s the Temple of Castor and Pollux, twin gods who fought for Rome.');

-- ============================================================
-- 6. TRASTEVERE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/culture (scholarly)
('rome_trastevere', ARRAY['history', 'culture'], 'scholarly',
 'Trastevere means "across the Tiber" — trans Tiberim in Latin — and for most of Roman history, this neighbourhood was considered outside the city proper. It was home to immigrants, sailors, tanners, and Rome''s oldest Jewish community before they were confined to the Ghetto in 1555. The Basilica di Santa Maria in Trastevere, at the heart of the neighbourhood, is one of the oldest churches in Rome, with foundations dating to the 3rd century and 12th-century mosaics by Pietro Cavallini that rival anything in the city. The neighbourhood''s medieval street plan has survived almost intact because it was too tangled and too poor to interest the urban planners who straightened the rest of Rome. That neglect preserved it. What was once a disadvantage became its defining charm.',
 'Trastevere was Rome''s immigrant quarter — its medieval streets survived because the area was too poor to redevelop.',
 'Look at the narrow medieval lanes around you — this street plan has survived almost unchanged because no planner bothered to touch it.'),

-- Story 2: food/local-life (casual)
('rome_trastevere', ARRAY['food', 'local-life'], 'casual',
 'Trastevere is where Romans eat when they want to eat like Romans. The neighbourhood has more trattorias per square metre than anywhere else in the city, and the locals will tell you exactly which ones are good and which are tourist traps — loudly, and with hand gestures. The classic Trastevere meal is cacio e pepe — pasta with pecorino cheese and black pepper, nothing else. If the menu lists more than four ingredients, you''re in the wrong place. Supplì — fried rice balls with molten mozzarella — are the standard appetizer. The market at Piazza San Cosimato runs every morning except Sunday and sells produce that makes supermarket fruit look sad. Walk the side streets after 9pm and you''ll find the neighbourhood at its best: families eating outdoors, kids running between tables, and cats asleep on Vespas.',
 'Romans eat here when they want to eat like Romans — if the cacio e pepe has more than four ingredients, leave.',
 'Look for the side streets south of Piazza Santa Maria — after 9pm, the trattorias spill outdoors and the real Trastevere appears.'),

-- Story 3: art/history (dramatic)
('rome_trastevere', ARRAY['art', 'history'], 'dramatic',
 'The mosaics inside Santa Maria in Trastevere are among the most important in Western art. The apse mosaics date to the 12th and 13th centuries and show the Virgin Mary seated beside Christ on the same throne — a radical statement of equality in medieval iconography. Below them, Pietro Cavallini''s six panels depicting the life of the Virgin, completed around 1291, are considered a bridge between Byzantine formalism and the naturalism that would explode with Giotto a few years later. Cavallini painted figures with weight, shadow, and genuine human expression decades before the Renaissance officially began. Stand in the nave at midday when sunlight reaches the gold tesserae and the entire apse ignites. The gold was applied leaf by leaf, angled by hand to catch light from specific directions. These mosaics were designed to glow.',
 'Cavallini painted naturalistic figures here decades before Giotto — these mosaics helped spark the Renaissance.',
 'Step inside Santa Maria in Trastevere and look at the apse — the gold mosaics were angled to catch midday light.'),

-- Story 4: local-life/music (witty)
('rome_trastevere', ARRAY['local-life', 'music'], 'witty',
 'Trastevere has a persecution complex, and it''s well-earned. Trasteverini — the born-and-raised locals — consider themselves the real Romans. They''ve survived floods from the Tiber, malaria from the marshes, papal neglect, and now an invasion of Airbnb tourists and aperitivo bars. The annual Festa de'' Noantri in July is essentially Trastevere throwing itself a birthday party for being tougher than the rest of the city. Street musicians set up at every intersection after dark, and the quality ranges from conservatory-trained to enthusiastically terrible. The acoustics of the narrow streets amplify everything, so a bad accordion player becomes inescapable. Walk along Via della Lungaretta in the evening and let the noise wash over you — that chaotic mix of music, argument, and laughter is the authentic soundtrack of old Rome.',
 'Trasteverini consider themselves the real Romans — the July festival is basically a birthday party for surviving everything.',
 'Walk Via della Lungaretta after dark — the narrow streets amplify every musician, conversation, and argument into a wall of sound.');

-- ============================================================
-- 7. SPANISH STEPS
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_spanish_steps', ARRAY['history', 'architecture'], 'scholarly',
 'The Spanish Steps were built between 1723 and 1726, designed by Francesco de Sanctis to connect the Bourbon Spanish Embassy at the bottom — hence the name — with the French church of Trinita dei Monti at the top. The project was funded by a bequest from French diplomat Etienne Gueffier, who left 20,000 scudi specifically for this purpose in 1660. It took 63 years of diplomatic arguments between France and Spain before construction began. The 135 steps are arranged in a butterfly pattern: a single flight at the bottom that splits into two curving flights, converges, then splits again. The design creates a natural amphitheatre effect — people sitting on the steps face each other across the divide. De Sanctis won the commission over several rivals, including Alessandro Specchi, whose rejected design still exists in the Vatican archives.',
 'It took 63 years of Franco-Spanish diplomatic arguments before the steps could be built — funded by a French bequest from 1660.',
 'Look at the butterfly pattern of the stairs — they split, converge, and split again, creating a natural amphitheatre.'),

-- Story 2: culture/local-life (casual)
('rome_spanish_steps', ARRAY['culture', 'local-life'], 'casual',
 'You can''t sit on the Spanish Steps anymore — a 2019 city ordinance banned it, with fines up to 400 euros. Romans were surprisingly divided on this: some were glad to reclaim the monument from selfie-stick crowds, others thought it killed the atmosphere that made the steps famous in the first place. The Keats-Shelley House at the bottom right is where the poet John Keats died of tuberculosis in 1821, at age 25. His room overlooking the steps is preserved exactly as it was. The Barcaccia fountain at the base — shaped like a sinking boat — was designed by Pietro Bernini, father of the more famous Gian Lorenzo. It sits low because the water pressure from the Acqua Vergine aqueduct was too weak for a tall fountain. His son would have made it bigger. His father made it clever.',
 'You can''t sit on the steps anymore — fines up to 400 euros since 2019. Keats died in the house at the bottom right.',
 'Look at the Barcaccia fountain at the base — shaped like a sinking boat because the water pressure was too weak for anything taller.'),

-- Story 3: art/myths (dramatic)
('rome_spanish_steps', ARRAY['art', 'myths'], 'dramatic',
 'Keats arrived in Rome in November 1820, already dying. His doctor thought the Roman climate might help — it didn''t. He spent his last months in a small room overlooking this piazza, nursed by his friend Joseph Severn, who sketched Keats on his deathbed. Keats asked that his tombstone bear no name, only the words: "Here lies one whose name was writ in water." He was 25. He believed his poetry would be forgotten. His grave in the Protestant Cemetery on the other side of Rome is now one of the most visited literary pilgrimage sites in the world. Severn was so affected by the experience that he eventually moved to Rome permanently and is buried next to Keats. Stand at the bottom of the steps and look up at the second-floor window on the right. That was his room. The light hasn''t changed.',
 'Keats asked for no name on his tombstone — "Here lies one whose name was writ in water." He was 25 and thought he''d be forgotten.',
 'Look at the second-floor windows on the right at the base of the steps — that was Keats''s room, where he died in 1821.'),

-- Story 4: photography/culture (witty)
('rome_spanish_steps', ARRAY['photography', 'culture'], 'witty',
 'The Spanish Steps are probably the most Instagrammed staircase in the world, which is impressive for something you can''t legally sit on. The sitting ban created an unexpected photography trend: people now pose standing dramatically on various levels, which honestly looks better than the old tourist-sitting-on-steps shot. The best light hits the staircase in late afternoon when the travertine turns golden and the shadows from Trinita dei Monti stretch down the upper flights. For the classic shot, stand at the Barcaccia fountain and shoot upward. For something different, climb to the top and shoot down — the butterfly pattern of the stairs is only visible from above. The luxury shopping streets fan out from the base: Via Condotti, Via Frattina, Via Borgognona. Romans call this the Tridente, and window-shopping here is free entertainment.',
 'You can''t sit on the steps, so tourists now pose standing dramatically — it actually photographs better.',
 'Climb to the top and shoot downward to see the butterfly stair pattern — or stand at the fountain and shoot up for the classic angle.');

-- ============================================================
-- 8. PIAZZA NAVONA
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_piazza_navona', ARRAY['history', 'architecture'], 'scholarly',
 'Piazza Navona preserves the exact footprint of the Stadium of Domitian, built in 80 AD for Greek-style athletic competitions. The elongated shape, the curved northern end, the buildings lining the perimeter — they all follow the stadium''s original outline. The arena held 30,000 spectators. If you descend to the archaeological site beneath the piazza, you can see the original travertine arches of the stadium. The central fountain — Bernini''s Fontana dei Quattro Fiumi, completed in 1651 — represents four great rivers: the Nile, Ganges, Danube, and Rio de la Plata, symbolizing the four known continents. The obelisk at its centre is a Roman copy of an Egyptian original, brought from the Circus of Maxentius on the Via Appia. Bernini won this commission through a calculated gambit, placing a silver model where Pope Innocent X would stumble upon it.',
 'The piazza preserves the exact footprint of a stadium from 80 AD — the curved end and elongated shape are the original outline.',
 'Look at the curved northern end of the piazza — that curve follows the turning point of the 1st-century athletic track.'),

-- Story 2: art/culture (casual)
('rome_piazza_navona', ARRAY['art', 'culture'], 'casual',
 'There''s a famous story that the Nile figure on Bernini''s fountain covers his eyes to avoid looking at Borromini''s Sant''Agnese church facade across the piazza — a dig at his rival. It''s a great story and completely untrue. The fountain was finished two years before Borromini even started the church. The real reason the Nile covers his face is that the river''s source was unknown in the 17th century — the gesture represents mystery. But the rivalry between Bernini and Borromini was real and vicious. They competed for every major commission in Rome and despised each other personally. Borromini eventually took his own life in 1667. Today, artists and caricaturists line the piazza, and the quality of their work honestly varies from genuinely talented to hilariously bad. The piazza is at its best around sunset when the fountains catch the light.',
 'The story that Bernini''s statue shades its eyes from Borromini''s church is a perfect lie — the fountain was finished two years before the church.',
 'Find the Nile figure on Bernini''s central fountain with the covered face — it represents mystery, not an insult to Borromini.'),

-- Story 3: history/myths (dramatic)
('rome_piazza_navona', ARRAY['history', 'myths'], 'dramatic',
 'From the 17th to the 19th century, the piazza was deliberately flooded every weekend in August. The drains of the three fountains were plugged, and the basin-like piazza filled with half a metre of water. Aristocrats drove their carriages through the artificial lake while commoners waded and splashed. It was called the Lago di Piazza Navona, and it was essentially Rome''s summer festival — part spectacle, part relief from the brutal August heat. The tradition ended in 1866. Before the fountains, this was also the site of public executions. Giordano Bruno, the philosopher burned for heresy in 1600, was held in a prison near here before his execution at Campo de'' Fiori. The piazza has always been a stage — for sport, for punishment, for celebration, for showing off. The audience just keeps changing.',
 'The piazza was deliberately flooded every August for 200 years — carriages drove through the artificial lake.',
 'Imagine the piazza filled with half a metre of water — from the 1600s to 1866, this was Rome''s summer swimming pool.'),

-- Story 4: food/local-life (witty)
('rome_piazza_navona', ARRAY['food', 'local-life'], 'witty',
 'The cafes on Piazza Navona charge a surcharge that Romans consider a form of voluntary taxation. A cappuccino at the bar anywhere else in Rome costs about one euro fifty. A cappuccino sitting down on Piazza Navona costs six. You are paying for Bernini''s fountain reflected in your coffee. Whether that''s worth it is a personal decision, but locals would rather drink standing at the bar around the corner. The gelato sold from carts in the piazza is industrially produced and the locals know it — look for a gelateria where the pistachio is brownish-green and muted, not bright green. Bright green pistachio gelato is a lie. The restaurants on the piazza itself are almost uniformly mediocre. Walk two blocks east and you''re in a different price universe with better food. This is true of every famous piazza in Rome.',
 'If the pistachio gelato is bright green, it''s fake — real pistachio is brownish-green and muted.',
 'Walk two blocks east to escape the piazza pricing — every cafe here charges a Bernini surcharge on your cappuccino.');

-- ============================================================
-- 9. CAMPO DE' FIORI
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/culture (scholarly)
('rome_campo_de_fiori', ARRAY['history', 'culture'], 'scholarly',
 'Campo de'' Fiori is the only major piazza in central Rome without a church. Instead, its centre is dominated by the hooded statue of Giordano Bruno, erected in 1889 on the exact spot where he was burned alive by the Inquisition on February 17, 1600. Bruno was a Dominican friar, philosopher, and mathematician who proposed that the universe was infinite, that stars were distant suns with their own planets, and that the Earth was not the centre of creation. The Inquisition tried him for heresy over eight years. He refused to recant. The statue, by Ettore Ferrari, faces the Vatican defiantly. It was erected over the fierce objections of the Catholic Church and became a symbol of free thought. The inscription reads: "To Bruno, from the century he foresaw, on the spot where the pyre burned."',
 'Bruno proposed an infinite universe with distant suns — the Inquisition burned him here in 1600 and he refused to recant.',
 'Look at the hooded statue in the centre — Giordano Bruno faces the Vatican defiantly from the spot where he burned.'),

-- Story 2: food/local-life (casual)
('rome_campo_de_fiori', ARRAY['food', 'local-life'], 'casual',
 'Every morning except Sunday, the Campo transforms into one of Rome''s oldest open-air markets. Stalls sell seasonal produce, dried spices, artichokes piled in pyramids, and fresh flowers — the piazza''s name means "field of flowers." The market has been running since 1869, though informal trading happened here for centuries before that. The best stalls are the ones without English signs. Look for the vendors selling Roman artichokes — carciofi alla romana — and the spice merchants who mix their own blends. By 2pm, the stalls are packed up and by evening the piazza becomes a drinking destination for a younger crowd, which annoys the residents enormously. The pizza bianca from Forno Campo de'' Fiori on the corner is legendary — crisp, olive-oiled, and sold by weight. Get there before noon or it sells out.',
 'The pizza bianca from Forno on the corner is legendary — sold by weight, crisp, and gone by noon.',
 'Look for the produce stalls without English signs — those are the ones locals use. The pizza bianca shop is on the northwest corner.'),

-- Story 3: history/myths (dramatic)
('rome_campo_de_fiori', ARRAY['history', 'myths'], 'dramatic',
 'Before it was a market, the Campo was an execution ground. The Inquisition carried out public burnings here because the open square allowed large crowds to witness the punishment. Bruno was not the only one — dozens were executed in this piazza between the 15th and 18th centuries. The name "field of flowers" predates the executions; it refers to a meadow that existed here in the Middle Ages before the area was paved. By night, the Campo had a different reputation: it was the centre of Rome''s tavern and inn district, frequented by travellers, pilgrims, and people the Church preferred not to acknowledge. Caravaggio lived nearby on Vicolo del Divino Amore and was known to frequent the gambling dens around the piazza. He killed a man in a brawl near here in 1606 and fled Rome. The piazza has always attracted trouble.',
 'Caravaggio killed a man in a brawl near this piazza in 1606 and fled Rome — he lived just around the corner.',
 'Look down the side streets — Caravaggio lived on Vicolo del Divino Amore nearby and frequented the gambling dens around this square.'),

-- Story 4: photography/food (witty)
('rome_campo_de_fiori', ARRAY['photography', 'food'], 'witty',
 'The Campo has two completely different personalities, and they share the same square without acknowledging each other. Morning: fruit vendors shouting prices, grandmothers squeezing tomatoes, the air smelling of basil and fresh bread. Evening: international students drinking cheap wine on the statue base while Bruno looks down with what you might generously call philosophical detachment. The best photograph of the market is from the southeast corner around 8am, when the morning light rakes across the stalls and the produce glows. For the evening atmosphere, shoot from above if you can access any of the surrounding terraces. The restaurants ringing the square are mixed — some excellent, some cynically overpriced. The rule is simple: if the menu has photographs, keep walking. If there''s a handwritten daily special on a chalkboard, you''re probably in the right place.',
 'If the menu has photographs, keep walking — if there''s a handwritten chalkboard, sit down.',
 'Come at 8am and stand at the southeast corner — the morning light rakes across the market stalls and makes the produce glow.');

-- ============================================================
-- 10. BORGHESE GALLERY
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: art/history (scholarly)
('rome_borghese_gallery', ARRAY['art', 'history'], 'scholarly',
 'Cardinal Scipione Borghese was the nephew of Pope Paul V, which gave him the money and the connections to assemble one of the most extraordinary private art collections in history. He built this villa between 1613 and 1616 specifically to house it. His methods of acquisition were not always ethical — he had Raphael''s Entombment confiscated from a church in Perugia under a papal warrant. He commissioned Bernini, then barely twenty years old, to create four of the greatest sculptures in Western art: Apollo and Daphne, The Rape of Proserpina, David, and Aeneas and Anchises. The gallery also holds Caravaggio''s Boy with a Basket of Fruit, David with the Head of Goliath, and several others. The collection has remained essentially intact since the 17th century, which is astonishing for any private collection.',
 'Cardinal Borghese had Raphael''s Entombment seized from a church under a papal warrant — his collecting methods were ruthless.',
 'The villa was purpose-built to house this collection — Bernini was barely twenty when he carved the masterpieces inside.'),

-- Story 2: art/culture (casual)
('rome_borghese_gallery', ARRAY['art', 'culture'], 'casual',
 'You can''t just walk into the Borghese Gallery — entry is by timed reservation only, in two-hour blocks, and it books out weeks in advance. This is one of the few museums in the world where the limitation actually improves the experience. With only 360 visitors per slot, you can stand in front of Bernini''s Apollo and Daphne without someone''s selfie stick in your peripheral vision. That sculpture is in room three on the ground floor, and here''s the trick: walk around it slowly. From the front, Apollo is reaching. From the side, you see Daphne''s fingers turning into laurel leaves. From the back, bark is crawling up her legs. Bernini carved this from a single block of marble at age 24. The detail on the leaves is so fine that restorers use dental tools to clean it. Book your tickets online at least two weeks ahead.',
 'Entry is timed and limited to 360 people — one of the few museums where the crowd control makes it better.',
 'Find Apollo and Daphne in room three and walk around it slowly — from the back, bark is visibly crawling up her legs.'),

-- Story 3: art/myths (dramatic)
('rome_borghese_gallery', ARRAY['art', 'myths'], 'dramatic',
 'Caravaggio''s David with the Head of Goliath, painted around 1610, hangs in room eight. The severed head of Goliath is a self-portrait — Caravaggio painted his own face on the decapitated giant. He created it while on the run for murder, hoping to send it to Cardinal Borghese as a plea for a papal pardon. The painting is essentially a man offering his own severed head to the person who could save his life. David looks down at Goliath with an expression that isn''t triumph — it''s pity, or possibly regret. The inscription on David''s sword reads "Humility conquers pride," but the genius of the painting is that Caravaggio cast himself as both — the violent giant and the remorseful boy. He died of fever on a beach in Tuscany before the pardon arrived.',
 'Caravaggio painted his own face on Goliath''s severed head — it was a plea for a pardon he never received.',
 'Find room eight and Caravaggio''s David — look at Goliath''s face and know you are looking at Caravaggio''s self-portrait.'),

-- Story 4: nature/photography (witty)
('rome_borghese_gallery', ARRAY['nature', 'photography'], 'witty',
 'The Villa Borghese gardens surrounding the gallery are 80 hectares of parkland, making them Rome''s third-largest public park. Romans come here to jog, walk their dogs, argue on the phone, and pointedly ignore the cultural treasures inside the villa. You can rent rowboats on the small artificial lake, which is a genuinely romantic activity until you realise everyone else had the same idea and you''re in a traffic jam of pedal boats. The Pincio terrace at the western edge of the park gives you the best free panoramic view of Rome — the dome of St Peter''s, the rooftops, the umbrella pines. Sunset from the Pincio is a Roman ritual: couples line the balustrade, street musicians set up, and the sky turns colours that would look exaggerated in a painting. It''s free and it''s better than most of the things you''ll pay for.',
 'The Pincio terrace gives the best free sunset view in Rome — couples line up and the sky outperforms any painting inside.',
 'After the gallery, walk west through the gardens to the Pincio terrace — the sunset view of St Peter''s dome is unmissable.');

-- ============================================================
-- 11. AVENTINE KEYHOLE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_aventine_keyhole', ARRAY['history', 'architecture'], 'scholarly',
 'The keyhole belongs to the gate of the Priory of the Knights of Malta, the headquarters of the Sovereign Military Order of Malta — a medieval crusading order that still exists as a sovereign entity with its own passports, stamps, and diplomatic relations with over 100 countries. The Priory is on the site of a Benedictine monastery that predates the Knights'' arrival in the 12th century. The garden behind the gate was redesigned by Giovanni Battista Piranesi in 1765 — the same Piranesi famous for his etchings of Roman ruins. The view through the keyhole is his deliberate composition: a hedge-lined avenue that frames the dome of St Peter''s Basilica exactly at its centre. From this keyhole, you see three sovereign states at once: Italy, the Order of Malta, and Vatican City. That is by design, not accident.',
 'Through this keyhole you see three sovereign states at once — Italy, the Knights of Malta, and Vatican City.',
 'Press your eye to the keyhole of the green gate — the hedge avenue frames St Peter''s dome in a perfect Piranesi composition.'),

-- Story 2: culture/local-life (casual)
('rome_aventine_keyhole', ARRAY['culture', 'local-life'], 'casual',
 'There is almost always a queue to look through this keyhole, which is an absurd thing to say about a door on a quiet hilltop. But here we are. On a busy day, you might wait twenty minutes for three seconds of peeping through a lock. Romans find this hilarious. The Aventine Hill itself is one of the quietest, most residential neighbourhoods in central Rome — orange trees line the streets, cats sleep on ancient walls, and the traffic noise from below barely reaches. The Giardino degli Aranci — the Orange Garden — is a few steps from the keyhole and offers a panoramic view of the city that''s nearly as good as the Pincio, with a fraction of the crowd. There''s a bench at the far end that might be the most peaceful seat in Rome. Sit there before joining the keyhole queue.',
 'You might wait twenty minutes to peek through a keyhole for three seconds — and it''s worth every second.',
 'Visit the Orange Garden a few steps away first — the bench at the far end might be the most peaceful seat in Rome.'),

-- Story 3: history/myths (dramatic)
('rome_aventine_keyhole', ARRAY['history', 'myths'], 'dramatic',
 'The Aventine Hill has been a place apart since the founding myths of Rome. According to tradition, Remus stood on the Aventine while Romulus stood on the Palatine, each watching for vultures to determine who would rule the new city. Remus saw six birds first; Romulus saw twelve birds second. The argument over who won — first sighting or more birds — ended with Romulus killing his brother. The Aventine became the hill of the common people, the plebeians, while the Palatine became the hill of power. That class division persisted for centuries. Today, the Aventine is patrician and serene, its ancient underdog status long forgotten. The keyhole view encapsulates something about Rome itself: layers of history, framed precisely, visible only if you know where to look and are willing to wait your turn.',
 'Remus watched for omens from this hill while Romulus watched from the Palatine — the argument ended in murder.',
 'Stand on the Aventine and look across to the Palatine Hill — Romulus and Remus divided Rome''s future from these two summits.'),

-- Story 4: photography/architecture (witty)
('rome_aventine_keyhole', ARRAY['photography', 'architecture'], 'witty',
 'Photographing through the keyhole is an exercise in frustration. Your phone camera won''t focus properly through a tiny aperture, the depth of field is wrong, and the person behind you in the queue is breathing on your neck. The trick is to hold your phone flat against the door with the camera lens directly over the keyhole, tap to focus on the dome, and take several shots. Even then, most of them will be blurry. But the one good shot — the dark vignette of the hedge tunnel with St Peter''s glowing at the end — is genuinely spectacular. Piranesi designed this view in 1765 and inadvertently created one of the most photographed perspectives in the age of smartphones. He also designed the piazza in front of the gate, decorated with Masonic symbols and military trophies. Look at the ground: even the pavement is a Piranesi composition.',
 'Piranesi accidentally created the world''s most Instagrammed keyhole in 1765 — photographing it is an art in itself.',
 'Hold your phone flat against the door with the lens over the keyhole — tap to focus on the dome and shoot several times.');

-- ============================================================
-- 12. MOUTH OF TRUTH
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue) VALUES

-- Story 1: history/architecture (scholarly)
('rome_mouth_of_truth', ARRAY['history', 'architecture'], 'scholarly',
 'The Bocca della Verita is a marble disc 1.75 metres in diameter, carved as the face of a river god — most scholars believe it represents Oceanus or possibly a faun. Its original function is debated: it may have been a drain cover from a nearby Roman temple, or a fountain decoration, or part of a cattle market that once occupied this area. The disc dates to approximately the 1st century AD. It has been mounted in the portico of the Basilica of Santa Maria in Cosmedin since 1632. The basilica itself is a remarkable building — a 6th-century church built into the remains of a Roman temple and the city''s food distribution centre, the Statio Annonae. The Romanesque bell tower, added in the 12th century, is one of the tallest medieval towers in Rome and a landmark visible from across the Tiber.',
 'The disc was probably a Roman drain cover from the 1st century — the church behind it is built into a Roman food distribution centre.',
 'Look past the marble disc at the basilica portico — the church is layered onto a Roman temple and an ancient food depot.'),

-- Story 2: myths/culture (casual)
('rome_mouth_of_truth', ARRAY['myths', 'culture'], 'casual',
 'The legend is simple: put your hand in the mouth and tell a lie, and it bites your hand off. Nobody believes this, but everyone puts their hand in anyway — the queue can stretch for thirty minutes just to stick your fingers into a stone face and take a photo. Medieval Romans apparently took it more seriously: there are records of the Bocca being used in informal trials, where accused liars were made to swear their innocence with their hand in the mouth. Whether anyone actually lost a hand is unclear, but the psychological pressure of the ritual probably extracted a few confessions. Gregory Peck pretended to lose his hand in Roman Holiday, and Audrey Hepburn''s scream was genuine — Peck hadn''t told her about the gag. That one film scene did more for tourism to this spot than fourteen centuries of legend.',
 'Audrey Hepburn''s scream in Roman Holiday was real — Peck hid his hand without warning her. The queue hasn''t shortened since.',
 'Join the queue and put your hand in the mouth — just know that Gregory Peck did it better in 1953.'),

-- Story 3: history/myths (dramatic)
('rome_mouth_of_truth', ARRAY['history', 'myths'], 'dramatic',
 'One medieval legend claims that a woman accused of adultery was ordered to swear her innocence at the Bocca della Verita. She arranged for her lover to disguise himself as a madman, rush from the crowd, and kiss her just before the test. When she placed her hand in the mouth, she could truthfully swear that no man had ever kissed her except her husband and the madman. The mouth accepted her oath. The story was told as a warning that cleverness could outwit divine justice — or as admiration for a woman who beat a rigged system. The area around the Bocca was once the Forum Boarium, Rome''s ancient cattle market. Beneath the church, archaeologists have found layers stretching back to the 6th century BC. You are standing on three thousand years of continuous human activity, and most people only notice the face.',
 'A medieval woman outwitted the Mouth by arranging for her lover to kiss her in disguise — the stone accepted her technicality.',
 'Look at the ground beneath your feet — this was Rome''s ancient cattle market, with archaeological layers going back to the 6th century BC.'),

-- Story 4: photography/culture (witty)
('rome_mouth_of_truth', ARRAY['photography', 'culture'], 'witty',
 'The Mouth of Truth is arguably Rome''s most overrated attraction, and also one of its most fun — which is an unusual combination. The experience is objectively absurd: you wait in line, put your hand in a disc, pretend to be scared, take a photo, and leave. The whole thing takes ten seconds and you''ve achieved nothing. And yet, everyone does it, everyone laughs, and everyone posts the photo. There''s something honest about a tourist attraction that makes no attempt to be anything other than silly. The portico of Santa Maria in Cosmedin, where the disc is mounted, is actually architecturally gorgeous — Corinthian columns, medieval frescoes, a 6th-century floor — but nobody looks at any of it. They''re all staring at a drain cover. If you want to be a contrarian, skip the mouth and go inside the church. The Cosmatesque floor alone is worth the detour.',
 'Everyone queues thirty minutes for a drain cover while ignoring the gorgeous 6th-century church behind it.',
 'After the obligatory hand-in-mouth photo, step inside Santa Maria in Cosmedin — the Cosmatesque floor is the real treasure.');
