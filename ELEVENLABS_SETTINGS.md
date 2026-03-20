# ElevenLabs Voice Settings

## Current Configuration

### Primary Voice
**Voice ID**: `EST9Ui6982FZPSi7gCHi`

**Used For**:
- Main tour narrations (all stops)
- Interactive Q&A responses (all tones)
- All audio generation across the app

### Voice Hierarchy

| Priority | Gender | Voice ID | Notes |
|----------|--------|----------|-------|
| Primary | Female | `EST9Ui6982FZPSi7gCHi` | Default for all audio |
| Backup Female | Female | `56bWURjYFHyYyVf490Dp` | Fallback if primary unavailable |
| Third Female | Female | `lcMyyd2HUfFzxdCaC4Ta` | Third option |
| Primary Male | Male | `L0Dsvb3SLTyegXwtm47J` | Archer — for male voice option |
| Backup Male | Male | `MFZUKuGQUsGJPQjTS4wC` | Fallback male |

---

## Settings

**Model**: `eleven_turbo_v2_5`

**Voice Settings**:
```typescript
{
  stability: 0.65,
  similarity_boost: 0.85,
  style: 0.4,
  use_speaker_boost: true
}
```

---

## Files Using This Configuration

### 1. Edge Function (Server Default)
**File**: `supabase/functions/generate-audio/index.ts`
- Default voice: `EST9Ui6982FZPSi7gCHi`
- Called by all frontend components for TTS

### 2. Frontend Components (Client-side voice ID)
All pass `voiceId: 'EST9Ui6982FZPSi7gCHi'` explicitly:
- `src/components/EnhancedAudioGuide.tsx` — main tour playback + Q&A audio
- `src/components/UnifiedQuestionInput.tsx` — question responses
- `src/components/InlineTourChat.tsx` — fire-and-forget pre-generation
- `src/components/ChatTourPlanner.tsx` — alternative tour planner pre-generation
- `src/pages/Index.tsx` — audio pre-generation during tour creation
- `src/components/onboarding/DemoStep.tsx` — onboarding demo audio
- `src/components/library/PlaceDetailSheet.tsx` — story preview audio
- `src/components/dashboard/DashboardBookmarks.tsx` — bookmarked place playback

---

## Deployment

- **generate-audio Edge Function**: Must be deployed after voice ID changes: `supabase functions deploy generate-audio --no-verify-jwt`
- **Frontend**: Auto-deploys via Lovable on push

---

## Testing

1. Create a new tour → play any stop → verify voice
2. Ask a question (voice or text) → response should use primary voice
3. Play a bookmarked place from dashboard → verify voice
