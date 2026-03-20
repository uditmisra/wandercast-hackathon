/**
 * Flow C - Auth + Persistence
 *
 * 1. Sign up form renders with email + password inputs
 * 2. Dashboard shows tours in the History tab for authenticated users
 * 3. Clicking a tour from the dashboard resumes it in the guide view
 *
 * Auth is injected via localStorage (Supabase's auth storage) so these
 * tests do not require a real Supabase backend.
 */

import { test, expect } from '@playwright/test';
import { mockSupabaseFunctions, MOCK_TOUR } from './helpers';

// A minimal JWT-shaped token that Supabase JS client can parse.
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"e2e-user-001","email":"e2e@example.com","role":"authenticated","iat":1700000000,"exp":9999999999}
const FAKE_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJlMmUtdXNlci0wMDEiLCJlbWFpbCI6ImUyZUBleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9' +
  '.fake-signature-for-e2e-tests';

const SUPABASE_PROJECT_REF = 'hdzfffutbzpevblbpgjc';
const STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

const FAKE_SESSION = {
  access_token: FAKE_ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'fake-refresh-e2e',
  user: {
    id: 'e2e-user-001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'e2e@example.com',
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
  },
};

/**
 * Inject a fake Supabase session into localStorage so the app treats the
 * user as authenticated on next page load.
 */
async function injectFakeSession(page: import('@playwright/test').Page) {
  // Navigate to the app first (any page) so we have access to the origin's localStorage
  await page.goto('/');
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: FAKE_SESSION },
  );
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Flow C: Auth + Persistence', () => {
  test('sign-up page renders with email and password inputs', async ({ page }) => {
    await page.goto('/auth');

    // Email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    // Password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });

    // Submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 5_000 });
  });

  test('sign-up form accepts input and shows submit button', async ({ page }) => {
    await page.goto('/auth');

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    await emailInput.fill('e2e-test@example.com');
    await page.locator('input[type="password"]').first().fill('password123');

    // Submit button should be enabled with valid input
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });
  });

  test('dashboard History tab shows saved tours for authenticated user', async ({ page }) => {
    await mockSupabaseFunctions(page);
    await injectFakeSession(page);

    // Mock auth/user endpoint so the app doesn't reject our fake token
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION.user),
      });
    });

    // Mock the session refresh
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      });
    });

    await page.goto('/dashboard');

    // History tab should be visible
    const historyTab = page.locator('button:has-text("History")').first();
    await expect(historyTab).toBeVisible({ timeout: 10_000 });

    // Tour from mock data should appear in the list
    await expect(page.locator(`text=${MOCK_TOUR.title}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a tour in dashboard history opens the tour guide', async ({ page }) => {
    await mockSupabaseFunctions(page);
    await injectFakeSession(page);

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION.user),
      });
    });

    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      });
    });

    await page.goto('/dashboard');

    await expect(page.locator(`text=${MOCK_TOUR.title}`).first()).toBeVisible({ timeout: 10_000 });

    // Click the Play button on the tour card to resume it
    const playButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    // More targeted: find a button near the tour title
    const tourCard = page.locator('[class*="rounded"]').filter({ hasText: MOCK_TOUR.title }).first();
    const tourPlayButton = tourCard.locator('button').first();
    await tourPlayButton.click({ force: true });

    // After clicking, the guide view should show the first stop
    await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test('dashboard redirects unauthenticated users to /auth', async ({ page }) => {
    // No session injected - should redirect
    await page.goto('/dashboard');

    // Either we see the auth page or the URL contains /auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});
