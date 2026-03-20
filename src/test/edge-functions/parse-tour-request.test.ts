/**
 * Integration tests for the `parse-tour-request` edge function.
 *
 * Mode A (default / CI): global.fetch is mocked.
 * Mode B (live): Set TEST_SUPABASE_URL to a running Supabase instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fnUrl, callOptions, isLiveMode } from './helpers';

const FUNCTION = 'parse-tour-request';

const LONDON_PLACES_RESPONSE = {
  places: [
    { name: 'Tower of London', city: 'London', country: 'England', lat: 51.5081, lng: -0.0759 },
    { name: 'London Eye', city: 'London', country: 'England', lat: 51.5033, lng: -0.1195 },
    { name: 'Buckingham Palace', city: 'London', country: 'England', lat: 51.5014, lng: -0.1419 },
  ],
  title: 'London Highlights Tour',
  description: 'A tour of iconic London landmarks.',
};

function mockOk(json: unknown = LONDON_PLACES_RESPONSE) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => json,
  } as unknown as Response);
}

function mockError(status: number, json: unknown) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => json,
  } as unknown as Response);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('parse-tour-request edge function', () => {
  beforeEach(() => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns a structured places array for a natural language request', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ message: 'Show me the highlights of London' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('places');
    expect(Array.isArray(data.places)).toBe(true);
    expect(data.places.length).toBeGreaterThan(0);
  });

  it('each returned place has required fields: name, city, lat, lng', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ message: 'I want a tour of London landmarks' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    for (const place of data.places) {
      expect(place).toHaveProperty('name');
      expect(place).toHaveProperty('city');
      expect(place).toHaveProperty('lat');
      expect(place).toHaveProperty('lng');
      expect(typeof place.lat).toBe('number');
      expect(typeof place.lng).toBe('number');
    }
  });

  it('sends the user message and conversation history in the request body', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }

    const history = [
      { role: 'user', content: 'I like history and architecture' },
      { role: 'assistant', content: 'Great! I can suggest some historical places.' },
    ];

    await fetch(
      fnUrl(FUNCTION),
      callOptions({ message: 'Show me London highlights', conversationHistory: history }),
    );

    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.message).toBe('Show me London highlights');
      expect(body.conversationHistory).toHaveLength(2);
    }
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('handles non-English city names (e.g., Tokyo)', async () => {
    const tokyoResponse = {
      places: [
        { name: 'Senso-ji Temple', city: 'Tokyo', country: 'Japan', lat: 35.7147, lng: 139.7966 },
        { name: 'Shibuya Crossing', city: 'Tokyo', country: 'Japan', lat: 35.6595, lng: 139.7004 },
      ],
      title: 'Tokyo Must-See Tour',
      description: 'Iconic spots in Tokyo.',
    };

    if (!isLiveMode()) {
      global.fetch = mockOk(tokyoResponse);
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ message: 'Give me a tour of Tokyo' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data.places.length).toBeGreaterThan(0);
    if (!isLiveMode()) {
      expect(data.places[0].city).toBe('Tokyo');
    }
  });

  it('handles a vague request gracefully (returns best-effort places)', async () => {
    const vagueResponse = {
      places: [
        { name: 'City Centre', city: 'London', country: 'England', lat: 51.5074, lng: -0.1278 },
      ],
      title: 'City Tour',
      description: 'A general city tour.',
    };

    if (!isLiveMode()) {
      global.fetch = mockOk(vagueResponse);
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ message: 'show me around' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('places');
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns 500 when no message is provided', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, { error: 'No message provided' });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({}));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });

  it('returns 500 when message is not a string', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, { error: 'No message provided' });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ message: 42 }));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });
});
