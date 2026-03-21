import { useCallback, useRef, useState } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';

const AGENT_ID = 'agent_4501km70w8mgff4sx96kj5bd83pv';

interface Place {
  name: string;
  city?: string;
  country?: string;
  neighbourhood?: string;
  description?: string;
  generatedContent?: {
    audioNarration?: string;
    hook?: string;
    funFacts?: string[];
    directionalCue?: string;
    lookCloserChallenge?: string;
    overview?: string;
  };
}

interface TourContext {
  title?: string;
  interests?: Array<{ id?: string; name?: string; label?: string }>;
  personalization?: {
    preferredTone?: string;
    travelStyle?: string;
  };
}

interface UseVoiceAgentOptions {
  onStart?: () => void;
}

export function useVoiceAgent(options?: UseVoiceAgentOptions) {
  const [guideName, setGuideName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Stabilize callbacks in refs
  const onStartRef = useRef(options?.onStart);
  onStartRef.current = options?.onStart;

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceAgent] Connected');
      setIsConnecting(false);
      onStartRef.current?.();
    },
    onDisconnect: () => {
      console.log('[VoiceAgent] Disconnected');
      setIsConnecting(false);
    },
    onError: (err: any) => {
      console.error('[VoiceAgent] Error:', err);
      setError(typeof err === 'string' ? err : err?.message || 'Voice agent error');
      setIsConnecting(false);
    },
    onMessage: (message: any) => {
      console.log('[VoiceAgent] Message:', message);
    },
  });

  const startConversation = useCallback(async (place: Place, tourContext: TourContext) => {
    setError(null);
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get agent context from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        'get-agent-signed-url',
        {
          body: { currentPlace: place, tourContext },
        }
      );

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Failed to initialize voice agent');
      }

      setGuideName(data.guideName);

      // Start session using agentId directly with overrides
      await conversation.startSession({
        agentId: AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: data.systemPrompt,
            },
            firstMessage: data.firstMessage,
          },
        },
      });
    } catch (err: any) {
      console.error('[VoiceAgent] Start failed:', err);

      let errorMessage = 'Failed to start voice conversation';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        errorMessage = 'Microphone access is required. Please allow microphone access and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[VoiceAgent] End session error:', err);
    }
    setGuideName(null);
  }, [conversation]);

  return {
    status: isConnecting ? 'connecting' as const : conversation.status,
    isSpeaking: conversation.isSpeaking,
    guideName,
    error,
    startConversation,
    endConversation,
    getInputByteFrequencyData: conversation.getInputByteFrequencyData,
    getOutputByteFrequencyData: conversation.getOutputByteFrequencyData,
  };
}
