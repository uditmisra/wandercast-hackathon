import { Page } from '@playwright/test';

/**
 * Mock tour data used across all E2E tests.
 */
export const MOCK_TOUR = {
  id: 'e2e-tour-001',
  title: 'London Highlights',
  description: 'An AI-guided tour of iconic London landmarks.',
  places: [
    {
      id: 'place-1',
      name: 'Tower of London',
      city: 'London',
      country: 'England',
      lat: 51.5081,
      lng: -0.0759,
      estimatedDuration: 45,
      description: 'Historic fortress on the Thames.',
      generatedContent: {
        audioNarration:
          'The Tower of London has stood for nearly a thousand years. Within these walls, kings plotted, prisoners wept, and the Crown Jewels still dazzle.',
        hook: 'Nearly a thousand years of royal intrigue, hidden in plain sight.',
        directionalCue: 'Look up at the White Tower - the oldest part, built by William the Conqueror.',
        funFacts: ['The Tower was used as a royal mint until 1812.', 'Six ravens are kept here by royal decree.'],
        suggestedQuestions: [
          'Who were the most famous prisoners?',
          'Where are the Crown Jewels kept?',
        ],
      },
    },
    {
      id: 'place-2',
      name: 'London Eye',
      city: 'London',
      country: 'England',
      lat: 51.5033,
      lng: -0.1195,
      estimatedDuration: 30,
      description: 'Giant observation wheel on the South Bank.',
      generatedContent: {
        audioNarration:
          'The London Eye was never meant to be permanent -- it was built for the Millennium. Twenty-five years later, it is one of London\'s most beloved landmarks.',
        hook: 'A wheel meant to last a year, now celebrating a quarter century.',
        directionalCue: 'From the top capsule on a clear day, you can see Windsor Castle, 40 km away.',
        funFacts: ['Each rotation takes 30 minutes.', 'It was the world\'s largest observation wheel when opened.'],
        suggestedQuestions: ['How many capsules are there?', 'Why was it built?'],
      },
    },
    {
      id: 'place-3',
      name: 'Buckingham Palace',
      city: 'London',
      country: 'England',
      lat: 51.5014,
      lng: -0.1419,
      estimatedDuration: 30,
      description: 'Official residence of the British monarch.',
      generatedContent: {
        audioNarration:
          'Buckingham Palace has 775 rooms, 78 bathrooms, and one very famous balcony. The Changing of the Guard ceremony has occurred here since 1660.',
        hook: '775 rooms, one famous balcony.',
        directionalCue: 'Watch the central balcony - that\'s where royal announcements are made.',
        funFacts: ['The palace has its own post office.', 'Queen Victoria was the first monarch to live here.'],
        suggestedQuestions: ['Can visitors go inside?', 'When does the Changing of the Guard happen?'],
      },
    },
  ],
  interests: [{ id: '1', name: 'history', label: 'History' }],
  personalization: { preferredTone: 'casual' },
  createdAt: new Date().toISOString(),
};

/**
 * Installs route mocks for all Supabase edge function calls used during tests.
 * Call this at the start of each test that creates tours.
 */
export async function mockSupabaseFunctions(page: Page) {
  // ── parse-tour-request ─────────────────────────────────────────────────────
  await page.route('**/functions/v1/parse-tour-request', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          needsMoreInfo: false,
          places: MOCK_TOUR.places.map(p => ({
            id: p.id,
            name: p.name,
            city: p.city,
            country: p.country,
            lat: p.lat,
            lng: p.lng,
            estimatedDuration: p.estimatedDuration,
            description: p.description,
          })),
          title: MOCK_TOUR.title,
          description: MOCK_TOUR.description,
          mood: 'exploratory',
        },
      }),
    });
  });

  // ── generate-tour-content ──────────────────────────────────────────────────
  await page.route('**/functions/v1/generate-tour-content', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: MOCK_TOUR.places.map(p => ({
          placeId: p.id,
          source: 'curated',
          content: p.generatedContent,
        })),
      }),
    });
  });

  // ── generate-audio ─────────────────────────────────────────────────────────
  await page.route('**/functions/v1/generate-audio', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        audioUrl: 'https://example.com/audio/test.mp3',
        cached: false,
      }),
    });
  });

  // ── save-tour ──────────────────────────────────────────────────────────────
  await page.route('**/functions/v1/save-tour', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, skipped: true }),
    });
  });

  // ── get-tours ──────────────────────────────────────────────────────────────
  await page.route('**/functions/v1/get-tours', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tours: [MOCK_TOUR] }),
    });
  });

  // ── interactive-guide-conversation ────────────────────────────────────────
  await page.route('**/functions/v1/interactive-guide-conversation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        response:
          'The Tower has held some of history\'s most famous prisoners - Anne Boleyn, Sir Walter Raleigh, even Rudolf Hess in WWII.',
        success: true,
      }),
    });
  });
}

/**
 * Mocks Supabase Auth endpoints so sign-up / sign-in succeed without a real backend.
 */
export async function mockSupabaseAuth(page: Page) {
  const fakeSession = {
    access_token: 'fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'fake-refresh-token',
    user: {
      id: 'e2e-user-001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e-test@example.com',
      created_at: new Date().toISOString(),
    },
  };

  await page.route('**/auth/v1/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ session: fakeSession, user: fakeSession.user }),
    });
  });

  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });
}
