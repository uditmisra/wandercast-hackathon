import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { MapPin, Sparkles, Landmark, TreePine, Church, Building2, Drama, Compass, Headphones, BookOpen, Lightbulb } from 'lucide-react';
import { NativePOI } from './HomeMapView';

interface PoiBottomSheetProps {
  poi: NativePOI | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateStory: (poi: NativePOI) => void;
}

const categoryConfig: Record<string, { label: string; icon: typeof MapPin; tint: string; prompt: string }> = {
  museum:     { label: 'Museum',           icon: Building2, tint: 'text-amber-400',   prompt: 'the art, the artists, and the stories behind the collection' },
  park:       { label: 'Park',             icon: TreePine,  tint: 'text-emerald-400', prompt: 'the landscape, the wildlife, and hidden corners' },
  church:     { label: 'Place of Worship', icon: Church,    tint: 'text-violet-400',  prompt: 'the architecture, the faith, and centuries of history' },
  landmark:   { label: 'Landmark',         icon: Landmark,  tint: 'text-rose-400',    prompt: 'the history, the legends, and what makes it iconic' },
  theatre:    { label: 'Theatre',          icon: Drama,     tint: 'text-pink-400',    prompt: 'the performances, the drama, and backstage stories' },
  bridge:     { label: 'Bridge',           icon: Compass,   tint: 'text-cyan-400',    prompt: 'the engineering, the views, and tales from the crossing' },
  restaurant: { label: 'Restaurant',       icon: MapPin,    tint: 'text-orange-400',  prompt: 'the cuisine, the culture, and culinary traditions' },
  market:     { label: 'Market',           icon: MapPin,    tint: 'text-orange-400',  prompt: 'the stalls, the flavours, and the local characters' },
};

function getConfig(category?: string) {
  if (!category) return categoryConfig.landmark;
  return categoryConfig[category.toLowerCase()] ?? categoryConfig.landmark;
}

export function PoiBottomSheet({ poi, open, onOpenChange, onGenerateStory }: PoiBottomSheetProps) {
  if (!poi) return null;

  const config = getConfig(poi.category);
  const Icon = config.icon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-white/10">
        <DrawerHeader className="pb-1">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon className={`w-5 h-5 ${config.tint}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-lg font-display text-foreground text-left">
                {poi.name}
              </DrawerTitle>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {config.label}
              </span>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* What the AI will create */}
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3.5 space-y-2.5">
            <p className="text-[13px] text-foreground/70 leading-relaxed">
              I'll craft a personal audio story about {config.prompt}.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3 h-3" />
                Audio narration
              </span>
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" />
                Fun facts
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                History
              </span>
            </div>
          </div>

          <button
            onClick={() => onGenerateStory(poi)}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Tell me the story
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
