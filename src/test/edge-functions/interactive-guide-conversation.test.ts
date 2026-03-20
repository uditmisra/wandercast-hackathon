/**
 * Integration tests for the `interactive-guide-conversation` edge function.
 *
 * Mode A (default / CI): global.fetch is mocked.
 * Mode B (live): Set TEST_SUPABASE_URL to a running Supabase instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fnUrl, callOptions, isLiveMode } from './helpers';

const FUNCTION = 'interactive-guide-conversation';

const CURRENT_PLACE = {
  id: 'place-1',
  name: 'Edinburgh Castle',
  city: 'Edinburgh',
  country: 'Scotland',
  generatedContent: {
    audioNarration: 'Edinburgh Castle stands on volcanic rock...',
    hook: 'High on volcanic rock, the castle watches over Edinburgh.',
    directionalCue: 'Look up at the half-moon battery.',
    funFacts: ["The castle houses Scotland's crown jewels."],
  },
};

const TOUR_CONTEXT = {
  interests: [{ id: '1', name: 'history', label: 'History' }],
  personalization: { preferredTone: 'casual', travelStyle: 'first-time' },
};

function mockOk(responseText = "Great question! The crown jewels have been here since the 14th century.") {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ response: responseText, success: true }),
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

describe('interactive-guide-conversation edge function', () => {
  beforeEach(() => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns a response text for a valid question + currentPlace', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk("The castle is over 900 years old. Its foundations date to the 12th century.");
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({
        question: 'How old is the castle?',
        currentPlace: CURRENT_PLACE,
        tourContext: TOUR_CONTEXT,
      }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
    expect(data).toHaveProperty('success', true);
  });

  it('includes conversation history in the request when provided', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk("It was last besieged in 1745 by Bonnie Prince Charlie's forces.");
    }

    const history = [
      { role: 'user', content: 'Tell me about the castle battles.' },
      { role: 'assistant', content: 'The castle has been sieged 26 times!' },
    ];

    await fetch(
      fnUrl(FUNCTION),
      callOptions({
        question: 'Which was the last siege?',
        currentPlace: CURRENT_PLACE,
        tourContext: TOUR_CONTEXT,
        conversationHistory: history,
      }),
    );

    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.conversationHistory).toHaveLength(2);
      expect(body.conversationHistory[0].role).toBe('user');
    }
  });

  it('applies persona tone — scholarly tone request is passed in tourContext', async () => {
    const scholarlyContext = {
      ...TOUR_CONTEXT,
      personalization: { preferredTone: 'scholarly', travelStyle: 'deep-dive' },
    };

    if (!isLiveMode()) {
      global.fetch = mockOk("Fascinating — the castle's origins are documented in the chronicles of 1093.");
    }

    await fetch(
      fnUrl(FUNCTION),
      callOptions({
        question: 'What is the history of the castle?',
        currentPlace: CURRENT_PLACE,
        tourContext: scholarlyContext,
      }),
    );

    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.tourContext.personalization.preferredTone).toBe('scholarly');
    }
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns 500 when question is missing', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, {
        error: 'Missing required fields: question and currentPlace',
        success: false,
      });
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ currentPlace: CURRENT_PLACE, tourContext: TOUR_CONTEXT }),
    );
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('success', false);
  });

  it('returns 500 when currentPlace is missing', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, {
        error: 'Missing required fields: question and currentPlace',
        success: false,
      });
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ question: 'Tell me more', tourContext: TOUR_CONTEXT }),
    );
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });

  it('returns 500 when tourContext is null (invalid, not undefined)', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, {
        error: 'Invalid tour context',
        success: false,
      });
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({
        question: 'Tell me more',
        currentPlace: CURRENT_PLACE,
        tourContext: null,
      }),
    );
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data.error).toMatch(/tour context/i);
  });

  it('accepts tourContext as undefined (omitted from body) without error', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk("The castle has a rich history going back centuries.");
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ question: 'Tell me more', currentPlace: CURRENT_PLACE }),
    );

    // tourContext is optional — should succeed when omitted
    if (!isLiveMode()) {
      expect(res.ok).toBe(true);
    }
  });
});
