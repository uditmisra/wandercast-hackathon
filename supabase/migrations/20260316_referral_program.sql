-- Referral Program: Give a Tour, Get a Tour
-- Each user has one unique referral code.
-- Referral events track the funnel: link_shared → signup → tour_completed → reward_granted
-- Free tour credits unlock premium tours for referrers + referred users.

-- ── referral_codes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_codes_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS referral_codes_code_idx ON referral_codes (code);

-- ── referral_events ──────────────────────────────────────────────────────────
-- Tracks each step in the referral funnel per pair (referrer, referred).
CREATE TABLE IF NOT EXISTS referral_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type       TEXT        NOT NULL CHECK (event_type IN (
                                 'link_shared', 'signup', 'tour_completed', 'reward_granted'
                               )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata         JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS referral_events_referrer_idx ON referral_events (referrer_user_id);
CREATE INDEX IF NOT EXISTS referral_events_referred_idx ON referral_events (referred_user_id);

-- ── free_tour_credits ────────────────────────────────────────────────────────
-- Tracks how many free premium tour unlocks each user has available.
CREATE TABLE IF NOT EXISTS free_tour_credits (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_available INTEGER     NOT NULL DEFAULT 0,
  credits_used      INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT free_tour_credits_user_id_key UNIQUE (user_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE referral_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_tour_credits ENABLE ROW LEVEL SECURITY;

-- referral_codes: owner can read/insert their own code.
-- Anyone can look up a code by value (needed to validate referral links on signup).
CREATE POLICY "Owner reads own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner inserts own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can SELECT all (edge functions need to look up codes by value).
-- Anon SELECT is intentionally excluded; edge functions run as service_role.

-- referral_events: referrer can read events where they are the referrer.
CREATE POLICY "Referrer reads own events"
  ON referral_events FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- free_tour_credits: user can read their own credits.
CREATE POLICY "User reads own credits"
  ON free_tour_credits FOR SELECT
  USING (auth.uid() = user_id);
