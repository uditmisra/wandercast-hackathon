-- London Stories Import
-- 12 places × 4 stories each = 48 curated stories
-- Run AFTER import-london.sql (which creates the city + places)
-- Includes enrichment columns: story_type, fun_facts, look_closer_challenge, suggested_questions

-- ============================================================
-- 1. BUCKINGHAM PALACE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

-- Story 1: history/architecture (scholarly)
('london_buckingham_palace', ARRAY['history', 'architecture'], 'scholarly',
 'That facade you''re looking at? It''s a lie — architecturally speaking. The entire east front was refaced in 1913 with Portland stone, essentially gift-wrapping a building that started life as a townhouse for the Duke of Buckingham in 1703. George IV spent a fortune turning it into a palace in the 1820s, then never actually lived here. Queen Victoria was the first monarch to move in, in 1837, partly because the previous royal residence — St James''s Palace — was, in her words, antiquated. Count the windows on the front face. There are 240 bedrooms behind them. The building has its own post office, police station, cinema, and even a cash machine — though only the royal family can use it.',
 'The palace facade is a 1913 disguise over a 1703 townhouse — George IV spent a fortune on it and never moved in.',
 'Count the windows across the east front — there are 240 bedrooms behind that Portland stone facade.',
 'hidden-history',
 ARRAY['The palace has 775 rooms including 78 bathrooms, 52 royal and guest bedrooms, and 188 staff bedrooms', 'There is a private cash machine in the basement — only the royal family can use it', 'The 1913 refacing took just 13 weeks, done while the royal family was on holiday at Balmoral'],
 'Find the carved lion and unicorn on the central gates — the lion faces left, unusual in heraldry. Can you spot the difference from other royal crests?',
 ARRAY['Why did Queen Victoria choose this palace over St James''s Palace?', 'What happened to the Duke of Buckingham''s original townhouse design?']),

-- Story 2: local-life/sensory (casual)
('london_buckingham_palace', ARRAY['local-life', 'culture'], 'casual',
 'So that flag up there tells you everything. If it''s the Royal Standard — the one with lions and a harp — the monarch is home. If it''s the Union Jack, they''re out. Locals barely glance at it anymore but tourists crane their necks trying to figure it out. The Changing of the Guard happens most days in summer, fewer in winter, and the timing is genuinely unpredictable — don''t trust the internet, trust the notice board at the gate. Here''s the thing about this forecourt though: it''s designed to make you feel small. That Victoria Memorial behind you, the wide-open space, the symmetry — it''s all stage management. Stand in the centre and notice how your voice drops. That''s the architecture working on you.',
 'The flag on top tells you if the monarch is home — Royal Standard means yes, Union Jack means out.',
 'Look up at the flagpole on the roof — is it the Royal Standard or the Union Jack today?',
 'local-secret',
 ARRAY['The Changing of the Guard was once cancelled because a guardsman fainted inside his bearskin hat — they weigh over 450g', 'The Victoria Memorial contains 2,300 tonnes of white marble and took 10 years to complete', 'The palace garden has its own lake, 350 types of wildflower, and a tennis court'],
 'Try to spot which windows have lights on — each reveals an occupied office or apartment behind the facade.',
 ARRAY['What is the daily routine of the guards who stand at the gates?', 'Can you actually visit inside the palace during summer?']),

-- Story 3: oddities/hidden detail (witty)
('london_buckingham_palace', ARRAY['history', 'myths'], 'witty',
 'In 1982, a man named Michael Fagan climbed the palace wall, shinned up a drainpipe, and wandered the corridors until he found the Queen''s bedroom. He sat on the edge of her bed and asked for a cigarette. She calmly pressed her alarm button — twice — and nobody came. She kept him talking for about ten minutes until a footman arrived. The security review that followed was, to put it mildly, thorough. But Fagan wasn''t charged with trespassing because, at the time, trespassing in a royal palace wasn''t actually a criminal offence. They got him on stealing half a bottle of wine instead. Look at those railings — they''ve been upgraded since.',
 'A man broke into the Queen''s bedroom in 1982 and asked her for a cigarette — trespassing wasn''t even illegal.',
 'Look at the palace railings and the camera clusters on the gateposts — direct result of one man and a drainpipe in 1982.',
 'scandal',
 ARRAY['Fagan broke in twice — the first time, a month earlier, he stole wine and left completely undetected', 'The Queen kept Fagan talking by calmly asking about his family and children', 'After the incident, palace security spending increased by over 2 million pounds in a single year'],
 'Count the security cameras on the nearest gatepost — there are more than you''d expect, all installed after the Fagan breach.',
 ARRAY['What other security breaches has the palace had over the years?', 'How did the Fagan incident change royal protection procedures?']),

-- Story 4: perspective shift (dramatic)
('london_buckingham_palace', ARRAY['culture', 'photography'], 'dramatic',
 'Turn around. Face away from the palace. That long tree-lined avenue stretching toward Admiralty Arch — that''s The Mall, and on coronation days, jubilees, and royal weddings, it fills with a river of people so dense you can''t see the tarmac. In 2022, over a million people stood along this route for the Queen''s funeral procession. Complete silence. A million people and you could hear footsteps. The Mall was redesigned by Aston Webb in 1911 as a processional route — basically a piece of urban theatre. Stand here at sunset and the whole avenue turns gold. The palace becomes a silhouette. For about ten minutes, this becomes the most photogenic spot in London. Locals know. Tourists don''t.',
 'The Mall held over a million silent people for the Queen''s funeral — you could hear footsteps.',
 'Turn your back on the palace and face The Mall — that avenue is designed as a stage for a million spectators.',
 'perspective-shift',
 ARRAY['The Mall''s red surface is coloured with crushed iron oxide — designed to resemble a ceremonial red carpet', 'Admiralty Arch at the far end has a nose sculpture hidden at human height — rubbing it is a naval tradition', 'The plane trees lining The Mall were planted specifically to shade Queen Victoria''s carriage rides'],
 'Face The Mall at sunset and wait — for about ten minutes the entire avenue turns gold. See if you can capture the palace as a silhouette.',
 ARRAY['What happens along The Mall during a coronation procession?', 'Why is the road surface of The Mall coloured red?']);

-- ============================================================
-- 2. ST JAMES'S PARK
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_st_jamess_park', ARRAY['history', 'nature'], 'scholarly',
 'This park was a swamp. Henry VIII drained it in the 1530s to create a deer hunting ground, which is a very Henry VIII thing to do. Charles II redesigned it in the French style after seeing Versailles and thought London deserved something similar. But the park you''re walking through now is mostly John Nash''s work from the 1820s — he turned the rigid canal into this curving lake and planted the tree canopy to create what landscape architects call borrowed views. Stand by the bridge and look east: you get Whitehall framed by willows. Look west: Buckingham Palace floating above the water. Nash designed those sightlines deliberately. Nothing here is accidental.',
 'Henry VIII drained a swamp here for deer hunting — the lake and sightlines were designed by John Nash 300 years later.',
 'Stand on the bridge and look east toward Whitehall, then west toward the palace — both views were designed by Nash.',
 'hidden-history',
 ARRAY['The park covers 23 hectares and is the oldest of London''s eight Royal Parks', 'John Nash''s curving lake replaced a rigid straight canal that Charles II had modelled on the canals at Versailles', 'The park contains over 100 species of plants, many chosen by Nash to create specific colour effects through the seasons'],
 'Stand on the footbridge and try to spot both Buckingham Palace (west) and Whitehall (east) framed by trees — Nash designed these sightlines to feel accidental.',
 ARRAY['How did John Nash transform the original French-style canal into the lake we see today?', 'What other London landmarks did John Nash design?']),

('london_st_jamess_park', ARRAY['nature', 'local-life'], 'casual',
 'The pelicans. You have to see the pelicans. St James''s Park has had pelicans since 1664, when the Russian ambassador gave them to Charles II as a diplomatic gift. There are currently about seven, and they''re fed fresh fish every afternoon around 2:30pm near Duck Island. They''re not shy — they''ve been known to swallow pigeons whole, which is genuinely horrifying if you see it happen. The park also has around 15 species of waterfowl on the lake at any given time. But the pelicans are the stars. Find a bench near the east end of the lake and just watch. Office workers eat lunch here every day surrounded by birds that predate their buildings by centuries. That contrast is peak London.',
 'The park has had pelicans since 1664 — a gift from Russia — and they''ve been caught swallowing pigeons whole.',
 'Head to the east end of the lake near Duck Island — the pelicans are fed fresh fish around 2:30pm daily.',
 'local-secret',
 ARRAY['A pelican named Gargi was caught on camera swallowing a pigeon whole in 2006 — the video went viral', 'The pelicans are Great White Pelicans, native to Africa, and each one eats about 1kg of fish per day', 'Duck Island in the centre of the lake has its own cottage, built in 1840, used by the London Ornithological Society'],
 'Can you count the pelicans on or near the lake? There should be about seven — they tend to gather near Duck Island.',
 ARRAY['Why did the Russian ambassador choose pelicans as a diplomatic gift?', 'What other unusual animals have lived in London''s royal parks?']),

('london_st_jamess_park', ARRAY['politics', 'history'], 'dramatic',
 'In the Cold War, this park was spy territory. The bench-lined paths between Whitehall and the park were favoured meeting spots for intelligence officers — close enough to the ministries to look like a lunch break, secluded enough for a quiet conversation. Kim Philby, the most damaging double agent in British history, reportedly met his Soviet handlers within sight of where you''re standing. MI5 and MI6 headquarters are both within a ten-minute walk. The park still has an odd energy at lunchtime — hundreds of civil servants eating sandwiches in silence, checking phones, having conversations they can''t have indoors. Some things haven''t changed much since the 1960s.',
 'Kim Philby met his Soviet handlers in this park — MI5 and MI6 are both within a ten-minute walk.',
 'Look at the benches along the path toward Whitehall — in the Cold War, these were favoured spots for intelligence handoffs.',
 'spy-story',
 ARRAY['Kim Philby passed secrets to the Soviets for 30 years before fleeing to Moscow in 1963', 'MI5 headquarters at Thames House and MI6 at Vauxhall Cross are both visible from the park''s bridges', 'During WWII, the park''s lake was drained and covered with temporary government buildings'],
 'Sit on one of the benches facing Whitehall and observe the lunchtime crowd — civil servants still use these paths for conversations they can''t have indoors.',
 ARRAY['How many known double agents operated in London during the Cold War?', 'Why was this park specifically favoured by intelligence officers for meetings?']),

('london_st_jamess_park', ARRAY['photography', 'design'], 'witty',
 'Here''s the trick every London photographer knows: the footbridge in the middle of the lake gives you two completely different cities depending on which way you face. East: the domes and turrets of Whitehall and Horse Guards Parade, looking like a slightly unreal period drama. West: Buckingham Palace sitting above the water, framed by willows, looking like a postcard that''s almost too perfect. The genius is that Nash designed it so you can''t see both at once — you have to choose. It''s like the park is making you pick a version of London. Sunset is the cheat code. The water turns copper and both views go soft. Every Instagrammer in Westminster knows about this spot. You''re welcome.',
 'The footbridge forces you to choose between two Londons — Nash designed it so you can''t see both at once.',
 'Walk to the centre of the footbridge and face east, then west — two completely different cities.',
 'perspective-shift',
 ARRAY['The footbridge was rebuilt in 1957 — the original suspension bridge by Nash swayed dangerously in the wind', 'At sunset, the lake reflects both Buckingham Palace and the London Eye simultaneously from certain angles', 'The willow trees framing the western view were specifically planted to soften the palace''s formal facade'],
 'Stand at the exact centre of the bridge and photograph east, then west, without moving your feet. Compare the two images — they look like different cities.',
 ARRAY['What other hidden photography spots did Nash design into London''s parks?', 'How has the view from this bridge changed over the last 200 years?']);

-- ============================================================
-- 3. WESTMINSTER ABBEY
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_westminster_abbey', ARRAY['history', 'architecture'], 'scholarly',
 'Every English monarch since William the Conqueror in 1066 has been crowned in this building — that''s nearly a thousand years of continuous ceremonial use. The abbey you''re looking at is mostly Henry III''s rebuild from 1245, designed to rival the great French cathedrals like Reims and Amiens. Look at the flying buttresses along the south side — they''re doing real structural work, not just decoration. They transfer the weight of that vaulted ceiling outward so the walls can be thinner, which means bigger windows, which means more light inside. It''s an engineering solution disguised as beauty. Over 3,300 people are buried here, making the floor itself a kind of geological record of British power.',
 'Every monarch since 1066 has been crowned here — 3,300 people are buried under the floor.',
 'Look at the flying buttresses along the south wall — they''re not decorative, they''re holding the ceiling up.',
 'hidden-history',
 ARRAY['The abbey floor is so crowded with burials that some coffins are stacked five deep beneath the stones', 'The Coronation Chair has been used for every coronation since 1308 and still bears graffiti carved by Westminster schoolboys in the 18th century', 'Charles Darwin was buried here in 1882 despite being an agnostic — his scientific status overrode religious objections'],
 'Look at the flying buttresses on the south wall and count them — each one transfers tonnes of ceiling weight outward to allow the thin walls and tall windows.',
 ARRAY['Why did Henry III want the abbey to rival French cathedrals like Reims?', 'Who decides which famous people are buried in Westminster Abbey?']),

('london_westminster_abbey', ARRAY['literature', 'culture'], 'casual',
 'Poets'' Corner started by accident. Geoffrey Chaucer was buried here in 1400 — not because he wrote The Canterbury Tales, but because he lived nearby and rented rooms from the abbey. It wasn''t until the 1500s that someone thought to add a monument, and then other writers wanted in. Now it''s got Dickens, Hardy, Kipling, Tennyson, and dozens more. Some are actual burials, some are just memorial stones. The funny thing is, some of the greatest writers aren''t here at all — Shakespeare has a memorial but is buried in Stratford. Jane Austen has a stone but it was only added in 1967. The politics of who gets in and who doesn''t is its own centuries-long drama.',
 'Chaucer wasn''t buried here for his writing — he just rented rooms nearby. Poets'' Corner happened by accident.',
 'Find the entrance to Poets'' Corner on the south transept side — Chaucer''s tomb started it all in 1400.',
 'literary-legacy',
 ARRAY['Lord Byron was denied a memorial until 1969, 145 years after his death, because of his scandalous reputation', 'Dickens wanted to be buried in Rochester but was overruled — his funeral at the abbey was deliberately kept small', 'The memorial to Oscar Wilde wasn''t added until 1995, nearly a century after his imprisonment and death'],
 'Find Chaucer''s tomb and then count how many poets and writers have memorials nearby — there are over 100 in this corner alone.',
 ARRAY['Which famous writers have been denied a place in Poets'' Corner and why?', 'How did Chaucer''s accidental burial here create a literary tradition?']),

('london_westminster_abbey', ARRAY['history', 'myths'], 'dramatic',
 'On Christmas Day 1066, William the Conqueror was crowned inside this abbey, and it nearly ended in disaster. The congregation shouted their approval in both English and Norman French, and the guards outside — hearing the roar — thought a riot had broken out. They started setting fire to surrounding buildings. Inside, the ceremony continued through smoke and panic, with William reportedly trembling on the throne. It set the tone for what was, let''s be honest, a pretty turbulent reign. That coronation chair — the one Edward I had built in 1296 — is still inside, still used. It''s the oldest piece of furniture in England still serving its original purpose.',
 'William the Conqueror''s coronation nearly caused a riot — guards set fires outside while he trembled on the throne.',
 'Look at the great west door — every coronation procession has passed through this entrance since 1066.',
 'hidden-history',
 ARRAY['The Coronation Chair had the Stone of Scone underneath it from 1296 until it was returned to Scotland in 1996', 'William the Conqueror''s guards set fire to nearby houses, and the congregation fled — William was crowned in a near-empty, smoke-filled abbey', 'The chair has been used for 38 coronations and bears carved graffiti from centuries of visitors'],
 'Look at the great west doors and imagine a coronation procession passing through — every monarch since 1066 has entered this way.',
 ARRAY['What happened to the Stone of Scone that was kept under the Coronation Chair?', 'Which coronation at the abbey had the most dramatic or unusual incidents?']),

('london_westminster_abbey', ARRAY['architecture', 'design'], 'witty',
 'The two west towers that define the abbey''s silhouette weren''t finished until 1745 — nearly 500 years after the rest of the building. They were designed by Nicholas Hawksmoor, who was basically the closer that English architecture called in when projects stalled. He was Christopher Wren''s assistant and inherited all the difficult jobs. The towers are technically Gothic, but if you look carefully, the proportions are subtly different from the medieval work below — a bit more vertical, a bit more confident. It''s like watching someone finish someone else''s sentence perfectly. The abbey has been under continuous renovation for so long that the scaffolding is practically a design feature. If you see it without scaffolding, buy a lottery ticket.',
 'The west towers took 500 years to finish — completed in 1745 by Wren''s assistant Hawksmoor.',
 'Compare the west towers to the older stonework below — Hawksmoor''s 1745 additions are subtly taller and crisper.',
 'design-detail',
 ARRAY['Hawksmoor died in 1736, nine years before the towers were completed — he never saw them finished', 'The abbey has been under some form of renovation or repair for over 750 consecutive years', 'The rose window above the great west door is one of the largest medieval stained glass windows in England'],
 'Compare the stone colour and carving style of the west towers with the older walls below — Hawksmoor''s 18th-century work is crisper and slightly lighter.',
 ARRAY['How did Hawksmoor match his 18th-century design to a 13th-century building?', 'Why did it take 500 years to finish the abbey''s west towers?']);

-- ============================================================
-- 4. PALACE OF WESTMINSTER / BIG BEN
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_palace_of_westminster', ARRAY['history', 'architecture'], 'scholarly',
 'The building looks medieval but it''s mostly Victorian — the original Palace of Westminster burned down in 1834 when overheated tally sticks set fire to a furnace. Tally sticks: the medieval accounting system they were still using in the 19th century. Charles Barry designed the replacement in the Perpendicular Gothic style, with Augustus Pugin handling every interior detail down to the ink wells and umbrella stands. Pugin worked himself into a breakdown doing it. The building contains over 1,100 rooms, 100 staircases, and 3 miles of corridors. Look at the stone — the original Anston limestone decayed so badly they''ve been replacing it with Clipsham stone since the 1920s. The building is essentially replacing itself, panel by panel.',
 'Parliament burned down in 1834 because they were still using medieval tally sticks — the fire started in the accounting system.',
 'Look at the stonework closely — lighter panels are 20th-century Clipsham stone replacing the original Victorian limestone.',
 'hidden-history',
 ARRAY['Pugin designed every detail including wallpaper, tiles, hat stands, and even the inkwells — he had a nervous breakdown at 40 and died at 40', 'The fire of 1834 drew crowds including J.M.W. Turner, who painted the blaze from a boat on the Thames', 'The building contains 3 miles of corridors and staff still regularly get lost in unfamiliar sections'],
 'Look at the exterior stone carefully — you can spot the difference between the original darker Anston limestone and the lighter Clipsham stone replacement panels.',
 ARRAY['Why were they still using medieval tally sticks in 1834?', 'How did Pugin''s obsessive attention to detail affect his health and career?']),

('london_palace_of_westminster', ARRAY['engineering', 'local-life'], 'casual',
 'Big Ben isn''t the tower, it''s the bell. Everyone says this and everyone still calls the tower Big Ben anyway, so let''s just go with it. The tower''s official name is Elizabeth Tower, renamed in 2012 for the Diamond Jubilee. The bell itself weighs 13.7 tonnes and has a crack in it — it''s been cracked since 1859, which is why it has that slightly imperfect tone. They rotated the bell so the hammer hits a different spot and just kept going. The clock is kept accurate by adding or removing old pennies from the pendulum — literally. A single penny changes the clock speed by 0.4 seconds per day. Next time you hear those chimes, you''re hearing a cracked bell corrected by loose change.',
 'Big Ben has been cracked since 1859 — the clock is kept accurate by stacking pennies on the pendulum.',
 'Listen for the chimes on the quarter hour — that slightly imperfect tone is a crack that''s been there since 1859.',
 'engineering-marvel',
 ARRAY['A single old penny placed on the pendulum changes the clock''s speed by 0.4 seconds per day', 'The bell was named either after Sir Benjamin Hall (the works commissioner) or Ben Caunt (a heavyweight boxer) — nobody is certain', 'The clock mechanism is so reliable it has kept time within a second of accuracy for most of its 160-year life'],
 'Listen carefully for the chimes on the quarter hour — can you hear the slightly imperfect tone caused by the crack?',
 ARRAY['How do the clockmakers decide when to add or remove pennies from the pendulum?', 'Why didn''t they just replace the cracked bell in 1859?']),

('london_palace_of_westminster', ARRAY['politics', 'history'], 'dramatic',
 'On November 5th 1605, Guy Fawkes was found in the cellars beneath this building with 36 barrels of gunpowder — enough to level everything within a wide radius. The Gunpowder Plot aimed to blow up the House of Lords during the State Opening of Parliament, killing King James I and most of the Protestant establishment in a single blast. Fawkes was a soldier, not the ringleader — that was Robert Catesby — but he drew the short straw of guarding the gunpowder. To this day, before every State Opening, the Yeoman of the Guard search the cellars. It''s ceremonial now, but the tradition tells you something about institutional memory. Four hundred years later, they still check.',
 'The cellars are still searched before every State Opening — 400 years after the Gunpowder Plot.',
 'Look at the base of the building near Old Palace Yard — the cellars Fawkes was found in ran beneath this stretch.',
 'hidden-history',
 ARRAY['The 36 barrels contained about 2,500 pounds of gunpowder — enough to destroy the entire building and damage structures 500 metres away', 'Fawkes gave his name as John Johnson when caught and refused to reveal the other plotters for two days despite torture', 'The Yeoman of the Guard search is now accompanied by a lamp and tradition — they no longer expect to find gunpowder'],
 'Look at the base of the building near Old Palace Yard and imagine the cellars beneath — this is roughly where the 36 barrels were hidden.',
 ARRAY['Why is Guy Fawkes remembered more than Robert Catesby, the actual ringleader?', 'How did the Gunpowder Plot change laws and attitudes toward Catholics in England?']),

('london_palace_of_westminster', ARRAY['photography', 'design'], 'witty',
 'Here''s something most people miss: the Victoria Tower at the south end of the building is actually taller than Elizabeth Tower at the north end. Victoria Tower is 98 metres; Elizabeth Tower is 96. But nobody photographs Victoria Tower because it doesn''t have a clock face and it doesn''t have a name that sounds like a person. It houses the Parliamentary Archives — every Act of Parliament since 1497 is stored in there. Meanwhile, Elizabeth Tower gets all the Instagram attention for being two metres shorter with a better marketing department. If you want the classic postcard shot, stand on Westminster Bridge and look north. If you want to feel clever, photograph Victoria Tower instead and tell people what it actually contains.',
 'Victoria Tower is taller than Big Ben''s tower but gets almost zero tourist attention — it holds every Act of Parliament since 1497.',
 'Look south along the building to the Victoria Tower — it''s two metres taller than Elizabeth Tower but almost nobody photographs it.',
 'perspective-shift',
 ARRAY['The Parliamentary Archives in Victoria Tower contain over 3 million documents, including the original Death Warrant of Charles I', 'Victoria Tower was the tallest square tower in the world when completed in 1860', 'The Union Flag flies from Victoria Tower when Parliament is in session — most people think it flies from Elizabeth Tower'],
 'Photograph Victoria Tower and Elizabeth Tower from the same spot — compare the heights and notice which one is actually taller.',
 ARRAY['What is the oldest document stored in the Parliamentary Archives?', 'Why does Victoria Tower get so much less attention despite being taller?']);

-- ============================================================
-- 5. WHITEHALL
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_whitehall', ARRAY['history', 'architecture'], 'scholarly',
 'Whitehall was once the largest palace in Europe — over 1,500 rooms sprawling from the Thames to St James''s Park. Henry VIII seized it from Cardinal Wolsey in 1530 and turned it into his primary London residence. Almost all of it burned down in 1698. The only surviving piece is the Banqueting House, designed by Inigo Jones in 1622. Look at it: that clean Palladian facade was revolutionary in a London of timber and Tudor brick. It was the first purely Renaissance building in England. The Rubens ceiling inside was commissioned by Charles I, who later walked through a first-floor window of the same building to his own execution in 1649. Architecture and irony, side by side.',
 'The Banqueting House is the only survivor of a 1,500-room palace — Charles I was executed through its window.',
 'Find the Banqueting House''s pale stone facade on your left — the only surviving piece of what was Europe''s largest palace.',
 'hidden-history',
 ARRAY['Henry VIII''s Whitehall Palace had tennis courts, a bowling alley, a cockpit, and a tiltyard for jousting', 'The Rubens ceiling panels that Charles I commissioned depict the divine right of kings — the irony of his execution beneath them was not lost on contemporaries', 'The fire of 1698 started when a laundry maid left clothes drying too close to a charcoal brazier'],
 'Find the Banqueting House facade and look for the first-floor windows — Charles I stepped through one of them onto the execution scaffold.',
 ARRAY['What did the full Whitehall Palace look like before the fire of 1698?', 'Why was Inigo Jones''s Palladian style so revolutionary for London in 1622?']),

('london_whitehall', ARRAY['politics', 'local-life'], 'casual',
 'Every important government department lines this street. The Ministry of Defence, the Foreign Office, the Cabinet Office, the Treasury — they''re all within a few hundred metres of each other. That''s not a coincidence; it''s proximity as power. Decisions that affect millions happen in rooms you can see from the pavement. The Cenotaph — that plain white memorial in the middle of the road — is the national war memorial. It was designed by Edwin Lutyens and originally built in wood for the 1919 peace celebrations. The public reaction was so strong they rebuilt it in Portland stone. Watch how people behave around it: some pause, some salute, most walk past. On Remembrance Sunday in November, the entire street shuts down.',
 'The Cenotaph was built in wood as a temporary memorial — public grief made it permanent in stone.',
 'Look for the Cenotaph in the centre of the road — watch how people''s pace changes as they pass it.',
 'power-politics',
 ARRAY['The word Cenotaph means "empty tomb" in Greek — there is no one buried inside or beneath it', 'Lutyens designed the Cenotaph in just six days, sketching it on the back of an envelope', 'On Remembrance Sunday, all traffic stops and even the government departments fall silent for two minutes at 11am'],
 'Watch pedestrians as they pass the Cenotaph — notice how some slow down, some pause, and some change their path entirely.',
 ARRAY['Why did the government originally plan for only a temporary wooden memorial?', 'What happens on Whitehall during the Remembrance Sunday ceremony?']),

('london_whitehall', ARRAY['history', 'myths'], 'dramatic',
 'In January 1649, King Charles I walked from St James''s Palace down what is now this road to his execution. The scaffold was built outside the Banqueting House — the same building where he''d hosted lavish masques and commissioned that extraordinary Rubens ceiling celebrating the divine right of kings. He wore two shirts so he wouldn''t shiver in the cold and give the crowd the impression he was afraid. His last word to the executioner was "Remember." Nobody is entirely sure what he meant. The spot isn''t marked with anything dramatic — no plaque on the ground, no monument. You just walk over it. Every commuter heading to Charing Cross station walks over the spot where the English monarchy was interrupted.',
 'Charles I wore two shirts to his execution so the crowd wouldn''t mistake his shivering for fear.',
 'Stand in front of the Banqueting House and look down — the execution scaffold stood roughly where the road is now.',
 'hidden-history',
 ARRAY['Charles I asked for an extra shirt because the January cold might make him tremble, and he didn''t want the crowd to think he was afraid', 'The execution was watched by thousands — some reportedly dipped handkerchiefs in his blood as souvenirs', 'The monarchy was restored just 11 years later when Charles II returned from exile in 1660'],
 'Stand in front of the Banqueting House and look at the road surface — you are standing approximately where the execution scaffold was erected.',
 ARRAY['What did Charles I mean by his last word, "Remember"?', 'How did London react in the days after the execution of the king?']),

('london_whitehall', ARRAY['culture', 'photography'], 'witty',
 'Horse Guards Parade is the most photographed military checkpoint in the world where absolutely nothing is being guarded. The mounted sentries sit on horseback in those little booths, and tourists queue to pose with them like they''re Disney characters. The soldiers aren''t allowed to react, which has produced some of the internet''s best deadpan content. But here''s the thing: walk through the archway behind them and you''re in Horse Guards Parade ground — the actual open space where Trooping the Colour happens every June. This was Henry VIII''s jousting yard. From the parade ground, turn around and look back through the archway: you get a perfectly framed view of Whitehall. That sightline has been open for 500 years.',
 'Horse Guards Parade was Henry VIII''s jousting yard — the sentries aren''t guarding anything anymore.',
 'Walk through the Horse Guards archway and turn around — the view back through frames Whitehall perfectly.',
 'perspective-shift',
 ARRAY['The mounted guards are from the Household Cavalry and serve 2-hour shifts — they''re trained not to react but can ask people to step back', 'Horse Guards Parade was used for jousting tournaments by Henry VIII and is still the venue for Trooping the Colour', 'The clock on Horse Guards has a black mark at the 2 o''clock position, said to mark the hour of Charles I''s execution'],
 'Walk through the Horse Guards archway, turn around, and photograph the perfectly framed view of Whitehall — this sightline has been open for 500 years.',
 ARRAY['Why do the Horse Guards sentries have such strict rules about not reacting?', 'What is the significance of the black mark on the Horse Guards clock?']);

-- ============================================================
-- 6. 10 DOWNING STREET
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_10_downing_street_viewpoint', ARRAY['history', 'politics'], 'scholarly',
 'Number 10 is actually three houses knocked together. The modest terraced house you see from the street is connected to a larger building behind it and a house on the adjoining street. Behind that famous black door there are approximately 100 rooms. The house was a gift from George II to Robert Walpole, Britain''s first Prime Minister, in 1735. Walpole accepted it on the condition it be attached to the office, not to him personally. That decision created the convention that the PM lives at Number 10. The door is blast-proof, weighs more than it looks, and can only be opened from the inside. There''s no keyhole, no handle on the outside. The Prime Minister literally cannot let themselves in.',
 'The PM can''t open their own front door — Number 10 has no external keyhole or handle.',
 'Look down Downing Street toward the black door — it''s blast-proof with no external handle, opened only from inside.',
 'hidden-history',
 ARRAY['Number 10 is three houses merged into one — the modest front hides a much larger building behind', 'Robert Walpole insisted the house belong to the office of PM, not to him personally — that convention has held since 1735', 'The current door is made of blast-resistant steel but painted to look like the original Georgian wood door'],
 'Look at the proportions of Number 10 compared to its neighbours — can you tell that it''s actually three houses merged together?',
 ARRAY['Why did Walpole insist the house belong to the office rather than to him personally?', 'How many Prime Ministers have lived at Number 10?']),

('london_10_downing_street_viewpoint', ARRAY['local-life', 'culture'], 'casual',
 'The gates blocking Downing Street weren''t always there. Until 1989, you could walk right up to the door and knock on it. Margaret Thatcher had the security gates installed after IRA threats. Before that, it was genuinely a regular-looking street that happened to contain the PM''s house. There''s a famous photo from the 1960s of a milkman delivering bottles to Number 10 like any other terraced house. Larry the Cat has lived at Number 10 since 2011 and has now outlasted four Prime Ministers. His official title is Chief Mouser to the Cabinet Office. He has his own Wikipedia page, and it''s longer than some MPs''. He''s usually visible through the window or on the doorstep if you''re patient.',
 'Larry the Cat has outlasted four Prime Ministers — his Wikipedia page is longer than some MPs''.',
 'Watch for Larry the Cat on the Number 10 doorstep — he''s been Chief Mouser since 2011, outlasting four PMs.',
 'local-secret',
 ARRAY['Larry the Cat was adopted from Battersea Dogs and Cats Home in 2011 and has a mixed record as a mouser', 'Before the gates, a milkman regularly delivered bottles to Number 10 just like any terraced house', 'The security gates cost approximately 750,000 pounds when installed in 1989'],
 'Be patient and watch the doorstep of Number 10 — Larry the Cat frequently appears, especially in the mornings.',
 ARRAY['What is Larry the Cat''s actual track record as Chief Mouser?', 'What was it like to walk freely up to the Number 10 door before 1989?']),

('london_10_downing_street_viewpoint', ARRAY['history', 'architecture'], 'dramatic',
 'The front of Number 10 is a lie. Those black bricks? They''re actually yellow London stock bricks underneath, darkened by 200 years of coal pollution. When they cleaned the building in the 1960s, the yellow bricks emerged and everyone hated it — it didn''t look like Number 10 anymore. So they painted it black. Every few years they repaint it to maintain the illusion. The house is also structurally precarious — it was cheaply built in the 1680s and has been shored up, underpinned, and reinforced so many times that it''s essentially held together by renovations. Margaret Thatcher''s government spent millions stabilising it in the 1980s. The most powerful address in Britain is basically a patched-up terrace with a good paint job.',
 'Number 10''s black bricks are actually painted yellow ones — they cleaned off the soot and everyone hated it.',
 'Look at the facade — those black bricks are yellow underneath, painted to maintain the image after a 1960s cleaning.',
 'hidden-history',
 ARRAY['The yellow London stock bricks were darkened by two centuries of coal soot — when cleaned, the public demanded they be painted black', 'Margaret Thatcher''s renovation in the 1980s cost several million pounds and involved underpinning the entire foundation', 'The famous lion''s head door knocker is a replica — the original is kept safe inside'],
 'Look closely at the brickwork — the uniformly dark colour is actually paint over yellow bricks, maintained to preserve the iconic appearance.',
 ARRAY['Why did the public react so negatively when the true yellow bricks were revealed?', 'How structurally sound is Number 10 today after centuries of repairs?']),

('london_10_downing_street_viewpoint', ARRAY['politics', 'photography'], 'witty',
 'Every time a new PM arrives, they do the same thing: stand at the door, wave, walk in. Every time one leaves, they do the same thing in reverse. The choreography is identical because the street is so narrow that there''s really only one angle for the cameras. That''s why every Number 10 photo looks the same. The podium where PMs give statements is bolted to a specific spot on the pavement. Even the emotional moments are staged to hit the same camera position. The real power move, though, is the people you don''t see: the permanent civil servants who stay when the PMs change. The building has about 200 staff. Most of them have been there longer than whoever''s in charge.',
 'The PM''s podium is bolted to a specific pavement spot — every statement hits the exact same camera angle.',
 'Notice how every Downing Street photo looks identical — the street is so narrow there''s only one camera angle.',
 'perspective-shift',
 ARRAY['The podium is bolted into a specific pavement position so every PM''s statement is filmed from the exact same angle', 'Around 200 permanent staff work at Number 10 — most outlast multiple Prime Ministers', 'The narrow street means press photographers have been shooting from essentially the same position since the 1920s'],
 'Compare Downing Street photos from different decades — the angle is identical because the street geometry allows only one camera position.',
 ARRAY['Who are the permanent staff who remain at Number 10 when prime ministers change?', 'How is the arrival and departure of a Prime Minister choreographed?']);

-- ============================================================
-- 7. CHURCHILL WAR ROOMS
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_churchill_war_rooms', ARRAY['history', 'architecture'], 'scholarly',
 'The War Rooms sit beneath the Treasury building, protected by a concrete slab that was reinforced to three metres thick — code-named "the Slab" — though Churchill privately doubted it would survive a direct hit. The complex was operational from August 1939 until Japan surrendered in August 1945. When the staff walked out and locked the doors, they left everything in place: maps, pins, charts, ashtrays. The rooms remained sealed for decades. What you see inside today is largely as it was on that final day. The Map Room operated 24 hours a day for six straight years. The phones connected directly to the White House. Churchill''s underground bedroom still has the desk microphone he used for wartime broadcasts that reached 70 percent of the British population.',
 'When the War Rooms closed in 1945, staff locked the doors and left everything in place — it stayed sealed for decades.',
 'Look for the small sign near the entrance at Clive Steps — the War Rooms sit directly beneath the building above you.',
 'hidden-history',
 ARRAY['The Map Room operated 24/7 for six straight years without a single day''s interruption', 'Churchill''s wartime broadcasts from the underground microphone reached 70% of the British population', 'The rooms were sealed in 1945 and not opened to the public until 1984 — nearly 40 years of untouched wartime history'],
 'Look at the building above the entrance and imagine three metres of reinforced concrete beneath it — that''s "the Slab" protecting the War Rooms.',
 ARRAY['Did Churchill really believe the concrete slab would survive a direct bomb hit?', 'What was daily life like for the 500 people who worked underground?']),

('london_churchill_war_rooms', ARRAY['local-life', 'history'], 'casual',
 'About 500 people worked down here during the war, and conditions were genuinely grim. No natural light, recycled air, and noise from the ventilation fans so loud that some staff developed hearing problems. People slept in shifts on bunks in the corridors. Churchill hated being underground — he''d sneak up to the roof of the Treasury during air raids to watch the Blitz, which terrified his security team. The one luxury was a direct phone line to Roosevelt in the White House, disguised as a private toilet so nobody would ask questions. If you asked why Churchill kept disappearing into the loo, the answer was: he was calling the President. The staff canteen served powdered egg. Nobody missed it when the war ended.',
 'Churchill''s hotline to Roosevelt was disguised as a toilet so nobody would question his frequent visits.',
 'Look at the building above — Churchill used to sneak to its roof during air raids to watch the Blitz.',
 'scandal',
 ARRAY['The phone line to Roosevelt was hidden in a room labelled as a private toilet to avoid suspicion', 'Churchill''s rooftop Blitz-watching terrified his protection officers — he once had to be physically pulled back inside', 'Staff worked in shifts and many developed health problems from the recycled air and constant noise'],
 'Look up at the Treasury roof above the entrance — Churchill repeatedly snuck up there during air raids to watch the Blitz, terrifying his security team.',
 ARRAY['How did Churchill get away with sneaking to the roof during bombing raids?', 'What was the quality of life like for workers who spent months underground?']),

('london_churchill_war_rooms', ARRAY['engineering', 'history'], 'dramatic',
 'The entire complex was a secret hidden in plain sight. Thousands of people walked over it every day on King Charles Street without knowing what was underneath. The ventilation shaft was disguised as a normal building feature. The entrances were unmarked. If a bomb had scored a direct hit on the Treasury above, the three-metre concrete slab would have been the only thing between the War Cabinet and oblivion. Churchill was briefed that it probably wouldn''t hold. He used the rooms anyway. The decision to stay in London rather than evacuate the government was partly strategic and partly theatrical — Churchill understood that visible leadership mattered as much as military orders. Every night, the lights stayed on underground while London burned above.',
 'Churchill was told the concrete slab probably wouldn''t survive a direct hit — he used the rooms anyway.',
 'Stand on King Charles Street and look down — the War Rooms are directly beneath your feet, hidden for six years.',
 'engineering-marvel',
 ARRAY['The ventilation system was disguised as ordinary building infrastructure — even neighbouring office workers didn''t know what was below', 'Churchill was explicitly briefed that the slab would not survive a direct hit from a large bomb', 'The decision to keep the government in London rather than evacuate was as much about morale as military strategy'],
 'Stand on King Charles Street and stamp your foot lightly — the War Rooms are directly beneath, hidden in plain sight for six years.',
 ARRAY['Why did Churchill choose to stay in London rather than evacuate the government?', 'How was such a large underground complex kept secret from the public?']),

('london_churchill_war_rooms', ARRAY['culture', 'design'], 'witty',
 'Churchill had very specific requirements for his underground life. He insisted on a proper bed, not a bunk, because he napped religiously every afternoon — a habit he credited for his ability to work 18-hour days. He also insisted on a supply of champagne, brandy, and cigars, which his staff found both infuriating and reassuring. His typing pool worked in a windowless room and were famously accurate despite the noise. The museum gift shop now sells Churchill-branded cigars, which he would have found hilarious. The man understood personal branding a century before the term existed. His V-for-victory sign, his hat, his cigar, his one-liners — all deliberately cultivated. The War Rooms are as much a monument to image-making as to military strategy.',
 'Churchill insisted on champagne and afternoon naps underground — he credited the naps for his 18-hour workdays.',
 'Before you go in, notice the modest entrance — 500 people worked here in secret while London walked overhead.',
 'perspective-shift',
 ARRAY['Churchill napped every afternoon without exception — he believed this habit doubled his working capacity', 'His daily consumption included champagne at lunch, whisky in the afternoon, and brandy in the evening', 'The V-for-victory sign, the cigar, and the bowler hat were all deliberately cultivated as a personal brand'],
 'Notice how modest and unmarked the entrance is — imagine 500 people disappearing into this doorway every day while the street above carried on normally.',
 ARRAY['How did Churchill''s personal habits affect the running of the War Rooms?', 'Was Churchill''s public image genuinely calculated or naturally eccentric?']);

-- ============================================================
-- 8. LONDON EYE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_london_eye', ARRAY['engineering', 'architecture'], 'scholarly',
 'The London Eye wasn''t supposed to be permanent. It was built as a temporary millennium celebration — a five-year permit that just kept getting renewed. The wheel is 135 metres tall and was the world''s tallest Ferris wheel when it opened in 2000. Engineers floated the structure down the Thames in sections and assembled it horizontally on pontoons in the river, then raised it into position over two weeks. The capsules are numbered 1 to 33 — but there''s no capsule 13, because the operators decided superstition was simpler than explanation. Each capsule holds 25 people and weighs 10 tonnes. The wheel rotates continuously at 26 centimetres per second, slow enough to board without stopping. One revolution takes exactly 30 minutes.',
 'The Eye was temporary — a five-year permit that never ended. There''s no capsule 13.',
 'Look at the capsule numbers as they pass the boarding platform — count from 12 to 14 and notice what''s missing.',
 'engineering-marvel',
 ARRAY['Each of the 32 capsules weighs 10 tonnes and is climate-controlled year-round', 'The wheel rotates at 26 centimetres per second — slow enough to board without stopping, completing one revolution in 30 minutes', 'The Eye uses enough steel cable to stretch from London to Edinburgh — about 600 kilometres'],
 'Try to spot capsule numbers as they rotate past — count from 12 to 14 and notice that capsule 13 is missing.',
 ARRAY['Why was the London Eye originally meant to be temporary?', 'How did engineers manage to raise a 2,100-tonne structure from horizontal to vertical?']),

('london_london_eye', ARRAY['local-life', 'culture'], 'casual',
 'Here''s what Londoners actually think of the Eye: they never go on it. It''s in the same category as the Statue of Liberty for New Yorkers — you appreciate it from a distance and let the tourists have it. But the area around it is genuinely great. The South Bank promenade from here to the Tate Modern is one of the best walks in London — buskers, skateboarders, bookstalls under Waterloo Bridge, food stalls. In summer it feels like the whole city is outside. The Eye was designed by husband-and-wife architects David Marks and Julia Barfield, who entered a newspaper competition and won. They spent years fighting to get it built. Now it''s on the skyline alongside buildings that have been here for centuries. That''s London for you.',
 'The Eye was designed by a married couple who entered a newspaper competition — Londoners famously never ride it.',
 'Look along the South Bank promenade in either direction — the walk from here to Tate Modern is one of London''s best.',
 'local-secret',
 ARRAY['David Marks and Julia Barfield entered a Sunday Times competition for a millennium landmark — their design won out of hundreds', 'It took the couple seven years of planning battles and fundraising before construction even began', 'The Eye receives over 3 million visitors annually, but surveys show fewer than 10% of Londoners have ridden it'],
 'Look along the South Bank promenade in both directions — can you spot buskers, skateboarders, or the bookstalls under Waterloo Bridge?',
 ARRAY['Why do Londoners avoid riding the Eye despite living so close to it?', 'What was the original newspaper competition that led to the Eye being built?']),

('london_london_eye', ARRAY['engineering', 'history'], 'dramatic',
 'Raising the Eye was one of the great engineering dramas of the 1990s. The wheel was assembled lying flat on platforms in the Thames, then slowly raised by a strand-jacking system — cables pulling it upright degree by degree over a week. On the first attempt, a cable coupling failed and the lift stalled at a few degrees. The press had a field day. The engineers fixed it and resumed, raising 2,100 tonnes of steel to vertical while the entire country watched. The wind tolerance during the lift was tight — anything above 20 knots and they''d have had to abort. They got lucky with the weather. When it finally clicked into position, the engineering team reportedly opened champagne on the riverbank at 3am.',
 'The first attempt to raise the Eye failed live on television — engineers opened champagne at 3am when it finally stood.',
 'Look at the base where the wheel meets the river — the entire structure was raised from horizontal over a week of nerve.',
 'engineering-marvel',
 ARRAY['The first lift attempt failed when a cable coupling broke — the press nicknamed it "the lying Eye"', 'Wind speeds above 20 knots would have forced engineers to abort the entire raising operation', 'The total weight raised from horizontal to vertical was 2,100 tonnes — equivalent to about 350 elephants'],
 'Look at the massive A-frame support legs at the base — the entire 2,100-tonne wheel was raised from flat to vertical on those supports.',
 ARRAY['What exactly went wrong during the first attempt to raise the Eye?', 'How did the engineering team manage the risk of wind during the week-long raising?']),

('london_london_eye', ARRAY['photography', 'design'], 'witty',
 'The Eye has completely changed how people photograph London. Before 2000, the classic Thames shot was Big Ben reflected in the water. Now half the shots include the Eye, and it''s become the visual shorthand for "modern London" in the same way Big Ben means "old London." The capsules are designed as glass eggs to maximize the view, and they''re climate-controlled — warmer than you''d expect inside. The best photography moment from ground level is at dusk when the LED lights come on. They change colour for events: red white and blue for national celebrations, rainbow for Pride, purple for the Queen''s Jubilee. Stand on the opposite bank near Westminster Bridge for the reflection shot. Tripod helps. Tourists will photobomb you. Accept it.',
 'The Eye changed London photography forever — it replaced Big Ben as the skyline''s visual shorthand for "modern."',
 'Cross to the Westminster Bridge side of the river for the reflection shot — the LED lights change colour at dusk.',
 'perspective-shift',
 ARRAY['The LED lighting system can produce 16 million colour combinations and is changed for national events and holidays', 'The capsules are designed as sealed glass eggs — they don''t open, which is why the Eye can operate in rain and wind', 'Before the Eye, the classic London photograph was Big Ben reflected in the Thames — now the Eye appears in most skyline shots'],
 'Wait for dusk and watch the LED lights switch on — note what colour they are tonight and see if it corresponds to a national event.',
 ARRAY['How did the Eye change the way London''s skyline is photographed?', 'What determines the colour of the Eye''s LED lights on any given night?']);

-- ============================================================
-- 9. SOUTH BANK
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_south_bank', ARRAY['history', 'culture'], 'scholarly',
 'The South Bank was a wasteland until 1951. Bombed during the Blitz and largely derelict, the government chose it as the site for the Festival of Britain — a national morale boost designed to show that post-war Britain could still innovate. The Royal Festival Hall, the only surviving building from that festival, was built in just two years and remains one of the finest concert halls in the world. The Brutalist buildings that followed — the Hayward Gallery, Queen Elizabeth Hall, the National Theatre — were designed as a cultural fortress on the river. Love them or hate them, they''re some of the most uncompromising architecture in London. The raw concrete was a deliberate choice: honest materials for honest culture.',
 'This entire cultural strip was a bomb-damaged wasteland until 1951 — the Festival of Britain reinvented it.',
 'Look at the Royal Festival Hall — the only survivor of the 1951 Festival of Britain, built in just two years.',
 'hidden-history',
 ARRAY['The Festival of Britain attracted 8.5 million visitors in five months — a massive morale boost for post-war Britain', 'The Royal Festival Hall''s acoustics were so carefully designed that the auditorium floats on rubber pads to isolate it from vibration', 'The Brutalist concrete buildings were controversial from day one — their raw finish was a deliberate rejection of decorative architecture'],
 'Look at the Royal Festival Hall and compare its 1951 curves with the angular Brutalist buildings next to it — two very different visions of Britain built just 15 years apart.',
 ARRAY['Why did the government choose this bomb-damaged area for the Festival of Britain?', 'What other buildings from the 1951 Festival were demolished and why?']),

('london_south_bank', ARRAY['local-life', 'food'], 'casual',
 'The book market under Waterloo Bridge has been here since the 1980s and it''s one of London''s quiet treasures. Secondhand books, prints, maps — the kind of browsing that eats an hour without you noticing. The bridge above creates a sheltered corridor that stays dry even in rain, which is why it''s also a favourite spot for skateboarders. The skate spot at the Undercroft — just along from here — is one of the most famous in Europe and nearly got demolished for development. Skaters campaigned and won, which tells you something about what South Bank values. Grab something from one of the food stalls along the river walk and find a bench facing the water. St Paul''s dome across the river, boats going past, and the city humming around you.',
 'The skateboarders nearly lost their spot to developers — they campaigned and won, saving a legendary skate spot.',
 'Duck under Waterloo Bridge to find the book market — it stays dry even in the rain, open every day.',
 'local-secret',
 ARRAY['The Undercroft skate spot has been used continuously since the 1970s — it''s one of the oldest in Europe', 'The book market sellers pay a small daily fee and many have had the same pitch for decades', 'The South Bank food market started with a few stalls in the 1990s and now stretches for nearly half a mile'],
 'Duck under Waterloo Bridge and browse the book market — see if you can find a first edition or a rare print among the secondhand stalls.',
 ARRAY['How did the skateboarders win their campaign to save the Undercroft?', 'What makes the South Bank book market different from other London markets?']),

('london_south_bank', ARRAY['art', 'design'], 'dramatic',
 'The National Theatre is a building that divides London like no other. Opened in 1976, designed by Denys Lasdun, it was described by Prince Charles as "a clever way of building a nuclear power station in the middle of London." Lasdun was devastated. But the building works — the layered concrete terraces create outdoor stages, sheltered viewing platforms, and a sense of a building that belongs to the city rather than being fenced off from it. The Brutalist concrete ages beautifully when it''s maintained, developing a warmth that surprises people who expect it to look cold. At night, when the building is lit from within and the terraces glow, even its critics tend to go quiet.',
 'Prince Charles called the National Theatre "a clever way of building a nuclear power station" — the architect was devastated.',
 'Look at the layered concrete terraces of the National Theatre — at night they glow from within and silence the critics.',
 'design-detail',
 ARRAY['Lasdun deliberately designed the terraces as public spaces — he wanted the building to give something to the city, not just take space', 'Prince Charles''s nuclear power station comment was part of a broader campaign against Brutalist architecture in the 1980s', 'The building has three separate theatres inside, each with different capacities and staging configurations'],
 'Look at the National Theatre after dark if possible — the warm glow from within the concrete terraces completely transforms the building''s character.',
 ARRAY['Why did Denys Lasdun choose raw concrete for such a prominent cultural building?', 'Has public opinion on Brutalist architecture changed since Prince Charles''s criticism?']),

('london_south_bank', ARRAY['photography', 'local-life'], 'witty',
 'The South Bank is where London goes to be seen being cultured. On any weekend you''ll see people reading novels they''ve just bought from the book market (covers facing outward, naturally), couples pretending to understand the Hayward Gallery exhibition, and parents dragging children to the BFI while promising ice cream after. It''s performative and genuine at the same time, which is very London. The best free entertainment is the river itself — watch the tide. When the Thames is low, mudlarkers appear on the foreshore searching for Tudor pipes, Victorian bottles, and medieval pins. It''s technically illegal without a permit but enforcement is relaxed. The Thames has been dropping things for 2,000 years. The South Bank just watches.',
 'At low tide, mudlarkers search the foreshore for Tudor pipes and medieval pins — technically illegal, rarely stopped.',
 'Watch for the tide line on the river wall — when the Thames drops, check the foreshore for mudlarkers with metal detectors.',
 'local-secret',
 ARRAY['Mudlarking permits are issued by the Port of London Authority — only about 50 active permits exist at any time', 'Finds from the Thames foreshore include Roman coins, medieval pilgrim badges, and Tudor leather shoes', 'The Thames tidal range at South Bank is about 7 metres — one of the largest urban tidal ranges in the world'],
 'Check the tide level against the river wall — if it''s low, look for mudlarkers on the foreshore below with trowels and metal detectors.',
 ARRAY['What are the most valuable objects ever found by mudlarkers on the Thames?', 'Why does the Thames have such a large tidal range this far from the sea?']);

-- ============================================================
-- 10. MILLENNIUM BRIDGE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_millennium_bridge', ARRAY['engineering', 'architecture'], 'scholarly',
 'The Millennium Bridge was designed by Norman Foster, sculptor Anthony Caro, and engineering firm Arup. When it opened on June 10, 2000, it immediately started swaying — not up and down, but side to side. The problem was synchronous lateral excitation: as the bridge moved slightly, pedestrians unconsciously adjusted their footsteps to match, amplifying the wobble. Within two days, it was closed. It stayed closed for nearly two years while Arup installed 91 dampers — essentially shock absorbers hidden under the deck. The fix cost five million pounds. The bridge now stands as both an engineering triumph and a cautionary tale about crowd dynamics that no one had properly modelled before. It changed how pedestrian bridges are designed worldwide.',
 'The "Wobbly Bridge" closed two days after opening — pedestrians'' synchronised footsteps made it sway uncontrollably.',
 'Walk to the centre of the bridge and feel the deck — the 91 hidden dampers underneath are why it doesn''t move anymore.',
 'engineering-marvel',
 ARRAY['Synchronous lateral excitation was a phenomenon that had never been properly modelled for pedestrian bridges before 2000', 'The fix required 91 dampers — 37 fluid-viscous dampers to control lateral movement and 54 tuned mass dampers for vertical', 'The wobble was so pronounced that footage of pedestrians swaying in unison became one of the most-viewed engineering failure videos online'],
 'Walk to the centre of the bridge and stand still — see if you can feel any movement. The 91 hidden dampers beneath the deck keep it perfectly steady now.',
 ARRAY['What exactly is synchronous lateral excitation and why wasn''t it predicted?', 'How did the Millennium Bridge failure change the design of pedestrian bridges worldwide?']),

('london_millennium_bridge', ARRAY['photography', 'culture'], 'casual',
 'This bridge exists to frame St Paul''s Cathedral. Stand at the south end near the Tate Modern and look north: the bridge creates a perfect corridor straight to St Paul''s dome. That''s not an accident — Foster designed the bridge as a "blade of light" that would connect two cultural landmarks while creating the best pedestrian view of the cathedral in London. It''s also the most photogenic bridge crossing in the city, especially at dawn when the steel catches the first light and St Paul''s goes golden. Harry Potter fans will recognise it from The Half-Blood Prince — Death Eaters destroy it in the opening sequence. It''s the only London bridge that exists purely for walking, which gives it a different energy from the traffic-heavy crossings upstream.',
 'Foster designed this bridge specifically to frame St Paul''s — stand at the south end for the perfect shot.',
 'Stand at the Tate Modern end and look north — the bridge creates a corridor straight to St Paul''s dome.',
 'design-detail',
 ARRAY['Foster described the bridge as a "blade of light" — the low profile was designed to avoid competing with St Paul''s dome', 'The bridge was used in Harry Potter and the Half-Blood Prince — Death Eaters collapse it in the opening scene', 'It''s the only central London bridge exclusively for pedestrians — no vehicles have ever crossed it'],
 'Stand at the Tate Modern end and photograph St Paul''s through the bridge corridor — the dome should sit perfectly centred at dawn or dusk.',
 ARRAY['Why did Foster choose such a low profile for the bridge design?', 'What was the process of filming the bridge''s destruction for Harry Potter?']),

('london_millennium_bridge', ARRAY['history', 'design'], 'dramatic',
 'Before this bridge, there hadn''t been a new Thames crossing in central London for over a century. The gap between Blackfriars Bridge and Southwark Bridge was one of the longest un-bridged stretches on the river, and it kept the South Bank culturally disconnected from the City. When the Millennium Bridge opened, foot traffic between the Tate Modern and St Paul''s increased by 400 percent almost overnight. It physically stitched two halves of London together. The bridge is deliberately minimal — no towers, no suspension cables visible above deck, just a low steel blade across the water. At night, the lighting runs along the handrails, and the whole structure seems to float. It''s the kind of infrastructure that reshapes a city without most people realising it happened.',
 'This bridge increased foot traffic between Tate Modern and St Paul''s by 400% — it stitched two Londons together.',
 'Look along the handrails at dusk — the integrated lighting makes the bridge appear to float above the water.',
 'hidden-history',
 ARRAY['Before 2000, there had been no new Thames crossing in central London for over 100 years', 'Foot traffic between the Tate Modern and St Paul''s increased by 400% after the bridge opened', 'The bridge deck is only 4 metres wide — deliberately narrow to maintain the blade-like profile'],
 'Walk across at dusk and look at the handrail lighting — the bridge appears to float above the dark water with no visible support above deck.',
 ARRAY['How did this single bridge change the cultural geography of London''s South Bank?', 'Why hadn''t anyone built a new Thames crossing in central London for over a century?']),

('london_millennium_bridge', ARRAY['local-life', 'nature'], 'witty',
 'Stand in the middle of the bridge and look down at the water. The Thames at this point is tidal — it rises and falls about seven metres twice a day. At low tide you can see the riverbed, which is essentially an open-air archaeological site. Mudlarks find Roman coins, medieval shoe buckles, and Georgian clay pipes down there regularly. The river moves fast here too — about four knots at peak flow — which is why nobody swims in it (officially). Seals have been spotted this far upriver, which delights locals and terrifies paddleboarders. The bridge also has a peculiar acoustic property: at certain times, the steel hums in the wind. Regular crossers learn to hear it. Tourists think it''s their imagination. It''s not.',
 'The bridge hums in the wind — regular crossers learn to hear it, tourists think they''re imagining things.',
 'Stop in the middle, look down at the water level, and listen — at certain wind speeds the steel deck hums.',
 'local-secret',
 ARRAY['The Thames rises and falls about 7 metres with each tide at this point — one of the largest urban tidal ranges in the world', 'Seals have been spotted near the Millennium Bridge — harbour seals follow fish upriver from the estuary', 'The steel deck produces a faint hum at specific wind speeds due to vortex-induced vibration in the support cables'],
 'Stop at the centre of the bridge, close your eyes, and listen for the faint hum of the steel in the wind — it''s not your imagination.',
 ARRAY['What causes the steel bridge deck to hum in certain wind conditions?', 'How far upriver do Thames seals typically travel?']);

-- ============================================================
-- 11. TATE MODERN
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_tate_modern', ARRAY['architecture', 'history'], 'scholarly',
 'The building was Bankside Power Station, designed by Giles Gilbert Scott — the same architect who designed the red telephone box and Battersea Power Station. It generated electricity for London from 1952 to 1981, when rising oil prices shut it down. Herzog and de Meuron won the competition to convert it into a gallery, and their key decision was to keep the Turbine Hall. That vast industrial void — 152 metres long and 35 metres high — became the entrance, and it changed what people expected a gallery to feel like. The chimney was shortened by two metres and topped with a glass light beam so it wouldn''t compete with St Paul''s across the river. That restraint defines the whole conversion.',
 'The architect of this power station also designed the red telephone box — the chimney was shortened to respect St Paul''s.',
 'Look up at the chimney''s glass light beam at the top — it was shortened by two metres so it wouldn''t rival St Paul''s dome.',
 'hidden-history',
 ARRAY['Giles Gilbert Scott also designed Battersea Power Station and the iconic red telephone box — all in the same career', 'The Turbine Hall is 152 metres long and 35 metres high — large enough to contain several football pitches', 'The chimney was shortened by exactly 2 metres and capped with glass to avoid competing with St Paul''s dome across the river'],
 'Compare the height of the Tate''s chimney with St Paul''s dome across the river — the chimney was deliberately shortened to sit below the dome line.',
 ARRAY['Why did Herzog and de Meuron decide to keep the Turbine Hall as the entrance rather than fill it with galleries?', 'What other buildings did Giles Gilbert Scott design?']),

('london_tate_modern', ARRAY['art', 'culture'], 'casual',
 'The Turbine Hall commissions are some of the most talked-about art events in London. Olafur Eliasson put a giant sun in there. Ai Weiwei filled the floor with 100 million hand-painted porcelain sunflower seeds. Carsten Höller installed five giant slides. The space is so massive that it basically dares artists to fill it, and the results range from breathtaking to baffling. Entry is free, which means the Tate Modern gets about six million visitors a year — more than any other modern art museum in the world. The gift shop is excellent and the view from the restaurant on the top floor is one of London''s best-kept secrets. St Paul''s at eye level, the river below, and on a clear day you can see all the way to the hills south of London.',
 'The Tate Modern gets six million visitors a year — more than any other modern art museum in the world. Entry is free.',
 'Step inside the Turbine Hall entrance — that 35-metre-high void used to house the power station''s generators.',
 'local-secret',
 ARRAY['Ai Weiwei''s sunflower seeds were individually hand-painted by 1,600 artisans in Jingdezhen, China', 'The Tate Modern is the most visited modern art museum in the world — ahead of MoMA in New York and the Centre Pompidou in Paris', 'Olafur Eliasson''s Weather Project sun installation attracted over 2 million visitors in just five months'],
 'Step into the Turbine Hall and look up — the 35-metre ceiling used to house generators that powered central London.',
 ARRAY['How do artists approach the challenge of filling the Turbine Hall?', 'Which Turbine Hall commission has been the most controversial?']),

('london_tate_modern', ARRAY['design', 'engineering'], 'dramatic',
 'Converting a power station into a gallery sounds simple but the engineering was ferocious. The building had to maintain its industrial character while meeting museum-grade climate control — constant temperature, constant humidity, UV-filtered light. Herzog and de Meuron added the glass extension on top (the Switch House, now called the Blavatnik Building) in 2016, which gives the building a split personality: heavy brick below, light glass above. The viewing platform on level 10 caused a legal battle — residents of the luxury flats next door sued because visitors could see directly into their living rooms. The Tate won. The view is public. The residents installed one-way glass. London architecture disputes don''t get more perfectly London than that.',
 'Residents of the adjacent luxury flats sued over the viewing platform — the Tate won, the residents installed one-way glass.',
 'Look for the Blavatnik Building extension on top — glass above brick, and the level 10 viewing platform that sparked a lawsuit.',
 'scandal',
 ARRAY['The NEO Bankside residents paid up to 4 million pounds per flat and sued for invasion of privacy — they lost', 'Museum-grade climate control requires constant temperature within 1 degree and humidity within 5% — in a former power station', 'The Blavatnik Building extension added 60% more gallery space while weighing a fraction of the original brick structure'],
 'Look up at the Blavatnik Building extension (glass pyramid on top) and then look at the luxury flats next door — that viewing platform sparked a privacy lawsuit.',
 ARRAY['How did the courts rule on the privacy dispute between the Tate and the neighbouring flat residents?', 'What engineering challenges did converting a power station into a museum present?']),

('london_tate_modern', ARRAY['local-life', 'photography'], 'witty',
 'The Tate Modern accidentally created one of London''s best date spots. Something about the industrial space, the free entry, and the guaranteed conversation starters on every wall makes it first-date gold. You can pretend to have opinions about Rothko, share awkward silences in front of conceptual installations, and retreat to the cafe when you run out of things to say. The building also works as a London weather gauge: if the Turbine Hall is packed, it''s raining. If the river terrace is full, it''s the one nice day of British summer. For photos, the exterior is best from the Millennium Bridge approach — the whole building reveals itself as you cross. Inside, the stairwell in the Blavatnik Building has a spiral geometry that photographers lose an hour in.',
 'The Tate Modern is London''s most popular first-date spot — free entry and guaranteed conversation starters on every wall.',
 'Approach from the Millennium Bridge for the best exterior shot — the building reveals itself as you cross the river.',
 'perspective-shift',
 ARRAY['The Tate Modern consistently ranks as one of London''s top date destinations — free entry removes financial pressure', 'The Blavatnik Building stairwell has become an Instagram favourite for its geometric spiral when photographed from below', 'The river terrace is one of the best free places to sit in central London — St Paul''s is directly opposite'],
 'Approach from the Millennium Bridge and watch the building reveal itself as you cross — the full facade only becomes visible from the bridge''s midpoint.',
 ARRAY['Why has the Tate Modern become such a popular date destination?', 'What is the best time of day to photograph the Tate Modern exterior?']);

-- ============================================================
-- 12. SHAKESPEARE'S GLOBE
-- ============================================================

INSERT INTO place_stories (place_id, interests, tone, audio_narration, hook, directional_cue, story_type, fun_facts, look_closer_challenge, suggested_questions) VALUES

('london_shakespeares_globe', ARRAY['history', 'theatre'], 'scholarly',
 'This isn''t Shakespeare''s Globe — it''s a reconstruction, built about 230 metres from where the original stood. The original burned down in 1613 when a cannon fired during Henry VIII set the thatched roof alight. The new Globe was the obsession of American actor Sam Wanamaker, who spent 23 years campaigning and fundraising for it. He died in 1993, four years before it opened. The building uses the same construction methods as the original: oak frame, lime plaster, and the only thatched roof permitted in London since the Great Fire of 1666 — it required a special Act of Parliament. The theatre holds 1,500 people. 700 stand as groundlings in the yard, exposed to the weather, exactly as they did in 1599.',
 'This has London''s only thatched roof since the Great Fire of 1666 — it needed an Act of Parliament.',
 'Look at the thatched roof — it''s the only one legally permitted in London since 1666, approved by a special Act of Parliament.',
 'hidden-history',
 ARRAY['The thatch required a special Act of Parliament — no thatched roof had been permitted in London since the Great Fire of 1666', 'The reconstruction is built 230 metres from the original site, which now lies beneath a listed Georgian terrace', 'Groundling tickets cost 5 pounds — you stand in the open yard for the entire performance, rain or shine, just like in 1599'],
 'Look at the thatched roof and compare it with every other building nearby — it''s the only thatched roof in London, legal only by special parliamentary permission.',
 ARRAY['Why was the Globe rebuilt 230 metres from the original site?', 'How accurate is this reconstruction compared to the original 1599 theatre?']),

('london_shakespeares_globe', ARRAY['theatre', 'local-life'], 'casual',
 'In 1949, an American actor named Sam Wanamaker came looking for Shakespeare''s Globe. He found a bronze plaque on a brewery wall. That''s it. No theatre, nothing. He spent the next 23 years fundraising, arguing with councils, and fighting to rebuild it. He convinced English Heritage, survived planning objections, and insisted every detail be historically accurate: oak frame, lime plaster, hand-made bricks. He died in 1993, four years before the first audience walked in. Never saw a single performance in the theatre he willed into existence. The groundlings in the yard today owe their five-pound tickets to a stubborn American who wouldn''t accept a plaque.',
 'Sam Wanamaker spent 23 years rebuilding this theatre and died four years before it opened — he never saw a single performance.',
 'Look for the bronze plaque near the entrance honouring Sam Wanamaker — the American actor who made this place exist.',
 'hidden-history',
 ARRAY['Wanamaker arrived in London partly to escape the Hollywood blacklist during the McCarthy era', 'He spent 23 years fighting planning authorities, fundraising, and insisting on historical accuracy before construction began', 'The first performance in the new Globe was The Two Gentlemen of Verona in 1997 — four years after Wanamaker''s death'],
 'Find the bronze plaque or memorial to Sam Wanamaker near the entrance — the man who spent 23 years building this theatre and never saw a performance.',
 ARRAY['Why did Wanamaker insist on such strict historical accuracy for the reconstruction?', 'How did an American actor end up devoting his life to rebuilding a London theatre?']),

('london_shakespeares_globe', ARRAY['architecture', 'myths'], 'dramatic',
 'The original Globe was built from stolen timber. In 1598, the lease on the Theatre in Shoreditch expired, and the landlord planned to seize the building. On December 28th, while the landlord was away for Christmas, the acting company — including Shakespeare — dismantled the entire timber frame, carried it across the frozen Thames, and rebuilt it on Bankside as the Globe. The whole operation took a few winter weeks and was technically legal because the company owned the timber, just not the land. It''s one of the great heist stories in English history: a stolen theatre, carried across a frozen river, reassembled into the most famous playhouse ever built. The building you''re looking at is their ghost, made solid.',
 'The original Globe was built from a stolen theatre — dismantled at night and carried across the frozen Thames.',
 'Look at the oak frame construction — this reconstruction uses the same methods as the timber that was carried across the ice in 1598.',
 'scandal',
 ARRAY['The acting company dismantled the Theatre in Shoreditch on December 28th while the landlord was away for Christmas', 'The Thames froze regularly in the 16th century — cold enough to carry heavy timber frames across', 'The heist was technically legal — the company owned the building materials, just not the land they stood on'],
 'Look at the heavy oak frame and imagine it being dismantled, carried across a frozen river, and reassembled — that''s exactly how the original Globe came to exist.',
 ARRAY['How did Shakespeare''s company manage to dismantle and move an entire theatre in winter?', 'Was the landlord ever compensated for the loss of the Theatre in Shoreditch?']),

('london_shakespeares_globe', ARRAY['design', 'culture'], 'witty',
 'Sam Wanamaker first visited the site of the original Globe in 1949 and found nothing but a dirty plaque on a brewery wall. He was so annoyed that he spent the rest of his life trying to fix it. The reconstruction project took decades because everything had to be historically accurate, which meant arguing with every planning authority in London about whether you could build a thatched, timber-framed, open-roofed theatre next to modern buildings. Fire safety alone took years. The sprinkler system hidden in the thatch is a masterpiece of invisible engineering. The Globe also has no stage lighting — performances use natural light and candles, which means the audience can see each other. That changes everything. Theatre becomes communal instead of anonymous. Wanamaker would have loved it.',
 'Wanamaker found nothing but a dirty plaque on a brewery wall in 1949 — he spent 44 years building this replacement.',
 'Look for the hidden fire sprinklers in the thatch — years of negotiations to put a timber-framed theatre next to modern buildings.',
 'design-detail',
 ARRAY['The fire sprinkler system hidden inside the thatch took years of negotiation with London Fire Brigade', 'Performances use only natural light and candles — there are no electric stage lights, so the audience can see each other', 'The oak frame used traditional green oak joinery — no screws, no bolts, just mortise-and-tenon joints held by wooden pegs'],
 'Look carefully at the thatch for the hidden fire sprinklers — they''re a masterpiece of invisible modern engineering inside a historical reconstruction.',
 ARRAY['How does performing without electric lighting change the experience for actors and audience?', 'What compromises were made between historical accuracy and modern safety requirements?']);

-- Verify import
SELECT
  cp.name as place_name,
  count(ps.id) as story_count
FROM city_places cp
LEFT JOIN place_stories ps ON ps.place_id = cp.place_id
WHERE cp.place_id LIKE 'london_%'
GROUP BY cp.name
ORDER BY cp.name;
