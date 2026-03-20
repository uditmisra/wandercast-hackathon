import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square, Loader2, Send, Keyboard, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Place, Interest, Personalization } from '@/types/tour';
import { useToast } from '@/hooks/use-toast';

/** When the guide API is unavailable, construct a response from local enrichment data */
function buildLocalFallback(question: string, gc: any): string {
  const q = question.toLowerCase();
  const facts = gc?.funFacts as string[] | undefined;
  const narration = gc?.audioNarration as string | undefined;
  const hook = gc?.hook as string | undefined;
  const challenge = gc?.lookCloserChallenge as string | undefined;

  // If the question relates to facts/details, return a fun fact
  if (facts && facts.length > 0) {
    // Pick a random fact the user probably hasn't seen yet
    const fact = facts[Math.floor(Math.random() * facts.length)];
    return `Here's something interesting: ${fact}`;
  }

  // If we have narration, excerpt a relevant snippet
  if (narration) {
    // Return the first ~200 chars of narration as context
    const snippet = narration.length > 200 ? narration.slice(0, 200) + '...' : narration;
    return `Based on what I know about this place: ${snippet}`;
  }

  if (hook) {
    return hook;
  }

  return `That's a great question about ${gc?.hook ? 'this place' : 'here'}! I'm having trouble connecting right now, but try tapping the Facts or Look Closer buttons for more details.`;
}

interface UnifiedQuestionInputProps {
  currentPlace: Place;
  tourContext: {
    title: string;
    interests: Interest[];
    personalization: Personalization;
  };
  remainingQuestions?: number;
  onQuestionAsked?: () => void;
  suggestedQuestions?: string[];
}

export function UnifiedQuestionInput({
  currentPlace,
  tourContext,
  remainingQuestions = 5,
  onQuestionAsked,
  suggestedQuestions
}: UnifiedQuestionInputProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Voice input handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processQuestion(null, audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Text input handler
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const question = textInput.trim();
    setTextInput('');
    await processQuestion(question, null);
  };

  // Unified question processor (handles both text and voice)
  const processQuestion = async (textQuestion: string | null, audioBlob: Blob | null) => {
    try {
      setIsProcessing(true);
      let question = textQuestion;

      // If audio, transcribe first
      if (audioBlob && !textQuestion) {
        setProcessingStage('Listening...');
        const reader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(audioBlob);
        });

        setProcessingStage('Understanding your question...');
        console.log('Transcribing audio...');
        const { data: transcriptionData, error: transcribeError } = await supabase.functions.invoke(
          'transcribe-audio',
          { body: { audio: audioBase64 } }
        );

        if (transcribeError || !transcriptionData?.success) {
          console.error('Transcription error:', transcribeError);
          throw new Error('Failed to transcribe audio');
        }

        question = transcriptionData.text;
        console.log('User asked:', question);
      }

      if (!question) {
        throw new Error('No question to process');
      }

      // Send relevant place context to the edge function
      const gc = currentPlace.generatedContent as any;
      const trimmedPlace = {
        name: currentPlace.name,
        city: currentPlace.city,
        country: currentPlace.country,
        description: currentPlace.description,
        generatedContent: gc ? {
          overview: gc.overview || gc.hook || '',
          audioNarration: gc.audioNarration || '',
          hook: gc.hook || '',
          directionalCue: gc.directionalCue || '',
          funFacts: gc.funFacts || [],
          lookCloserChallenge: gc.lookCloserChallenge || '',
        } : undefined,
      };

      // Get contextual response from GPT — with client-side fallback
      setProcessingStage('Thinking...');
      let responseText: string;

      try {
        const { data: responseData, error: responseError } = await supabase.functions.invoke(
          'interactive-guide-conversation',
          {
            body: {
              question,
              currentPlace: trimmedPlace,
              tourContext: {
                interests: tourContext.interests,
                personalization: tourContext.personalization,
              },
              conversationHistory
            }
          }
        );

        if (responseError || !responseData?.success) {
          throw new Error(responseData?.error || responseError?.message || 'API unavailable');
        }

        responseText = responseData.response;
      } catch (apiErr) {
        console.warn('Guide API failed, using local fallback:', apiErr);
        // Build a response from local enrichment data
        responseText = buildLocalFallback(question, gc);
      }
      console.log('Guide response:', responseText);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: responseText }
      ]);

      // Try to convert response to speech — fall back to text-only if audio fails
      setProcessingStage('Preparing audio...');
      try {
        const voiceId = getVoiceId(tourContext.personalization.preferredTone);
        const { data: audioData, error: audioError } = await supabase.functions.invoke(
          'generate-audio',
          { body: { text: responseText, voiceId } }
        );

        if (audioError || !audioData?.audioContent) throw new Error('Audio unavailable');

        if (audioRef.current) audioRef.current.pause();

        const audioBytes = Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0));
        const audioResponseBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioResponseBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      } catch {
        // Audio failed — show text response instead
        console.warn('Audio generation failed, showing text response');
      }

      // Track usage
      if (onQuestionAsked) {
        onQuestionAsked();
      }

      toast({
        title: "Question Answered",
        description: responseText.slice(0, 100) + (responseText.length > 100 ? '...' : ''),
      });

    } catch (error) {
      console.error('Error processing question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Sorry, I had trouble with your question. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const getVoiceId = (tone: string): string => {
    return 'EST9Ui6982FZPSi7gCHi';
  };

  const isDisabled = isProcessing || remainingQuestions <= 0;

  const handleSuggestedQuestion = (question: string) => {
    if (isDisabled) return;
    processQuestion(question, null);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Suggested Questions */}
      {suggestedQuestions && suggestedQuestions.length > 0 && !isProcessing && remainingQuestions > 0 && (
        <div className="flex flex-wrap justify-center gap-2 w-full max-w-sm">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSuggestedQuestion(q)}
              disabled={isDisabled}
              className="text-xs px-3.5 py-2 min-h-[44px] rounded-full border border-foreground/15 text-foreground/80 hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50 bg-foreground/[0.06]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('voice')}
          disabled={isProcessing}
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('text')}
          disabled={isProcessing}
        >
          <Keyboard className="w-4 h-4 mr-2" />
          Text
        </Button>
      </div>

      {/* Voice Input */}
      {inputMode === 'voice' && (
        <div className="flex flex-col items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isDisabled}
            className="rounded-full w-16 h-16 shadow-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {remainingQuestions <= 0 ? (
            <p className="text-xs text-muted-foreground text-center max-w-[200px]">
              Question limit reached
            </p>
          ) : isProcessing ? (
            <p className="text-xs text-primary font-medium text-center">
              {processingStage}
            </p>
          ) : isRecording ? (
            <p className="text-xs text-destructive font-medium text-center">
              Recording... Tap to ask
            </p>
          ) : (
            <p className="text-xs text-muted-foreground text-center max-w-[200px]">
              {remainingQuestions <= 3 && `${remainingQuestions} questions left • `}
              Tap to ask
            </p>
          )}
        </div>
      )}

      {/* Text Input */}
      {inputMode === 'text' && (
        <div className="w-full max-w-sm space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask about this place..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              disabled={isDisabled}
              className="flex-1"
            />
            <Button
              onClick={handleTextSubmit}
              disabled={isDisabled || !textInput.trim()}
              size="icon"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {remainingQuestions <= 0 ? (
            <p className="text-xs text-muted-foreground text-center">
              Question limit reached
            </p>
          ) : isProcessing ? (
            <p className="text-xs text-primary font-medium text-center">
              {processingStage}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {remainingQuestions <= 3 && `${remainingQuestions} questions left • `}
              Ask me anything
            </p>
          )}
        </div>
      )}
    </div>
  );
}
