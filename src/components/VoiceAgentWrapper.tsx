import { useEffect, useRef, useState, useCallback } from 'react';
import { useVoiceAgent, VoiceMessage } from '@/hooks/useVoiceAgent';
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
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  const handleMessage = useCallback((msg: VoiceMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const voiceAgent = useVoiceAgent({ onStart, onMessage: handleMessage });

  // Capture initial props in refs so re-renders don't restart the conversation
  const placeRef = useRef(place);
  const tourContextRef = useRef(tourContext);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      voiceAgent.startConversation(placeRef.current, tourContextRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = async () => {
    await voiceAgent.endConversation();
    onClose();
  };

  return (
    <VoiceAgentPanel
      status={voiceAgent.status as 'connecting' | 'connected' | 'disconnected'}
      isSpeaking={voiceAgent.isSpeaking}
      guideName={voiceAgent.guideName}
      placeName={placeRef.current.name}
      imageUrl={voiceAgent.imageUrl}
      error={voiceAgent.error}
      messages={messages}
      onEnd={handleEnd}
      getInputByteFrequencyData={voiceAgent.getInputByteFrequencyData}
      getOutputByteFrequencyData={voiceAgent.getOutputByteFrequencyData}
    />
  );
}
