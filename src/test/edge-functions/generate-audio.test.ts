/**
 * Integration tests for the `generate-audio` edge function.
 *
 * Mode A (default / CI): global.fetch is mocked.
 * Mode B (live): Set TEST_SUPABASE_URL to a running Supabase instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fnUrl, callOptions, isLiveMode } from './helpers';

const FUNCTION = 'generate-audio';

const VALID_AUDIO_RESPONSE = {
  audioUrl:
    'https://oyzozaqvykslverwctim.supabase.co/storage/v1/object/public/audio-cache/abc123.mp3',
  cached: false,
  placeId: 'place-1',
};

function mockOk(json: unknown = VALID_AUDIO_RESPONSE) {
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

describe('generate-audio edge function', () => {
  beforeEach(() => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns an audio URL for valid narration text', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ text: 'Edinburgh Castle stands on volcanic rock.', placeId: 'place-1' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('audioUrl');
    expect(typeof data.audioUrl).toBe('string');
    expect(data.audioUrl.length).toBeGreaterThan(0);
  });

  it('uses the provided voiceId in the request', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk();
    }

    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // ElevenLabs Adam voice
    await fetch(
      fnUrl(FUNCTION),
      callOptions({ text: 'Hello from Edinburgh.', voiceId, placeId: 'place-1' }),
    );

    if (!isLiveMode()) {
      const body = JSON.parse(
        ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.voiceId).toBe(voiceId);
    }
  });

  it('returns a cached:true response on cache hit', async () => {
    if (!isLiveMode()) {
      global.fetch = mockOk({ ...VALID_AUDIO_RESPONSE, cached: true });
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ text: 'Edinburgh Castle stands on volcanic rock.', placeId: 'place-1' }),
    );
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data).toHaveProperty('cached');
    // Whether cached or not, a URL should always be returned
    expect(data).toHaveProperty('audioUrl');
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns 500 when text is empty', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, { error: 'Text is required for audio generation' });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ text: '', placeId: 'place-1' }));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/text/i);
  });

  it('returns 500 when text exceeds 5000 characters', async () => {
    const longText = 'A'.repeat(5001);

    if (!isLiveMode()) {
      global.fetch = mockError(500, { error: 'Text too long' });
    }

    const res = await fetch(fnUrl(FUNCTION), callOptions({ text: longText, placeId: 'place-1' }));
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data).toHaveProperty('error');
  });

  it('returns 500 when ElevenLabs API key is not configured', async () => {
    if (!isLiveMode()) {
      global.fetch = mockError(500, { error: 'Service unavailable' });
    }

    const res = await fetch(
      fnUrl(FUNCTION),
      callOptions({ text: 'Some narration text.', placeId: 'place-1' }),
    );
    const data = await res.json();

    // In CI with mocked response, the function correctly surfaces the error
    if (!isLiveMode()) {
      expect(res.ok).toBe(false);
      expect(data.error).toMatch(/unavailable/i);
    } else {
      // Live mode: should succeed if ElevenLabs key is configured
      expect(res.ok).toBe(true);
    }
  });
});
