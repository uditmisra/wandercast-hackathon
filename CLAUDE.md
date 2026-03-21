# CLAUDE.md — Wandercast (Edinburgh Whispers Route)

You are a distinguished engineer who looks for elegant engineering solutions that never compromise the user experience. You prefer solving problems at their root causes, rather than applying bandaids. You prefer the best solution to the easiest one. You always write distinguished engineer level code and do the associated research necessary.

We are building an AI-powered audio tour guide. Users chat with AI to describe where they want to go, get instant personalized audio narration for each stop.

## Quick Start

```bash
npm install && npm run dev    # http://localhost:8080
npm run build                 # Production build
npm test                      # Run tests (vitest)
```

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite 5 (code-split), TailwindCSS, shadcn/ui, React Router v6, React Query v5, `@11labs/react` v0.2.0 (Conversational AI)
- **Backend**: Supabase (PostgreSQL + Edge Functions on Deno runtime + Auth)
- **AI**: Anthropic Claude Sonnet 4.6 (content gen Tier 1+2), Claude Sonnet 4.6 (tour parsing), GPT-5.2 (content Tier 3 fallback + Q&A), Whisper (STT), ElevenLabs TTS (voice `EST9Ui6982FZPSi7gCHi`), ElevenLabs Conversational AI (voice agent)
- **Web Search**: Firecrawl Search API (primary web context), Wikipedia/Wikivoyage (fallback)
- **Maps**: Mapbox Standard style (night preset), Mapbox Geocoding, Mapbox Directions API (walking)
- **Deployment**: Lovable (frontend), Supabase Cloud (backend)

## Local Development

This app was built on Lovable. To run locally:
1. `npm install`
2. Copy `.env.production` → `.env.local` (Vite dev mode ignores `.env.production`)
3. `npm run dev` → http://localhost:8080

## Project Structure

```
src/
├── pages/          Index.tsx (orchestrator), ChatHomePage, ExplorePage, BuildTourPage, Dashboard, AdminDashboard, Auth, SharedTourPage
├── components/     EnhancedAudioGuide, MinimalAudioPlayer, VoiceAgentPanel, VoiceAgentWrapper, map/HomeMapView, map/ExploreMapView, map/PoiBottomSheet, chat/*, dashboard/*, admin/*, auth/AuthWallModal, layout/*
├── hooks/          useTourChatEngine, useVoiceAgent, useTours, useBookmarks, useTourProgress, useDashboardStats, useSuggestions, useUserPreferences, useGeolocation, useStoryLibrary, useTourBuilder, useAdminData
├── contexts/       AuthContext (useAuth hook)
├── utils/          tourAssembly, collections, contentCache, rateLimiter
├── types/          tour.ts (TourPlan, Place, Interest), library.ts (CityPlaceWithStories, CityData)
└── integrations/   supabase/client.ts

supabase/
├── functions/      20 edge functions (see below)
└── migrations/     SQL migrations
```

## Edge Functions

| Function | Purpose | AI Model | Auth |
|----------|---------|----------|------|
| `parse-tour-request` | Chat → structured tour plan with places, interests, neighbourhood | Claude Sonnet 4.6 | No |
| `generate-tour-content` | 4-tier RAG pipeline — Firecrawl Search primary, Wikipedia fallback | Claude Sonnet 4.6 + GPT-5.2 | No |
| `firecrawl-search` | Standalone Firecrawl Search (also used as ElevenAgents tool webhook) | — | No |
| `get-agent-signed-url` | Builds per-place voice agent context (Firecrawl + guide personality), returns system prompt + first message | — | No |
| `generate-audio` | ElevenLabs TTS (voice EST9Ui6982FZPSi7gCHi) | — | No |
| `save-tour` | Persist tour + places + generated_content JSONB + interests | — | Yes |
| `get-tours` | User's tours with places + favorite status + progress | — | Yes |
| `get-dashboard-stats` | Stats: tours, places, cities, streak, top interest | — | Yes |
| `toggle-bookmark` | Toggle place bookmarks / tour favorites | — | Yes |
| `get-bookmarks` | Bookmarked places + favorited tour IDs | — | Yes |
| `get-suggestions` | Unexplored interest themes per visited city | — | Yes |
| `transcribe-audio` | Whisper STT for voice questions | Whisper | No |
| `interactive-guide-conversation` | In-tour Q&A (in-character) | GPT-5.2 | No |
| `import-city-data` | Bulk content import with validation | — | No |
| `get-place-facts` | Fact cache lookup | — | No |
| `analyze-image` | Vision analysis (not wired to UI) | GPT-5.2 Vision | No |
| `share-tour` | Generate 8-char share slug, mark tour public | — | Yes |
| `get-shared-tour` | Fetch public tour by slug (for SPA) | — | No |
| `shared-tour-og` | Dynamic OG meta tags for social previews + redirect to SPA | — | No |
| `admin-dashboard-data` | Admin dashboard: overview, costs, users, tours, content stats | — | Admin (email allowlist) |

Deploy: `supabase functions deploy <name> --no-verify-jwt`

## Database Schema

**Core**: `tours` (user_id, title, interests JSONB) → `places` (tour_id, name, city, neighbourhood, audio_narration, generated_content JSONB, lat/lng)
**Progress**: `tour_progress` (user_id + tour_id UNIQUE, current_stop_index)
**User**: `user_preferences` (user_id UNIQUE, interests, preferred_voice_id)
**Dashboard**: `bookmarked_places` (user_id, place_id), `favorited_tours` (user_id, tour_id)
**Content library**: `cities` → `city_places` (name, neighbourhood, lat, lng, must_see) → `place_stories` (curated narrations 400-700 chars)
**Fact cache**: `place_facts`, `city_secrets`
**Web cache**: `web_context_cache` (place_key UNIQUE, context, source_count, 7-day TTL)
**Content cache**: `generated_place_content` (place_name_normalized, city_normalized, tone → generated_content JSONB, source)
**Usage log**: `api_usage_log` (service, function_name, characters_used, estimated_cost_usd, status)

All tables have RLS. Users can only access their own data.

## Tour Creation Flows

There are multiple code paths that create tours. Understanding which ones use AI parsing vs curated content is critical:

| Flow | Trigger | File | Uses `parse-tour-request` | Uses `generate-tour-content` | GPS-aware |
|------|---------|------|---------------------------|------------------------------|-----------|
| Chat message | User types in chat | `ChatHomePage` → `useTourChatEngine` | Yes | Yes (per-place, with spatial context) | Yes (full) |
| "Explore near me" pill | Quick start tap | `ChatHomePage` | Yes | Yes | Yes (neighbourhood-level) |
| Map POI tap | Tap native Mapbox POI | `ChatHomePage` → `buildPoiTour` | No | Yes (single place) | Partial (city) |
| Curated place play | Explore page "Play" | `ExplorePage` → `buildSingleStopTour` | No | No (has curated stories) | No |
| Collection play | "Play collection" | `ExplorePage` → `assembleCollectionTour` | No | No (has curated stories) | No |
| Build tour | Manual multi-select | `BuildTourPage` → `useTourBuilder` | No | No (has curated stories) | No |
| Create CTA | Floating button | `CreateTourCTA` → `useTourChatEngine` | Yes | Yes | Yes (full) |
| Enrichment | Background after tour created | `Index.tsx` → `enrichTourInPlace` | No | Yes (no spatial context) | No |

## Critical Patterns

### location.state Navigation
Cross-page communication uses React Router state, NOT URL params:
```typescript
// Dashboard → play tour
navigate('/', { state: { playTour: tour } })
// Suggestions → prefill chat
navigate('/', { state: { prefillPrompt: "Create a food tour of London" } })
// Index.tsx reads and clears: window.history.replaceState({}, document.title)
```

### Prefill Guard
`useTourChatEngine` uses `useRef` to auto-send prefillPrompt exactly once on mount.

### Content Pipeline (4-tier RAG with validation)

Each tier validates content relevance before accepting — `contentMatchesPlace()` checks that the narration contains distinctive tokens from the place name. If validation fails, the tier throws and falls through to the next. Bad cache entries are auto-purged.

1. **Step 0**: Check `generated_place_content` cache (keyed on normalized place+city+tone). Validates before reuse; deletes mismatches.
2. **Tier 1**: Curated stories + Claude Sonnet 4.6 (personalized narration, fun facts, challenges)
3. **Tier 1.5**: Curated story verbatim (if Claude fails)
4. **Tier 2**: Multi-source web context + Claude. **Firecrawl Search** is the primary source (richer, real-time). Wikipedia + Wikivoyage is the fallback if Firecrawl fails or returns 0 results. Web context validated before feeding to LLM. Cached 7 days.
5. **Tier 3**: GPT-5.2 fallback (uses `max_completion_tokens`, not `max_tokens`)
6. **Tier 4**: Static template text (generic, uses place.name)

Curated story matching (3-step, NO fuzzy Jaccard):
1. **Exact**: Normalized name match within same city
2. **Containment**: Substring match within same city
3. **Claude Haiku verification**: For ambiguous candidates, calls Claude Haiku to confirm match
City is a HARD requirement — no city = skip curated entirely, go to Tier 2.

Content validation (`contentMatchesPlace`):
- Full place name verbatim check (fast path)
- Token extraction with basic English stemming (studios↔studio, gardens↔garden, churches↔church, galleries↔gallery)
- 50% threshold: `Math.max(1, Math.ceil(tokens.length * 0.5))` — for 2 tokens need 1, for 3 need 2
- Applied at EVERY tier including Tier 1.5 curated verbatim and web context cache hits
- Bad cache entries auto-purged when validation fails

Content caching: `generated_place_content` table caches LLM output keyed on `place_name_normalized|city_normalized|tone`. Only caches content that passes relevance validation.

### Voice Agent (ElevenLabs Conversational AI) — Hackathon Addition

Real-time two-way voice conversation with the tour guide, powered by ElevenLabs Conversational AI + Firecrawl Search.

**Architecture**: Client-side `@11labs/react` `useConversation` hook connects directly to ElevenLabs agent. System prompt + first message are built server-side via `get-agent-signed-url` edge function, which fetches fresh Firecrawl context about the current place and injects guide personality.

**Agent**: `agent_4501km70w8mgff4sx96kj5bd83pv` (created in ElevenLabs dashboard)
- Voice: `EST9Ui6982FZPSi7gCHi` (same as TTS narration)
- Server-side tool: `search_web` → `firecrawl-search` edge function (for mid-conversation web lookups)

**Flow**:
1. User taps "Talk to Guide" pill in `MinimalAudioPlayer`
2. `EnhancedAudioGuide` sets `showVoiceAgent=true` → lazy-loads `VoiceAgentWrapper`
3. `VoiceAgentWrapper` mounts → `useVoiceAgent.startConversation()`:
   a. Request microphone permission
   b. Call `get-agent-signed-url` edge function (fetches Firecrawl context, builds system prompt with guide personality + place knowledge + web context, returns prompt + first message + guide name)
   c. Call `conversation.startSession({ agentId, overrides: { agent: { prompt, firstMessage } } })`
4. Agent greets user in character (Max/Dr. Eleanor/Marco/Sophie based on tone)
5. `VoiceAgentPanel` renders full-screen overlay with animated orb (driven by audio frequency data)
6. Narration audio is paused while voice agent is active
7. User taps "End conversation" → `endSession()` → panel dismisses

**Key files**:
- `src/hooks/useVoiceAgent.ts` — wraps `useConversation`, manages mic + edge function call + error states
- `src/components/VoiceAgentPanel.tsx` — full-screen dark overlay with animated orb, status, end button
- `src/components/VoiceAgentWrapper.tsx` — lazy-load wrapper (isolates `@11labs/react` SDK from main player bundle)
- `supabase/functions/get-agent-signed-url/index.ts` — builds per-place agent context with Firecrawl + guide personality
- `supabase/functions/firecrawl-search/index.ts` — standalone Firecrawl search (also agent tool webhook)

**Guide personalities** (reused from `interactive-guide-conversation`):
- casual → Max: warm, conversational, like a smart friend
- scholarly → Dr. Eleanor: deeply knowledgeable, rich specific detail
- dramatic → Marco: atmospheric, cinematic, sensory
- witty → Sophie: sharp, dry, playful, finds absurdity

### Neighbourhood-Level "Near Me" Tours

When the user taps "Explore near me" or sends a location-based request:

1. `useGeolocation` resolves **city**, **country**, and **neighbourhood** via single Mapbox reverse geocode (`types=neighborhood,locality,place,country`)
2. Chat prompt uses neighbourhood: "Show me what's within walking distance in St John's Wood"
3. `parse-tour-request` edge function uses GPS to find nearest curated places, identifies primary neighbourhood
4. Parser constrains LLM output: all stops must be within walking radius (~2km), in or adjacent to primary neighbourhood
5. Parser outputs both `city` (for content matching/Wikipedia) and `neighbourhood` (for storytelling context)
6. `useTourChatEngine` reorders stops by nearest-neighbour proximity, gets walking distances from Mapbox Directions API
7. `generate-tour-content` uses `buildLocationLine()` to include neighbourhood in prompts for disambiguation

### Walking Distance & Route Optimization

1. All places geocoded via Mapbox Geocoding API
2. Reordered by nearest-neighbour starting from user's GPS position (`sortByProximity`)
3. **Mapbox Directions API** (`/directions/v5/mapbox/walking/`) called with all waypoints for accurate leg-by-leg walking distance (meters) and duration (minutes)
4. Falls back to haversine × 1.4 urban routing factor if Directions API fails
5. Spatial context (distance, direction, walking minutes to next stop) passed to content generator for contextual transitions

### Map (Mapbox)

- **Style**: `dark-v11` with POI dots layer for tourist categories
- **Initial center**: User GPS (if available) > nearest curated city > world view (`[0, 20]`, zoom 2). **No London fallback bias.**
- **GPS flyTo**: Fires on every `userLocation` change (deduped by coords via `prevUserLocationRef`). No one-shot guard — always centers on user.
- **Native POI interaction**: Click handler on `poi-label` + `discovered-poi-dots` layers — tap any POI to generate AI story on the fly
- **Curated markers**: Custom DOM overlays with glow effect, flexbox-centered (prevents pin-sliding on hover/scale)
- **POI dots**: Amber `rgba(255,183,77,0.25)` fill, `rgba(255,183,77,0.7)` stroke, filtered to tourist classes
- **Legend**: Always visible (no auto-collapse)

### Auth (Google OAuth + Email/Password)

- **Google OAuth**: `signInWithGoogle()` in `AuthContext` uses `supabase.auth.signInWithOAuth({ provider: 'google' })`. Button present on both `Auth.tsx` (standalone page) and `AuthWallModal` (inline overlay). Requires Google provider enabled in Supabase Dashboard with OAuth client ID/secret from Google Cloud Console.
- **Email/password**: Standard `signUp` / `signIn` via Supabase Auth.
- **Redirect**: Google OAuth redirects to `${window.location.origin}/` after auth. Auth page redirects to `/` on success.

### Auth Wall (First-Stop-Free PLG Model)

Anonymous users experience the full "aha moment" before hitting a sign-up wall:

- **Free**: Chat with AI, see tour plan, browse library, hear **first stop** audio
- **Gated (stop 2+)**: `EnhancedAudioGuide` intercepts `handleNext`/`handlePrevious`/`goToStop` with `requireAuth()`. Shows inline `AuthWallModal` overlay (not a redirect — tour state preserved)
- **Gated (second tour)**: `Index.tsx` tracks anonymous tours in localStorage (`wandercast_anon_usage`). On second `handlePlayTour` call without auth → shows `AuthWallModal` with `tour-gate` variant
- **On auth success**: Modal dismisses, tour resumes at pending stop / pending tour plays. Usage tracking cleared.
- **save-tour**: Silently skips for anonymous users (`{ success: true, skipped: true }`)
- **Dashboard/Profile/Admin**: Require auth via `ProtectedRoute` / `AdminRoute`
- **Bookmarks/favorites**: Require auth (hooks use `enabled: !!user`)

### Admin Dashboard

Private dashboard at `/admin` with 3-layer security:
1. **Frontend**: `AdminRoute` checks `isAdmin(user.email)` from `src/lib/adminEmails.ts`
2. **Backend**: `admin-dashboard-data` edge function verifies JWT + email against server-side allowlist
3. **DB**: Uses `service_role` key to bypass RLS

5 tabs: Overview (stats + charts), API & Costs, Users, Tours, Content Library. Single parameterized edge function with `section` parameter. React Query hooks in `useAdminData.ts`.

### Tour Sharing + OG Tags

- **Share flow**: `EnhancedAudioGuide` share button → `share-tour` edge function (generates 8-char slug, marks tour public) → share URL
- **Share URL**: Points to `shared-tour-og` edge function (`https://hdzfffutbzpevblbpgjc.supabase.co/functions/v1/shared-tour-og?slug=xxx`), NOT directly to SPA
- **OG function**: Fetches tour title/description/places from DB, serves HTML with tour-specific OG tags (`og:title`, `og:description`, Twitter card), then redirects browsers to SPA route (`/tour/:slug`) via `<meta http-equiv="refresh">`
- **Why**: SPA client-side `<head>` tags are invisible to social bots (Facebook, Twitter, Slack, iMessage). The edge function serves pre-rendered OG HTML that bots can read.
- **SPA route**: `/tour/:slug` → `SharedTourPage` fetches tour via `get-shared-tour`, renders `TourItinerary` + `EnhancedAudioGuide`

### React Query Cache Keys
- `['tours', userId]` — invalidated on bookmark toggle
- `['bookmarks', userId]` — invalidated on toggle
- `['dashboard-stats', userId]` — 10min stale time
- `['suggestions', userId]` — 10min stale time

## Analytics (PostHog)

Initialised in `App.tsx` with `person_profiles: "identified_only"`. All custom events fire via `src/utils/analytics.ts` — typed, fire-and-forget, safe when PostHog isn't loaded.

### Identity

| Event | Where | Trigger |
|-------|-------|---------|
| `posthog.identify(userId, { email })` | `AuthContext` | Auth state change → signed in |
| `posthog.reset()` | `AuthContext` | Signed out |
| `$pageview` | `App.tsx` PostHogPageviewTracker | Every React Router path change |

### Conversion Funnel

| Event | Properties | Where | Funnel Stage |
|-------|------------|-------|--------------|
| `chat_message_sent` | `isFirstMessage`, `hasLocation` | `ChatHomePage` | Activation |
| `quick_start_tapped` | `text`, `hasLocation` | `ChatHomePage` | Activation |
| `poi_tapped` | `poiName`, `type` (curated/native) | `ChatHomePage` | Activation |
| `tour_created` | `title`, `city`, `stopCount`, `source` (chat/quick-start/poi/library-pin/suggestion) | `useTourChatEngine`, `ChatHomePage` | Activation |
| `tour_started` | `tourId`, `title`, `stopCount`, `isResume` | `EnhancedAudioGuide` (mount) | Engagement |
| `stop_viewed` | `tourId`, `stopIndex`, `totalStops`, `stopName`, `method` (next/previous/direct) | `EnhancedAudioGuide` | Engagement |
| `audio_played` | `tourId`, `stopIndex`, `stopName` | `EnhancedAudioGuide` | Engagement |
| `audio_paused` | `tourId`, `stopIndex`, `currentTime`, `duration` | `EnhancedAudioGuide` | Engagement |
| `audio_completed` | `tourId`, `stopIndex`, `stopName` | `EnhancedAudioGuide` | Engagement |
| `audio_error` | `tourId`, `stopIndex`, `errorCode` | `EnhancedAudioGuide` | Error |
| `tour_completed` | `tourId`, `title`, `stopCount` | `EnhancedAudioGuide` (last audio ends) | Retention |
| `question_asked` | `tourId`, `stopIndex`, `remainingQuestions` | `EnhancedAudioGuide` | Depth |
| `story_feedback` | `storyType`, `direction` (more/less) | `EnhancedAudioGuide` | Personalization |
| `auth_wall_shown` | `variant` (stop-gate/tour-gate), `stopIndex?` | `AuthWallModal` (mount) | Conversion |
| `auth_wall_converted` | `variant`, `method` (email/google) | `AuthWallModal` | Conversion |
| `auth_wall_dismissed` | `variant` | `AuthWallModal` (Back) | Drop-off |
| `onboarding_completed` | — | `OnboardingFlow` | Activation |
| `preferences_set` | `tone`, `interestCount`, `source` (onboarding/post-auth/settings) | `PreferencesStep`, `PostAuthPreferences` | Personalization |
| `preferences_skipped` | `source` | `PostAuthPreferences` | Drop-off |
| `tour_saved` | `tourId`, `title`, `stopCount`, `trigger` (auto/post-auth) | `Index.tsx` | Retention |
| `tour_shared` | `tourId`, `method` (native-share/clipboard) | `EnhancedAudioGuide` | Virality |
| `bookmark_toggled` | `type` (place/tour), `targetId`, `bookmarked` | `EnhancedAudioGuide` | Retention |

### Key Funnels to Build in PostHog

1. **Activation**: `$pageview` → `chat_message_sent` → `tour_created` → `tour_started` → `audio_played`
2. **Auth conversion**: `auth_wall_shown` → `auth_wall_converted` (filter by variant)
3. **Stop drop-off**: `stop_viewed` by `stopIndex` — shows where users disengage
4. **Retention**: `tour_completed` → `tour_created` (repeat usage)

## Database Schema (Full)

### Core Tables

**`tours`**: `id` (uuid PK), `user_id` (uuid FK auth.users), `title`, `description`, `interests` (jsonb), `is_public` (bool), `share_slug` (text unique), `created_at`
**`places`**: `id` (uuid PK), `tour_id` (uuid FK tours), `name`, `description`, `city`, `country`, `neighbourhood`, `latitude`, `longitude`, `audio_url`, `audio_narration`, `overview`, `generated_content` (jsonb), `created_at`

### User Tables

**`user_preferences`**: `id` (uuid PK), `user_id` (uuid unique FK auth.users), `interests` (jsonb), `preferred_tone`, `preferred_voice_id`, `preferred_language`, `favorite_story_types` (jsonb), `created_at`, `updated_at`
**`tour_progress`**: `id` (uuid PK), `user_id` (uuid FK), `tour_id` (uuid FK), `current_stop_index` (int), `updated_at` — UNIQUE(user_id, tour_id)
**`bookmarked_places`**: `id` (uuid PK), `user_id` (uuid FK), `place_id` (uuid FK), `created_at` — UNIQUE(user_id, place_id)
**`favorited_tours`**: `id` (uuid PK), `user_id` (uuid FK), `tour_id` (uuid FK), `created_at` — UNIQUE(user_id, tour_id)
**`user_achievements`**: `id` (uuid PK), `user_id` (uuid FK), `achievement_type`, `details` (jsonb), `earned_at`

### Content Library

**`cities`**: `id` (uuid PK), `name`, `country`, `description`, `image_url`, `latitude`, `longitude`, `created_at`
**`city_places`**: `id` (uuid PK), `city_id` (uuid FK), `name`, `description`, `neighbourhood`, `latitude`, `longitude`, `must_see` (bool), `image_url`, `categories` (jsonb), `created_at`
**`place_stories`**: `id` (uuid PK), `city_place_id` (uuid FK), `story_type`, `tone`, `narration_text` (400-700 chars), `fun_facts` (jsonb), `suggested_questions` (jsonb), `created_at`
**`city_highlights`**: `id` (uuid PK), `city_id` (uuid FK), `title`, `description`, `image_url`, `created_at`

### Caches

**`web_context_cache`**: `id` (uuid PK), `place_key` (text unique — `lowercase(name)|lowercase(city)`), `context`, `source_count` (int), `sources` (jsonb), `created_at` — 7-day TTL
**`generated_place_content`**: `id` (uuid PK), `place_name_normalized`, `city_normalized`, `tone`, `generated_content` (jsonb), `source`, `created_at` — validated on read, auto-purged on mismatch
**`audio_cache`**: `id` (uuid PK), `cache_key` (text unique — SHA-256 of `text|voiceId`), `storage_path`, `file_size`, `created_at`
**`place_facts`**: `id` (uuid PK), `place_name`, `city`, `facts` (jsonb), `created_at`
**`city_secrets`**: `id` (uuid PK), `city`, `secrets` (jsonb), `created_at`

### Monitoring

**`api_usage_log`**: `id` (uuid PK), `service` (openai/anthropic/elevenlabs), `function_name`, `model`, `input_tokens`, `output_tokens`, `characters_used`, `estimated_cost_usd`, `status`, `error_message`, `metadata` (jsonb), `created_at`
**`api_usage_summary`**: (VIEW) Aggregates `api_usage_log` by service, function, model — total calls, tokens, characters, cost

### Other

**`tour_history`**: `id` (uuid PK), `user_id`, `tour_id`, `action`, `created_at`
**`favorites`**: `id` (uuid PK), `user_id`, `item_type`, `item_id`, `created_at`

### RLS Summary

All user tables: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE. Cache tables and content library: SELECT for `anon`, admin mutations via `service_role`. `api_usage_log`: INSERT for `anon` (edge functions log usage), SELECT/UPDATE restricted to `service_role`.

## Deployment

```bash
# Frontend (auto-deploys via Lovable on push)
npm run build

# Edge functions
supabase functions deploy <name> --no-verify-jwt

# Database migrations
supabase db push

# Required secrets (see "Required Secrets" section below)
```

## Supabase Project

- URL: `https://hdzfffutbzpevblbpgjc.supabase.co`
- Anon key is in `src/integrations/supabase/client.ts`

## Voice Settings

- Primary voice: `EST9Ui6982FZPSi7gCHi`
- Backup female: `56bWURjYFHyYyVf490Dp`, Third: `lcMyyd2HUfFzxdCaC4Ta`
- Primary male: `L0Dsvb3SLTyegXwtm47J` (Archer), Backup male: `MFZUKuGQUsGJPQjTS4wC`
- Model: `eleven_turbo_v2_5`
- Stability: 0.35, Similarity: 0.80, Style: 0.70

## Cost Per Tour

- Claude parsing: ~$0.003
- Content gen (5 places): $0 curated, ~$0.015 Claude Tier 2, ~$0.025 GPT fallback
- TTS (on play only): ~$0.38 for 5 places
- Per question: ~$0.083

### Tour Progress
- `useTourProgress` hook upserts to `tour_progress` via direct Supabase client (RLS, no edge function)
- Progress saved on every stop change (next, previous, goToStop)
- `get-tours` merges progress into tour objects (`currentStopIndex`)
- `EnhancedAudioGuide` accepts `initialStopIndex` prop for resume

## Required Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ELEVENLABS_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set FIRECRAWL_API_KEY=fc-...        # Firecrawl Search (hackathon code: ELEVENHACKS for 10k credits)
supabase secrets set ELEVENLABS_AGENT_ID=agent_...   # ElevenLabs Conversational AI agent ID
```

## Gotchas

- `get-tours` uses separate queries for tours, favorites, and progress (PostgREST join was unreliable)
- Place IDs are client-generated timestamps (`place-{Date.now()}-{index}`) until saved to DB
- Audio cached server-side in Supabase Storage (keyed by SHA-256 of `text|voiceId`). `audio_cache` table maps cache keys to storage paths. Cache hits return a public URL (no ElevenLabs call). Client caches URLs on place objects (`_cachedAudioUrl`) to avoid re-calling the edge function. All stops prefetched on tour creation and on guide mount.
- Rate limiting is client-side only (token bucket in localStorage)
- 10 questions per tour limit is component state, not persisted
- Interests stored as both strings and objects — `useTours` transform handles both
- `generated_content` JSONB on places: new tours save full content; old tours fall back to `overview`/`audio_narration` columns
- `web_context_cache` uses `lowercase(placeName)|lowercase(city)` as key
- `generated_place_content` cache validated on read — stale/wrong entries auto-purged by `contentMatchesPlace()`
- GPT-5.2 uses `max_completion_tokens` (not `max_tokens` — API breaking change from GPT-4o)
- Supabase Deno client `.upsert()` returns a thenable, not a Promise — use `async/await` with `try/catch`, never `.catch()`
- `city` field = city name (for Wikipedia lookups, curated matching). `neighbourhood` field = local area (for prompt context, storytelling). Parser enforces this split.
- Map pin markers use flexbox centering (not absolute + translate) to prevent sliding on hover/scale transforms
- Mapbox reverse geocode uses `types=neighborhood,locality,place,country` in a single call for city, country, and neighbourhood
- Full geo context (city/country/neighbourhood) propagated through POI flow (`buildPoiTour` + `handleGeneratePoiStory`) and chat flow (`useTourChatEngine` → `parse-tour-request`)
- `parse-tour-request` uses reverse-geocoded city/country for non-curated cities (e.g. Gurgaon) instead of relying on LLM to infer from raw coordinates
- Auth wall is an inline overlay (`AuthWallModal`), NOT a page redirect — tour state is preserved in memory during sign-up
- Anonymous usage tracked in localStorage key `wandercast_anon_usage` (`{ toursPlayed: number }`). Cleared on sign-up via `clearAnonUsage()`
- **Code splitting**: Route-level `React.lazy()` for Auth, Dashboard, Profile, Admin, Upgrade, SharedTour, NotFound, Explore, BuildTour. Vendor chunks: `vendor-mapbox` (mapbox-gl), `vendor-charts` (recharts), `vendor-analytics` (posthog-js). Core bundle ~530KB, down from 3MB monolith. Index + ChatHomePage are eager (critical path).
- Admin email allowlist exists in TWO places: `src/lib/adminEmails.ts` (frontend) and `admin-dashboard-data/index.ts` (edge function). Both must be updated together.
- Map `HomeMapView` starts at world zoom (2) when no GPS and no curated city. The `flyTo` effect fires when GPS resolves — no hardcoded London coordinates anywhere
