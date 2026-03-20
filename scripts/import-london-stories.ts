import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Run with: deno run --allow-net --allow-env scripts/import-london-stories.ts
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
// Or pass them as arguments: deno run --allow-net scripts/import-london-stories.ts <url> <key>

const supabaseUrl = Deno.args[0] || Deno.env.get('SUPABASE_URL') || 'https://hdzfffutbzpevblbpgjc.supabase.co';
const supabaseKey = Deno.args[1] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('Usage: deno run --allow-net scripts/import-london-stories.ts <url> <service-role-key>');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const stories = [
  // ============================================================
  // BUCKINGHAM PALACE
  // ============================================================
  {
    place_id: "london_buckingham_palace",
    interests: ["history", "architecture"],
    tone: "scholarly",
    hook: "The palace facade is a 1913 disguise over a 1703 townhouse — George IV spent a fortune on it and never moved in.",
    directional_cue: "Count the windows across the east front — there are 240 bedrooms behind that Portland stone facade.",
    audio_narration: "That facade you're looking at? It's a lie — architecturally speaking. The entire east front was refaced in 1913 with Portland stone, essentially gift-wrapping a building that started life as a townhouse for the Duke of Buckingham in 1703. George IV spent a fortune turning it into a palace in the 1820s, then never actually lived here. Queen Victoria was the first monarch to move in, in 1837, partly because the previous royal residence was, in her words, antiquated. Count the windows on the front face. There are 240 bedrooms behind them. The building has its own post office, police station, cinema, and even a cash machine — though only the royal family can use it."
  },
  {
    place_id: "london_buckingham_palace",
    interests: ["local-life", "culture"],
    tone: "casual",
    hook: "The flag on top tells you if the monarch is home — Royal Standard means yes, Union Jack means out.",
    directional_cue: "Look up at the flagpole on the roof — is it the Royal Standard or the Union Jack today?",
    audio_narration: "So that flag up there tells you everything. If it's the Royal Standard — the one with lions and a harp — the monarch is home. If it's the Union Jack, they're out. Locals barely glance at it anymore but tourists crane their necks trying to figure it out. Here's the thing about this forecourt though: it's designed to make you feel small. That Victoria Memorial behind you, the wide-open space, the symmetry — it's all stage management. Stand in the centre and notice how your voice drops. That's the architecture working on you."
  },
  {
    place_id: "london_buckingham_palace",
    interests: ["history", "myths"],
    tone: "witty",
    hook: "A man broke into the Queen's bedroom in 1982 and asked her for a cigarette — trespassing wasn't even illegal.",
    directional_cue: "Look at the palace railings and the camera clusters on the gateposts — direct result of one man and a drainpipe in 1982.",
    audio_narration: "In 1982, a man named Michael Fagan climbed the palace wall, shinned up a drainpipe, and wandered the corridors until he found the Queen's bedroom. He sat on the edge of her bed and asked for a cigarette. She calmly pressed her alarm button — twice — and nobody came. She kept him talking for about ten minutes until a footman arrived. The security review that followed was thorough. But Fagan wasn't charged with trespassing because, at the time, trespassing in a royal palace wasn't actually a criminal offence. They got him on stealing half a bottle of wine instead. Look at those railings — they've been upgraded since."
  },
  {
    place_id: "london_buckingham_palace",
    interests: ["culture", "photography"],
    tone: "dramatic",
    hook: "The Mall held over a million silent people for the Queen's funeral — you could hear footsteps.",
    directional_cue: "Turn your back on the palace and face The Mall — that avenue is designed as a stage for a million spectators.",
    audio_narration: "Turn around. Face away from the palace. That long tree-lined avenue stretching toward Admiralty Arch — that's The Mall, and on coronation days, jubilees, and royal weddings, it fills with a river of people so dense you can't see the tarmac. In 2022, over a million people stood along this route for the Queen's funeral procession. Complete silence. A million people and you could hear footsteps. The Mall was redesigned in 1911 as a processional route — basically urban theatre. Stand here at sunset and the whole avenue turns gold. The palace becomes a silhouette. For about ten minutes, this becomes the most photogenic spot in London."
  },

  // ============================================================
  // ST JAMES'S PARK
  // ============================================================
  {
    place_id: "london_st_jamess_park",
    interests: ["history", "nature"],
    tone: "scholarly",
    hook: "Henry VIII drained a swamp here for deer hunting — the lake and sightlines were designed by John Nash 300 years later.",
    directional_cue: "Stand on the bridge and look east toward Whitehall, then west toward the palace — both views were designed by Nash.",
    audio_narration: "This park was a swamp. Henry VIII drained it in the 1530s to create a deer hunting ground. Charles II redesigned it in the French style after seeing Versailles. But the park you're walking through now is mostly John Nash's work from the 1820s — he turned the rigid canal into this curving lake and planted the tree canopy to create what landscape architects call borrowed views. Stand by the bridge and look east: you get Whitehall framed by willows. Look west: Buckingham Palace floating above the water. Nash designed those sightlines deliberately. Nothing here is accidental."
  },
  {
    place_id: "london_st_jamess_park",
    interests: ["nature", "local-life"],
    tone: "casual",
    hook: "The park has had pelicans since 1664 — a gift from Russia — and they've been caught swallowing pigeons whole.",
    directional_cue: "Head to the east end of the lake near Duck Island — the pelicans are fed fresh fish around 2:30pm daily.",
    audio_narration: "The pelicans. You have to see the pelicans. St James's Park has had pelicans since 1664, when the Russian ambassador gave them to Charles II as a diplomatic gift. There are currently about seven, and they're fed fresh fish every afternoon around 2:30pm near Duck Island. They're not shy — they've been known to swallow pigeons whole, which is genuinely horrifying if you see it happen. But the pelicans are the stars. Find a bench near the east end of the lake and just watch. Office workers eat lunch here every day surrounded by birds that predate their buildings by centuries. That contrast is peak London."
  },
  {
    place_id: "london_st_jamess_park",
    interests: ["politics", "history"],
    tone: "dramatic",
    hook: "Kim Philby met his Soviet handlers in this park — MI5 and MI6 are both within a ten-minute walk.",
    directional_cue: "Look at the benches along the path toward Whitehall — in the Cold War, these were favoured spots for intelligence handoffs.",
    audio_narration: "In the Cold War, this park was spy territory. The bench-lined paths between Whitehall and the park were favoured meeting spots for intelligence officers — close enough to the ministries to look like a lunch break, secluded enough for a quiet conversation. Kim Philby, the most damaging double agent in British history, reportedly met his Soviet handlers within sight of where you're standing. MI5 and MI6 headquarters are both within a ten-minute walk. The park still has an odd energy at lunchtime — hundreds of civil servants eating sandwiches in silence, having conversations they can't have indoors. Some things haven't changed much."
  },
  {
    place_id: "london_st_jamess_park",
    interests: ["photography", "design"],
    tone: "witty",
    hook: "The footbridge forces you to choose between two Londons — Nash designed it so you can't see both at once.",
    directional_cue: "Walk to the centre of the footbridge and face east, then west — two completely different cities.",
    audio_narration: "Here's the trick every London photographer knows: the footbridge in the middle of the lake gives you two completely different cities depending on which way you face. East: the domes and turrets of Whitehall and Horse Guards Parade, looking like a slightly unreal period drama. West: Buckingham Palace sitting above the water, framed by willows. The genius is that Nash designed it so you can't see both at once — you have to choose. It's like the park is making you pick a version of London. Sunset is the cheat code. The water turns copper and both views go soft. Every Instagrammer in Westminster knows this spot."
  },

  // ============================================================
  // WESTMINSTER ABBEY
  // ============================================================
  {
    place_id: "london_westminster_abbey",
    interests: ["history", "architecture"],
    tone: "scholarly",
    hook: "Every monarch since 1066 has been crowned here — 3,300 people are buried under the floor.",
    directional_cue: "Look at the flying buttresses along the south wall — they're not decorative, they're holding the ceiling up.",
    audio_narration: "Every English monarch since William the Conqueror in 1066 has been crowned in this building — nearly a thousand years of continuous ceremonial use. The abbey you're looking at is mostly Henry III's rebuild from 1245, designed to rival the great French cathedrals. Look at the flying buttresses along the south side — they're doing real structural work. They transfer the weight of that vaulted ceiling outward so the walls can be thinner, which means bigger windows, which means more light inside. It's an engineering solution disguised as beauty. Over 3,300 people are buried here, making the floor itself a kind of geological record of British power."
  },
  {
    place_id: "london_westminster_abbey",
    interests: ["literature", "culture"],
    tone: "casual",
    hook: "Chaucer wasn't buried here for his writing — he just rented rooms nearby. Poets' Corner happened by accident.",
    directional_cue: "Find the entrance to Poets' Corner on the south transept side — Chaucer's tomb started it all in 1400.",
    audio_narration: "Poets' Corner started by accident. Geoffrey Chaucer was buried here in 1400 — not because he wrote The Canterbury Tales, but because he lived nearby and rented rooms from the abbey. It wasn't until the 1500s that someone thought to add a monument, and then other writers wanted in. Now it's got Dickens, Hardy, Kipling, Tennyson, and dozens more. Some are actual burials, some are just memorial stones. The funny thing is, some of the greatest writers aren't here — Shakespeare has a memorial but is buried in Stratford. Jane Austen has a stone but it was only added in 1967. The politics of who gets in is its own centuries-long drama."
  },
  {
    place_id: "london_westminster_abbey",
    interests: ["history", "myths"],
    tone: "dramatic",
    hook: "William the Conqueror's coronation nearly caused a riot — guards set fires outside while he trembled on the throne.",
    directional_cue: "Look at the great west door — every coronation procession has passed through this entrance since 1066.",
    audio_narration: "On Christmas Day 1066, William the Conqueror was crowned inside this abbey, and it nearly ended in disaster. The congregation shouted their approval in both English and Norman French, and the guards outside — hearing the roar — thought a riot had broken out. They started setting fire to surrounding buildings. Inside, the ceremony continued through smoke and panic, with William reportedly trembling on the throne. That coronation chair — the one Edward I had built in 1296 — is still inside, still used. It's the oldest piece of furniture in England still serving its original purpose."
  },
  {
    place_id: "london_westminster_abbey",
    interests: ["architecture", "design"],
    tone: "witty",
    hook: "The west towers took 500 years to finish — completed in 1745 by Wren's assistant Hawksmoor.",
    directional_cue: "Compare the west towers to the older stonework below — Hawksmoor's 1745 additions are subtly taller and crisper.",
    audio_narration: "The two west towers that define the abbey's silhouette weren't finished until 1745 — nearly 500 years after the rest of the building. They were designed by Nicholas Hawksmoor, who was basically the closer that English architecture called in when projects stalled. He was Christopher Wren's assistant and inherited all the difficult jobs. The towers are technically Gothic, but if you look carefully, the proportions are subtly different from the medieval work below — a bit more vertical, a bit more confident. It's like watching someone finish someone else's sentence perfectly. The abbey has been under continuous renovation for so long that scaffolding is practically a design feature."
  },

  // ============================================================
  // PALACE OF WESTMINSTER / BIG BEN
  // ============================================================
  {
    place_id: "london_palace_of_westminster",
    interests: ["history", "architecture"],
    tone: "scholarly",
    hook: "Parliament burned down in 1834 because they were still using medieval tally sticks — the fire started in the accounting system.",
    directional_cue: "Look at the stonework closely — lighter panels are 20th-century Clipsham stone replacing the original Victorian limestone.",
    audio_narration: "The building looks medieval but it's mostly Victorian — the original Palace of Westminster burned down in 1834 when overheated tally sticks set fire to a furnace. Tally sticks: the medieval accounting system they were still using in the 19th century. Charles Barry designed the replacement in the Perpendicular Gothic style, with Augustus Pugin handling every interior detail down to the ink wells. Pugin worked himself into a breakdown doing it. The building contains over 1,100 rooms, 100 staircases, and 3 miles of corridors. Look at the stone — the original Anston limestone decayed so badly they've been replacing it with Clipsham stone since the 1920s."
  },
  {
    place_id: "london_palace_of_westminster",
    interests: ["engineering", "local-life"],
    tone: "casual",
    hook: "Big Ben has been cracked since 1859 — the clock is kept accurate by stacking pennies on the pendulum.",
    directional_cue: "Listen for the chimes on the quarter hour — that slightly imperfect tone is a crack that's been there since 1859.",
    audio_narration: "Big Ben isn't the tower, it's the bell. Everyone says this and everyone still calls the tower Big Ben anyway, so let's just go with it. The tower's official name is Elizabeth Tower, renamed in 2012. The bell itself weighs 13.7 tonnes and has a crack in it — it's been cracked since 1859, which is why it has that slightly imperfect tone. They rotated the bell so the hammer hits a different spot and just kept going. The clock is kept accurate by adding or removing old pennies from the pendulum. A single penny changes the clock speed by 0.4 seconds per day. You're hearing a cracked bell corrected by loose change."
  },
  {
    place_id: "london_palace_of_westminster",
    interests: ["politics", "history"],
    tone: "dramatic",
    hook: "The cellars are still searched before every State Opening — 400 years after the Gunpowder Plot.",
    directional_cue: "Look at the base of the building near Old Palace Yard — the cellars Fawkes was found in ran beneath this stretch.",
    audio_narration: "On November 5th 1605, Guy Fawkes was found in the cellars beneath this building with 36 barrels of gunpowder — enough to level everything within a wide radius. The Gunpowder Plot aimed to blow up the House of Lords during the State Opening. Fawkes was a soldier, not the ringleader — that was Robert Catesby — but he drew the short straw of guarding the gunpowder. To this day, before every State Opening, the Yeoman of the Guard search the cellars. It's ceremonial now, but the tradition tells you something about institutional memory. Four hundred years later, they still check."
  },
  {
    place_id: "london_palace_of_westminster",
    interests: ["photography", "design"],
    tone: "witty",
    hook: "Victoria Tower is taller than Big Ben's tower but gets almost zero tourist attention — it holds every Act of Parliament since 1497.",
    directional_cue: "Look south along the building to the Victoria Tower — it's two metres taller than Elizabeth Tower but almost nobody photographs it.",
    audio_narration: "Here's something most people miss: the Victoria Tower at the south end of the building is actually taller than Elizabeth Tower at the north end. Victoria Tower is 98 metres; Elizabeth Tower is 96. But nobody photographs Victoria Tower because it doesn't have a clock face and it doesn't have a name that sounds like a person. It houses the Parliamentary Archives — every Act of Parliament since 1497 is stored in there. Meanwhile, Elizabeth Tower gets all the Instagram attention for being two metres shorter with a better marketing department. If you want the classic postcard shot, stand on Westminster Bridge. If you want to feel clever, photograph Victoria Tower instead."
  },

  // ============================================================
  // WHITEHALL
  // ============================================================
  {
    place_id: "london_whitehall",
    interests: ["history", "architecture"],
    tone: "scholarly",
    hook: "The Banqueting House is the only survivor of a 1,500-room palace — Charles I was executed through its window.",
    directional_cue: "Find the Banqueting House's pale stone facade on your left — the only surviving piece of what was Europe's largest palace.",
    audio_narration: "Whitehall was once the largest palace in Europe — over 1,500 rooms sprawling from the Thames to St James's Park. Henry VIII seized it from Cardinal Wolsey in 1530. Almost all of it burned down in 1698. The only surviving piece is the Banqueting House, designed by Inigo Jones in 1622. Look at it: that clean Palladian facade was revolutionary in a London of timber and Tudor brick. It was the first purely Renaissance building in England. The Rubens ceiling inside was commissioned by Charles I, who later walked through a first-floor window of the same building to his own execution in 1649. Architecture and irony, side by side."
  },
  {
    place_id: "london_whitehall",
    interests: ["politics", "local-life"],
    tone: "casual",
    hook: "The Cenotaph was built in wood as a temporary memorial — public grief made it permanent in stone.",
    directional_cue: "Look for the Cenotaph in the centre of the road — watch how people's pace changes as they pass it.",
    audio_narration: "Every important government department lines this street. The Ministry of Defence, the Foreign Office, the Cabinet Office, the Treasury — they're all within a few hundred metres. That's not a coincidence; it's proximity as power. The Cenotaph — that plain white memorial in the middle of the road — is the national war memorial. It was designed by Edwin Lutyens and originally built in wood for the 1919 peace celebrations. The public reaction was so strong they rebuilt it in Portland stone. Watch how people behave around it: some pause, some salute, most walk past. On Remembrance Sunday in November, the entire street shuts down."
  },
  {
    place_id: "london_whitehall",
    interests: ["history", "myths"],
    tone: "dramatic",
    hook: "Charles I wore two shirts to his execution so the crowd wouldn't mistake his shivering for fear.",
    directional_cue: "Stand in front of the Banqueting House and look down — the execution scaffold stood roughly where the road is now.",
    audio_narration: "In January 1649, King Charles I walked from St James's Palace down what is now this road to his execution. The scaffold was built outside the Banqueting House — the same building where he'd hosted lavish masques and commissioned that extraordinary Rubens ceiling celebrating the divine right of kings. He wore two shirts so he wouldn't shiver in the cold and give the crowd the impression he was afraid. His last word to the executioner was 'Remember.' Nobody is entirely sure what he meant. The spot isn't marked — no plaque, no monument. You just walk over it. Every commuter heading to Charing Cross walks over the spot where the English monarchy was interrupted."
  },
  {
    place_id: "london_whitehall",
    interests: ["culture", "photography"],
    tone: "witty",
    hook: "Horse Guards Parade was Henry VIII's jousting yard — the sentries aren't guarding anything anymore.",
    directional_cue: "Walk through the Horse Guards archway and turn around — the view back through frames Whitehall perfectly.",
    audio_narration: "Horse Guards Parade is the most photographed military checkpoint in the world where absolutely nothing is being guarded. The mounted sentries sit on horseback in those little booths, and tourists queue to pose with them like they're Disney characters. The soldiers aren't allowed to react, which has produced some of the internet's best deadpan content. But walk through the archway and you're in Horse Guards Parade ground — Henry VIII's jousting yard. From the parade ground, turn around and look back through the archway: you get a perfectly framed view of Whitehall. That sightline has been open for 500 years."
  },

  // ============================================================
  // 10 DOWNING STREET
  // ============================================================
  {
    place_id: "london_10_downing_street_viewpoint",
    interests: ["history", "politics"],
    tone: "scholarly",
    hook: "The PM can't open their own front door — Number 10 has no external keyhole or handle.",
    directional_cue: "Look down Downing Street toward the black door — it's blast-proof with no external handle, opened only from inside.",
    audio_narration: "Number 10 is actually three houses knocked together. The modest terraced house you see from the street is connected to a larger building behind it. Behind that famous black door there are approximately 100 rooms. The house was a gift from George II to Robert Walpole, Britain's first Prime Minister, in 1735. Walpole accepted it on the condition it be attached to the office, not to him personally. That decision created the convention that the PM lives at Number 10. The door is blast-proof, weighs more than it looks, and can only be opened from the inside. There's no keyhole, no handle on the outside. The Prime Minister literally cannot let themselves in."
  },
  {
    place_id: "london_10_downing_street_viewpoint",
    interests: ["local-life", "culture"],
    tone: "casual",
    hook: "Larry the Cat has outlasted four Prime Ministers — his Wikipedia page is longer than some MPs'.",
    directional_cue: "Watch for Larry the Cat on the Number 10 doorstep — he's been Chief Mouser since 2011, outlasting four PMs.",
    audio_narration: "The gates blocking Downing Street weren't always there. Until 1989, you could walk right up to the door and knock on it. Margaret Thatcher had the security gates installed after IRA threats. Before that, it was genuinely a regular-looking street. There's a famous photo from the 1960s of a milkman delivering bottles to Number 10 like any other terraced house. Larry the Cat has lived at Number 10 since 2011 and has now outlasted four Prime Ministers. His official title is Chief Mouser to the Cabinet Office. He has his own Wikipedia page, and it's longer than some MPs'. He's usually visible on the doorstep if you're patient."
  },
  {
    place_id: "london_10_downing_street_viewpoint",
    interests: ["history", "architecture"],
    tone: "dramatic",
    hook: "Number 10's black bricks are actually painted yellow ones — they cleaned off the soot and everyone hated it.",
    directional_cue: "Look at the facade — those black bricks are yellow underneath, painted to maintain the image after a 1960s cleaning.",
    audio_narration: "The front of Number 10 is a lie. Those black bricks? They're actually yellow London stock bricks underneath, darkened by 200 years of coal pollution. When they cleaned the building in the 1960s, the yellow bricks emerged and everyone hated it — it didn't look like Number 10 anymore. So they painted it black. Every few years they repaint it to maintain the illusion. The house is also structurally precarious — cheaply built in the 1680s and shored up so many times that it's essentially held together by renovations. The most powerful address in Britain is basically a patched-up terrace with a good paint job."
  },
  {
    place_id: "london_10_downing_street_viewpoint",
    interests: ["politics", "photography"],
    tone: "witty",
    hook: "The PM's podium is bolted to a specific pavement spot — every statement hits the exact same camera angle.",
    directional_cue: "Notice how every Downing Street photo looks identical — the street is so narrow there's only one camera angle.",
    audio_narration: "Every time a new PM arrives, they do the same thing: stand at the door, wave, walk in. Every time one leaves, same thing in reverse. The choreography is identical because the street is so narrow that there's really only one angle for the cameras. That's why every Number 10 photo looks the same. The podium where PMs give statements is bolted to a specific spot on the pavement. Even the emotional moments hit the same camera position. The real power move is the people you don't see: the permanent civil servants who stay when the PMs change. Most of them have been there longer than whoever's in charge."
  },

  // ============================================================
  // CHURCHILL WAR ROOMS
  // ============================================================
  {
    place_id: "london_churchill_war_rooms",
    interests: ["history", "architecture"],
    tone: "scholarly",
    hook: "When the War Rooms closed in 1945, staff locked the doors and left everything in place — it stayed sealed for decades.",
    directional_cue: "Look for the small sign near the entrance at Clive Steps — the War Rooms sit directly beneath the building above you.",
    audio_narration: "The War Rooms sit beneath the Treasury building, protected by a concrete slab reinforced to three metres thick — though Churchill privately doubted it would survive a direct hit. The complex was operational from August 1939 until Japan surrendered in August 1945. When the staff walked out and locked the doors, they left everything in place: maps, pins, charts, ashtrays. The rooms remained sealed for decades. What you see inside today is largely as it was on that final day. The Map Room operated 24 hours a day for six straight years. Churchill's underground bedroom still has the desk microphone he used for wartime broadcasts."
  },
  {
    place_id: "london_churchill_war_rooms",
    interests: ["local-life", "history"],
    tone: "casual",
    hook: "Churchill's hotline to Roosevelt was disguised as a toilet so nobody would question his frequent visits.",
    directional_cue: "Look at the building above — Churchill used to sneak to its roof during air raids to watch the Blitz.",
    audio_narration: "About 500 people worked down here during the war, and conditions were genuinely grim. No natural light, recycled air, and noise from the ventilation fans so loud that some staff developed hearing problems. Churchill hated being underground — he'd sneak up to the roof during air raids to watch the Blitz, which terrified his security team. The one luxury was a direct phone line to Roosevelt in the White House, disguised as a private toilet so nobody would ask questions. If you asked why Churchill kept disappearing into the loo, the answer was: he was calling the President."
  },
  {
    place_id: "london_churchill_war_rooms",
    interests: ["engineering", "history"],
    tone: "dramatic",
    hook: "Churchill was told the concrete slab probably wouldn't survive a direct hit — he used the rooms anyway.",
    directional_cue: "Stand on King Charles Street and look down — the War Rooms are directly beneath your feet, hidden for six years.",
    audio_narration: "The entire complex was a secret hidden in plain sight. Thousands of people walked over it every day without knowing what was underneath. The ventilation shaft was disguised as a normal building feature. The entrances were unmarked. If a bomb had scored a direct hit, the three-metre concrete slab would have been the only thing between the War Cabinet and oblivion. Churchill was briefed that it probably wouldn't hold. He used the rooms anyway. The decision to stay in London rather than evacuate was partly strategic and partly theatrical — Churchill understood that visible leadership mattered. Every night, the lights stayed on underground while London burned above."
  },
  {
    place_id: "london_churchill_war_rooms",
    interests: ["culture", "design"],
    tone: "witty",
    hook: "Churchill insisted on champagne and afternoon naps underground — he credited the naps for his 18-hour workdays.",
    directional_cue: "Before you go in, notice the modest entrance — 500 people worked here in secret while London walked overhead.",
    audio_narration: "Churchill had very specific requirements for his underground life. He insisted on a proper bed, not a bunk, because he napped religiously every afternoon — a habit he credited for his ability to work 18-hour days. He also insisted on a supply of champagne, brandy, and cigars, which his staff found both infuriating and reassuring. His typing pool worked in a windowless room and were famously accurate despite the noise. The man understood personal branding a century before the term existed. His V-for-victory sign, his hat, his cigar — all deliberately cultivated. The War Rooms are as much a monument to image-making as to military strategy."
  },

  // ============================================================
  // LONDON EYE
  // ============================================================
  {
    place_id: "london_london_eye",
    interests: ["engineering", "architecture"],
    tone: "scholarly",
    hook: "The Eye was temporary — a five-year permit that never ended. There's no capsule 13.",
    directional_cue: "Look at the capsule numbers as they pass the boarding platform — count from 12 to 14 and notice what's missing.",
    audio_narration: "The London Eye wasn't supposed to be permanent. It was built as a temporary millennium celebration — a five-year permit that just kept getting renewed. The wheel is 135 metres tall and was the world's tallest Ferris wheel when it opened in 2000. Engineers floated the structure down the Thames in sections and assembled it horizontally on pontoons, then raised it into position over two weeks. The capsules are numbered 1 to 33 — but there's no capsule 13. Each capsule holds 25 people and weighs 10 tonnes. The wheel rotates continuously at 26 centimetres per second, slow enough to board without stopping. One revolution takes exactly 30 minutes."
  },
  {
    place_id: "london_london_eye",
    interests: ["local-life", "culture"],
    tone: "casual",
    hook: "The Eye was designed by a married couple who entered a newspaper competition — Londoners famously never ride it.",
    directional_cue: "Look along the South Bank promenade in either direction — the walk from here to Tate Modern is one of London's best.",
    audio_narration: "Here's what Londoners actually think of the Eye: they never go on it. It's in the same category as the Statue of Liberty for New Yorkers — you appreciate it from a distance. But the area around it is genuinely great. The South Bank promenade from here to the Tate Modern is one of the best walks in London — buskers, skateboarders, bookstalls under Waterloo Bridge, food stalls. The Eye was designed by husband-and-wife architects David Marks and Julia Barfield, who entered a newspaper competition and won. They spent years fighting to get it built. Now it's on the skyline alongside buildings that have been here for centuries."
  },
  {
    place_id: "london_london_eye",
    interests: ["engineering", "history"],
    tone: "dramatic",
    hook: "The first attempt to raise the Eye failed live on television — engineers opened champagne at 3am when it finally stood.",
    directional_cue: "Look at the base where the wheel meets the river — the entire structure was raised from horizontal over a week of nerve.",
    audio_narration: "Raising the Eye was one of the great engineering dramas of the 1990s. The wheel was assembled lying flat on platforms in the Thames, then slowly raised by a strand-jacking system — cables pulling it upright degree by degree. On the first attempt, a cable coupling failed and the lift stalled. The press had a field day. The engineers fixed it and resumed, raising 2,100 tonnes of steel to vertical while the entire country watched. The wind tolerance during the lift was tight — anything above 20 knots and they'd have had to abort. They got lucky with the weather. When it finally clicked into position, the team reportedly opened champagne on the riverbank at 3am."
  },
  {
    place_id: "london_london_eye",
    interests: ["photography", "design"],
    tone: "witty",
    hook: "The Eye changed London photography forever — it replaced Big Ben as the skyline's visual shorthand for 'modern.'",
    directional_cue: "Cross to the Westminster Bridge side of the river for the reflection shot — the LED lights change colour at dusk.",
    audio_narration: "The Eye has completely changed how people photograph London. Before 2000, the classic Thames shot was Big Ben reflected in the water. Now half the shots include the Eye, and it's become the visual shorthand for modern London. The capsules are designed as glass eggs to maximize the view, and they're climate-controlled. The best photography moment from ground level is at dusk when the LED lights come on. They change colour for events: red white and blue for national celebrations, rainbow for Pride. Stand on the opposite bank near Westminster Bridge for the reflection shot. Tourists will photobomb you. Accept it."
  },

  // ============================================================
  // SOUTH BANK
  // ============================================================
  {
    place_id: "london_south_bank",
    interests: ["history", "culture"],
    tone: "scholarly",
    hook: "This entire cultural strip was a bomb-damaged wasteland until 1951 — the Festival of Britain reinvented it.",
    directional_cue: "Look at the Royal Festival Hall — the only survivor of the 1951 Festival of Britain, built in just two years.",
    audio_narration: "The South Bank was a wasteland until 1951. Bombed during the Blitz and largely derelict, the government chose it for the Festival of Britain — a national morale boost. The Royal Festival Hall, the only surviving building from that festival, was built in just two years and remains one of the finest concert halls in the world. The Brutalist buildings that followed — the Hayward Gallery, Queen Elizabeth Hall, the National Theatre — were designed as a cultural fortress on the river. The raw concrete was a deliberate choice: honest materials for honest culture. Love them or hate them, they're some of the most uncompromising architecture in London."
  },
  {
    place_id: "london_south_bank",
    interests: ["local-life", "food"],
    tone: "casual",
    hook: "The skateboarders nearly lost their spot to developers — they campaigned and won, saving a legendary skate spot.",
    directional_cue: "Duck under Waterloo Bridge to find the book market — it stays dry even in the rain, open every day.",
    audio_narration: "The book market under Waterloo Bridge has been here since the 1980s and it's one of London's quiet treasures. Secondhand books, prints, maps — the kind of browsing that eats an hour. The bridge above creates a sheltered corridor that stays dry even in rain, which is why it's also a favourite spot for skateboarders. The skate spot at the Undercroft is one of the most famous in Europe and nearly got demolished for development. Skaters campaigned and won. Grab something from one of the food stalls along the river walk and find a bench facing the water. St Paul's dome across the river, boats going past, and the city humming around you."
  },
  {
    place_id: "london_south_bank",
    interests: ["art", "design"],
    tone: "dramatic",
    hook: "Prince Charles called the National Theatre 'a clever way of building a nuclear power station' — the architect was devastated.",
    directional_cue: "Look at the layered concrete terraces of the National Theatre — at night they glow from within and silence the critics.",
    audio_narration: "The National Theatre is a building that divides London like no other. Opened in 1976, designed by Denys Lasdun, it was described by Prince Charles as a clever way of building a nuclear power station in the middle of London. Lasdun was devastated. But the building works — the layered concrete terraces create outdoor stages, sheltered viewing platforms, and a sense of belonging to the city. The Brutalist concrete ages beautifully when maintained, developing a warmth that surprises people who expect it to look cold. At night, when the building is lit from within and the terraces glow, even its critics tend to go quiet."
  },
  {
    place_id: "london_south_bank",
    interests: ["photography", "local-life"],
    tone: "witty",
    hook: "At low tide, mudlarkers search the foreshore for Tudor pipes and medieval pins — technically illegal, rarely stopped.",
    directional_cue: "Watch for the tide line on the river wall — when the Thames drops, check the foreshore for mudlarkers with metal detectors.",
    audio_narration: "The South Bank is where London goes to be seen being cultured. On any weekend you'll see people reading novels they've just bought from the book market, couples pretending to understand the Hayward Gallery exhibition, and parents dragging children to the BFI while promising ice cream after. It's performative and genuine at the same time, which is very London. The best free entertainment is the river itself — watch the tide. When the Thames is low, mudlarkers appear on the foreshore searching for Tudor pipes and medieval pins. It's technically illegal without a permit but enforcement is relaxed. The Thames has been dropping things for 2,000 years."
  },

  // ============================================================
  // MILLENNIUM BRIDGE
  // ============================================================
  {
    place_id: "london_millennium_bridge",
    interests: ["engineering", "architecture"],
    tone: "scholarly",
    hook: "The 'Wobbly Bridge' closed two days after opening — pedestrians' synchronised footsteps made it sway uncontrollably.",
    directional_cue: "Walk to the centre of the bridge and feel the deck — the 91 hidden dampers underneath are why it doesn't move anymore.",
    audio_narration: "The Millennium Bridge was designed by Norman Foster, sculptor Anthony Caro, and engineering firm Arup. When it opened on June 10, 2000, it immediately started swaying — not up and down, but side to side. The problem was synchronous lateral excitation: as the bridge moved slightly, pedestrians unconsciously adjusted their footsteps to match, amplifying the wobble. Within two days, it was closed. It stayed closed for nearly two years while Arup installed 91 dampers. The fix cost five million pounds. The bridge now stands as both an engineering triumph and a cautionary tale about crowd dynamics that changed how pedestrian bridges are designed worldwide."
  },
  {
    place_id: "london_millennium_bridge",
    interests: ["photography", "culture"],
    tone: "casual",
    hook: "Foster designed this bridge specifically to frame St Paul's — stand at the south end for the perfect shot.",
    directional_cue: "Stand at the Tate Modern end and look north — the bridge creates a corridor straight to St Paul's dome.",
    audio_narration: "This bridge exists to frame St Paul's Cathedral. Stand at the south end near the Tate Modern and look north: the bridge creates a perfect corridor straight to St Paul's dome. That's not an accident — Foster designed it as a blade of light connecting two cultural landmarks while creating the best pedestrian view of the cathedral in London. It's also the most photogenic bridge crossing in the city, especially at dawn when the steel catches the first light. Harry Potter fans will recognise it from The Half-Blood Prince. It's the only London bridge that exists purely for walking, which gives it a different energy from the traffic-heavy crossings."
  },
  {
    place_id: "london_millennium_bridge",
    interests: ["history", "design"],
    tone: "dramatic",
    hook: "This bridge increased foot traffic between Tate Modern and St Paul's by 400% — it stitched two Londons together.",
    directional_cue: "Look along the handrails at dusk — the integrated lighting makes the bridge appear to float above the water.",
    audio_narration: "Before this bridge, there hadn't been a new Thames crossing in central London for over a century. The gap between Blackfriars Bridge and Southwark Bridge kept the South Bank culturally disconnected from the City. When the Millennium Bridge opened, foot traffic between the Tate Modern and St Paul's increased by 400 percent almost overnight. It physically stitched two halves of London together. The bridge is deliberately minimal — no towers, no suspension cables visible above deck, just a low steel blade across the water. At night, the lighting runs along the handrails, and the whole structure seems to float."
  },
  {
    place_id: "london_millennium_bridge",
    interests: ["local-life", "nature"],
    tone: "witty",
    hook: "The bridge hums in the wind — regular crossers learn to hear it, tourists think they're imagining things.",
    directional_cue: "Stop in the middle, look down at the water level, and listen — at certain wind speeds the steel deck hums.",
    audio_narration: "Stand in the middle of the bridge and look down at the water. The Thames at this point is tidal — it rises and falls about seven metres twice a day. At low tide you can see the riverbed. Mudlarks find Roman coins, medieval shoe buckles, and Georgian clay pipes down there regularly. The river moves fast here too — about four knots at peak flow. Seals have been spotted this far upriver, which delights locals and terrifies paddleboarders. The bridge also has a peculiar acoustic property: at certain times, the steel hums in the wind. Regular crossers learn to hear it. Tourists think it's their imagination. It's not."
  },

  // ============================================================
  // TATE MODERN
  // ============================================================
  {
    place_id: "london_tate_modern",
    interests: ["architecture", "history"],
    tone: "scholarly",
    hook: "The architect of this power station also designed the red telephone box — the chimney was shortened to respect St Paul's.",
    directional_cue: "Look up at the chimney's glass light beam at the top — it was shortened by two metres so it wouldn't rival St Paul's dome.",
    audio_narration: "The building was Bankside Power Station, designed by Giles Gilbert Scott — the same architect who designed the red telephone box and Battersea Power Station. It generated electricity for London from 1952 to 1981. Herzog and de Meuron won the competition to convert it, and their key decision was to keep the Turbine Hall. That vast industrial void — 152 metres long and 35 metres high — became the entrance, changing what people expected a gallery to feel like. The chimney was shortened by two metres and topped with a glass light beam so it wouldn't compete with St Paul's across the river. That restraint defines the whole conversion."
  },
  {
    place_id: "london_tate_modern",
    interests: ["art", "culture"],
    tone: "casual",
    hook: "The Tate Modern gets six million visitors a year — more than any other modern art museum in the world. Entry is free.",
    directional_cue: "Step inside the Turbine Hall entrance — that 35-metre-high void used to house the power station's generators.",
    audio_narration: "The Turbine Hall commissions are some of the most talked-about art events in London. Olafur Eliasson put a giant sun in there. Ai Weiwei filled the floor with 100 million hand-painted porcelain sunflower seeds. The space is so massive that it dares artists to fill it. Entry is free, which means the Tate Modern gets about six million visitors a year — more than any other modern art museum in the world. The gift shop is excellent and the view from the restaurant on the top floor is one of London's best-kept secrets. St Paul's at eye level, the river below, and on a clear day you can see the hills south of London."
  },
  {
    place_id: "london_tate_modern",
    interests: ["design", "engineering"],
    tone: "dramatic",
    hook: "Residents of the adjacent luxury flats sued over the viewing platform — the Tate won, the residents installed one-way glass.",
    directional_cue: "Look for the Blavatnik Building extension on top — glass above brick, and the level 10 viewing platform that sparked a lawsuit.",
    audio_narration: "Converting a power station into a gallery sounds simple but the engineering was ferocious. The building had to maintain its industrial character while meeting museum-grade climate control. Herzog and de Meuron added the glass extension on top — the Blavatnik Building — in 2016, giving the building a split personality: heavy brick below, light glass above. The viewing platform on level 10 caused a legal battle — residents of the luxury flats next door sued because visitors could see directly into their living rooms. The Tate won. The view is public. The residents installed one-way glass. London architecture disputes don't get more perfectly London than that."
  },
  {
    place_id: "london_tate_modern",
    interests: ["local-life", "photography"],
    tone: "witty",
    hook: "The Tate Modern is London's most popular first-date spot — free entry and guaranteed conversation starters on every wall.",
    directional_cue: "Approach from the Millennium Bridge for the best exterior shot — the building reveals itself as you cross the river.",
    audio_narration: "The Tate Modern accidentally created one of London's best date spots. Something about the industrial space, the free entry, and the guaranteed conversation starters on every wall makes it first-date gold. You can pretend to have opinions about Rothko, share awkward silences in front of conceptual installations, and retreat to the cafe when you run out of things to say. For photos, the exterior is best from the Millennium Bridge approach — the whole building reveals itself as you cross. Inside, the stairwell in the Blavatnik Building has a spiral geometry that photographers lose an hour in."
  },

  // ============================================================
  // SHAKESPEARE'S GLOBE
  // ============================================================
  {
    place_id: "london_shakespeares_globe",
    interests: ["history", "theatre"],
    tone: "scholarly",
    hook: "This has London's only thatched roof since the Great Fire of 1666 — it needed an Act of Parliament.",
    directional_cue: "Look at the thatched roof — it's the only one legally permitted in London since 1666, approved by a special Act of Parliament.",
    audio_narration: "This isn't Shakespeare's Globe — it's a reconstruction, built about 230 metres from where the original stood. The original burned down in 1613 when a cannon fired during Henry VIII set the thatched roof alight. The new Globe was the obsession of American actor Sam Wanamaker, who spent 23 years campaigning for it. He died in 1993, four years before it opened. The building uses the same construction methods as the original: oak frame, lime plaster, and the only thatched roof permitted in London since the Great Fire of 1666. The theatre holds 1,500 people. 700 stand as groundlings in the yard, exposed to the weather, exactly as they did in 1599."
  },
  {
    place_id: "london_shakespeares_globe",
    interests: ["theatre", "local-life"],
    tone: "casual",
    hook: "Sam Wanamaker spent 23 years rebuilding this theatre and died four years before it opened — he never saw a single performance.",
    directional_cue: "Look for the bronze plaque near the entrance honouring Sam Wanamaker — the American actor who made this place exist.",
    audio_narration: "In 1949, an American actor named Sam Wanamaker came looking for Shakespeare's Globe. He found a bronze plaque on a brewery wall. That's it. No theatre, nothing. He spent the next 23 years fundraising, arguing with councils, and fighting to rebuild it. He convinced English Heritage, survived planning objections, and insisted every detail be historically accurate: oak frame, lime plaster, hand-made bricks. He died in 1993, four years before the first audience walked in. Never saw a single performance in the theatre he willed into existence. The groundlings in the yard today owe their five-pound tickets to a stubborn American who wouldn't accept a plaque."
  },
  {
    place_id: "london_shakespeares_globe",
    interests: ["architecture", "myths"],
    tone: "dramatic",
    hook: "The original Globe was built from a stolen theatre — dismantled at night and carried across the frozen Thames.",
    directional_cue: "Look at the oak frame construction — this reconstruction uses the same methods as the timber carried across the ice in 1598.",
    audio_narration: "The original Globe was built from stolen timber. In 1598, the lease on the Theatre in Shoreditch expired, and the landlord planned to seize the building. On December 28th, while the landlord was away for Christmas, the acting company — including Shakespeare — dismantled the entire timber frame, carried it across the frozen Thames, and rebuilt it as the Globe. The whole operation was technically legal because the company owned the timber, just not the land. It's one of the great heist stories in English history: a stolen theatre, carried across a frozen river, reassembled into the most famous playhouse ever built."
  },
  {
    place_id: "london_shakespeares_globe",
    interests: ["design", "culture"],
    tone: "witty",
    hook: "Wanamaker found nothing but a dirty plaque on a brewery wall in 1949 — he spent 44 years building this replacement.",
    directional_cue: "Look for the hidden fire sprinklers in the thatch — years of negotiations to put a timber-framed theatre next to modern buildings.",
    audio_narration: "Sam Wanamaker first visited the site of the original Globe in 1949 and found nothing but a dirty plaque on a brewery wall. He was so annoyed that he spent the rest of his life trying to fix it. The reconstruction took decades because everything had to be historically accurate, which meant arguing with every planning authority about whether you could build a thatched, timber-framed, open-roofed theatre next to modern buildings. The sprinkler system hidden in the thatch is a masterpiece of invisible engineering. The Globe uses natural light and candles, which means the audience can see each other. Theatre becomes communal instead of anonymous. Wanamaker would have loved it."
  }
];

async function importStories() {
  console.log(`Starting London stories import: ${stories.length} stories for 12 places\n`);

  // First verify the places exist
  const { data: places, error: placesError } = await supabase
    .from('city_places')
    .select('place_id, name')
    .like('place_id', 'london_%');

  if (placesError) {
    console.error('Error checking places:', placesError.message);
    console.log('\nPlaces may not exist yet. Run import-london-data.ts first.');
    return;
  }

  console.log(`Found ${places?.length || 0} London places in database:`);
  places?.forEach(p => console.log(`  - ${p.place_id}: ${p.name}`));

  if (!places || places.length === 0) {
    console.error('\nNo London places found. Running place import first...');

    // Import city
    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .upsert({ slug: 'london', name: 'London', country: 'United Kingdom' }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (cityErr) {
      console.error('Failed to create city:', cityErr.message);
      return;
    }

    console.log(`Created/found London city: ${city.id}`);

    // Import places
    const londonPlaces = [
      { place_id: "london_buckingham_palace", name: "Buckingham Palace", lat: 51.501111, lng: -0.141944, trigger_radius_m: 120, category: "landmark", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_st_jamess_park", name: "St James's Park", lat: 51.5025, lng: -0.135, trigger_radius_m: 200, category: "park", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_westminster_abbey", name: "Westminster Abbey", lat: 51.4994, lng: -0.127367, trigger_radius_m: 120, category: "church", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_palace_of_westminster", name: "Palace of Westminster / Big Ben", lat: 51.49962, lng: -0.12367, trigger_radius_m: 160, category: "landmark", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_whitehall", name: "Whitehall", lat: 51.504167, lng: -0.126389, trigger_radius_m: 200, category: "district", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_10_downing_street_viewpoint", name: "10 Downing Street (No.10 viewpoint)", lat: 51.503333, lng: -0.127778, trigger_radius_m: 120, category: "government", must_see: false, neighborhood: "Westminster" },
      { place_id: "london_churchill_war_rooms", name: "Churchill War Rooms", lat: 51.502219, lng: -0.1293, trigger_radius_m: 90, category: "museum", must_see: true, neighborhood: "Westminster" },
      { place_id: "london_london_eye", name: "London Eye", lat: 51.503333, lng: -0.119722, trigger_radius_m: 120, category: "landmark", must_see: true, neighborhood: "South Bank" },
      { place_id: "london_south_bank", name: "South Bank (riverside district)", lat: 51.504167, lng: -0.116667, trigger_radius_m: 280, category: "district", must_see: true, neighborhood: "South Bank" },
      { place_id: "london_millennium_bridge", name: "Millennium Bridge", lat: 51.510278, lng: -0.098333, trigger_radius_m: 110, category: "bridge", must_see: true, neighborhood: "City of London / Bankside" },
      { place_id: "london_tate_modern", name: "Tate Modern", lat: 51.507778, lng: -0.099444, trigger_radius_m: 130, category: "museum", must_see: true, neighborhood: "Bankside" },
      { place_id: "london_shakespeares_globe", name: "Shakespeare's Globe", lat: 51.508111, lng: -0.097194, trigger_radius_m: 110, category: "theatre", must_see: true, neighborhood: "Bankside" },
    ];

    for (const place of londonPlaces) {
      const { error } = await supabase
        .from('city_places')
        .upsert({ ...place, city_id: city.id }, { onConflict: 'place_id' });
      if (error) {
        console.error(`  Failed: ${place.name}: ${error.message}`);
      } else {
        console.log(`  OK: ${place.name}`);
      }
    }
    console.log('');
  }

  // Now import stories
  console.log(`\nImporting ${stories.length} stories...\n`);

  let ok = 0, fail = 0;
  for (const story of stories) {
    const charCount = story.audio_narration.length;

    // Check for existing story with same place_id + tone + primary interest
    const { data: existing } = await supabase
      .from('place_stories')
      .select('id')
      .eq('place_id', story.place_id)
      .eq('tone', story.tone)
      .contains('interests', [story.interests[0]])
      .limit(1)
      .single();

    let error;
    if (existing) {
      const { error: updateErr } = await supabase
        .from('place_stories')
        .update({
          interests: story.interests,
          hook: story.hook,
          directional_cue: story.directional_cue,
          audio_narration: story.audio_narration
        })
        .eq('id', existing.id);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('place_stories')
        .insert(story);
      error = insertErr;
    }

    if (error) {
      fail++;
      console.error(`  FAIL [${story.place_id}/${story.tone}] (${charCount} chars): ${error.message}`);
    } else {
      ok++;
      console.log(`  OK   [${story.place_id}/${story.tone}] ${charCount} chars ${existing ? '(updated)' : '(new)'}`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`${ok} succeeded, ${fail} failed out of ${stories.length} total`);

  // Verify
  const { count } = await supabase
    .from('place_stories')
    .select('*', { count: 'exact', head: true });
  console.log(`Total stories in database: ${count}`);
}

importStories();
