# Wandercast — Talk to Any Place on Earth

Pick any landmark, any city, anywhere — and have a real-time voice conversation with an AI guide who actually knows the place.

**Live demo:** [wandercast-hackathon.vercel.app](https://wandercast-hackathon.vercel.app)

Built for [ElevenLabs Hack #1: Firecrawl](https://hacks.elevenlabs.io/hackathons/0)

## How it works

1. **You pick a place** — type "Colosseum, Rome" or tap a suggestion
2. **Firecrawl Search** scrapes the web in real time — official sites, travel guides, local sources — and builds a rich knowledge base about that place
3. **ElevenLabs Conversational AI** turns that knowledge into a live voice agent you can actually talk to — ask questions, go on tangents, dig deeper
4. **You have a real conversation** — not a scripted tour, not a text chatbot. A voice that knows the place and can riff on anything you throw at it.

## What makes it different

- **Not pre-recorded.** Every conversation is generated live from real web data.
- **Not a search engine.** It's a voice you talk to. Ask follow-ups. Go off-script. It handles it.
- **Not generic.** Firecrawl pulls from the actual venue's website, recent reviews, local guides — not just Wikipedia.
- **Any place on Earth.** Colosseum, a street food stall in Bangkok, a castle in Scotland. If it's on the web, Wandercast can talk about it.

## Tech stack

| Layer | Technology |
|-------|-----------|
| **Voice agent** | [ElevenLabs Conversational AI](https://elevenlabs.io/docs/eleven-agents) — real-time two-way voice conversation |
| **Web knowledge** | [Firecrawl Search API](https://firecrawl.dev) — scrapes and structures web content for the agent |
| **Agent tools** | Firecrawl as a server-side tool — agent can search the web mid-conversation |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Mapbox GL (ambient globe) |
| **Backend** | Supabase Edge Functions (Deno runtime) |
| **Deployment** | Vercel |

## Architecture

```
User types a place
       |
       v
┌──────────────────────┐
│  ConversationPage    │  React SPA — globe map + place input
└──────────┬───────────┘
           |
           v
┌──────────────────────┐     ┌─────────────────┐
│  get-agent-signed-url│────>│  Firecrawl Search│  Scrapes web for place context
│  (Supabase Edge Fn)  │     └─────────────────┘
│                      │
│  Builds system prompt│  Guide personality + web knowledge + place data
│  Returns to client   │
└──────────┬───────────┘
           |
           v
┌──────────────────────┐     ┌─────────────────┐
│  ElevenLabs Agent    │────>│  firecrawl-search│  Mid-conversation web lookups
│  (Conversational AI) │     │  (agent tool)    │
│                      │     └─────────────────┘
│  Real-time voice     │
│  conversation        │
└──────────────────────┘
```

## Running locally

```bash
git clone https://github.com/uditmisra/wandercast-hackathon.git
cd wandercast-hackathon
npm install
cp .env.example .env.local  # Add your VITE_MAPBOX_TOKEN
npm run dev                  # http://localhost:8080
```

### Required secrets (Supabase Edge Functions)

```bash
FIRECRAWL_API_KEY=...       # firecrawl.dev
ELEVENLABS_API_KEY=...      # elevenlabs.io
ELEVENLABS_AGENT_ID=...     # Your Conversational AI agent ID
ANTHROPIC_API_KEY=...       # For the classic tour mode (/classic)
OPENAI_API_KEY=...          # For the classic tour mode (/classic)
```

## Project structure

```
src/
├── pages/
│   └── ConversationPage.tsx    # The two-screen UI (globe home + voice agent)
├── hooks/
│   └── useVoiceAgent.ts        # ElevenLabs Conversation session management
├── components/
│   ├── VoiceAgentPanel.tsx      # Conversation screen (orb, captions, backdrop)
│   └── VoiceAgentWrapper.tsx    # Lazy-load wrapper

supabase/functions/
├── get-agent-signed-url/       # Builds agent context with Firecrawl + guide personality
├── firecrawl-search/           # Standalone Firecrawl search (agent tool webhook)
└── generate-tour-content/      # Content pipeline (used by /classic mode)
```

## Cost per session

| Component | Cost |
|-----------|------|
| Firecrawl context search | ~$0.003 |
| ElevenLabs voice agent (~2 min) | ~$0.30 |
| Firecrawl mid-conversation searches | ~$0.006 |
| **Total** | **~$0.31** |

## License

MIT
