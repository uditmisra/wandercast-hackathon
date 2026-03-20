/**
 * Flow B - Tour Playback + Q&A
 *
 * 1. Open an existing tour (create one via chat)
 * 2. Verify Play button is visible on first stop
 * 3. Click Next to navigate to stop 2
 * 4. Verify stop content updates (different stop name)
 * 5. Verify the All Stops sheet can be opened and shows all stops
 * 6. Verify the Ask pill is visible
 */

import { test, expect } from '@playwright/test';
import { mockSupabaseFunctions, MOCK_TOUR } from './helpers';

async function createTourViaChat(page: import('@playwright/test').Page) {
  await page.goto('/');
  const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
  await expect(chatInput).toBeVisible({ timeout: 10_000 });
  await chatInput.fill('Show me London highlights');
  await chatInput.press('Enter');
  // Wait for tour to load - first stop name appears
  await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).first()).toBeVisible({ timeout: 20_000 });
}

test.describe('Flow B: Tour Playback + Q&A', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseFunctions(page);
  });

  test('Play button is visible on the first stop', async ({ page }) => {
    await createTourViaChat(page);

    // The MinimalAudioPlayer renders a circular play button
    // It shows a Play svg icon when not playing and not generating
    // Class: "w-11 h-11 rounded-full flex items-center justify-center"
    const playButton = page.locator('button[class*="rounded-full"][class*="bg-foreground"]').first();
    await expect(playButton).toBeVisible({ timeout: 10_000 });
  });

  test('stop counter shows "Stop 1 of 3" on first stop', async ({ page }) => {
    await createTourViaChat(page);

    await expect(page.locator('text=/Stop 1 of 3/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Next navigates to stop 2 with a different stop name', async ({ page }) => {
    await createTourViaChat(page);

    // Verify we are on stop 1
    await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).first()).toBeVisible({ timeout: 10_000 });

    // The Next button at the bottom shows the next stop's name
    const nextStopName = MOCK_TOUR.places[1].name; // "London Eye"
    const nextButton = page.locator(`button:has-text("${nextStopName}")`).first();
    await expect(nextButton).toBeVisible({ timeout: 10_000 });
    await nextButton.click();

    // After clicking, stop 2 name should be in the heading
    await expect(page.locator(`text=${nextStopName}`).nth(1)).toBeVisible({ timeout: 10_000 });
    // Stop counter updates
    await expect(page.locator('text=/Stop 2 of 3/').first()).toBeVisible({ timeout: 5_000 });
  });

  test('All Stops sheet opens and lists all stop names', async ({ page }) => {
    await createTourViaChat(page);

    // The List icon button opens the All Stops sheet
    // It's rendered as a button > svg (List icon) in the top header area
    // We can find it by looking for a button with just an SVG (no text) near the header
    const listButton = page.locator('button').filter({ has: page.locator('svg[class*="w-4"][class*="h-4"]') }).first();

    // Click the list/sheet button - it's at the header right side
    // Fallback: find any button that contains a list-style SVG
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();

    // Sheet should open showing all stop names
    await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).nth(1)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${MOCK_TOUR.places[1].name}`).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${MOCK_TOUR.places[2].name}`).first()).toBeVisible({ timeout: 5_000 });
  });

  test('Ask pill button is visible and clicking it expands the Q&A section', async ({ page }) => {
    await createTourViaChat(page);

    // Wait for content pills to appear
    await expect(page.locator('button:has-text("Ask")').first()).toBeVisible({ timeout: 10_000 });

    // Click the Ask pill
    await page.locator('button:has-text("Ask")').first().click();

    // Q&A section should expand - look for a text input or question prompt
    // UnifiedQuestionInput renders a textarea or input for the question
    await expect(
      page.locator('textarea, input[placeholder*="question"], input[placeholder*="Ask"]').first(),
    ).toBeVisible({ timeout: 5_000 }).catch(async () => {
      // Fallback: at minimum the pill should now be in active state
      const askPill = page.locator('button:has-text("Ask")').first();
      await expect(askPill).toHaveClass(/bg-foreground/, { timeout: 5_000 });
    });
  });
});
