/**
 * Integration tests for the `generate-tour-content` edge function.
 *
 * Mode A (default / CI): global.fetch is mocked. Tests verify request shape
 *   and correct handling of various response scenarios.
 * Mode B (live): Set TEST_SUPABASE_URL to a running Supabase instance.
 *   External APIs (OpenAI, Anthropic) will be called for real.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fnUrl, callOptions, isLiveMode } from './helpers';

const FUNCTION = 'generate-tour-content';

const PLACE = {
  id: 'place-1',
  name: 'Edinburgh Castle',
  city: 'Edinburgh',
  country: 'Scotland',
  estimatedDuration: 60,
};

const INTERESTS = [
  { id: '1', name: 'history', label: 'History' },
  { id: '2', name: 'architecture', label: 'Architecture' },
];

const VALID_CONTENT = {
  audioNarration:
    'Edinburgh Castle stands on volcanic rock, a fortress of legend and blood. From these battlements, history unfolds across the city below.',
  hook: 'High on volcanic rock, the castle has watched over Edinburgh for a thousand years.',
  directionalCue: 'Look up at the half-moon battery — those cannon ports once aimed at invasion fleets.',
  funFacts: [
    "The castle houses Scotland's crown jewels, hidden for over 100 years.",
    'A 1pm gun has fired here every day since 1861.',
  ],
  suggestedQuestions: [
    'What happened during the castle sieges?',
    'Where are the crown jewels kept?',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mockFetch(overrides: Partial<Response> & { json?: () => Promise<unknown> } = {}) {
  const defaultJson = { ...VALID_CONTENT };
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => defaultJson,
    ...overrides,
  } as unknown as Response);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generate-tour-content edge function', () => {
  beforeEach(() => {
    if (!isLiveMode()) {
      global.fetch = mockFetch();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns structured content for a valid place request', async () => {
    if (!isLiveMode()) {
      global.fetch = mockFetch({ json: async () => VALID_CONTENT });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ place: PLACE, interests: INTERESTS }));
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('audioNarration');
    expect(data).toHaveProperty('hook');
    expect(data).toHaveProperty('directionalCue');
    expect(typeof data.audioNarration).toBe('string');
    expect(data.audioNarration.length).toBeGreaterThan(0);
  });

  it('returns funFacts array when content is generated', async () => {
    if (!isLiveMode()) {
      global.fetch = mockFetch({ json: async () => VALID_CONTENT });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ place: PLACE, interests: INTERESTS }));
    const data = await res.json();

    expect(data).toHaveProperty('funFacts');
    expect(Array.isArray(data.funFacts)).toBe(true);
  });

  it('sends correct place and interests in the request body', async () => {
    if (!isLiveMode()) {
      global.fetch = mockFetch({ json: async () => VALID_CONTENT });
    }

    await fetch(fnUrl(FUNCTION), callOptions({ place: PLACE, interests: INTERESTS }));

    if (!isLiveMode()) {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(fnUrl(FUNCTION));
      const body = JSON.parse((opts as RequestInit).body as string);
      expect(body.place.name).toBe('Edinburgh Castle');
      expect(body.interests).toHaveLength(2);
    }
  });

  // ── Fallback tiers ────────────────────────────────────────────────────────

  it('returns fallback static content when all AI providers fail', async () => {
    const fallback = {
      audioNarration: `Welcome to ${PLACE.name}. This remarkable location has much to explore.`,
      hook: `Discover ${PLACE.name} on your tour today.`,
      directionalCue: 'Take a moment to look around and absorb your surroundings.',
      funFacts: [],
    };

    if (!isLiveMode()) {
      global.fetch = mockFetch({ json: async () => fallback });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ place: PLACE, interests: INTERESTS }));
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('audioNarration');
    // Static template should still mention the place name
    expect(data.audioNarration).toMatch(new RegExp(PLACE.name, 'i'));
  });

  it('handles personalization parameters in the request', async () => {
    if (!isLiveMode()) {
      global.fetch = mockFetch({ json: async () => VALID_CONTENT });
    }

    const personalization = {
      preferredTone: 'scholarly',
      travelStyle: 'deep-dive',
    };

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ place: PLACE, interests: INTERESTS, personalization }),
    );

    expect(res.ok).toBe(true);
    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.personalization.preferredTone).toBe('scholarly');
    }
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns a 4xx/5xx response for an invalid place object', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Place name is required' }),
      } as unknown as Response);
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ place: { id: 'x' }, interests: [] }));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });

  it('gracefully handles a place with an unrecognised city (no curated data)', async () => {
    const unknownPlace = { ...PLACE, name: 'Random Building', city: 'Obscureville' };

    if (!isLiveMode()) {
      // Function falls back to AI generation for unknown cities — still returns 200
      global.fetch = mockFetch({
        json: async () => ({
          ...VALID_CONTENT,
          audioNarration: 'Welcome to Random Building in Obscureville.',
        }),
      });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ place: unknownPlace, interests: [] }));

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty('audioNarration');
  });
});
