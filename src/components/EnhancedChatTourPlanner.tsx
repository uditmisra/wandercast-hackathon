
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PersonalizationSetup } from './PersonalizationSetup';
import { ChatTourPlanner } from './ChatTourPlanner';
import { TourPlan, Interest } from '@/types/tour';

interface EnhancedChatTourPlannerProps {
  onTourGenerated: (tour: TourPlan) => void;
  onBack: () => void;
}

interface PersonalizationData {
  travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
  preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export function EnhancedChatTourPlanner({ onTourGenerated, onBack }: EnhancedChatTourPlannerProps) {
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);

  const handlePersonalizationComplete = (data: PersonalizationData) => {
    setPersonalization(data);
  };

  const handleTourGenerated = (tour: TourPlan) => {
    // Enhance tour with personalization data
    const enhancedTour = {
      ...tour,
      personalization,
      title: `${tour.title} - ${personalization?.preferredTone === 'witty' ? 'With a Twist of Humor' : 
                              personalization?.preferredTone === 'dramatic' ? 'A Dramatic Journey' :
                              personalization?.preferredTone === 'scholarly' ? 'An In-Depth Exploration' :
                              'Your Personal Adventure'}`
    };
    onTourGenerated(enhancedTour);
  };

  if (!personalization) {
    return (
      <div>
        <div className="p-4 bg-gradient-royal">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="sm" 
            className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <PersonalizationSetup onPersonalizationComplete={handlePersonalizationComplete} />
      </div>
    );
  }

  return (
    <ChatTourPlanner 
      onTourGenerated={handleTourGenerated} 
      onBack={onBack}
      personalization={personalization}
    />
  );
}
