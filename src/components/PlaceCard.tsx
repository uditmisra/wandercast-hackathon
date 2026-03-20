import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Trash2, Play, Pause } from 'lucide-react';
import { Place } from '@/types/tour';

interface PlaceCardProps {
  place: Place;
  onRemove: (placeId: string) => void;
  onPlay: (place: Place) => void;
  isPlaying: boolean;
  isSelected: boolean;
  onClick: () => void;
  showAudioControls?: boolean;
  placeNumber?: number;
}

export function PlaceCard({ 
  place, 
  onRemove, 
  onPlay, 
  isPlaying, 
  isSelected, 
  onClick,
  showAudioControls = false,
  placeNumber
}: PlaceCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-gold ${
        isSelected 
          ? 'border-edinburgh-gold bg-gradient-stone shadow-gold' 
          : 'border-border hover:border-edinburgh-gold/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{place.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span>{place.city}, {place.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{place.estimatedDuration} minutes</span>
            </div>
            {place.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {place.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {place.generatedContent && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(place);
                }}
                variant="outline"
                size="sm"
                className="bg-edinburgh-gold/10 border-edinburgh-gold text-edinburgh-gold hover:bg-edinburgh-gold hover:text-background"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(place.id);
              }}
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {place.generatedContent && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ✨ AI content generated
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}