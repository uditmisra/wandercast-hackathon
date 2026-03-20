-- API usage tracking for cost monitoring and alerts
CREATE TABLE IF NOT EXISTS api_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service text NOT NULL,         -- 'elevenlabs', 'anthropic', 'openai'
  function_name text NOT NULL,   -- edge function that made the call
  characters_used integer DEFAULT 0,
  estimated_cost_usd numeric(10,6) DEFAULT 0,
  status text NOT NULL DEFAULT 'success',  -- 'success', 'error', 'quota_exceeded', 'rate_limited'
  error_code text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Index for querying usage by service and time range
CREATE INDEX idx_api_usage_service_time ON api_usage_log (service, created_at DESC);

-- Index for finding errors quickly
CREATE INDEX idx_api_usage_errors ON api_usage_log (status, created_at DESC) WHERE status != 'success';

-- No RLS needed — this is a service-level table, not user-facing
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read
CREATE POLICY "Service role full access" ON api_usage_log
  FOR ALL USING (auth.role() = 'service_role');

-- Aggregated view for quick dashboard queries
CREATE OR REPLACE VIEW api_usage_summary AS
SELECT
  service,
  date_trunc('day', created_at) AS day,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE status = 'success') AS successful,
  COUNT(*) FILTER (WHERE status != 'success') AS failed,
  SUM(characters_used) AS total_characters,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM api_usage_log
GROUP BY service, date_trunc('day', created_at)
ORDER BY day DESC, service;
