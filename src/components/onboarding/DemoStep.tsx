import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, BookOpen, ChevronDown } from 'lucide-react';
import { GradientOrb } from '@/components/design/GradientOrb';
import { WaveformVisualizer } from '@/components/player/WaveformVisualizer';
import { supabase } from '@/integrations/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

interface DemoStepProps {
  selectedTone: string;
  onComplete: () => void;
  onBack: () => void;
}

interface PreviewPlace {
  id: string;
  name: string;
  city: string;
  narrations: Record<string, { hook: string; text: string }>;
}

const PREVIEW_PLACES: PreviewPlace[] = [
  {
    id: 'buckingham',
    name: 'Buckingham Palace',
    city: 'London',
    narrations: {
      casual: {
        hook: 'The flag on top tells you if the monarch is home — but almost nobody looks.',
        text: "Most people stare at the guards and miss the real tell. If the Royal Standard is flying — that's the one with lions and a harp — the monarch is inside. Union Jack means they're out. The whole forecourt is designed to make you feel small, by the way. The Victoria Memorial, the wide-open space, the symmetry? Pure stage management. The building itself started life as a fairly modest townhouse in 1703. George IV blew a fortune trying to make it grand and then never actually lived here.",
      },
      scholarly: {
        hook: 'The east facade is architecturally a lie — a 1913 Portland stone mask over a much older structure.',
        text: "What most photographs show is a 1913 refacing in Portland stone, designed by Aston Webb. Underneath sits a building that originated as a townhouse for the Duke of Buckingham in 1703. George IV commissioned John Nash to transform it in the 1820s at enormous expense, yet never resided here — he died in 1830 at Windsor. Queen Victoria became the first monarch to occupy the palace in 1837, largely because the old St James's Palace lacked the space her expanding court demanded.",
      },
      dramatic: {
        hook: 'In 2022, a million people lined The Mall in complete silence. You could hear footsteps.',
        text: "The long tree-lined avenue stretching from the palace toward Admiralty Arch is called The Mall. On coronation days, jubilees, and royal weddings, it fills with a river of people so dense you can't see the tarmac beneath them. But the most extraordinary moment came in September 2022, during Queen Elizabeth's funeral procession. Over a million people stood along this route. Complete silence. A million people, and witnesses say you could hear the soldiers' footsteps on the road.",
      },
      witty: {
        hook: 'In 1982, a man broke in and asked the Queen for a cigarette. She kept him chatting.',
        text: "Michael Fagan climbed the palace wall, shinned up a drainpipe, and wandered the corridors until he found the Queen's bedroom. He sat on the edge of her bed and asked for a cigarette. She calmly pressed her alarm button — twice — and nobody came. She kept him talking for about ten minutes until a footman arrived. The security review that followed was, shall we say, extensive. Fagan was never actually charged with trespass — at the time, trespassing in a royal residence wasn't a criminal offence.",
      },
    },
  },
  {
    id: 'eiffel',
    name: 'Eiffel Tower',
    city: 'Paris',
    narrations: {
      casual: {
        hook: 'Gustave Eiffel had a secret apartment at the top that made all of Paris jealous.',
        text: "Here's something most visitors never learn: Gustave Eiffel built himself a private apartment at the very top of the tower. It had a grand piano, wallpapered walls, and a balcony with the best view in the city. When word got out, he was flooded with offers from wealthy Parisians desperate to rent it. He turned them all down. The apartment still exists today — you can peek through a window on the third level and see mannequins of Eiffel and Thomas Edison having a chat inside.",
      },
      scholarly: {
        hook: "The tower's design solves a wind-load equation so elegant it still impresses structural engineers.",
        text: "The Eiffel Tower's curved profile isn't purely aesthetic — it's the mathematical solution to a wind-resistance equation. Each section narrows at precisely the rate needed to distribute wind forces evenly across the structure. Gustave Eiffel's engineering team calculated these curves by hand in the 1880s. The result is a 7,300-ton iron structure that sways only 6 to 7 centimetres in wind. Built for the 1889 World's Fair, it was scheduled for demolition in 1909. It survived only because Eiffel convinced the military it was useful as a radio transmission antenna.",
      },
      dramatic: {
        hook: 'A con man sold the Eiffel Tower for scrap metal. Then he did it again.',
        text: "In 1925, a con artist named Victor Lustig read a newspaper article about how expensive the tower was to maintain. He forged government stationery, posed as a civil servant, and invited six scrap metal dealers to a secret meeting. He told them the city could no longer afford the tower and was selling it for scrap. One dealer, André Poisson, paid Lustig a fortune. When Poisson realised he'd been conned, he was too embarrassed to go to the police. So Lustig came back to Paris and sold the tower a second time.",
      },
      witty: {
        hook: 'The tower grows six inches taller every summer and has its own postcode.',
        text: "Thermal expansion is real, and when you're made of 7,300 tons of iron, it adds up. On hot summer days, the tower grows about 15 centimetres. It also leans very slightly toward the shade as the sunny side expands faster. The tower gets repainted every seven years — it takes 25 painters, 60 tons of paint, and 18 months. Oh, and the sparkling light show that happens every hour after dark? That's copyrighted. Technically, photographing it at night and publishing the image is a copyright violation. Nobody enforces it, but still.",
      },
    },
  },
  {
    id: 'colosseum',
    name: 'Colosseum',
    city: 'Rome',
    narrations: {
      casual: {
        hook: 'The Colosseum once had a retractable roof operated by a thousand sailors.',
        text: "The ancient Romans invented the retractable stadium roof — about two thousand years before anyone else figured it out. The Colosseum had an enormous canvas awning called the velarium, and it took roughly a thousand sailors from the imperial fleet to operate the rigging. They were stationed permanently nearby just for this purpose. The whole system of ropes, pulleys, and masts could shade about two-thirds of the seating. Fifty thousand spectators kept cool while watching gladiators fight in the sun below.",
      },
      scholarly: {
        hook: 'Built in under a decade, the Colosseum pioneered construction techniques still studied today.',
        text: "The Flavian Amphitheatre was completed in approximately 80 AD under Emperor Titus, a construction timeline of roughly eight years — remarkable for a structure seating fifty thousand. The builders used an estimated 100,000 cubic metres of travertine limestone, held together not by mortar but by iron clamps totalling around 300 tons. The hypogeum — the underground network of tunnels and chambers — contained 80 lift shafts powered by human-operated winches that could raise animals and scenery directly into the arena through trapdoors.",
      },
      dramatic: {
        hook: 'For four centuries, this arena decided who lived and who died — fifty thousand voices at a time.',
        text: "Imagine fifty thousand people screaming. Not cheering at a concert — screaming for blood. For nearly four hundred years, the Colosseum was the Roman Empire's theatre of death. Gladiators fought until one yielded, and then the crowd decided their fate. Thumbs up or thumbs down — historians still debate which gesture meant what. What's certain is that over its lifetime, an estimated 400,000 people and over a million animals died on its arena floor. The sand was dyed red so the blood wouldn't show.",
      },
      witty: {
        hook: 'The Colosseum once hosted a naval battle. Inside. With real ships.',
        text: "Emperor Titus celebrated the opening of the Colosseum in 80 AD with a hundred days of games. The most absurd event? A naval battle. They flooded the arena, brought in actual warships, and had condemned prisoners fight a sea battle while fifty thousand Romans watched from the stands. How they waterproofed a stone amphitheatre remains one of ancient engineering's great mysteries. Later emperors decided this was too much hassle and built the underground tunnel network instead, which was arguably a more practical use of the space.",
      },
    },
  },
  {
    id: 'brooklyn_bridge',
    name: 'Brooklyn Bridge',
    city: 'New York',
    narrations: {
      casual: {
        hook: 'The chief engineer built this bridge from his bedroom window — he never set foot on it.',
        text: "Washington Roebling, the chief engineer, was crippled by decompression sickness from working in the underwater foundations. He spent the last eleven years of construction watching through a telescope from his bedroom in Brooklyn Heights while his wife Emily relayed his instructions to the workers. Emily essentially became the first female field engineer in American history, learning advanced mathematics and engineering on the job. When the bridge finally opened in 1883, she was the first person to walk across it.",
      },
      scholarly: {
        hook: "The bridge's foundations required a terrifying new technology — pressurised underwater chambers.",
        text: "The Brooklyn Bridge's construction required workers to descend into caissons — airtight wooden chambers sunk to the riverbed and pressurised with compressed air to keep water out. Workers entered through airlocks and dug the riverbed by hand in conditions of extreme pressure. Many developed what was then called 'caisson disease' — decompression sickness from ascending too quickly. At least twenty workers died during construction. Chief engineer Washington Roebling himself was permanently disabled by the condition, yet the bridge stands as perhaps the nineteenth century's greatest engineering achievement.",
      },
      dramatic: {
        hook: 'Six days after it opened, a stampede on the bridge killed twelve people.',
        text: "The Brooklyn Bridge opened on May 24th, 1883, to enormous fanfare. President Chester Arthur walked across it. But six days later, on a crowded Memorial Day, a woman stumbled on the stairs. Someone screamed that the bridge was collapsing. In the ensuing stampede, twelve people were crushed to death and dozens more injured. To restore public confidence, P.T. Barnum marched a herd of twenty-one elephants across the bridge. If it could hold the elephants, the reasoning went, it could hold anything. It worked.",
      },
      witty: {
        hook: 'A con man repeatedly sold the Brooklyn Bridge to gullible tourists. Multiple times.',
        text: "George C. Parker was a New York con artist who made a career of selling landmarks he didn't own. His masterpiece was the Brooklyn Bridge, which he sold to unsuspecting immigrants multiple times — sometimes twice in one week. He'd set up a fake office, produce forged ownership documents, and close the deal before police could intervene. The buyers would show up to install toll booths before being informed that they'd been swindled. Parker was eventually caught and sentenced to life in Sing Sing prison. The phrase 'I've got a bridge to sell you' exists because of him.",
      },
    },
  },
  {
    id: 'sacre_coeur',
    name: 'Sacré-Cœur',
    city: 'Paris',
    narrations: {
      casual: {
        hook: 'This basilica gets whiter with age — the exact opposite of every other building in Paris.',
        text: "Most buildings in Paris darken with age and pollution, but Sacré-Cœur does the opposite. It's built from travertine limestone quarried in Château-Landon, and when it rains, the stone secretes calcite — a natural whitening agent. So the basilica literally bleaches itself. It's been doing this since 1914, and it's whiter now than the day it was finished. The whole hill of Montmartre underneath it is basically hollow — riddled with old gypsum mines — so the foundations go thirty metres deep, like enormous stilts.",
      },
      scholarly: {
        hook: "Sacré-Cœur was built as political penance — a monument to France's most divisive era.",
        text: "The basilica's origins are inseparable from the trauma of the Paris Commune. After France's defeat in the Franco-Prussian War and the bloody suppression of the Commune in 1871, the National Assembly voted to construct a basilica as an act of national penance. Critics saw it as a monument to conservative Catholic triumph over the radical working class who had briefly governed Paris. This political tension defined the basilica for decades — Montmartre's residents resented it as an imposition, and construction was repeatedly delayed by protests and sabotage.",
      },
      dramatic: {
        hook: 'Beneath this white basilica lies a hill honeycombed with abandoned mines — and dark history.',
        text: "Montmartre means 'Mount of Martyrs.' According to legend, Saint Denis, the first Bishop of Paris, was beheaded on this hill around 250 AD. He then picked up his own head and walked six miles north, preaching the whole way, before finally collapsing. Whether you believe that or not, the hill has a documented history of violence. It's where the Paris Commune made its last stand in 1871, where over twenty thousand Communards were killed in a single week, and where the French government chose to build a basilica on top of their graves.",
      },
      witty: {
        hook: 'The Savoyarde bell inside weighs 19 tons — and nobody is sure how they got it up the hill.',
        text: "Inside the bell tower hangs La Savoyarde, one of the heaviest bells in the world at 19 tons. It was cast in Annecy, transported to Paris by train, and then somehow hauled up the steep streets of Montmartre in 1895. The logistics of this operation were so complicated that a contemporary journalist described it as 'moving a small house uphill using horses and swear words.' Twenty-eight horses were involved. Several streets had to be reinforced. The bell arrived intact and has been ringing ever since, audible across much of northern Paris.",
      },
    },
  },
  {
    id: 'central_park',
    name: 'Central Park',
    city: 'New York',
    narrations: {
      casual: {
        hook: 'Nothing in Central Park is natural. Every rock, lake, and hill was placed by hand.',
        text: "Central Park looks like nature, but it's one of the most engineered landscapes on Earth. Frederick Law Olmsted and Calvert Vaux designed every contour, planted every tree, and built every stream from scratch. Before construction began in 1857, the site was a swampy mess of bone-boiling works, piggeries, and shanty towns — home to roughly 1,600 people who were forcibly evicted. Workers moved ten million cartloads of earth and planted over 270,000 trees and shrubs. The 'natural' rock outcroppings? Some are real Manhattan schist, but many were placed to look picturesque.",
      },
      scholarly: {
        hook: "Central Park was America's first major public landscape — and a radical democratic experiment.",
        text: "When the New York State Legislature authorised Central Park in 1853, it represented a radical proposition: that a growing industrial city owed its working-class citizens access to nature and recreation. Olmsted's winning design deliberately rejected the formal European garden tradition in favour of naturalistic landscapes — pastoral meadows, dense woodlands, and rambling paths meant to provide psychological relief from the grid. The park's four sunken transverse roads, hidden from view, were an innovation that allowed commercial traffic to cross the park without disrupting the illusion of rural escape.",
      },
      dramatic: {
        hook: '1,600 people were evicted to build this park. Their community was erased from history.',
        text: "Before Central Park existed, this land was home to Seneca Village — one of New York's most significant African-American communities. Founded in 1825, it had three churches, a school, and was one of the few places where Black New Yorkers could own property. When the city seized the land through eminent domain in 1857, roughly 1,600 residents — many of them Black and Irish — were displaced. Their homes were demolished, their cemeteries paved over. For over a century, the community was largely forgotten, dismissed in newspapers of the era as squatters and shanty dwellers.",
      },
      witty: {
        hook: 'The park has its own police precinct, its own weather station, and at least one resident coyote.',
        text: "Central Park is essentially a small city disguised as a large garden. It has its own police precinct (the Central Park Precinct, one of the busiest in New York), its own weather station (the official one for Manhattan, operating since 1919), and a wildlife population that includes red-tailed hawks, raccoons, and at least one coyote who wanders in periodically from the Bronx. There's a medieval-style castle (Belvedere Castle, built in 1869 purely as a decorative folly), a Swedish cottage, and an Egyptian obelisk that's older than the city by about 3,400 years.",
      },
    },
  },
];

export function DemoStep({ selectedTone, onComplete, onBack }: DemoStepProps) {
  const [selectedPlace, setSelectedPlace] = useState<PreviewPlace | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [showNarration, setShowNarration] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tone = selectedTone || 'casual';
  const narration = selectedPlace?.narrations[tone];

  // Generate audio when a place is selected
  useEffect(() => {
    if (!selectedPlace || !narration) return;

    setAudioData(null);
    setIsLoading(true);
    setHasFailed(false);
    setIsPlaying(false);
    setShowNarration(false);
    setCurrentTime(0);
    setDuration(0);

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    const cacheKey = `wandercast_demo_${selectedPlace.id}_${tone}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setAudioData(cached);
      setIsLoading(false);
      return;
    }

    supabase.functions.invoke('generate-audio', {
      body: { text: narration.text, voiceId: 'EST9Ui6982FZPSi7gCHi', placeId: 'demo' }
    }).then(({ data, error }) => {
      if (error || data?.error || !data?.audioContent) {
        setHasFailed(true);
      } else {
        setAudioData(data.audioContent);
        sessionStorage.setItem(cacheKey, data.audioContent);
      }
      setIsLoading(false);
    }).catch(() => {
      setHasFailed(true);
      setIsLoading(false);
    });
  }, [selectedPlace, tone, narration]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioData) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      return;
    }

    try {
      const binaryStr = atob(audioData);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } catch {
      setHasFailed(true);
    }
  }, [audioData, isPlaying]);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={() => {
            cleanup();
            if (selectedPlace) { setSelectedPlace(null); }
            else { onBack(); }
          }}
          className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-[0.1em] font-semibold">Back</span>
        </button>
        <BrandLogo size="sm" className="text-foreground/70" />
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {!selectedPlace ? (
          /* ═══ PLACE PICKER ═══ */
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-foreground/70 text-center mt-4 mb-2">
              Pick a place to preview
            </p>
            <p className="text-[13px] text-foreground/50 text-center mb-8">
              Hear what your <strong>{toneLabel.toLowerCase()}</strong> guide sounds like.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PREVIEW_PLACES.map((place, i) => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`group relative overflow-hidden text-left flex flex-col justify-end hover:shadow-lg active:scale-[0.97] transition-all duration-200 ${
                    i % 2 === 0 ? 'panel-surface corner-glow-sm' : 'bg-card'
                  }`}
                  style={{
                    borderRadius: '16px',
                    border: i % 2 === 0 ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                    padding: '16px 18px',
                  }}
                >
                  {i % 2 !== 0 && <GradientOrb size={80} opacity={0.15} blur={16} className="-top-4 -right-4" />}
                  <div className="relative z-10">
                    <span className={`text-[9px] uppercase tracking-[0.15em] font-medium block mb-1 ${
                      i % 2 === 0 ? 'text-foreground/50' : 'text-foreground/50'
                    }`}>
                      {place.city}
                    </span>
                    <span className={`font-display text-[16px] sm:text-[18px] leading-[1.1] block ${
                      i % 2 === 0 ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {place.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ═══ PLAYER PREVIEW — matches tour experience ═══ */
          <div className="max-w-lg mx-auto">

            {/* Arch Orb Visualizer */}
            <div className="flex justify-center mb-4 mt-2">
              <div
                className="relative overflow-hidden bg-card"
                style={{ width: 140, height: 140, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 20px rgba(255,255,255,0.04)' }}
              >
                <GradientOrb
                  size={100}
                  opacity={isPlaying ? 0.6 : 0.2}
                  blur={30}
                  className={`top-[10%] left-[10%] ${isPlaying ? 'animate-orb-float' : ''}`}
                />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-display text-xs italic text-foreground/60">
                    {selectedPlace.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Place Header */}
            <div className="text-center space-y-1 mb-3">
              <h1 className="font-display text-2xl sm:text-3xl text-foreground">{selectedPlace.name}</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-medium">
                {selectedPlace.city} — {toneLabel} tone
              </p>
            </div>

            {/* Waveform */}
            <div className="flex justify-center mb-3">
              <WaveformVisualizer isPlaying={isPlaying} barCount={20} className="h-6" />
            </div>

            {/* Play/Pause */}
            <div className="flex items-center justify-center mb-6">
              {isLoading ? (
                <div className="w-14 h-14 rounded-full border-2 border-foreground/10 border-t-foreground animate-spin" />
              ) : (
                <button
                  onClick={togglePlayback}
                  disabled={!audioData && !hasFailed}
                  className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 disabled:opacity-30"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
              )}
            </div>

            {/* Progress */}
            {duration > 0 && (
              <div className="flex justify-between text-[10px] font-medium text-foreground/40 mb-6 px-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}

            {/* Hook Card */}
            {narration?.hook && (
              <div className="panel-surface corner-glow rounded-xl p-4 mb-4" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <p className="text-sm font-medium text-foreground leading-relaxed">{narration.hook}</p>
              </div>
            )}

            {/* Read Narration toggle */}
            {narration?.text && (
              <div className="mb-4">
                <button
                  onClick={() => setShowNarration(!showNarration)}
                  className="flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground/60 transition-colors px-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {showNarration ? 'Hide narration' : 'Read narration'}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showNarration ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${showNarration ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="mt-2 p-3 bg-foreground/5 rounded-xl">
                      <p className="text-sm text-foreground/60 leading-relaxed">{narration.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasFailed && (
              <p className="text-xs text-foreground/40 text-center">Audio unavailable — read the narration above instead.</p>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 bg-gradient-to-t from-background via-background to-transparent" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={() => { cleanup(); onComplete(); }}
          className="w-full max-w-md mx-auto block bg-primary text-white py-5 rounded-full font-semibold uppercase tracking-[0.1em] text-[13px] active:scale-95 transition-all duration-150 hover:bg-primary/90"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
