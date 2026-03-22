import { useEffect, useRef } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { VoiceAgentPanel } from './VoiceAgentPanel';
import { Place } from '@/types/tour';

interface VoiceAgentWrapperProps {
  place: Place;
  tourContext: {
    title: string;
    interests: any[];
    personalization: any;
  };
  onStart?: () => void;
  onClose: () => void;
}

export function VoiceAgentWrapper({ place, tourContext, onStart, onClose }: VoiceAgentWrapperProps) {
  const voiceAgent = useVoiceAgent({ onStart });

  // Capture initial props in refs so re-renders don't restart the conversation
  const placeRef = useRef(place);
  const tourContextRef = useRef(tourContext);
  const startedRef = useRef(false);

  // Start conversation exactly once on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      voiceAgent.startConversation(placeRef.current, tourContextRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = () => {
    voiceAgent.endConversation();
    onClose();
  };

  return (
    <VoiceAgentPanel
      status={voiceAgent.status as 'connecting' | 'connected' | 'disconnected'}
      isSpeaking={voiceAgent.isSpeaking}
      guideName={voiceAgent.guideName}
      placeName={placeRef.current.name}
      error={voiceAgent.error}
      onEnd={handleEnd}
      getInputByteFrequencyData={voiceAgent.getInputByteFrequencyData}
      getOutputByteFrequencyData={voiceAgent.getOutputByteFrequencyData}
    />
  );
}
