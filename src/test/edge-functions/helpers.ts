/**
 * Shared helpers for edge function integration tests.
 *
 * By default tests run in mock mode (no live server required, CI-safe).
 * Set TEST_SUPABASE_URL to a running Supabase URL to run as real integration tests.
 */

export const SUPABASE_URL =
  process.env.TEST_SUPABASE_URL || 'http://localhost:54321';

export const SUPABASE_ANON_KEY =
  process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';

export function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

export function isLiveMode(): boolean {
  return !!process.env.TEST_SUPABASE_URL;
}

/**
 * Base options for calling an edge function. Adds the required anon key header
 * and JSON content type.
 */
export function callOptions(body: unknown, authToken?: string): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  };
}
