import React from 'react';
import { AudioEstimator, AudioEstimate } from '@/utils/audioEstimator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Place } from '@/types/tour';

interface AudioCostEstimatorProps {
  places: Place[];
  selectedPlaces?: string[]; // Place IDs that are selected for audio generation
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const AudioCostEstimator: React.FC<AudioCostEstimatorProps> = ({
  places,
  selectedPlaces = places.map(p => p.id),
  onSelectionChange
}) => {
  // Get audio texts for estimation
  const audioTexts = places
    .filter(place => selectedPlaces.includes(place.id))
    .map(place => place.generatedContent?.audioNarration || '')
    .filter(text => text.length > 0);

  const bulkEstimate = AudioEstimator.estimateBulkAudio(audioTexts);

  const handlePlaceToggle = (placeId: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedPlaces.includes(placeId)
      ? selectedPlaces.filter(id => id !== placeId)
      : [...selectedPlaces, placeId];
    
    onSelectionChange(newSelection);
  };

  if (audioTexts.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No audio content available for estimation. Generate tour content first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎧 Audio Generation Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{AudioEstimator.formatDuration(bulkEstimate.totalDuration)}</div>
            <div className="text-muted-foreground">Total Duration</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{bulkEstimate.totalCharacters.toLocaleString()}</div>
            <div className="text-muted-foreground">Characters</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{AudioEstimator.formatCost(bulkEstimate.totalCost)}</div>
            <div className="text-muted-foreground">Est. Cost</div>
          </div>
        </div>

        {bulkEstimate.totalCost > 0.02 && (
          <Alert>
            <AlertDescription>
              This will use a significant amount of ElevenLabs credits. Consider generating audio for fewer places or shortening the content.
            </AlertDescription>
          </Alert>
        )}

        {onSelectionChange && (
          <div className="space-y-2">
            <h4 className="font-medium">Select places for audio generation:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {places.map((place, index) => {
                const estimate = bulkEstimate.individual[index];
                const isSelected = selectedPlaces.includes(place.id);
                
                return (
                  <div
                    key={place.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => handlePlaceToggle(place.id)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePlaceToggle(place.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{place.name}</span>
                    </div>
                    {estimate && (
                      <div className="text-sm text-muted-foreground">
                        {AudioEstimator.formatDuration(estimate.estimatedDurationSeconds)} · {AudioEstimator.formatCost(estimate.estimatedCost)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};