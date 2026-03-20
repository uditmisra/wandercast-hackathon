import React, { useState, useRef } from 'react';
import { Send, Mic, Square, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
  showLocationButton?: boolean;
  onLocationRequest?: () => void;
  locationAvailable?: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSubmit,
  isProcessing,
  placeholder = "e.g. Hidden gems in Rome...",
  showLocationButton,
  onLocationRequest,
  locationAvailable,
}: ChatInputBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAndSubmit(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAndSubmit = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: audioBase64 }
      });

      if (error || !data?.success) {
        console.error('Transcription error:', error);
        return;
      }

      if (data.text) {
        onSubmit(data.text);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isProcessing) {
        onSubmit(value);
      }
    }
  };

  const busy = isProcessing || isTranscribing;

  return (
    <div className="relative flex items-center gap-2 w-full bg-card rounded-lg border border-foreground/10 shadow-lg shadow-black/20 px-4 h-14">
      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={busy || isRecording}
        className="flex-1 bg-transparent text-sm text-foreground placeholder-foreground/40 outline-none disabled:opacity-50 min-w-0"
      />

      {/* Location button */}
      {showLocationButton && (
        <button
          onClick={onLocationRequest}
          disabled={busy}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            locationAvailable
              ? 'text-accent-orange hover:bg-accent-orange/10'
              : 'text-foreground/30 hover:text-foreground/50 hover:bg-foreground/5'
          }`}
          aria-label="Use my location"
        >
          <MapPin className="w-4 h-4" />
        </button>
      )}

      {/* Mic button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={busy && !isRecording}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 text-white scale-110 animate-pulse'
            : isTranscribing
              ? 'bg-foreground/10 text-foreground/50'
              : 'border border-foreground/20 text-foreground/50 hover:border-foreground/40 hover:text-foreground active:scale-95'
        }`}
        aria-label={isRecording ? 'Stop recording' : 'Voice input'}
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Send button */}
      <button
        onClick={() => value.trim() && onSubmit(value)}
        disabled={!value.trim() || busy}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-foreground text-background transition-all duration-150 active:scale-95 disabled:opacity-20"
        aria-label="Send"
      >
        {busy && !isRecording ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
