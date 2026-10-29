-- Persistent favorites table
-- Distinct from provider likes and reviews
-- One favorite per authenticated user per provider
CREATE TABLE public.provider_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);
GRANT SELECT, INSERT ON public.provider_favorites TO authenticated;
GRANT ALL ON public.provider_favorites TO service_role;
ALTER TABLE public.provider_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own favorites
CREATE POLICY "Users view own favorites" ON public.provider_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy: Authenticated users can favorite a provider
CREATE POLICY "Users favorite provider" ON public.provider_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unfavorite (delete their own favorite)
CREATE POLICY "Users unfavorite" ON public.provider_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
