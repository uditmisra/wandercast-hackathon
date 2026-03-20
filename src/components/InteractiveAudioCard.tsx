
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, MessageCircle, Sparkles, Clock, Eye, Share2 } from 'lucide-react';
import { Place } from '@/types/tour';

interface InteractiveAudioCardProps {
  place: Place;
  isPlaying: boolean;
  onPlay: (type: 'quick' | 'deep' | 'secret') => void;
  onAskMore: (prompt: string) => void;
}

export function InteractiveAudioCard({ place, isPlaying, onPlay, onAskMore }: InteractiveAudioCardProps) {
  const [activeTab, setActiveTab] = useState('quick');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const enhancedContent = place.generatedContent as any; // Type assertion for enhanced content

  if (!enhancedContent) {
    return null;
  }

  const contentTypes = [
    {
      id: 'quick',
      label: 'Quick Tour',
      icon: <Clock className="w-4 h-4" />,
      duration: '30 sec',
      content: enhancedContent.quickSnippet,
      description: 'Essential highlights'
    },
    {
      id: 'deep',
      label: 'Deep Dive',
      icon: <Eye className="w-4 h-4" />,
      duration: '2 min',
      content: enhancedContent.deepDive,
      description: 'Rich storytelling'
    },
    {
      id: 'secret',
      label: 'Local Secret',
      icon: <Sparkles className="w-4 h-4" />,
      duration: '45 sec',
      content: enhancedContent.localSecret,
      description: 'Hidden gems'
    }
  ];

  return (
    <Card className="border-royal-purple bg-gradient-stone shadow-atmospheric">
      <CardHeader className="bg-gradient-royal text-primary-foreground">
        <CardTitle className="flex items-center justify-between">
          <span>{place.name}</span>
          <Button variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground">
            <Share2 className="w-4 h-4 mr-2" />
            Share Story
          </Button>
        </CardTitle>
        {enhancedContent.personalizedHook && (
          <p className="text-primary-foreground/90 italic">
            "{enhancedContent.personalizedHook}"
          </p>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {contentTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                {type.icon}
                <div className="text-left">
                  <div className="font-medium text-xs">{type.label}</div>
                  <div className="text-xs opacity-70">{type.duration}</div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {contentTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  {type.icon}
                  {type.description}
                </Badge>
                <Button
                  onClick={() => onPlay(type.id as any)}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'} {type.label}
                </Button>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{type.content}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Interactive Prompts */}
        {enhancedContent.interactivePrompts && enhancedContent.interactivePrompts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Ask me more about...
            </h4>
            <div className="flex flex-wrap gap-2">
              {enhancedContent.interactivePrompts.map((prompt: string, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    onAskMore(prompt);
                  }}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
            {selectedPrompt && (
              <p className="text-xs text-muted-foreground mt-2">
                Generating personalized response for: "{selectedPrompt}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
