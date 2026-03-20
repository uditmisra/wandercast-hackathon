// Updates enrichment columns (story_type, fun_facts, look_closer_challenge, suggested_questions)
// for existing London stories in place_stories.
// Usage: node scripts/update-enrichment.cjs <SERVICE_ROLE_KEY>

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdzfffutbzpevblbpgjc.supabase.co';
const supabaseKey = process.argv[2];

if (!supabaseKey) {
  console.error('Usage: node scripts/update-enrichment.cjs <SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enrichment data keyed by place_id + tone
const enrichments = [
  // BUCKINGHAM PALACE
  { place_id: 'london_buckingham_palace', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The palace has 775 rooms including 78 bathrooms, 52 royal and guest bedrooms, and 188 staff bedrooms', 'There is a private cash machine in the basement — only the royal family can use it', 'The 1913 refacing took just 13 weeks, done while the royal family was on holiday at Balmoral'],
    look_closer_challenge: 'Find the carved lion and unicorn on the central gates — the lion faces left, unusual in heraldry. Can you spot the difference from other royal crests?',
    suggested_questions: ['Why did Queen Victoria choose this palace over St James\'s Palace?', 'What happened to the Duke of Buckingham\'s original townhouse design?'] },
  { place_id: 'london_buckingham_palace', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['The Changing of the Guard was once cancelled because a guardsman fainted inside his bearskin hat — they weigh over 450g', 'The Victoria Memorial contains 2,300 tonnes of white marble and took 10 years to complete', 'The palace garden has its own lake, 350 types of wildflower, and a tennis court'],
    look_closer_challenge: 'Try to spot which windows have lights on — each reveals an occupied office or apartment behind the facade.',
    suggested_questions: ['What is the daily routine of the guards who stand at the gates?', 'Can you actually visit inside the palace during summer?'] },
  { place_id: 'london_buckingham_palace', tone: 'witty', story_type: 'scandal',
    fun_facts: ['Fagan broke in twice — the first time, a month earlier, he stole wine and left completely undetected', 'The Queen kept Fagan talking by calmly asking about his family and children', 'After the incident, palace security spending increased by over 2 million pounds in a single year'],
    look_closer_challenge: 'Count the security cameras on the nearest gatepost — there are more than you\'d expect, all installed after the Fagan breach.',
    suggested_questions: ['What other security breaches has the palace had over the years?', 'How did the Fagan incident change royal protection procedures?'] },
  { place_id: 'london_buckingham_palace', tone: 'dramatic', story_type: 'perspective-shift',
    fun_facts: ['The Mall\'s red surface is coloured with crushed iron oxide — designed to resemble a ceremonial red carpet', 'Admiralty Arch at the far end has a nose sculpture hidden at human height — rubbing it is a naval tradition', 'The plane trees lining The Mall were planted specifically to shade Queen Victoria\'s carriage rides'],
    look_closer_challenge: 'Face The Mall at sunset and wait — for about ten minutes the entire avenue turns gold. See if you can capture the palace as a silhouette.',
    suggested_questions: ['What happens along The Mall during a coronation procession?', 'Why is the road surface of The Mall coloured red?'] },

  // ST JAMES'S PARK
  { place_id: 'london_st_jamess_park', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The park covers 23 hectares and is the oldest of London\'s eight Royal Parks', 'John Nash\'s curving lake replaced a rigid straight canal that Charles II had modelled on the canals at Versailles', 'The park contains over 100 species of plants, many chosen by Nash to create specific colour effects through the seasons'],
    look_closer_challenge: 'Stand on the footbridge and try to spot both Buckingham Palace (west) and Whitehall (east) framed by trees — Nash designed these sightlines to feel accidental.',
    suggested_questions: ['How did John Nash transform the original French-style canal into the lake we see today?', 'What other London landmarks did John Nash design?'] },
  { place_id: 'london_st_jamess_park', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['A pelican named Gargi was caught on camera swallowing a pigeon whole in 2006 — the video went viral', 'The pelicans are Great White Pelicans, native to Africa, and each one eats about 1kg of fish per day', 'Duck Island in the centre of the lake has its own cottage, built in 1840, used by the London Ornithological Society'],
    look_closer_challenge: 'Can you count the pelicans on or near the lake? There should be about seven — they tend to gather near Duck Island.',
    suggested_questions: ['Why did the Russian ambassador choose pelicans as a diplomatic gift?', 'What other unusual animals have lived in London\'s royal parks?'] },
  { place_id: 'london_st_jamess_park', tone: 'dramatic', story_type: 'spy-story',
    fun_facts: ['Kim Philby passed secrets to the Soviets for 30 years before fleeing to Moscow in 1963', 'MI5 headquarters at Thames House and MI6 at Vauxhall Cross are both visible from the park\'s bridges', 'During WWII, the park\'s lake was drained and covered with temporary government buildings'],
    look_closer_challenge: 'Sit on one of the benches facing Whitehall and observe the lunchtime crowd — civil servants still use these paths for conversations they can\'t have indoors.',
    suggested_questions: ['How many known double agents operated in London during the Cold War?', 'Why was this park specifically favoured by intelligence officers for meetings?'] },
  { place_id: 'london_st_jamess_park', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The footbridge was rebuilt in 1957 — the original suspension bridge by Nash swayed dangerously in the wind', 'At sunset, the lake reflects both Buckingham Palace and the London Eye simultaneously from certain angles', 'The willow trees framing the western view were specifically planted to soften the palace\'s formal facade'],
    look_closer_challenge: 'Stand at the exact centre of the bridge and photograph east, then west, without moving your feet. Compare the two images — they look like different cities.',
    suggested_questions: ['What other hidden photography spots did Nash design into London\'s parks?', 'How has the view from this bridge changed over the last 200 years?'] },

  // WESTMINSTER ABBEY
  { place_id: 'london_westminster_abbey', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The abbey floor is so crowded with burials that some coffins are stacked five deep beneath the stones', 'The Coronation Chair has been used for every coronation since 1308 and still bears graffiti carved by Westminster schoolboys in the 18th century', 'Charles Darwin was buried here in 1882 despite being an agnostic — his scientific status overrode religious objections'],
    look_closer_challenge: 'Look at the flying buttresses on the south wall and count them — each one transfers tonnes of ceiling weight outward to allow the thin walls and tall windows.',
    suggested_questions: ['Why did Henry III want the abbey to rival French cathedrals like Reims?', 'Who decides which famous people are buried in Westminster Abbey?'] },
  { place_id: 'london_westminster_abbey', tone: 'casual', story_type: 'literary-legacy',
    fun_facts: ['Lord Byron was denied a memorial until 1969, 145 years after his death, because of his scandalous reputation', 'Dickens wanted to be buried in Rochester but was overruled — his funeral at the abbey was deliberately kept small', 'The memorial to Oscar Wilde wasn\'t added until 1995, nearly a century after his imprisonment and death'],
    look_closer_challenge: 'Find Chaucer\'s tomb and then count how many poets and writers have memorials nearby — there are over 100 in this corner alone.',
    suggested_questions: ['Which famous writers have been denied a place in Poets\' Corner and why?', 'How did Chaucer\'s accidental burial here create a literary tradition?'] },
  { place_id: 'london_westminster_abbey', tone: 'dramatic', story_type: 'hidden-history',
    fun_facts: ['The Coronation Chair had the Stone of Scone underneath it from 1296 until it was returned to Scotland in 1996', 'William the Conqueror\'s guards set fire to nearby houses, and the congregation fled — William was crowned in a near-empty, smoke-filled abbey', 'The chair has been used for 38 coronations and bears carved graffiti from centuries of visitors'],
    look_closer_challenge: 'Look at the great west doors and imagine a coronation procession passing through — every monarch since 1066 has entered this way.',
    suggested_questions: ['What happened to the Stone of Scone that was kept under the Coronation Chair?', 'Which coronation at the abbey had the most dramatic or unusual incidents?'] },
  { place_id: 'london_westminster_abbey', tone: 'witty', story_type: 'design-detail',
    fun_facts: ['Hawksmoor died in 1736, nine years before the towers were completed — he never saw them finished', 'The abbey has been under some form of renovation or repair for over 750 consecutive years', 'The rose window above the great west door is one of the largest medieval stained glass windows in England'],
    look_closer_challenge: 'Compare the stone colour and carving style of the west towers with the older walls below — Hawksmoor\'s 18th-century work is crisper and slightly lighter.',
    suggested_questions: ['How did Hawksmoor match his 18th-century design to a 13th-century building?', 'Why did it take 500 years to finish the abbey\'s west towers?'] },

  // PALACE OF WESTMINSTER
  { place_id: 'london_palace_of_westminster', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['Pugin designed every detail including wallpaper, tiles, hat stands, and even the inkwells — he had a nervous breakdown at 40 and died at 40', 'The fire of 1834 drew crowds including J.M.W. Turner, who painted the blaze from a boat on the Thames', 'The building contains 3 miles of corridors and staff still regularly get lost in unfamiliar sections'],
    look_closer_challenge: 'Look at the exterior stone carefully — you can spot the difference between the original darker Anston limestone and the lighter Clipsham stone replacement panels.',
    suggested_questions: ['Why were they still using medieval tally sticks in 1834?', 'How did Pugin\'s obsessive attention to detail affect his health and career?'] },
  { place_id: 'london_palace_of_westminster', tone: 'casual', story_type: 'engineering-marvel',
    fun_facts: ['A single old penny placed on the pendulum changes the clock\'s speed by 0.4 seconds per day', 'The bell was named either after Sir Benjamin Hall (the works commissioner) or Ben Caunt (a heavyweight boxer) — nobody is certain', 'The clock mechanism is so reliable it has kept time within a second of accuracy for most of its 160-year life'],
    look_closer_challenge: 'Listen carefully for the chimes on the quarter hour — can you hear the slightly imperfect tone caused by the crack?',
    suggested_questions: ['How do the clockmakers decide when to add or remove pennies from the pendulum?', 'Why didn\'t they just replace the cracked bell in 1859?'] },
  { place_id: 'london_palace_of_westminster', tone: 'dramatic', story_type: 'hidden-history',
    fun_facts: ['The 36 barrels contained about 2,500 pounds of gunpowder — enough to destroy the entire building and damage structures 500 metres away', 'Fawkes gave his name as John Johnson when caught and refused to reveal the other plotters for two days despite torture', 'The Yeoman of the Guard search is now accompanied by a lamp and tradition — they no longer expect to find gunpowder'],
    look_closer_challenge: 'Look at the base of the building near Old Palace Yard and imagine the cellars beneath — this is roughly where the 36 barrels were hidden.',
    suggested_questions: ['Why is Guy Fawkes remembered more than Robert Catesby, the actual ringleader?', 'How did the Gunpowder Plot change laws and attitudes toward Catholics in England?'] },
  { place_id: 'london_palace_of_westminster', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The Parliamentary Archives in Victoria Tower contain over 3 million documents, including the original Death Warrant of Charles I', 'Victoria Tower was the tallest square tower in the world when completed in 1860', 'The Union Flag flies from Victoria Tower when Parliament is in session — most people think it flies from Elizabeth Tower'],
    look_closer_challenge: 'Photograph Victoria Tower and Elizabeth Tower from the same spot — compare the heights and notice which one is actually taller.',
    suggested_questions: ['What is the oldest document stored in the Parliamentary Archives?', 'Why does Victoria Tower get so much less attention despite being taller?'] },

  // WHITEHALL
  { place_id: 'london_whitehall', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['Henry VIII\'s Whitehall Palace had tennis courts, a bowling alley, a cockpit, and a tiltyard for jousting', 'The Rubens ceiling panels that Charles I commissioned depict the divine right of kings — the irony of his execution beneath them was not lost on contemporaries', 'The fire of 1698 started when a laundry maid left clothes drying too close to a charcoal brazier'],
    look_closer_challenge: 'Find the Banqueting House facade and look for the first-floor windows — Charles I stepped through one of them onto the execution scaffold.',
    suggested_questions: ['What did the full Whitehall Palace look like before the fire of 1698?', 'Why was Inigo Jones\'s Palladian style so revolutionary for London in 1622?'] },
  { place_id: 'london_whitehall', tone: 'casual', story_type: 'power-politics',
    fun_facts: ['The word Cenotaph means "empty tomb" in Greek — there is no one buried inside or beneath it', 'Lutyens designed the Cenotaph in just six days, sketching it on the back of an envelope', 'On Remembrance Sunday, all traffic stops and even the government departments fall silent for two minutes at 11am'],
    look_closer_challenge: 'Watch pedestrians as they pass the Cenotaph — notice how some slow down, some pause, and some change their path entirely.',
    suggested_questions: ['Why did the government originally plan for only a temporary wooden memorial?', 'What happens on Whitehall during the Remembrance Sunday ceremony?'] },
  { place_id: 'london_whitehall', tone: 'dramatic', story_type: 'hidden-history',
    fun_facts: ['Charles I asked for an extra shirt because the January cold might make him tremble, and he didn\'t want the crowd to think he was afraid', 'The execution was watched by thousands — some reportedly dipped handkerchiefs in his blood as souvenirs', 'The monarchy was restored just 11 years later when Charles II returned from exile in 1660'],
    look_closer_challenge: 'Stand in front of the Banqueting House and look at the road surface — you are standing approximately where the execution scaffold was erected.',
    suggested_questions: ['What did Charles I mean by his last word, "Remember"?', 'How did London react in the days after the execution of the king?'] },
  { place_id: 'london_whitehall', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The mounted guards are from the Household Cavalry and serve 2-hour shifts — they\'re trained not to react but can ask people to step back', 'Horse Guards Parade was used for jousting tournaments by Henry VIII and is still the venue for Trooping the Colour', 'The clock on Horse Guards has a black mark at the 2 o\'clock position, said to mark the hour of Charles I\'s execution'],
    look_closer_challenge: 'Walk through the Horse Guards archway, turn around, and photograph the perfectly framed view of Whitehall — this sightline has been open for 500 years.',
    suggested_questions: ['Why do the Horse Guards sentries have such strict rules about not reacting?', 'What is the significance of the black mark on the Horse Guards clock?'] },

  // 10 DOWNING STREET
  { place_id: 'london_10_downing_street_viewpoint', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['Number 10 is three houses merged into one — the modest front hides a much larger building behind', 'Robert Walpole insisted the house belong to the office of PM, not to him personally — that convention has held since 1735', 'The current door is made of blast-resistant steel but painted to look like the original Georgian wood door'],
    look_closer_challenge: 'Look at the proportions of Number 10 compared to its neighbours — can you tell that it\'s actually three houses merged together?',
    suggested_questions: ['Why did Walpole insist the house belong to the office rather than to him personally?', 'How many Prime Ministers have lived at Number 10?'] },
  { place_id: 'london_10_downing_street_viewpoint', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['Larry the Cat was adopted from Battersea Dogs and Cats Home in 2011 and has a mixed record as a mouser', 'Before the gates, a milkman regularly delivered bottles to Number 10 just like any terraced house', 'The security gates cost approximately 750,000 pounds when installed in 1989'],
    look_closer_challenge: 'Be patient and watch the doorstep of Number 10 — Larry the Cat frequently appears, especially in the mornings.',
    suggested_questions: ['What is Larry the Cat\'s actual track record as Chief Mouser?', 'What was it like to walk freely up to the Number 10 door before 1989?'] },
  { place_id: 'london_10_downing_street_viewpoint', tone: 'dramatic', story_type: 'hidden-history',
    fun_facts: ['The yellow London stock bricks were darkened by two centuries of coal soot — when cleaned, the public demanded they be painted black', 'Margaret Thatcher\'s renovation in the 1980s cost several million pounds and involved underpinning the entire foundation', 'The famous lion\'s head door knocker is a replica — the original is kept safe inside'],
    look_closer_challenge: 'Look closely at the brickwork — the uniformly dark colour is actually paint over yellow bricks, maintained to preserve the iconic appearance.',
    suggested_questions: ['Why did the public react so negatively when the true yellow bricks were revealed?', 'How structurally sound is Number 10 today after centuries of repairs?'] },
  { place_id: 'london_10_downing_street_viewpoint', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The podium is bolted into a specific pavement position so every PM\'s statement is filmed from the exact same angle', 'Around 200 permanent staff work at Number 10 — most outlast multiple Prime Ministers', 'The narrow street means press photographers have been shooting from essentially the same position since the 1920s'],
    look_closer_challenge: 'Compare Downing Street photos from different decades — the angle is identical because the street geometry allows only one camera position.',
    suggested_questions: ['Who are the permanent staff who remain at Number 10 when prime ministers change?', 'How is the arrival and departure of a Prime Minister choreographed?'] },

  // CHURCHILL WAR ROOMS
  { place_id: 'london_churchill_war_rooms', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The Map Room operated 24/7 for six straight years without a single day\'s interruption', 'Churchill\'s wartime broadcasts from the underground microphone reached 70% of the British population', 'The rooms were sealed in 1945 and not opened to the public until 1984 — nearly 40 years of untouched wartime history'],
    look_closer_challenge: 'Look at the building above the entrance and imagine three metres of reinforced concrete beneath it — that\'s "the Slab" protecting the War Rooms.',
    suggested_questions: ['Did Churchill really believe the concrete slab would survive a direct bomb hit?', 'What was daily life like for the 500 people who worked underground?'] },
  { place_id: 'london_churchill_war_rooms', tone: 'casual', story_type: 'scandal',
    fun_facts: ['The phone line to Roosevelt was hidden in a room labelled as a private toilet to avoid suspicion', 'Churchill\'s rooftop Blitz-watching terrified his protection officers — he once had to be physically pulled back inside', 'Staff worked in shifts and many developed health problems from the recycled air and constant noise'],
    look_closer_challenge: 'Look up at the Treasury roof above the entrance — Churchill repeatedly snuck up there during air raids to watch the Blitz, terrifying his security team.',
    suggested_questions: ['How did Churchill get away with sneaking to the roof during bombing raids?', 'What was the quality of life like for workers who spent months underground?'] },
  { place_id: 'london_churchill_war_rooms', tone: 'dramatic', story_type: 'engineering-marvel',
    fun_facts: ['The ventilation system was disguised as ordinary building infrastructure — even neighbouring office workers didn\'t know what was below', 'Churchill was explicitly briefed that the slab would not survive a direct hit from a large bomb', 'The decision to keep the government in London rather than evacuate was as much about morale as military strategy'],
    look_closer_challenge: 'Stand on King Charles Street and stamp your foot lightly — the War Rooms are directly beneath, hidden in plain sight for six years.',
    suggested_questions: ['Why did Churchill choose to stay in London rather than evacuate the government?', 'How was such a large underground complex kept secret from the public?'] },
  { place_id: 'london_churchill_war_rooms', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['Churchill napped every afternoon without exception — he believed this habit doubled his working capacity', 'His daily consumption included champagne at lunch, whisky in the afternoon, and brandy in the evening', 'The V-for-victory sign, the cigar, and the bowler hat were all deliberately cultivated as a personal brand'],
    look_closer_challenge: 'Notice how modest and unmarked the entrance is — imagine 500 people disappearing into this doorway every day while the street above carried on normally.',
    suggested_questions: ['How did Churchill\'s personal habits affect the running of the War Rooms?', 'Was Churchill\'s public image genuinely calculated or naturally eccentric?'] },

  // LONDON EYE
  { place_id: 'london_london_eye', tone: 'scholarly', story_type: 'engineering-marvel',
    fun_facts: ['Each of the 32 capsules weighs 10 tonnes and is climate-controlled year-round', 'The wheel rotates at 26 centimetres per second — slow enough to board without stopping, completing one revolution in 30 minutes', 'The Eye uses enough steel cable to stretch from London to Edinburgh — about 600 kilometres'],
    look_closer_challenge: 'Try to spot capsule numbers as they rotate past — count from 12 to 14 and notice that capsule 13 is missing.',
    suggested_questions: ['Why was the London Eye originally meant to be temporary?', 'How did engineers manage to raise a 2,100-tonne structure from horizontal to vertical?'] },
  { place_id: 'london_london_eye', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['David Marks and Julia Barfield entered a Sunday Times competition for a millennium landmark — their design won out of hundreds', 'It took the couple seven years of planning battles and fundraising before construction even began', 'The Eye receives over 3 million visitors annually, but surveys show fewer than 10% of Londoners have ridden it'],
    look_closer_challenge: 'Look along the South Bank promenade in both directions — can you spot buskers, skateboarders, or the bookstalls under Waterloo Bridge?',
    suggested_questions: ['Why do Londoners avoid riding the Eye despite living so close to it?', 'What was the original newspaper competition that led to the Eye being built?'] },
  { place_id: 'london_london_eye', tone: 'dramatic', story_type: 'engineering-marvel',
    fun_facts: ['The first lift attempt failed when a cable coupling broke — the press nicknamed it "the lying Eye"', 'Wind speeds above 20 knots would have forced engineers to abort the entire raising operation', 'The total weight raised from horizontal to vertical was 2,100 tonnes — equivalent to about 350 elephants'],
    look_closer_challenge: 'Look at the massive A-frame support legs at the base — the entire 2,100-tonne wheel was raised from flat to vertical on those supports.',
    suggested_questions: ['What exactly went wrong during the first attempt to raise the Eye?', 'How did the engineering team manage the risk of wind during the week-long raising?'] },
  { place_id: 'london_london_eye', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The LED lighting system can produce 16 million colour combinations and is changed for national events and holidays', 'The capsules are designed as sealed glass eggs — they don\'t open, which is why the Eye can operate in rain and wind', 'Before the Eye, the classic London photograph was Big Ben reflected in the Thames — now the Eye appears in most skyline shots'],
    look_closer_challenge: 'Wait for dusk and watch the LED lights switch on — note what colour they are tonight and see if it corresponds to a national event.',
    suggested_questions: ['How did the Eye change the way London\'s skyline is photographed?', 'What determines the colour of the Eye\'s LED lights on any given night?'] },

  // SOUTH BANK
  { place_id: 'london_south_bank', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The Festival of Britain attracted 8.5 million visitors in five months — a massive morale boost for post-war Britain', 'The Royal Festival Hall\'s acoustics were so carefully designed that the auditorium floats on rubber pads to isolate it from vibration', 'The Brutalist concrete buildings were controversial from day one — their raw finish was a deliberate rejection of decorative architecture'],
    look_closer_challenge: 'Look at the Royal Festival Hall and compare its 1951 curves with the angular Brutalist buildings next to it — two very different visions of Britain built just 15 years apart.',
    suggested_questions: ['Why did the government choose this bomb-damaged area for the Festival of Britain?', 'What other buildings from the 1951 Festival were demolished and why?'] },
  { place_id: 'london_south_bank', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['The Undercroft skate spot has been used continuously since the 1970s — it\'s one of the oldest in Europe', 'The book market sellers pay a small daily fee and many have had the same pitch for decades', 'The South Bank food market started with a few stalls in the 1990s and now stretches for nearly half a mile'],
    look_closer_challenge: 'Duck under Waterloo Bridge and browse the book market — see if you can find a first edition or a rare print among the secondhand stalls.',
    suggested_questions: ['How did the skateboarders win their campaign to save the Undercroft?', 'What makes the South Bank book market different from other London markets?'] },
  { place_id: 'london_south_bank', tone: 'dramatic', story_type: 'design-detail',
    fun_facts: ['Lasdun deliberately designed the terraces as public spaces — he wanted the building to give something to the city, not just take space', 'Prince Charles\'s nuclear power station comment was part of a broader campaign against Brutalist architecture in the 1980s', 'The building has three separate theatres inside, each with different capacities and staging configurations'],
    look_closer_challenge: 'Look at the National Theatre after dark if possible — the warm glow from within the concrete terraces completely transforms the building\'s character.',
    suggested_questions: ['Why did Denys Lasdun choose raw concrete for such a prominent cultural building?', 'Has public opinion on Brutalist architecture changed since Prince Charles\'s criticism?'] },
  { place_id: 'london_south_bank', tone: 'witty', story_type: 'local-secret',
    fun_facts: ['Mudlarking permits are issued by the Port of London Authority — only about 50 active permits exist at any time', 'Finds from the Thames foreshore include Roman coins, medieval pilgrim badges, and Tudor leather shoes', 'The Thames tidal range at South Bank is about 7 metres — one of the largest urban tidal ranges in the world'],
    look_closer_challenge: 'Check the tide level against the river wall — if it\'s low, look for mudlarkers on the foreshore below with trowels and metal detectors.',
    suggested_questions: ['What are the most valuable objects ever found by mudlarkers on the Thames?', 'Why does the Thames have such a large tidal range this far from the sea?'] },

  // MILLENNIUM BRIDGE
  { place_id: 'london_millennium_bridge', tone: 'scholarly', story_type: 'engineering-marvel',
    fun_facts: ['Synchronous lateral excitation was a phenomenon that had never been properly modelled for pedestrian bridges before 2000', 'The fix required 91 dampers — 37 fluid-viscous dampers to control lateral movement and 54 tuned mass dampers for vertical', 'The wobble was so pronounced that footage of pedestrians swaying in unison became one of the most-viewed engineering failure videos online'],
    look_closer_challenge: 'Walk to the centre of the bridge and stand still — see if you can feel any movement. The 91 hidden dampers beneath the deck keep it perfectly steady now.',
    suggested_questions: ['What exactly is synchronous lateral excitation and why wasn\'t it predicted?', 'How did the Millennium Bridge failure change the design of pedestrian bridges worldwide?'] },
  { place_id: 'london_millennium_bridge', tone: 'casual', story_type: 'design-detail',
    fun_facts: ['Foster described the bridge as a "blade of light" — the low profile was designed to avoid competing with St Paul\'s dome', 'The bridge was used in Harry Potter and the Half-Blood Prince — Death Eaters collapse it in the opening scene', 'It\'s the only central London bridge exclusively for pedestrians — no vehicles have ever crossed it'],
    look_closer_challenge: 'Stand at the Tate Modern end and photograph St Paul\'s through the bridge corridor — the dome should sit perfectly centred at dawn or dusk.',
    suggested_questions: ['Why did Foster choose such a low profile for the bridge design?', 'What was the process of filming the bridge\'s destruction for Harry Potter?'] },
  { place_id: 'london_millennium_bridge', tone: 'dramatic', story_type: 'hidden-history',
    fun_facts: ['Before 2000, there had been no new Thames crossing in central London for over 100 years', 'Foot traffic between the Tate Modern and St Paul\'s increased by 400% after the bridge opened', 'The bridge deck is only 4 metres wide — deliberately narrow to maintain the blade-like profile'],
    look_closer_challenge: 'Walk across at dusk and look at the handrail lighting — the bridge appears to float above the dark water with no visible support above deck.',
    suggested_questions: ['How did this single bridge change the cultural geography of London\'s South Bank?', 'Why hadn\'t anyone built a new Thames crossing in central London for over a century?'] },
  { place_id: 'london_millennium_bridge', tone: 'witty', story_type: 'local-secret',
    fun_facts: ['The Thames rises and falls about 7 metres with each tide at this point — one of the largest urban tidal ranges in the world', 'Seals have been spotted near the Millennium Bridge — harbour seals follow fish upriver from the estuary', 'The steel deck produces a faint hum at specific wind speeds due to vortex-induced vibration in the support cables'],
    look_closer_challenge: 'Stop at the centre of the bridge, close your eyes, and listen for the faint hum of the steel in the wind — it\'s not your imagination.',
    suggested_questions: ['What causes the steel bridge deck to hum in certain wind conditions?', 'How far upriver do Thames seals typically travel?'] },

  // TATE MODERN
  { place_id: 'london_tate_modern', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['Giles Gilbert Scott also designed Battersea Power Station and the iconic red telephone box — all in the same career', 'The Turbine Hall is 152 metres long and 35 metres high — large enough to contain several football pitches', 'The chimney was shortened by exactly 2 metres and capped with glass to avoid competing with St Paul\'s dome across the river'],
    look_closer_challenge: 'Compare the height of the Tate\'s chimney with St Paul\'s dome across the river — the chimney was deliberately shortened to sit below the dome line.',
    suggested_questions: ['Why did Herzog and de Meuron decide to keep the Turbine Hall as the entrance rather than fill it with galleries?', 'What other buildings did Giles Gilbert Scott design?'] },
  { place_id: 'london_tate_modern', tone: 'casual', story_type: 'local-secret',
    fun_facts: ['Ai Weiwei\'s sunflower seeds were individually hand-painted by 1,600 artisans in Jingdezhen, China', 'The Tate Modern is the most visited modern art museum in the world — ahead of MoMA in New York and the Centre Pompidou in Paris', 'Olafur Eliasson\'s Weather Project sun installation attracted over 2 million visitors in just five months'],
    look_closer_challenge: 'Step into the Turbine Hall and look up — the 35-metre ceiling used to house generators that powered central London.',
    suggested_questions: ['How do artists approach the challenge of filling the Turbine Hall?', 'Which Turbine Hall commission has been the most controversial?'] },
  { place_id: 'london_tate_modern', tone: 'dramatic', story_type: 'scandal',
    fun_facts: ['The NEO Bankside residents paid up to 4 million pounds per flat and sued for invasion of privacy — they lost', 'Museum-grade climate control requires constant temperature within 1 degree and humidity within 5% — in a former power station', 'The Blavatnik Building extension added 60% more gallery space while weighing a fraction of the original brick structure'],
    look_closer_challenge: 'Look up at the Blavatnik Building extension (glass pyramid on top) and then look at the luxury flats next door — that viewing platform sparked a privacy lawsuit.',
    suggested_questions: ['How did the courts rule on the privacy dispute between the Tate and the neighbouring flat residents?', 'What engineering challenges did converting a power station into a museum present?'] },
  { place_id: 'london_tate_modern', tone: 'witty', story_type: 'perspective-shift',
    fun_facts: ['The Tate Modern consistently ranks as one of London\'s top date destinations — free entry removes financial pressure', 'The Blavatnik Building stairwell has become an Instagram favourite for its geometric spiral when photographed from below', 'The river terrace is one of the best free places to sit in central London — St Paul\'s is directly opposite'],
    look_closer_challenge: 'Approach from the Millennium Bridge and watch the building reveal itself as you cross — the full facade only becomes visible from the bridge\'s midpoint.',
    suggested_questions: ['Why has the Tate Modern become such a popular date destination?', 'What is the best time of day to photograph the Tate Modern exterior?'] },

  // SHAKESPEARE'S GLOBE
  { place_id: 'london_shakespeares_globe', tone: 'scholarly', story_type: 'hidden-history',
    fun_facts: ['The thatch required a special Act of Parliament — no thatched roof had been permitted in London since the Great Fire of 1666', 'The reconstruction is built 230 metres from the original site, which now lies beneath a listed Georgian terrace', 'Groundling tickets cost 5 pounds — you stand in the open yard for the entire performance, rain or shine, just like in 1599'],
    look_closer_challenge: 'Look at the thatched roof and compare it with every other building nearby — it\'s the only thatched roof in London, legal only by special parliamentary permission.',
    suggested_questions: ['Why was the Globe rebuilt 230 metres from the original site?', 'How accurate is this reconstruction compared to the original 1599 theatre?'] },
  { place_id: 'london_shakespeares_globe', tone: 'casual', story_type: 'hidden-history',
    fun_facts: ['Wanamaker arrived in London partly to escape the Hollywood blacklist during the McCarthy era', 'He spent 23 years fighting planning authorities, fundraising, and insisting on historical accuracy before construction began', 'The first performance in the new Globe was The Two Gentlemen of Verona in 1997 — four years after Wanamaker\'s death'],
    look_closer_challenge: 'Find the bronze plaque or memorial to Sam Wanamaker near the entrance — the man who spent 23 years building this theatre and never saw a performance.',
    suggested_questions: ['Why did Wanamaker insist on such strict historical accuracy for the reconstruction?', 'How did an American actor end up devoting his life to rebuilding a London theatre?'] },
  { place_id: 'london_shakespeares_globe', tone: 'dramatic', story_type: 'scandal',
    fun_facts: ['The acting company dismantled the Theatre in Shoreditch on December 28th while the landlord was away for Christmas', 'The Thames froze regularly in the 16th century — cold enough to carry heavy timber frames across', 'The heist was technically legal — the company owned the building materials, just not the land they stood on'],
    look_closer_challenge: 'Look at the heavy oak frame and imagine it being dismantled, carried across a frozen river, and reassembled — that\'s exactly how the original Globe came to exist.',
    suggested_questions: ['How did Shakespeare\'s company manage to dismantle and move an entire theatre in winter?', 'Was the landlord ever compensated for the loss of the Theatre in Shoreditch?'] },
  { place_id: 'london_shakespeares_globe', tone: 'witty', story_type: 'design-detail',
    fun_facts: ['The fire sprinkler system hidden inside the thatch took years of negotiation with London Fire Brigade', 'Performances use only natural light and candles — there are no electric stage lights, so the audience can see each other', 'The oak frame used traditional green oak joinery — no screws, no bolts, just mortise-and-tenon joints held by wooden pegs'],
    look_closer_challenge: 'Look carefully at the thatch for the hidden fire sprinklers — they\'re a masterpiece of invisible modern engineering inside a historical reconstruction.',
    suggested_questions: ['How does performing without electric lighting change the experience for actors and audience?', 'What compromises were made between historical accuracy and modern safety requirements?'] },
];

async function run() {
  console.log(`Updating enrichment for ${enrichments.length} stories...\n`);
  let ok = 0, fail = 0, notFound = 0;

  for (const e of enrichments) {
    // Find the matching story
    const { data: stories, error: findErr } = await supabase
      .from('place_stories')
      .select('id')
      .eq('place_id', e.place_id)
      .eq('tone', e.tone);

    if (findErr || !stories || stories.length === 0) {
      notFound++;
      console.log(`SKIP [${e.place_id}/${e.tone}] — not found`);
      continue;
    }

    // Update with enrichment data
    const { error: updateErr } = await supabase
      .from('place_stories')
      .update({
        story_type: e.story_type,
        fun_facts: e.fun_facts,
        look_closer_challenge: e.look_closer_challenge,
        suggested_questions: e.suggested_questions,
      })
      .eq('id', stories[0].id);

    if (updateErr) {
      fail++;
      console.error(`FAIL [${e.place_id}/${e.tone}]: ${updateErr.message}`);
    } else {
      ok++;
      console.log(`OK   [${e.place_id}/${e.tone}] ${e.story_type}`);
    }
  }

  console.log(`\n=== DONE: ${ok} updated, ${fail} failed, ${notFound} not found ===`);
}

run().catch(e => console.error('Fatal:', e));
