import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Sparkles, MessageCircle, Camera, Mic, MapPin, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Place, Interest, TourPlan, AVAILABLE_INTERESTS } from '@/types/tour';

interface ChatTourPlannerProps {
  onTourGenerated: (tour: TourPlan) => void;
  onBack: () => void;
  personalization?: {
    travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
    preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ParsedTourData {
  places: Place[];
  interests: string[];
  tourTitle: string;
  tourDescription: string;
  needsMoreInfo: boolean;
  followUpQuestion?: string;
}

export function ChatTourPlanner({ onTourGenerated, onBack, personalization }: ChatTourPlannerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI travel assistant. Tell me about the tour you'd like to create! You can type, speak, or upload photos of places you want to visit.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [currentTourData, setCurrentTourData] = useState<ParsedTourData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'assistant' | 'system') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    addMessage(message, 'user');
    setInputValue('');
    setIsProcessing(true);

    try {
      await processTourRequest(message);
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage("I'm sorry, I encountered an error processing your request. Please try again.", 'assistant');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTourRequest = async (message: string) => {
    console.log('Processing tour request:', message);

    const { data, error } = await supabase.functions.invoke('parse-tour-request', {
      body: { message }
    });

    if (error) {
      throw error;
    }

    if (data.success && data.data) {
      const parsedData: ParsedTourData = data.data;
      setCurrentTourData(parsedData);

      if (parsedData.needsMoreInfo && parsedData.followUpQuestion) {
        addMessage(parsedData.followUpQuestion, 'assistant');
      } else {
        // Show summary and generate tour
        const summary = createTourSummary(parsedData);
        addMessage(summary, 'assistant');
        
        // Auto-generate the tour
        setTimeout(() => generateTour(parsedData), 1000);
      }
    } else {
      throw new Error('Failed to parse tour request');
    }
  };

  const createTourSummary = (data: ParsedTourData): string => {
    const placesText = data.places.map(p => `${p.name} (${p.city}, ${p.country})`).join(', ');
    const interestsText = data.interests.join(', ');
    
    return `Perfect! I'll create "${data.tourTitle}" for you.\n\n📍 Places: ${placesText}\n🎯 Interests: ${interestsText}\n\n⏳ Generating your personalized audio tour now...`;
  };

  const generateTour = async (data: ParsedTourData) => {
    try {
      addMessage("🎨 Creating your personalized storytelling experience...", 'system');

      // Map interests to available interest objects
      const mappedInterests: Interest[] = data.interests
        .map(interestName => AVAILABLE_INTERESTS.find(ai => ai.id === interestName))
        .filter(Boolean) as Interest[];

      // Use enhanced content generation if personalization is available
      if (personalization) {
        addMessage("✨ Crafting stories tailored to your preferences...", 'system');
        
        // Import and use enhanced content generator
        const { EnhancedContentGenerator } = await import('../utils/enhancedContentGenerator');
        
        const enhancedPlaces = [];
        for (const place of data.places) {
          try {
            const enhancedContent = await EnhancedContentGenerator.generateEnhancedContent(
              place,
              { ...personalization, interests: mappedInterests },
              'your-openai-key-here' // This should come from Supabase secrets
            );
            
            enhancedPlaces.push({
              ...place,
              generatedContent: enhancedContent
            });
          } catch (error) {
            console.error(`Failed to generate enhanced content for ${place.name}:`, error);
            // Fallback to regular content
            enhancedPlaces.push(place);
          }
        }

        // Generate audio for enhanced content
        addMessage("🎧 Creating your personalized audio narrations...", 'system');
        
        const placesWithAudio = [];
        for (const place of enhancedPlaces) {
          if (place.generatedContent?.audioNarration) {
            try {
              const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
                body: {
                  text: place.generatedContent.audioNarration,
                  placeId: place.id,
                  voiceId: 'EST9Ui6982FZPSi7gCHi'
                }
              });

              if (!audioError && audioData) {
                placesWithAudio.push({
                  ...place,
                  audioUrl: `data:audio/mpeg;base64,${audioData.audioContent}`
                });
              } else {
                placesWithAudio.push(place);
              }
            } catch (error) {
              console.error(`Failed to generate audio for ${place.name}:`, error);
              placesWithAudio.push(place);
            }
          } else {
            placesWithAudio.push(place);
          }
        }

        // Create final tour plan
        const tourPlan: TourPlan = {
          id: Date.now().toString(),
          title: data.tourTitle,
          description: `${data.tourDescription} - Personalized for ${personalization.travelStyle} visitors with ${personalization.preferredTone} storytelling`,
          places: placesWithAudio,
          interests: mappedInterests,
          totalDuration: placesWithAudio.reduce((total, place) => total + place.estimatedDuration, 0),
          createdAt: new Date(),
        };

        addMessage(`✨ Your personalized tour "${data.tourTitle}" is ready with enhanced storytelling!`, 'system');
        
        toast({
          title: "Enhanced Tour Generated!",
          description: `Your personalized audio tour "${tourPlan.title}" is ready with ${placesWithAudio.length} places and tailored stories.`,
        });

        setTimeout(() => onTourGenerated(tourPlan), 1000);

      } else {
        addMessage("🎨 Creating AI content for your places...", 'system');

        // Map interests to available interest objects
        const mappedInterests: Interest[] = data.interests
          .map(interestName => AVAILABLE_INTERESTS.find(ai => ai.id === interestName))
          .filter(Boolean) as Interest[];

        // Generate content using existing edge function
        const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-tour-content', {
          body: { 
            places: data.places,
            interests: mappedInterests 
          }
        });

        if (contentError) throw contentError;

        addMessage("🎧 Generating audio narrations...", 'system');

        // Process content results and update places
        const updatedPlaces = data.places.map(place => {
          const result = contentData.results.find((r: any) => r.placeId === place.id);
          if (result && result.success) {
            return {
              ...place,
              generatedContent: result.content
            };
          }
          return place;
        });

        // Generate audio for places with content
        const placesWithAudio = [];
        for (const place of updatedPlaces) {
          if (place.generatedContent?.audioNarration) {
            try {
              const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
                body: {
                  text: place.generatedContent.audioNarration,
                  placeId: place.id,
                  voiceId: 'EST9Ui6982FZPSi7gCHi'
                }
              });

              if (!audioError && audioData) {
                placesWithAudio.push({
                  ...place,
                  audioUrl: `data:audio/mpeg;base64,${audioData.audioContent}`
                });
              } else {
                placesWithAudio.push(place);
              }
            } catch (error) {
              console.error(`Failed to generate audio for ${place.name}:`, error);
              placesWithAudio.push(place);
            }
          } else {
            placesWithAudio.push(place);
          }
        }

        // Create final tour plan
        const tourPlan: TourPlan = {
          id: Date.now().toString(),
          title: data.tourTitle,
          description: data.tourDescription,
          places: placesWithAudio,
          interests: mappedInterests,
          totalDuration: placesWithAudio.reduce((total, place) => total + place.estimatedDuration, 0),
          createdAt: new Date(),
        };

        addMessage(`✨ Your tour "${data.tourTitle}" is ready! Starting audio guide...`, 'system');
        
        toast({
          title: "Tour Generated Successfully!",
          description: `Your audio tour "${tourPlan.title}" is ready with ${placesWithAudio.length} places.`,
        });

        // Launch the tour
        setTimeout(() => onTourGenerated(tourPlan), 1000);

      }
    } catch (error) {
      console.error('Error generating tour:', error);
      addMessage("I encountered an error generating your tour. Please try again or contact support.", 'assistant');
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setInputValue(text);
    addMessage(`🎤 "${text}"`, 'user');
    processTourRequest(text);
  };

  const handleImageAnalysis = (analysis: string) => {
    addMessage(`📸 I analyzed your image: ${analysis}`, 'system');
    processTourRequest(`I want to visit this place: ${analysis}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <div className="bg-gradient-royal p-4 shadow-royal">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="sm" 
            className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-primary-foreground flex items-center justify-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Chat Tour Planner
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Describe your perfect tour with voice, text, or photos
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.type === 'system'
                  ? 'bg-muted/50 text-muted-foreground border border-muted'
                  : 'bg-gradient-stone text-foreground border border-royal-purple/30'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gradient-stone text-foreground border border-royal-purple/30 p-4 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing your request...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Image Uploader */}
          {showImageUploader && (
            <Card>
              <CardContent className="p-4">
                <ImageUploader 
                  onImageAnalysis={handleImageAnalysis}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your ideal tour... (e.g., 'I want to visit Edinburgh Castle and Royal Mile, I love history and ghost stories')"
                disabled={isProcessing}
                className="min-h-[44px]"
              />
            </div>
            
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription}
              disabled={isProcessing}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageUploader(!showImageUploader)}
              disabled={isProcessing}
              className="aspect-square p-2"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => handleSubmit(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className="aspect-square p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {[
              "Edinburgh castle and historic sites",
              "Paris museums and culture", 
              "Tokyo food and temples"
            ].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(example)}
                disabled={isProcessing}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
