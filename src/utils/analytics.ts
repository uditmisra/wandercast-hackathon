/**
 * PostHog analytics — typed event helpers for the Wandercast conversion funnel.
 *
 * Usage:  import { analytics } from '@/utils/analytics';
 *         analytics.tourCreated({ title, city, stop_count, tour_number });
 *
 * All methods are fire-and-forget (no await needed) and safe to call
 * when PostHog isn't initialised (e.g. local dev without a key).
 */
import posthog from 'posthog-js';

function capture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // PostHog not initialised — swallow silently
  }
}

// ─── Auth ────────────────────────────────────────────────────────
export const analytics = {
  /** New user finished sign-up and has an active session */
  signupComplete(props: { method: 'email' | 'google' }) {
    capture('signup_complete', props);
  },

  /** Auth wall overlay shown to anonymous user */
  authWallShown(props: { variant: 'stop-gate' | 'tour-gate'; stopIndex?: number }) {
    capture('auth_wall_shown', props);
  },

  /** User converted through auth wall (signed up or signed in) */
  authWallConverted(props: { variant: 'stop-gate' | 'tour-gate'; method: 'email' | 'google' }) {
    capture('auth_wall_converted', props);
  },

  /** User dismissed the auth wall without converting */
  authWallDismissed(props: { variant: 'stop-gate' | 'tour-gate' }) {
    capture('auth_wall_dismissed', props);
  },

  // ─── Onboarding ──────────────────────────────────────────────
  /** Full onboarding flow completed (Welcome → Preferences → Demo) */
  onboardingCompleted() {
    capture('onboarding_completed');
  },

  /** Post-auth preference picker completed (tone + interests) */
  preferencesSet(props: { tone: string; interestCount: number; source: 'onboarding' | 'post-auth' | 'settings' }) {
    capture('preferences_set', props);
  },

  /** Post-auth preference picker skipped */
  preferencesSkipped(props: { source: 'post-auth' }) {
    capture('preferences_skipped', props);
  },

  // ─── Tour lifecycle ──────────────────────────────────────────
  /** Tour created from chat or other source */
  tourCreated(props: {
    title: string;
    city?: string;
    stop_count: number;
    tour_number?: number;
    source?: 'chat' | 'quick-start' | 'poi' | 'library-pin' | 'suggestion';
  }) {
    capture('tour_created', props);
  },

  /** User enters the audio guide (begins listening) */
  tourStarted(props: { tourId: string; title: string; stopCount: number; isResume: boolean }) {
    capture('tour_started', props);
  },

  /** All stops completed (reached last stop + audio ended) */
  tourCompleted(props: { tourId: string; title: string; stopCount: number }) {
    capture('tour_completed', props);
  },

  /** Tour saved to library (DB persist) */
  tourSaved(props: { tourId: string; title: string; stopCount: number; trigger: 'auto' | 'post-auth' }) {
    capture('tour_saved', props);
  },

  // ─── Stop progression ────────────────────────────────────────
  /** User navigated to a new stop (next, prev, or direct tap) */
  stopViewed(props: { tourId: string; stopIndex: number; totalStops: number; stopName: string; method: 'next' | 'previous' | 'direct' }) {
    capture('stop_viewed', props);
  },

  // ─── Audio ───────────────────────────────────────────────────
  /** Audio playback started for a stop */
  audioPlayed(props: { tourId: string; stopIndex: number; stopName: string }) {
    capture('audio_played', props);
  },

  /** Audio playback paused */
  audioPaused(props: { tourId: string; stopIndex: number; currentTime: number; duration: number }) {
    capture('audio_paused', props);
  },

  /** Audio narration finished playing to end */
  audioCompleted(props: { tourId: string; stopIndex: number; stopName: string }) {
    capture('audio_completed', props);
  },

  /** Audio generation/playback failed */
  audioError(props: { tourId: string; stopIndex: number; errorCode: string }) {
    capture('audio_error', props);
  },

  // ─── In-tour Q&A ─────────────────────────────────────────────
  /** User asked an in-tour question */
  questionAsked(props: { tourId: string; stopIndex: number; remainingQuestions: number }) {
    capture('question_asked', props);
  },

  // ─── Engagement ──────────────────────────────────────────────
  /** Tour shared (via native share or link copy) */
  tourShared(props: { tourId: string; method: 'native-share' | 'clipboard' }) {
    capture('tour_shared', props);
  },

  /** Place bookmarked or tour favorited */
  bookmarkToggled(props: { type: 'place' | 'tour'; targetId: string; bookmarked: boolean }) {
    capture('bookmark_toggled', props);
  },

  /** Chat message sent on home page */
  chatMessageSent(props: { isFirstMessage: boolean; hasLocation: boolean }) {
    capture('chat_message_sent', props);
  },

  /** Quick start pill tapped */
  quickStartTapped(props: { text: string; hasLocation: boolean }) {
    capture('quick_start_tapped', props);
  },

  /** Map POI tapped on home page */
  poiTapped(props: { poiName: string; type: 'curated' | 'native' }) {
    capture('poi_tapped', props);
  },

  /** Story feedback (more/less of a story type) */
  storyFeedback(props: { storyType: string; direction: 'more' | 'less' }) {
    capture('story_feedback', props);
  },

  // ─── Monetisation funnel ─────────────────────────────────────
  /** User hit a free-tier limit (tours, Q&A, or stops) */
  freeLimitReached(props: {
    limit_type: 'tours' | 'qa' | 'stops';
    current_count: number;
    plan: string;
  }) {
    capture('free_limit_reached', props);
  },

  /** Paywall shown to user (modal, inline block, or full page) */
  paywallShown(props: {
    trigger: 'tour_limit' | 'qa_limit' | 'manual';
    location: 'modal' | 'inline' | 'page';
  }) {
    capture('paywall_shown', props);
  },

  /** User dismissed the paywall without upgrading */
  paywallDismissed(props: {
    trigger: 'tour_limit' | 'qa_limit' | 'manual';
    time_on_paywall_ms: number;
  }) {
    capture('paywall_dismissed', props);
  },

  /** /upgrade page viewed */
  upgradePageViewed(props: {
    referrer: 'paywall_modal' | 'nav' | 'settings' | 'direct';
  }) {
    capture('upgrade_page_viewed', props);
  },

  /** User initiated Stripe checkout */
  checkoutStarted(props: {
    plan: 'plus' | 'pro';
    billing_period: 'monthly' | 'annual';
  }) {
    capture('checkout_started', props);
  },

  /** Stripe subscription created and activated (fired server-side from webhook) */
  subscriptionActivated(props: {
    plan: string;
    billing_period: 'monthly' | 'annual';
    revenue_cents: number;
  }) {
    capture('subscription_activated', props);
  },

  /** Stripe subscription cancelled (fired server-side from webhook) */
  subscriptionCancelled(props: {
    plan: string;
    tenure_days: number;
    reason?: string;
  }) {
    capture('subscription_cancelled', props);
  },

  // ─── Referral program ─────────────────────────────────────────
  /** User fetched/created their referral code for the first time */
  referralLinkCreated(props: { code: string }) {
    capture('referral_link_created', props);
  },

  /** User shared their referral link via share sheet or copy */
  referralLinkShared(props: { code: string; method: 'native-share' | 'clipboard' }) {
    capture('referral_link_shared', props);
  },

  /** A new user signed up via a referral link */
  referralSignup(props: { referralCode: string }) {
    capture('referral_signup', props);
  },

  /** Reward credit granted to referrer or referred user */
  referralRewardGranted(props: { userId: string; credits: number }) {
    capture('referral_reward_granted', props);
  },

  // ─── Social sharing (share cards) ─────────────────────────────
  /** Share card rendered on tour completion screen */
  shareCardGenerated(props: { tourId: string; format: 'stories' | 'twitter' | 'square' }) {
    capture('share_card_generated', props);
  },

  /** User tapped a share button (before platform sheet opens) */
  shareInitiated(props: { tourId: string; format: 'stories' | 'twitter' | 'square' | 'link'; source: 'completion' | 'history' }) {
    capture('share_initiated', props);
  },

  /** Share completed (navigator.share resolved or clipboard written) */
  shareCompleted(props: { tourId: string; platform: 'native' | 'clipboard'; source: 'completion' | 'history' }) {
    capture('share_completed', props);
  },
} as const;
