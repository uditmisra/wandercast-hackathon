
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, User, Volume2, Heart, ArrowRight } from 'lucide-react';

interface PersonalizationSetupProps {
  onPersonalizationComplete: (personalization: {
    travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
    preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  }) => void;
}

export function PersonalizationSetup({ onPersonalizationComplete }: PersonalizationSetupProps) {
  const [travelStyle, setTravelStyle] = useState<string>('');
  const [preferredTone, setPreferredTone] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<string>('');

  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  const handleComplete = () => {
    if (travelStyle && preferredTone && timeOfDay) {
      onPersonalizationComplete({
        travelStyle: travelStyle as any,
        preferredTone: preferredTone as any,
        timeOfDay: timeOfDay as any,
      });
    }
  };

  const isComplete = travelStyle && preferredTone && timeOfDay;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl border-royal-purple bg-gradient-stone shadow-atmospheric">
        <CardHeader className="bg-gradient-royal text-primary-foreground text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Heart className="w-6 h-6" />
            Personalize Your Experience
          </CardTitle>
          <p className="text-primary-foreground/80">
            Help us create the perfect audio tour just for you
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* Travel Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <Label className="text-lg font-medium">What's your travel style?</Label>
            </div>
            <RadioGroup value={travelStyle} onValueChange={setTravelStyle}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'first-time', label: 'First-Time Visitor', desc: 'Show me the essentials' },
                  { value: 'repeat', label: 'Return Visitor', desc: 'I want deeper insights' },
                  { value: 'local', label: 'Local Explorer', desc: 'Surprise me with hidden stories' },
                  { value: 'explorer', label: 'Adventure Seeker', desc: 'Off the beaten path' }
                ].map((option) => (
                  <div key={option.value} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/30">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Tone Preference */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Label className="text-lg font-medium">How would you like your guide to sound?</Label>
            </div>
            <RadioGroup value={preferredTone} onValueChange={setPreferredTone}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'casual', label: 'Friendly & Casual', desc: 'Like chatting with a friend' },
                  { value: 'scholarly', label: 'Knowledgeable & Deep', desc: 'Rich historical detail' },
                  { value: 'dramatic', label: 'Atmospheric & Vivid', desc: 'Bringing scenes to life' },
                  { value: 'witty', label: 'Humorous & Charming', desc: 'Stories with personality' }
                ].map((option) => (
                  <div key={option.value} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/30">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Time of Day */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <Label className="text-lg font-medium">When are you touring?</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTimeOfDay(getCurrentTimeOfDay())}
                className="text-xs"
              >
                Use current time
              </Button>
            </div>
            <RadioGroup value={timeOfDay} onValueChange={setTimeOfDay}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'morning', label: 'Morning', desc: '☀️ Fresh start' },
                  { value: 'afternoon', label: 'Afternoon', desc: '🌤️ Peak energy' },
                  { value: 'evening', label: 'Evening', desc: '🌅 Golden hour' },
                  { value: 'night', label: 'Night', desc: '🌙 Mysterious' }
                ].map((option) => (
                  <div key={option.value} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/30">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer text-sm">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleComplete}
            disabled={!isComplete}
            className="w-full py-6 text-lg"
            size="lg"
          >
            Create My Personalized Tour
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
