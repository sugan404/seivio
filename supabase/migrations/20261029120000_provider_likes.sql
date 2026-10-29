-- Provider likes table
-- One like per authenticated user per provider
CREATE TABLE public.provider_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);
GRANT SELECT, INSERT ON public.provider_likes TO authenticated;
GRANT ALL ON public.provider_likes TO service_role;
ALTER TABLE public.provider_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view likes they gave or that were given to their providers
CREATE POLICY "Users view own likes" ON public.provider_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy: Authenticated users can like a provider (insert if not exists)
CREATE POLICY "Users insert like" ON public.provider_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unlike (delete their own like)
CREATE POLICY "Users delete like" ON public.provider_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
