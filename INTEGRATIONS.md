# How Wandercast Uses ElevenLabs + Firecrawl

## The Problem

Most travel apps give you static text descriptions or pre-recorded audio tours. You can't ask questions. You can't go deeper. You can't say "wait, tell me more about that" or "what should I eat near here?" You're stuck with whatever someone wrote months ago.

We wanted to build something that feels like having a knowledgeable local friend walk you through a place — someone you can actually talk to.

## ElevenLabs Conversational AI — The Voice

ElevenLabs powers the entire conversation experience. We use their Conversational AI platform (ElevenAgents) to create a real-time, two-way voice agent that users can talk to naturally.

### How we use it

**Agent setup:**
- We created a single agent (`wandercast-tour-guide`) in the ElevenLabs dashboard
- Voice: `EST9Ui6982FZPSi7gCHi` — warm, natural, conversational
- Overrides enabled for system prompt and first message (so we can customize per place)
- Server-side tool configured to call our Firecrawl search endpoint

**Per-conversation flow:**
1. User picks a place (e.g., "Colosseum, Rome")
2. Our edge function builds a custom system prompt with the place's web context, guide personality, and conversation rules
3. Client connects to ElevenLabs via `Conversation.startSession()` from `@elevenlabs/client`, passing the agent ID + prompt overrides
4. The agent greets the user in character and the conversation begins
5. The agent can call our Firecrawl search tool mid-conversation for questions it can't answer from its initial context

**What makes it work well:**
- **Dynamic system prompts** — every conversation gets a fresh prompt loaded with real web data about that specific place. The agent isn't working from a generic knowledge base.
- **Guide personalities** — we have four guide characters (Max the casual guide, Dr. Eleanor the scholar, Marco the dramatic storyteller, Sophie the witty one). The personality shapes not just tone but how the agent thinks and responds.
- **Honest responses** — the prompt explicitly tells the agent to say "I don't know" rather than fabricate. If someone asks for "something creepy about the Eiffel Tower" and there isn't anything, the agent says so and pivots to something actually interesting.
- **Proactive conversation** — the agent doesn't just answer and wait. It offers follow-up angles, asks what the user wants to explore next, and drives the conversation forward.

**Key files:**
- `src/hooks/useVoiceAgent.ts` — session management, mic permissions, lifecycle
- `src/components/VoiceAgentPanel.tsx` — conversation UI with animated orb and live captions
- `supabase/functions/get-agent-signed-url/index.ts` — builds the per-place system prompt and guide personality

## Firecrawl Search — The Knowledge

Firecrawl is what makes the agent actually knowledgeable instead of just fluent. It provides two layers of intelligence:

### Layer 1: Pre-loaded context (before the conversation starts)

When a user picks a place, our `get-agent-signed-url` edge function calls Firecrawl Search:

```
POST https://api.firecrawl.dev/v1/search
{
  "query": "Colosseum Rome visitor guide history facts",
  "limit": 3,
  "scrapeOptions": { "formats": ["markdown"] }
}
```

Firecrawl returns structured markdown from the top 3 web results — the venue's official website, travel guides, local tourism boards. We extract:
- **Text content** — scraped and cleaned markdown, fed directly into the agent's system prompt as knowledge context
- **OG image** — used as a blurred backdrop behind the conversation UI

This context goes into the system prompt so the agent starts the conversation already knowing specific details — dates, prices, hours, historical facts, local tips — not just generic Wikipedia summaries.

### Layer 2: Live search tool (during the conversation)

We configured Firecrawl as a **server-side tool** on the ElevenLabs agent. When the user asks something the agent can't answer from its pre-loaded context (like "where should I eat nearby?" or "is there an event here this weekend?"), the agent calls our `firecrawl-search` edge function:

```
Agent → ElevenLabs tool call → firecrawl-search endpoint → Firecrawl API → results back to agent
```

The agent gets fresh web results mid-conversation and incorporates them into its response naturally. The user doesn't know a search happened — they just get a good answer.

**Key files:**
- `supabase/functions/firecrawl-search/index.ts` — standalone search endpoint, also serves as the agent's tool webhook
- `supabase/functions/get-agent-signed-url/index.ts` — calls Firecrawl for initial context + extracts OG image
- `supabase/functions/generate-tour-content/index.ts` — also uses Firecrawl as primary web source for the classic tour mode

### Why Firecrawl over raw web scraping

- **Clean markdown output** — no HTML parsing, no boilerplate extraction. The content is LLM-ready.
- **Search + scrape in one call** — we don't need to find URLs first then scrape them separately.
- **OG metadata** — we get structured metadata (title, description, og:image) alongside the content, which we use for the conversation UI backdrop.
- **Reliability** — consistent response format, handles JavaScript-rendered sites, built-in caching.

## The Integration Pattern

The two APIs complement each other perfectly:

```
Firecrawl: "Here's everything the web knows about this place"
     ↓
ElevenLabs: "Let me turn that into a natural voice conversation"
     ↓
User: "Tell me something wild about this place"
     ↓
ElevenLabs: [answers from pre-loaded context]
     ↓
User: "Where should I eat nearby?"
     ↓
ElevenLabs → Firecrawl: [live search] → "There's this great place called..."
```

Firecrawl provides the intelligence. ElevenLabs provides the voice. Together they create something that feels like talking to a real person who just happens to know everything about wherever you are.
