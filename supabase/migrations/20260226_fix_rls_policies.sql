-- Fix security issues flagged by Lovable audit
-- 1. web_context_cache: restrict to service_role only (was world-writable)
-- 2. place_facts: remove authenticated write access
-- 3. city_secrets: remove authenticated write access
-- 4. update_updated_at_column: set search_path

-- ═══ web_context_cache ═══
-- Drop the overly permissive policy that applied to all roles
DROP POLICY IF EXISTS "Service role full access" ON web_context_cache;

-- Allow public read (edge functions need to read cache via anon key)
CREATE POLICY "Public read access for web_context_cache"
  ON web_context_cache FOR SELECT
  USING (true);

-- Only service_role can write (edge functions use service_role key for writes)
CREATE POLICY "Service role write access for web_context_cache"
  ON web_context_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update access for web_context_cache"
  ON web_context_cache FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete access for web_context_cache"
  ON web_context_cache FOR DELETE
  TO service_role
  USING (true);

-- ═══ place_facts ═══
-- Drop the overly permissive authenticated write policy
DROP POLICY IF EXISTS "Authenticated users can manage place facts" ON place_facts;

-- Keep public read, add service_role-only write
CREATE POLICY "Service role can manage place facts"
  ON place_facts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══ city_secrets ═══
-- Drop the overly permissive authenticated write policy
DROP POLICY IF EXISTS "Authenticated users can manage city secrets" ON city_secrets;

-- Keep public read, add service_role-only write
CREATE POLICY "Service role can manage city secrets"
  ON city_secrets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══ Fix function search_path ═══
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
