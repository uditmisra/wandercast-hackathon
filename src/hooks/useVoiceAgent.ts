import { useCallback, useRef, useState, useEffect } from 'react';
import { Conversation } from '@11labs/client';
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

export interface VoiceMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp: number;
}

interface UseVoiceAgentOptions {
  onStart?: () => void;
  onMessage?: (message: VoiceMessage) => void;
}

export function useVoiceAgent(options?: UseVoiceAgentOptions) {
  const [guideName, setGuideName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const conversationRef = useRef<any>(null);
  const onStartRef = useRef(options?.onStart);
  onStartRef.current = options?.onStart;
  const onMessageRef = useRef(options?.onMessage);
  onMessageRef.current = options?.onMessage;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  const startConversation = useCallback(async (place: Place, tourContext: TourContext) => {
    setError(null);
    setStatus('connecting');

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
      if (data.imageUrl) setImageUrl(data.imageUrl);

      // Start session using the Conversation class directly (no React hook lifecycle issues)
      const session = await Conversation.startSession({
        agentId: AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: data.systemPrompt,
            },
            firstMessage: data.firstMessage,
          },
        },
        onConnect: () => {
          console.log('[VoiceAgent] Connected');
          setStatus('connected');
          onStartRef.current?.();
        },
        onDisconnect: () => {
          console.log('[VoiceAgent] Disconnected');
          setStatus('disconnected');
          setIsSpeaking(false);
          conversationRef.current = null;
        },
        onError: (err: any) => {
          console.error('[VoiceAgent] Error:', err);
          setError(typeof err === 'string' ? err : err?.message || 'Voice agent error');
          setStatus('disconnected');
        },
        onMessage: (message: any) => {
          console.log('[VoiceAgent] Message:', message);
          if (message?.source && message?.message) {
            onMessageRef.current?.({
              role: message.source === 'ai' ? 'agent' : 'user',
              content: message.message,
              timestamp: Date.now(),
            });
          }
        },
        onModeChange: ({ mode }: { mode: string }) => {
          setIsSpeaking(mode === 'speaking');
        },
      });

      conversationRef.current = session;
    } catch (err: any) {
      console.error('[VoiceAgent] Start failed:', err);

      let errorMessage = 'Failed to start voice conversation';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        errorMessage = 'Microphone access is required. Please allow microphone access and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setStatus('disconnected');
    }
  }, []);

  const endConversation = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
    } catch (err) {
      console.error('[VoiceAgent] End session error:', err);
    }
    setGuideName(null);
    setStatus('disconnected');
    setIsSpeaking(false);
  }, []);

  return {
    status,
    isSpeaking,
    guideName,
    imageUrl,
    error,
    startConversation,
    endConversation,
    getInputByteFrequencyData: () => conversationRef.current?.getInputByteFrequencyData?.(),
    getOutputByteFrequencyData: () => conversationRef.current?.getOutputByteFrequencyData?.(),
  };
}
