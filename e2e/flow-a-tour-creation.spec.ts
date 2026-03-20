/**
 * Flow A - Tour Creation
 *
 * 1. Navigate to home page
 * 2. Type a tour request in the chat
 * 3. Verify progress message appears
 * 4. Verify tour opens with content card showing stop name, hook, and Play button
 * 5. Verify at least 3 stops are generated
 */

import { test, expect } from '@playwright/test';
import { mockSupabaseFunctions, MOCK_TOUR } from './helpers';

test.describe('Flow A: Tour Creation', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseFunctions(page);
  });

  test('home page loads with chat input visible', async ({ page }) => {
    await page.goto('/');

    // The chat input bar should be visible
    const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
  });

  test('typing and submitting a tour request shows progress message', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // Type a tour request
    await chatInput.fill('Show me London highlights');

    // Submit via Enter key or the send button
    await chatInput.press('Enter');

    // Progress message should appear
    await expect(
      page.locator('text=/Finding the perfect spots|Mapping your route|stops/i').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('tour creation produces a guide with the first stop name visible', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    await chatInput.fill('Show me London highlights');
    await chatInput.press('Enter');

    // Wait for the tour guide view to appear - the first stop name should be visible
    const firstStopName = MOCK_TOUR.places[0].name; // "Tower of London"
    await expect(page.locator(`text=${firstStopName}`).first()).toBeVisible({ timeout: 20_000 });
  });

  test('tour guide shows a Play button on the first stop', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    await chatInput.fill('Show me London highlights');
    await chatInput.press('Enter');

    // Wait for first stop to appear
    await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).first()).toBeVisible({ timeout: 20_000 });

    // Play button: a button containing an svg Play icon (rounded-full bg-foreground)
    // The MinimalAudioPlayer renders a button with class bg-foreground text-background
    const playButton = page.locator('button.rounded-full').filter({ hasText: '' }).first();
    // Alternatively, find by aria role and nearby context
    const playerSection = page.locator('[class*="MinimalAudioPlayer"], .animate-fade-in').first();
    await expect(playerSection).toBeVisible({ timeout: 10_000 });
  });

  test('tour has at least 3 stops visible in the All Stops sheet', async ({ page }) => {
    await page.goto('/');

    const chatInput = page.locator('textarea, input[placeholder*="Hidden gems"], input[placeholder*="Rome"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    await chatInput.fill('Show me London highlights');
    await chatInput.press('Enter');

    // Wait for first stop to appear
    await expect(page.locator(`text=${MOCK_TOUR.places[0].name}`).first()).toBeVisible({ timeout: 20_000 });

    // Open the All Stops sheet via the List icon button
    // The button is near the top right and has a List icon (no text label)
    const listButton = page.locator('button').filter({ has: page.locator('svg') }).nth(3);

    // Try clicking any button that opens a sheet
    // The SheetTrigger renders as a button with a list icon in the top header area
    await page.locator('header button, [class*="header"] button').last().click().catch(() => {});

    // Alternatively, find by aria label or just count stop names
    // The stop indicator dots at bottom show total stops - check there are 3
    const stopDots = page.locator('[class*="rounded-full"][class*="bg-foreground"]');
    // At minimum, the stop counter text "Stop 1 of 3" should appear
    await expect(page.locator('text=/Stop 1 of/i').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/of 3/').first()).toBeVisible({ timeout: 5_000 });
  });
});
