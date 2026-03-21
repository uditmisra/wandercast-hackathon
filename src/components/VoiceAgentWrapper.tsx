import { useEffect } from 'react';
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

  // Auto-start conversation on mount
  useEffect(() => {
    voiceAgent.startConversation(place, tourContext);
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
      placeName={place.name}
      error={voiceAgent.error}
      onEnd={handleEnd}
      getInputByteFrequencyData={voiceAgent.getInputByteFrequencyData}
      getOutputByteFrequencyData={voiceAgent.getOutputByteFrequencyData}
    />
  );
}
