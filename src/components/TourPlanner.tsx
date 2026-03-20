
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, MessageSquare } from 'lucide-react';
import { ChatTourPlanner } from './ChatTourPlanner';
import { AudioGuide } from './AudioGuide';
import { TourPlan } from '@/types/tour';
import { EnhancedChatTourPlanner } from './EnhancedChatTourPlanner';
import { EnhancedAudioGuide } from './EnhancedAudioGuide';

interface TourPlannerProps {
  onTourGenerated: (tour: TourPlan) => void;
}

export function TourPlanner({ onTourGenerated }: TourPlannerProps) {
  const [showChatPlanner, setShowChatPlanner] = useState(false);
  const [currentTour, setCurrentTour] = useState<TourPlan | null>(null);

  if (currentTour) {
    return (
      <EnhancedAudioGuide 
        tour={currentTour} 
        onBack={() => setCurrentTour(null)} 
      />
    );
  }

  if (showChatPlanner) {
    return (
      <EnhancedChatTourPlanner
        onTourGenerated={(tour) => {
          setCurrentTour(tour);
          setShowChatPlanner(false);
          onTourGenerated(tour);
        }}
        onBack={() => setShowChatPlanner(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <Card className="w-[400px] space-y-4">
        <CardHeader>
          <CardTitle className="text-2xl">
            <MapPin className="mr-2 inline-block h-5 w-5" />
            Tour Planner
          </CardTitle>
          <CardDescription>
            Create your personalized audio tour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to explore? Start planning your custom audio tour now!
          </p>
          <Button onClick={() => setShowChatPlanner(true)} className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Plan with AI Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
