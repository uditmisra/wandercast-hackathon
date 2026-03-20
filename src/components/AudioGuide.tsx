
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Clock, MapPin, ArrowLeft, SkipBack, SkipForward } from 'lucide-react';
import { Place, TourPlan } from '@/types/tour';
import { PlaceCard } from './PlaceCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioGuideProps {
  tour: TourPlan;
  onBack: () => void;
}

export function AudioGuide({ tour, onBack }: AudioGuideProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playingPlaceId, setPlayingPlaceId] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize with first place
  useEffect(() => {
    if (tour.places.length > 0 && !selectedPlace) {
      setSelectedPlace(tour.places[0]);
    }
  }, [tour.places, selectedPlace]);

  const createAudioDataUrl = (base64Data: string): string => {
    // Ensure proper MIME type for audio data URL
    return `data:audio/mpeg;base64,${base64Data}`;
  };

  const handlePlayPlace = async (place: Place) => {
    if (!place.audioUrl && !place.generatedContent?.audioNarration) {
      toast({
        title: "No Audio Available",
        description: "This place doesn't have audio content yet.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlace(place);
    
    // If same place is playing, toggle pause/play
    if (playingPlaceId === place.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing audio:', error);
          toast({
            title: "Playback Error",
            description: "Unable to resume audio playback.",
            variant: "destructive",
          });
        }
      }
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlayingPlaceId(place.id);
    setCurrentTime(0);
    setIsGeneratingAudio(true);

    // Use existing audioUrl or generate new audio
    let audioUrl = place.audioUrl;
    
    if (!audioUrl && place.generatedContent?.audioNarration) {
      try {
        console.log('Generating audio for:', place.name);
        
        const { data, error } = await supabase.functions.invoke('generate-audio', {
          body: {
            text: place.generatedContent.audioNarration,
            placeId: place.id
          }
        });
        
        console.log('Audio generation response:', { data, error });
        
        if (data && data.audioContent && !error) {
          audioUrl = createAudioDataUrl(data.audioContent);
          console.log('Created audio URL, length:', audioUrl.length);
        } else {
          console.error('Audio generation error:', error);
          throw new Error(error?.message || 'Failed to generate audio');
        }
      } catch (error) {
        console.error('Failed to generate audio:', error);
        toast({
          title: "Audio Generation Failed",
          description: "Unable to generate audio for this place. Please try again.",
          variant: "destructive",
        });
        setIsGeneratingAudio(false);
        setPlayingPlaceId(null);
        return;
      }
    }

    setIsGeneratingAudio(false);

    if (audioUrl) {
      try {
        console.log('Creating audio element with URL length:', audioUrl.length);
        
        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = volume;
        audio.preload = 'auto';

        // Set up event listeners before setting src
        audio.addEventListener('loadedmetadata', () => {
          console.log('Audio metadata loaded, duration:', audio.duration);
          setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
          console.log('Audio ended');
          setIsPlaying(false);
          setPlayingPlaceId(null);
          setCurrentTime(0);
          
          // Auto-play next place
          const currentIndex = tour.places.findIndex(p => p.id === place.id);
          if (currentIndex < tour.places.length - 1) {
            const nextPlace = tour.places[currentIndex + 1];
            setTimeout(() => handlePlayPlace(nextPlace), 1000);
          }
        });

        audio.addEventListener('error', (e) => {
          console.error('Audio error event:', e);
          console.error('Audio error details:', {
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState
          });
          
          toast({
            title: "Audio Error",
            description: "Failed to load or play audio for this place.",
            variant: "destructive",
          });
          setIsPlaying(false);
          setPlayingPlaceId(null);
        });

        audio.addEventListener('canplaythrough', () => {
          console.log('Audio can play through');
        });

        // Set the source and attempt to play
        audio.src = audioUrl;
        
        await audio.play();
        setIsPlaying(true);
        
        toast({
          title: "Now Playing",
          description: place.name,
        });

      } catch (error) {
        console.error('Failed to play audio:', error);
        toast({
          title: "Playback Failed",
          description: "Unable to play audio. Please try again.",
          variant: "destructive",
        });
        setIsPlaying(false);
        setPlayingPlaceId(null);
      }
    } else {
      toast({
        title: "Audio Unavailable",
        description: "Could not load audio for this place.",
        variant: "destructive",
      });
      setPlayingPlaceId(null);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const skipToPrevious = () => {
    const currentIndex = tour.places.findIndex(p => p.id === selectedPlace?.id);
    if (currentIndex > 0) {
      handlePlayPlace(tour.places[currentIndex - 1]);
    }
  };

  const skipToNext = () => {
    const currentIndex = tour.places.findIndex(p => p.id === selectedPlace?.id);
    if (currentIndex < tour.places.length - 1) {
      handlePlayPlace(tour.places[currentIndex + 1]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPlaceIndex = selectedPlace ? tour.places.findIndex(p => p.id === selectedPlace.id) : -1;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-royal p-6 shadow-royal">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={onBack} variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Planner
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-foreground">{tour.title}</h1>
          <p className="text-primary-foreground/80 mt-2">{tour.description}</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-primary-foreground/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{tour.places.length} places</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{tour.totalDuration} minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Places List */}
        <div className="lg:w-1/2 p-4 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Your Audio Tour</h2>
          <div className="space-y-3">
            {tour.places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                onRemove={() => {}}
                onPlay={handlePlayPlace}
                isPlaying={playingPlaceId === place.id && isPlaying}
                isSelected={selectedPlace?.id === place.id}
                onClick={() => setSelectedPlace(place)}
                showAudioControls={true}
                placeNumber={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Audio Player & Content */}
        <div className="lg:w-1/2 p-4 space-y-4">
          {/* Audio Player */}
          {selectedPlace && (
            <Card className="border-royal-purple bg-gradient-stone shadow-atmospheric">
              <CardHeader className="bg-gradient-royal text-primary-foreground">
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-foreground">{selectedPlace.name}</h3>
                  <p className="text-muted-foreground">{selectedPlace.city}, {selectedPlace.country}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track {currentPlaceIndex + 1} of {tour.places.length}
                  </p>
                  {isGeneratingAudio && (
                    <p className="text-sm text-blue-600 mt-2">Generating audio...</p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                    disabled={!audioRef.current || isGeneratingAudio}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipToPrevious}
                    disabled={currentPlaceIndex <= 0 || isGeneratingAudio}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={() => handlePlayPlace(selectedPlace)}
                    className="w-16 h-16 rounded-full"
                    disabled={isGeneratingAudio}
                  >
                    {isGeneratingAudio ? (
                      <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (isPlaying && playingPlaceId === selectedPlace.id) ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipToNext}
                    disabled={currentPlaceIndex >= tour.places.length - 1 || isGeneratingAudio}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Place Details */}
          {selectedPlace ? (
            <Card className="h-fit border-royal-purple bg-gradient-stone shadow-atmospheric">
              <CardHeader className="bg-gradient-royal text-primary-foreground">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {selectedPlace.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {selectedPlace.generatedContent ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Overview</h4>
                      <p className="text-muted-foreground">{selectedPlace.generatedContent.overview}</p>
                    </div>
                    
                    {selectedPlace.generatedContent.history && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">🏛️ History</h4>
                        <p className="text-muted-foreground text-sm">{selectedPlace.generatedContent.history}</p>
                      </div>
                    )}
                    
                    {selectedPlace.generatedContent.architecture && (
                      <div>
                        <h4 className="font-semibent text-foreground mb-2">🏗️ Architecture</h4>
                        <p className="text-muted-foreground text-sm">{selectedPlace.generatedContent.architecture}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">🎧 Audio Script</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 p-3 rounded">
                        {selectedPlace.generatedContent.audioNarration}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Content Generated</h3>
                    <p className="text-muted-foreground">This place doesn't have AI-generated content yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit border-muted bg-gradient-stone">
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Place</h3>
                <p className="text-muted-foreground">Choose a location from your tour to explore its content.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
