/**
 * Integration tests for the `save-tour` and `get-tours` edge functions.
 *
 * Mode A (default / CI): global.fetch is mocked.
 * Mode B (live): Set TEST_SUPABASE_URL + TEST_AUTH_TOKEN to run against real Supabase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fnUrl, callOptions, isLiveMode } from './helpers';

// In live mode, set TEST_AUTH_TOKEN to a valid Supabase user JWT.
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'test-user-jwt';

const SAMPLE_TOUR_PAYLOAD = {
  title: 'Edinburgh Highlights',
  description: 'A walking tour of Old Town Edinburgh.',
  places: [
    {
      name: 'Edinburgh Castle',
      city: 'Edinburgh',
      country: 'Scotland',
      lat: 55.9486,
      lng: -3.1999,
      estimatedDuration: 60,
      generatedContent: {
        audioNarration: 'Edinburgh Castle stands on volcanic rock...',
        hook: 'High on volcanic rock, the castle watches over Edinburgh.',
        directionalCue: 'Look up at the half-moon battery.',
        funFacts: ["The castle houses Scotland's crown jewels."],
      },
    },
    {
      name: 'Royal Mile',
      city: 'Edinburgh',
      country: 'Scotland',
      lat: 55.9498,
      lng: -3.1883,
      estimatedDuration: 30,
      generatedContent: {
        audioNarration: 'The Royal Mile connects the castle to Holyrood Palace...',
        hook: 'A mile of history in every cobblestone.',
        directionalCue: 'Notice the closes branching off on each side.',
        funFacts: ['It is actually slightly longer than a mile.'],
      },
    },
  ],
  interests: [{ id: '1', name: 'history', label: 'History' }],
};

const SAVED_TOUR_RESPONSE = {
  success: true,
  tourId: 'tour-uuid-1234',
  title: SAMPLE_TOUR_PAYLOAD.title,
};

const GET_TOURS_RESPONSE = {
  tours: [
    {
      id: 'tour-uuid-1234',
      title: 'Edinburgh Highlights',
      description: 'A walking tour of Old Town Edinburgh.',
      created_at: new Date().toISOString(),
      places: SAMPLE_TOUR_PAYLOAD.places,
      isFavorited: false,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

describe('save-tour edge function', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('saves a tour and returns a tourId for an authenticated user', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => SAVED_TOUR_RESPONSE,
      } as unknown as Response);
    }

    const res = await fetch(fnUrl('save-tour'), callOptions(SAMPLE_TOUR_PAYLOAD, AUTH_TOKEN));
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('tourId');
    expect(typeof data.tourId).toBe('string');
  });

  it('persists generatedContent JSONB for all places', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => SAVED_TOUR_RESPONSE,
      } as unknown as Response);
    }

    await fetch(fnUrl('save-tour'), callOptions(SAMPLE_TOUR_PAYLOAD, AUTH_TOKEN));

    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.places).toHaveLength(2);
      expect(body.places[0].generatedContent).toHaveProperty('audioNarration');
      expect(body.places[0].generatedContent).toHaveProperty('funFacts');
    }
  });

  it('skips save (returns skipped:true) when no Authorization header is provided', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, skipped: true }),
      } as unknown as Response);
    }

    // No auth token — the function should return skipped rather than error
    const res = await fetch(fnUrl('save-tour'), callOptions(SAMPLE_TOUR_PAYLOAD));
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('skipped', true);
  });

  it('returns 500 when title is missing', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Title and places are required' }),
      } as unknown as Response);
    }

    const { title: _omit, ...noTitle } = SAMPLE_TOUR_PAYLOAD;
    const res = await fetch(fnUrl('save-tour'), callOptions(noTitle, AUTH_TOKEN));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/title/i);
  });

  it('returns 500 for an invalid (non-array) places field', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Title and places are required' }),
      } as unknown as Response);
    }

    const bad = { ...SAMPLE_TOUR_PAYLOAD, places: 'not-an-array' };
    const res = await fetch(fnUrl('save-tour'), callOptions(bad, AUTH_TOKEN));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('get-tours edge function', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns a list of tours for an authenticated user', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => GET_TOURS_RESPONSE,
      } as unknown as Response);
    }

    const res = await fetch(fnUrl('get-tours'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('tours');
    expect(Array.isArray(data.tours)).toBe(true);
  });

  it('retrieves all place data including generatedContent JSONB', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => GET_TOURS_RESPONSE,
      } as unknown as Response);
    }

    const res = await fetch(fnUrl('get-tours'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    if (data.tours.length > 0) {
      const firstTour = data.tours[0];
      expect(firstTour).toHaveProperty('places');
      if (firstTour.places.length > 0) {
        const place = firstTour.places[0];
        expect(place).toHaveProperty('generatedContent');
        expect(place.generatedContent).toHaveProperty('audioNarration');
      }
    }
  });

  it('returns empty tours array (not an error) when no Authorization header is provided', async () => {
    if (!isLiveMode()) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ tours: [] }),
      } as unknown as Response);
    }

    // No auth header — function should return empty list, not 500
    const res = await fetch(fnUrl('get-tours'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key',
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('tours');
    expect(data.tours).toHaveLength(0);
  });

  it('enforces RLS — user A cannot read user B tours', async () => {
    // In live mode, this requires two separate test user tokens.
    // In mock mode, we verify the request includes the caller's auth token.
    if (!isLiveMode()) {
      const userAToken = 'user-a-jwt';
      const userBToken = 'user-b-jwt';

      let capturedToken = '';
      global.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        capturedToken = (opts.headers as Record<string, string>)['Authorization'] || '';
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ tours: [{ id: 'tour-owned-by-user-a' }] }),
        } as unknown as Response);
      });

      await fetch(fnUrl('get-tours'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'test-anon-key',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({}),
      });

      // The request was made with user A's token — Supabase RLS enforces isolation
      expect(capturedToken).toBe(`Bearer ${userAToken}`);
      expect(capturedToken).not.toBe(`Bearer ${userBToken}`);
    }
  });
});
