CREATE TABLE public.market_cache (id text PRIMARY KEY, payload jsonb NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.market_cache TO anon, authenticated;
GRANT ALL ON public.market_cache TO service_role;
ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public market quotes" ON public.market_cache FOR SELECT TO anon, authenticated USING (true);