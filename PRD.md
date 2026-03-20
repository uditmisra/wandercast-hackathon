# Product Requirements Document: Edinburgh Whispers Route

## Product Vision

An AI-powered audio tour guide that creates personalized, conversational walking tours of any city in the world. Users simply chat with an AI to describe where they want to go, and receive instant, engaging audio narration for each location.

## Core Value Proposition

**"From chat to tour in 30 seconds"** - No planning, no research, no downloads. Just tell the AI where you want to explore, put in your earbuds, and start walking.

---

## 1. Product Overview

### 1.1 What This Is
- **Conversational tour planner**: Chat naturally with AI to plan tours ("Show me Paris highlights", "Hidden gems in Rome")
- **Instant audio tours**: Immediately get AI-generated audio narration for each location
- **Interactive guide**: Ask voice or text questions about what you're seeing — get spoken answers in character
- **Personal tour library**: Dashboard with history, stats, bookmarks, and personalized suggestions
- **Zero friction**: No pre-downloaded content, no tour guides, no schedules - fully on-demand

### 1.2 What This Is NOT
- Not a pre-recorded tour app (Detour, Rick Steves Audio Europe)
- Not a traditional guide booking platform (GetYourGuide, Viator)
- Not a navigation app (Google Maps, Citymapper)
- Not a general chatbot (ChatGPT, Claude)

### 1.3 Target User
- **Primary**: Travelers who want flexibility + local insights without guides/planning
- **Secondary**: Locals exploring their own city, history enthusiasts, students

---

## 2. User Journey

### 2.1 Core Flow (30 seconds)
```
1. User opens app → sees chat interface
2. User types: "Show me London highlights"
3. AI shows step-by-step progress ("Found 5 stops... Crafting stories...")
4. First stop audio pre-generates during creation
5. Tour opens → user sees content card (hook + directional cue) + instant Play
6. Audio prefetches next stop while current plays
7. User can ask voice/text questions at each stop (10 per tour)
```

### 2.2 Returning User Flow
```
1. User opens app → taps Dashboard
2. Sees tour history, stats, bookmarks
3. Replays a saved tour instantly
4. Or follows a suggestion for a new theme in a visited city
```

### 2.3 Conversation Examples

**Example 1: Simple Request**
```
User: "Show me Paris highlights"
AI: Creates "Classic Paris Discovery" with 5 stops
→ Tour auto-starts
```

**Example 2: Conversational Refinement**
```
User: "Hidden gems in Rome"
AI: "Which area will you be starting from?"
User: "Trastevere, 2 hours"
AI: Creates "Trastevere Secrets" with 6 stops
→ Tour auto-starts
```

**Example 3: Multi-turn with Memory**
```
User: "Best food tour in Tokyo"
AI: "Which neighborhood?"
User: "Shibuya"
AI: "How many hours?"
User: "3 hours"
AI: Creates "Shibuya Food Adventure"
    (Remembers "Tokyo" + "Shibuya" + "food" + "3 hours" across all turns)
```

---

## 3. Features — Current State

### 3.1 Conversational Tour Planning ✅ SHIPPED
- Natural language input (no forms)
- Full conversation memory via GPT-5.2 (400K context)
- Smart defaults when info is incomplete
- Follow-up questions only when critical info is missing
- Quick-start suggestions ("Show me Paris highlights", "Food tour of Barcelona")

### 3.2 Audio Generation ✅ SHIPPED
- ElevenLabs TTS with primary voice (EST9Ui6982FZPSi7gCHi)
- Model: `eleven_turbo_v2_5` (stability 0.65, similarity 0.85, style 0.4)
- **Pre-generation**: First stop audio generated during tour creation (instant playback)
- **Prefetching**: Next stop audio generated while current stop plays
- Fallback: On-demand generation if pre-generated audio unavailable
- 30-45 second narrations per stop

### 3.3 Content Quality System ✅ SHIPPED

**4-tier RAG content pipeline:**
1. **Tier 1 — Curated + Claude**: Pre-written stories in `place_stories` table fed as grounding material to Claude Sonnet. Claude synthesizes, personalizes tone/interests, and generates enriched content (narration, hook, directional cue, 3 fun facts, look-closer challenge, suggested questions, transition to next stop).
   - 48 curated stories for London (12 places × 4 tones), 2 for Edinburgh
   - Fuzzy place name matching (token-based Jaccard similarity, threshold 0.4)
2. **Tier 1.5 — Curated verbatim**: If Claude fails, best-matching curated story served directly (scored by tone + interest overlap).
3. **Tier 2 — Multi-source web context + Claude**: For uncurated places, fetches grounding from 3 free sources in parallel:
   - Wikipedia summary (up to 1500 chars)
   - Wikivoyage traveler perspective (up to 1000 chars)
   - Wikipedia extended extract (up to 2000 chars)
   - Results cached in `web_context_cache` table (7-day TTL). Claude generates from this grounding.
4. **Tier 3 — GPT-4o fallback**: If no web context or Claude unavailable.
5. **Tier 4 — Static template**: Last resort generic narration.

**Enriched content payload** (all tiers):
- `audioNarration` (500-650 chars), `hook` (max 120 chars), `directionalCue`
- `funFacts[]` (3 items), `lookCloserChallenge`, `suggestedQuestions[]` (2 items), `transitionToNext`

**Content import tool** (`import-city-data` edge function):
- API-based with validation (narration length 400-700 chars, required fields, coordinates)
- Supports `validate_only` mode for dry runs
- Upserts for idempotent imports
- Content template at `scripts/content-template.json`

### 3.4 Interactive Voice Q&A ✅ SHIPPED
- Unified voice + text input during tours
- Voice: Record → Whisper transcription → GPT-5.2 answer (in character) → ElevenLabs audio
- Text: Direct input → GPT-5.2 → ElevenLabs audio
- 10 questions per tour (free tier)
- Guide personas based on tone: Max (scholarly), Dr. Eleanor (dramatic), Marco (casual), Sophie (witty)

### 3.5 Tour Playback UI ✅ SHIPPED
- Progressive disclosure: layered content cards, not a wall of text
- Pill-style Play/Pause button with skip controls + progress bar
- **Rich stop experience** (top to bottom):
  - Hook card (amber) — one-sentence surprising fact
  - Directional cue (eye icon) — what to physically observe
  - Audio player with progress bar + read narration toggle
  - Look Closer challenge (violet card) — visual scavenger hunt with "Found it!" button
  - Fun Facts — horizontal swipeable cards (3 per stop)
  - Ask Your Guide — suggested question chips + voice/text input
  - Next Up — transition card with walking hint + "Go to next stop" button
- **Stop navigation**: Previous / Next buttons, All Stops sheet for jumping
- Dashboard link + bookmark heart in top bar
- First-visit onboarding toast

### 3.6 Tour Creation Progress ✅ SHIPPED
- Live-updating progress messages during 20-30 second generation:
  1. "Understanding your request..."
  2. "Found 5 amazing stops. Writing stories..."
  3. "Crafting story 2/5: Westminster Abbey..."
  4. "Almost ready — preparing your tour..."
- Inline spinner animation on progress messages
- First stop audio pre-generated before guide opens

### 3.7 Authentication & Persistence ✅ SHIPPED
- Supabase Auth (email/password)
- Tours auto-saved for authenticated users (full `generatedContent` JSONB preserved)
- **Tour resume**: Progress auto-saved on every stop change. Reopening a tour starts at last visited stop.
- Tour cards show "Continue · Stop 4/8" for in-progress tours
- Works without account (can't save tours or track progress)
- Row-Level Security on all user data

### 3.8 User Dashboard ✅ SHIPPED
- Protected route at `/dashboard`
- **History tab**: All past tours, most recent first. Favorited tours sort to top with star. Play button replays instantly.
- **Stats tab**: Tours taken, places visited, cities explored, listening time, current streak (consecutive days), most-explored interest, places-per-city breakdown.
- **Bookmarks tab**: Favorite tours (starred from history) + bookmarked places (hearted during tours). Bookmarked places have inline audio playback.
- **Suggestions tab**: Unexplored interest themes per visited city. "Try This Tour" pre-fills the chat with a prompt.

### 3.9 Personalization ✅ SHIPPED
- Time-of-day detection (morning/afternoon/evening/night)
- Travel style inference (first-time, repeat, local, explorer)
- Tone selection (casual, scholarly, dramatic, witty)
- `useUserPreferences` hook syncs preferences between localStorage and Supabase
- Per-tour interest tracking (stored on tour row for stats/suggestions)

### 3.10 Cost Optimization ✅ SHIPPED
- Content caching: 7-day TTL with memory + localStorage (ContentCache class)
- Rate limiting: Token bucket — 50 OpenAI/min, 30 ElevenLabs/min, 100 Supabase/min
- Usage tracking: Persists request counts and estimated costs to localStorage
- Lazy audio generation: ~80% ElevenLabs cost savings
- Curated content library: Eliminates GPT calls for covered places

---

## 4. Technical Architecture

### 4.1 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5 (build tool)
- TailwindCSS 3.4 with custom Edinburgh theme
- shadcn/ui (50+ Radix UI components)
- React Router v6
- React Query (@tanstack/react-query 5)
- Lovable (deployment platform)

**Backend:**
- Supabase (BaaS)
  - Edge Functions (Deno runtime) — 14 functions deployed
  - PostgreSQL with Row-Level Security
  - Authentication (email/password)

**AI Services:**
- Anthropic Claude Sonnet (content generation — Tier 1 + Tier 2)
- OpenAI GPT-5.2 (tour parsing, interactive Q&A)
- OpenAI GPT-4o (content generation Tier 3 fallback)
- OpenAI Whisper (speech-to-text)
- ElevenLabs TTS (primary voice `EST9Ui6982FZPSi7gCHi`)

### 4.2 Edge Functions

```
supabase/functions/
├── parse-tour-request/              # Chat → structured tour (GPT-5.2)
├── generate-tour-content/           # Curated stories + GPT-4o fallback
├── generate-audio/                  # ElevenLabs TTS
├── transcribe-audio/                # Whisper STT
├── interactive-guide-conversation/  # In-tour Q&A (GPT-5.2)
├── save-tour/                       # Persist tour + interests + city
├── get-tours/                       # Retrieve tours + favorite status
├── get-dashboard-stats/             # Computed stats from tours/places
├── toggle-bookmark/                 # Toggle place bookmarks / tour favorites
├── get-bookmarks/                   # Retrieve bookmarked places + favorite IDs
├── get-suggestions/                 # Unexplored themes per visited city
├── import-city-data/                # Content import with validation
├── get-place-facts/                 # Fact cache lookup
└── analyze-image/                   # GPT-5.2 Vision (not yet wired to UI)
```

### 4.3 Database Schema

**Core tables:**
| Table | Key Columns |
|-------|-------------|
| `tours` | id, user_id, title, description, interests (JSONB), created_at |
| `places` | id, tour_id, name, city, description, lat, lng, audio_narration, audio_url, generated_content (JSONB) |
| `tour_progress` | user_id, tour_id (UNIQUE pair), current_stop_index, updated_at |
| `user_preferences` | user_id (unique), interests (JSONB), preferred_voice_id, preferred_language |

**Dashboard tables:**
| Table | Key Columns |
|-------|-------------|
| `bookmarked_places` | user_id, place_id (FK), UNIQUE constraint |
| `favorited_tours` | user_id, tour_id (FK), UNIQUE constraint |

**Content library tables:**
| Table | Key Columns |
|-------|-------------|
| `cities` | slug, name, country |
| `city_places` | place_id, city_id, name, lat, lng, trigger_radius_m, category, neighborhood |
| `place_stories` | place_id, interests (array), tone, hook, directional_cue, audio_narration |
| `place_facts` | place_name, city, fact_category, hook, story, directional_cue |
| `city_secrets` | city, secret_type, content |
| `web_context_cache` | place_key (UNIQUE), context, source_count, expires_at (7-day TTL) |

**Current content:** 13 places (12 London + 1 Edinburgh), 50 curated stories (48 London + 2 Edinburgh)

### 4.4 Frontend Architecture

```
src/
├── pages/
│   ├── Index.tsx                    # Main orchestrator (home ↔ guide)
│   ├── HomePage.tsx                 # Hero + chat + saved tours
│   ├── Dashboard.tsx                # 4-tab dashboard (protected)
│   ├── Auth.tsx                     # Sign in / sign up
│   └── NotFound.tsx
├── components/
│   ├── InlineTourChat.tsx           # Chat interface, streaming progress, audio pre-gen
│   ├── EnhancedAudioGuide.tsx       # Tour player, audio prefetch, stop navigation
│   ├── MinimalAudioPlayer.tsx       # Content cards, play/pause, progress, navigation
│   ├── UnifiedQuestionInput.tsx     # Voice + text Q&A
│   ├── ProtectedRoute.tsx           # Auth guard
│   ├── ErrorBoundary.tsx
│   ├── dashboard/
│   │   ├── DashboardHistory.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── DashboardBookmarks.tsx
│   │   └── DashboardSuggestions.tsx
│   └── ui/                          # 50+ shadcn components
├── hooks/
│   ├── useTours.ts                  # Shared tour fetching (React Query)
│   ├── useBookmarks.ts              # Bookmark query + toggle mutation
│   ├── useDashboardStats.ts         # Stats query
│   ├── useSuggestions.ts            # Suggestions query
│   └── useUserPreferences.ts        # Preference sync (localStorage ↔ Supabase)
├── contexts/
│   └── AuthContext.tsx               # Auth provider (useAuth hook)
├── utils/
│   ├── enhancedContentGenerator.ts
│   ├── contentCache.ts              # 7-day TTL cache
│   └── rateLimiter.ts               # Token bucket + usage tracking
├── types/
│   └── tour.ts                      # TourPlan, Place, Interest, etc.
└── integrations/supabase/
    ├── client.ts
    └── types.ts
```

### 4.5 Hybrid Voice Architecture

```
User speaks question → OpenAI Whisper (STT) → GPT-5.2 (contextual answer)
  → ElevenLabs TTS → Audio plays to user
```

Why hybrid:
- **Quality**: Whisper optimized for understanding, ElevenLabs optimized for narration
- **Cost**: ~$0.083 per question (vs $0.30/min for OpenAI Realtime API)
- **Flexibility**: Can swap providers independently, support text input alongside voice

---

## 5. Cost Model

### Per Tour
| Component | Cost |
|-----------|------|
| GPT-5.2 parsing | ~$0.03-0.05 |
| Content generation (5 places) | $0 (curated) to ~$0.05 (GPT fallback) |
| ElevenLabs TTS (on play only) | ~$0.38 for 5 places |
| **Total per tour** | **~$0.10-0.43** |

### Per Interactive Question
| Component | Cost |
|-----------|------|
| Whisper transcription | ~$0.003 |
| GPT-5.2 response | ~$0.02 |
| ElevenLabs TTS | ~$0.06 |
| **Total per question** | **~$0.083** |

### Optimization Strategies (all shipped)
1. Lazy audio generation — only on play (~80% TTS savings)
2. Curated content library — eliminates GPT for covered places
3. Content caching — 7-day TTL reduces repeat API calls
4. Rate limiting — prevents abuse
5. Question limits — 10 per tour (free tier)

---

## 6. Design Principles

1. **Conversational First**: Chat is the primary interface, not forms
2. **Zero Friction**: No sign-up required to try. Start in <30 seconds
3. **Progressive Disclosure**: Show only what's needed. Advanced controls hidden until relevant
4. **Mobile-First**: Large tap targets, works while walking
5. **Trust Through Transparency**: Show tour preview, durations, clear errors

---

## 7. Roadmap

### Recently Shipped
| Feature | Date | Details |
|---------|------|---------|
| **Mapbox map integration** | Feb 19, 2026 | Live map with markers, route polyline, current stop highlight. Client-side geocoding via Mapbox Geocoding API. |
| **Progressive tour loading** | Feb 19, 2026 | First stop ready in ~15s, remaining stops stream in background (2 at a time). Pending stops shown with pulse animation. |
| **Storytelling content overhaul** | Feb 19, 2026 | Narrative arc structure (opening/story/punchline), story type classification (scandal, mystery, engineering, etc.), anti-hallucination guardrails, deeper content from model knowledge vs Wikipedia rehash. |
| **Desktop tour UI redesign** | Feb 19, 2026 | 50/50 split layout, 4-zone player hierarchy with sticky controls, story type badges. |
| **Q&A payload optimization** | Feb 19, 2026 | Trimmed interactive-guide-conversation payload, text-only fallback when audio fails. |
| **Audio cleanup on exit** | Feb 19, 2026 | Audio stops when exiting tour screen. |

### Next Up (planned, in priority order)
| Feature | Description |
|---------|-------------|
| **Personalization Engine (Tier 1)** | Persist tone + interests across tours via `user_preferences`. "More/Less like this" buttons on narrations. Story type preference tracking. See Personalization Roadmap below. |
| **Free Roam Mode** | Walk around with live location, see nearby landmarks on map, tap any to hear about it. Geolocation + POI database + per-tap content generation. |
| **Offline / PWA** | Service worker + audio pre-caching. Critical for travelers with spotty connectivity. |
| **More curated cities** | Paris, Rome, Barcelona, Tokyo. Tier 2 web+Claude handles uncurated cities, but curated stories are noticeably better. |

### Personalization Roadmap

**Tier 1: Preference Memory** (next up)
- Persist tone + interests across tours (read `user_preferences` during content generation)
- Track favorite story types (scandal, mystery, engineering, etc.) from engagement
- "More like this" / "Less like this" buttons on narrations → explicit signal
- 2nd tour feels noticeably different from the 1st

**Tier 2: Behavioral Learning** (future)
- Track listen-through rate per narration (finished? skipped at 15s?)
- Track which fun facts expanded, which questions asked
- Build implicit interest weights: "said history, but actually loves engineering"
- Adaptive narration length — some users want 30s, others want 90s
- This is where "it learns you" starts to feel real

**Tier 3: Contextual Adaptation** (future)
- Time-of-day affects energy level ("morning tour" vs "evening stroll" tone)
- Repeat visitor detection — "you've been to London before, skip the obvious"
- Cross-tour callbacks — "Remember that scandal at Buckingham Palace? The architect also designed this"
- Pace detection — rushing through stops → shorter narrations; lingering → offer deeper content

### Future
| Feature | Priority | Notes |
|---------|----------|-------|
| **Image recognition in UI** | Medium | `analyze-image` edge function exists but isn't wired into the main tour flow |
| **Streaming audio** | Medium | Currently base64 download. Streaming would reduce perceived latency |
| **Premium / payment tier** | Medium | PRD targets 20% free-to-premium conversion but no paywall exists |
| **GPS auto-play** | Low | Play audio when user physically arrives at a stop |
| **Multi-language** | Low | Currently English only |
| **Share tours** | Low | Send tour link to a friend |
| **Google Places API** | Low | Adds user review snippets for better lookCloserChallenge + obscure place coverage |

---

## 8. Success Metrics

### User Engagement
- % of users who complete tour generation: target >80%
- % of users who start audio tour: target >70%
- % of users who complete 3+ stops: target >50%
- % returning users (dashboard visits): target >30%

### AI Performance
- Tour generation success rate: target >95%
- Average response time: <5s initial, <3s follow-up
- Content quality: 0% generic filler phrases

### Cost Efficiency
- Average cost per tour: <$0.15 (with curated content)
- Cache hit rate for popular destinations: >60%

---

## Document Metadata

**Version:** 4.0
**Last Updated:** February 18, 2026
**Authors:** Udit Misra, Claude (AI Assistant)
**Status:** Living Document - Update as product evolves

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 30, 2025 | Initial PRD |
| 2.0 | Feb 14, 2026 | Updated to reflect: interactive voice Q&A (shipped), curated content library, UI redesign, user dashboard with history/stats/bookmarks/suggestions, all P0-P1 features delivered |
| 3.0 | Feb 16, 2026 | Tour experience overhaul: content cards (hook/directional cue/narration), audio pre-generation + prefetching, streaming generation progress, previous stop navigation, 48 curated London stories, editorial standards doc, question limit 5→10 |
| 4.0 | Feb 18, 2026 | 4-tier RAG pipeline (curated+Claude → curated verbatim → web+Claude → GPT → static), rich stop experience (fun facts, look-closer challenges, suggested questions, transitions), multi-source web grounding (Wikipedia + Wikivoyage + extended extract) with 7-day cache, tour persistence (full generatedContent JSONB saved, progress tracking with resume from last stop) |
