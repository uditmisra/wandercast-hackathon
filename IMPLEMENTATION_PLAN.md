# Interactive Audio Guide - Implementation Plan

## Overview

This document outlines the implementation strategy for the **Interactive Voice Q&A** feature - the core differentiator that transforms our app from a simple audio tour into a conversational AI guide.

---

## Architecture Decision: Hybrid Voice System

### Why NOT OpenAI Realtime API?

While OpenAI's Realtime API provides end-to-end voice-to-voice conversation, we're using a **hybrid architecture** for these reasons:

1. **Quality**: ElevenLabs voices are significantly more natural and expressive for narration
2. **Cost**: 4x cheaper ($0.083 vs $0.30 per question)
3. **Flexibility**: Can swap TTS providers independently, A/B test voices, offer multiple personalities
4. **Control**: Separate optimization for input (accuracy) vs output (quality)

### Hybrid Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACTIVE GUIDE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  User Voice Input    │  User holds mic button, asks question
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Browser MediaRecorder│  Records WebM audio in browser
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: Speech-to-Text (Understanding)                          │
│  ────────────────────────────────────────────────────────────    │
│  Edge Function: transcribe-audio                                 │
│  API: OpenAI Whisper                                             │
│  Cost: $0.006/minute                                             │
│  Output: "Tell me more about the architect"                      │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: Contextual Response Generation                          │
│  ────────────────────────────────────────────────────────────    │
│  Edge Function: interactive-guide-conversation (NEW)             │
│  API: OpenAI GPT-5.2                                             │
│  Context: Current place + tour interests + conversation history  │
│  Cost: ~$0.02/question                                           │
│  Output: "This building was designed by Charles Rennie           │
│           Mackintosh in 1896..."                                 │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: Text-to-Speech (Narration)                              │
│  ────────────────────────────────────────────────────────────    │
│  Edge Function: generate-audio                                   │
│  API: ElevenLabs (premium) OR Web Speech API (free)              │
│  Cost: $0.30/1000 chars (ElevenLabs) OR free (browser TTS)       │
│  Output: Audio stream                                            │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Stream to User      │  Plays audio response with same guide voice
└──────────────────────┘
```

---

## Implementation Steps

### Week 1: Core Voice Infrastructure

#### Task 1.1: Create `interactive-guide-conversation` Edge Function

**Location**: `supabase/functions/interactive-guide-conversation/index.ts`

**Purpose**: Generate contextual responses to user questions about current location

**Input**:
```typescript
{
  question: string,                    // Transcribed user question
  currentPlace: Place,                 // Current tour stop
  tourContext: {
    title: string,
    interests: Interest[],
    personalization: Personalization
  },
  conversationHistory: Array<{         // Previous Q&A for this location
    role: 'user' | 'assistant',
    content: string
  }>
}
```

**Output**:
```typescript
{
  response: string,                    // Text response (max 300 chars)
  success: boolean
}
```

**Implementation**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, currentPlace, tourContext, conversationHistory } = await req.json();

    // Build context-aware prompt
    const systemPrompt = `You are ${getGuideName(tourContext.personalization.preferredTone)}, an expert tour guide currently at ${currentPlace.name} in ${currentPlace.city}.

Tour Context:
- Tour focus: ${tourContext.interests.map(i => i.label).join(', ')}
- Location: ${currentPlace.name}
- Overview: ${currentPlace.generatedContent?.overview || currentPlace.description}

Your personality:
${getPersonalityDescription(tourContext.personalization.preferredTone)}

User's travel style: ${tourContext.personalization.travelStyle}

CRITICAL RULES:
1. Respond in 2-3 sentences MAX (under 300 characters)
2. Stay in character as the guide
3. Answer based on the current location context
4. If you don't know specific info, acknowledge it naturally ("That's a great question! While I don't have specific details about that, I can tell you...")
5. Use conversational tone, like speaking to a friend
6. Include anecdotes, interesting facts, or local secrets when relevant`;

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: question }
    ];

    // Call GPT-5.2
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        messages: conversationMessages,
        max_tokens: 150,        // ~300 chars
        temperature: 0.8,       // Creative but coherent
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const result = await openAIResponse.json();
    const response = result.choices[0].message.content;

    return new Response(JSON.stringify({
      response,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in interactive-guide-conversation:', error);
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getGuideName(tone: string): string {
  const guides = {
    'casual': 'Max',
    'scholarly': 'Dr. Eleanor',
    'dramatic': 'Marco',
    'witty': 'Sophie'
  };
  return guides[tone as keyof typeof guides] || 'Max';
}

function getPersonalityDescription(tone: string): string {
  const personalities = {
    'casual': 'Friendly, enthusiastic, like a well-traveled friend. Use contractions, ask rhetorical questions.',
    'scholarly': 'Knowledgeable, thoughtful, precise. Reference historical sources when relevant.',
    'dramatic': 'Vivid storytelling, emotional, immersive. Paint pictures with words.',
    'witty': 'Playful, clever, use humor and wordplay. Keep it light and engaging.'
  };
  return personalities[tone as keyof typeof personalities] || personalities.casual;
}
```

**Deploy**:
```bash
cd supabase
supabase functions deploy interactive-guide-conversation
```

#### Task 1.2: Update `transcribe-audio` Edge Function

**Current state**: Already exists and works

**Changes needed**: None - already handles Whisper transcription correctly

**Verification**: Test with voice input to ensure transcription accuracy

#### Task 1.3: Update `generate-audio` Edge Function

**Current state**: Already exists and uses ElevenLabs

**Changes needed**:
1. Add voice ID parameter (support multiple guide personalities)
2. Add streaming support (optional - can be Phase 2)

**Implementation**:
```typescript
// Add to existing generate-audio/index.ts

const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json(); // Default: Sarah (Soft)

// Available ElevenLabs voices:
// - 'EXAVITQu4vr4xnSDxMaL': Sarah (Soft, warm, female)
// - 'pNInz6obpgDQGcFmaJgB': Adam (Deep, male, British)
// - '21m00Tcm4TlvDq8ikWAM': Rachel (Calm, female, American)
// - 'AZnzlk1XvdvUeBnXmlld': Domi (Strong, confident, female)

const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'Accept': 'audio/mpeg',
    'xi-api-key': elevenLabsKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  })
});
```

---

### Week 2: Frontend Integration

#### Task 2.1: Create `InteractiveGuideButton` Component

**Location**: `src/components/InteractiveGuideButton.tsx`

**Purpose**: Mic button that records user voice, transcribes, and plays response

**Implementation**:
```typescript
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Place, Interest, Personalization } from '@/types/tour';

interface InteractiveGuideButtonProps {
  currentPlace: Place;
  tourContext: {
    title: string;
    interests: Interest[];
    personalization: Personalization;
  };
  remainingQuestions?: number;  // For usage limits
  onQuestionAsked?: () => void;  // Track usage
}

export function InteractiveGuideButton({
  currentPlace,
  tourContext,
  remainingQuestions = 5,
  onQuestionAsked
}: InteractiveGuideButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Convert audio to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // Step 2: Transcribe with Whisper
      console.log('Transcribing audio...');
      const { data: transcriptionData, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-audio',
        { body: { audio: audioBase64 } }
      );

      if (transcribeError || !transcriptionData?.success) {
        throw new Error('Failed to transcribe audio');
      }

      const question = transcriptionData.text;
      console.log('User asked:', question);

      // Step 3: Get contextual response from GPT-5.2
      const { data: responseData, error: responseError } = await supabase.functions.invoke(
        'interactive-guide-conversation',
        {
          body: {
            question,
            currentPlace,
            tourContext,
            conversationHistory
          }
        }
      );

      if (responseError || !responseData?.success) {
        throw new Error('Failed to generate response');
      }

      const responseText = responseData.response;
      console.log('Guide response:', responseText);

      // Step 4: Convert response to speech with ElevenLabs
      const voiceId = getVoiceId(tourContext.personalization.preferredTone);
      const { data: audioData, error: audioError } = await supabase.functions.invoke(
        'generate-audio',
        {
          body: {
            text: responseText,
            voiceId
          }
        }
      );

      if (audioError || !audioData?.audioUrl) {
        throw new Error('Failed to generate audio');
      }

      // Step 5: Play audio response
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioData.audioUrl);
      audioRef.current = audio;
      await audio.play();

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: responseText }
      ]);

      // Track usage
      if (onQuestionAsked) {
        onQuestionAsked();
      }

    } catch (error) {
      console.error('Error processing question:', error);
      alert('Sorry, I had trouble understanding your question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getVoiceId = (tone: string): string => {
    const voices = {
      'casual': 'EXAVITQu4vr4xnSDxMaL',        // Sarah (warm, friendly)
      'scholarly': 'pNInz6obpgDQGcFmaJgB',     // Adam (British, deep)
      'dramatic': 'AZnzlk1XvdvUeBnXmlld',      // Domi (strong, confident)
      'witty': '21m00Tcm4TlvDq8ikWAM'          // Rachel (playful)
    };
    return voices[tone as keyof typeof voices] || voices.casual;
  };

  const isDisabled = isProcessing || remainingQuestions <= 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
        className="rounded-full w-16 h-16"
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
        <p className="text-xs text-muted-foreground">
          Question limit reached. Upgrade for unlimited Q&A!
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {isRecording ? 'Release to ask' : 'Ask me anything'}
          {remainingQuestions <= 3 && ` (${remainingQuestions} left)`}
        </p>
      )}
    </div>
  );
}
```

#### Task 2.2: Integrate into `TourPlanner` Component

Add the interactive guide button to the tour experience UI:

```typescript
import { InteractiveGuideButton } from '@/components/InteractiveGuideButton';

// Inside TourPlanner render:
<div className="audio-controls">
  {/* Existing play/pause controls */}

  <InteractiveGuideButton
    currentPlace={places[currentStopIndex]}
    tourContext={{
      title: tour.title,
      interests: tour.interests,
      personalization: tour.personalization
    }}
    remainingQuestions={remainingQuestions}
    onQuestionAsked={() => setRemainingQuestions(prev => prev - 1)}
  />
</div>
```

---

### Week 3: Testing & Optimization

#### Task 3.1: Cost Monitoring

Add usage tracking to monitor costs per user:

```typescript
// In interactive-guide-conversation Edge Function
console.log('Question processed:', {
  userId: user.id,
  tourId: tourContext.tourId,
  question_length: question.length,
  response_length: response.length,
  timestamp: new Date().toISOString()
});

// Track in Supabase table:
// CREATE TABLE interaction_logs (
//   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id uuid REFERENCES auth.users(id),
//   tour_id text,
//   question_text text,
//   response_text text,
//   created_at timestamp DEFAULT now()
// );
```

#### Task 3.2: Error Handling

Test edge cases:
- Microphone permission denied
- Network errors during transcription
- OpenAI API rate limits
- ElevenLabs quota exceeded
- Very long questions (>60 seconds)
- Nonsense questions

#### Task 3.3: Performance Testing

Measure latency:
- Transcription: Target <3 seconds
- Response generation: Target <2 seconds
- Audio generation: Target <3 seconds
- **Total roundtrip**: Target <8 seconds

---

## Cost Analysis

### Per Interactive Question Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI Whisper | 30 sec audio transcription | $0.003 |
| OpenAI GPT-5.2 | ~500 tokens (context + response) | $0.020 |
| ElevenLabs TTS | ~200 characters | $0.060 |
| **Total per question** | | **$0.083** |

### Monthly Cost Projections

Assuming:
- 1,000 tours generated/month
- Average 3 interactive questions per tour
- 50% of users use premium (ElevenLabs), 50% use free tier (browser TTS)

**Premium Tier:**
- Questions: 3 × 1,000 × 0.5 = 1,500 questions
- Cost: 1,500 × $0.083 = **$124.50/month**

**Free Tier:**
- Questions: 3 × 1,000 × 0.5 = 1,500 questions
- Cost (Whisper + GPT only): 1,500 × $0.023 = **$34.50/month**

**Total Interactive Q&A Cost**: ~$159/month for 3,000 questions

---

## Free Tier vs Premium Tier Strategy

### Free Tier (Browser TTS)
- **Cost**: $0.023 per question
- **Limits**:
  - 3 tours per month
  - 5 voice questions per tour
  - Browser TTS voices (lower quality but acceptable)
- **Revenue**: $0 (acquisition funnel)

### Premium Tier ($9.99/month)
- **Cost**: $0.083 per question × ~15 questions = $1.25
- **Limits**:
  - Unlimited tours
  - Unlimited voice questions
  - ElevenLabs premium voices (3 personalities)
  - Priority support
- **Margin**: $9.99 - $1.25 = **$8.74/user/month**

### Breakeven Analysis
- If 20% of free users convert to premium → profitable at 100 users
- Target: 500 premium users by Month 3 = **$4,370 MRR**

---

## Rollout Plan

### Week 1: Infrastructure
- [ ] Create `interactive-guide-conversation` Edge Function
- [ ] Test with sample questions
- [ ] Deploy and verify in production

### Week 2: Frontend
- [ ] Build `InteractiveGuideButton` component
- [ ] Add usage tracking (questions remaining)
- [ ] Integrate into `TourPlanner`
- [ ] Add conversation history UI (optional)

### Week 3: Testing
- [ ] Test voice recording on iOS Safari, Android Chrome
- [ ] Test microphone permissions flow
- [ ] Measure end-to-end latency
- [ ] Test edge cases (long questions, errors, rate limits)

### Week 4: Launch
- [ ] Soft launch to 10 beta users
- [ ] Monitor costs and usage
- [ ] Collect feedback on voice quality and response accuracy
- [ ] Iterate based on user feedback

---

## Success Metrics

### Technical Metrics
- [ ] Voice transcription accuracy: >95%
- [ ] Response relevance: >90% (manual review of 100 samples)
- [ ] End-to-end latency: <10 seconds (target: <8 seconds)
- [ ] Error rate: <5%

### User Engagement
- [ ] % of tours that use interactive Q&A: Target >40%
- [ ] Average questions per tour: Target 3-5
- [ ] User satisfaction with responses: Target >4.5/5

### Business Metrics
- [ ] Cost per question: <$0.10
- [ ] Free-to-premium conversion: >15%
- [ ] Premium user retention: >80% after 30 days

---

## Future Enhancements (Phase 3+)

### Streaming Audio Responses
Instead of waiting for full audio generation, stream ElevenLabs audio in chunks:
- Reduce perceived latency by 50%
- Start playing audio while still generating

### Multi-Turn Conversations
Allow follow-up questions without holding mic button again:
- "Tell me more about that"
- "What about the architect?"
- Context carries over automatically

### Proactive Guide Suggestions
Guide can interrupt with optional prompts:
- "Did you notice the inscription above the door?"
- "Would you like to hear a ghost story about this place?"

### Voice Personality Selection
Let users choose their guide:
- Max (casual, friendly)
- Dr. Eleanor (scholarly, detailed)
- Marco (dramatic, storytelling)
- Sophie (witty, playful)

---

## Appendix: API Reference

### `transcribe-audio` (Existing)
**Input**: `{ audio: string }` (base64 webm)
**Output**: `{ text: string, success: boolean }`

### `interactive-guide-conversation` (New)
**Input**:
```typescript
{
  question: string,
  currentPlace: Place,
  tourContext: {
    title: string,
    interests: Interest[],
    personalization: Personalization
  },
  conversationHistory: Array<{ role: string, content: string }>
}
```
**Output**: `{ response: string, success: boolean }`

### `generate-audio` (Updated)
**Input**: `{ text: string, voiceId?: string }`
**Output**: `{ audioUrl: string, success: boolean }`

---

**Document Version**: 1.0
**Last Updated**: December 30, 2025
**Status**: Ready for Implementation
