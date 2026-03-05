-- Create table to cache greenhouse metrics
CREATE TABLE public.greenhouse_metrics_cache (
  id TEXT PRIMARY KEY DEFAULT 'latest',
  metrics JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow edge function to read/write (no RLS needed - internal use only)
ALTER TABLE public.greenhouse_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Public read policy (edge function uses service role for writes)
CREATE POLICY "Anyone can read cached metrics"
  ON public.greenhouse_metrics_cache
  FOR SELECT
  USING (true);

-- Service role can do everything (edge function)
CREATE POLICY "Service role can manage cache"
  ON public.greenhouse_metrics_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);