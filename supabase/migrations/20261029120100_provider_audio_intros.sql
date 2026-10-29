-- Provider audio introductions table
-- Optional audio introductions of maximum 30 seconds
CREATE TABLE public.provider_audio_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  duration_seconds INT CHECK (duration_seconds <= 30),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg')),
  file_size_bytes INT CHECK (file_size_bytes <= 5000000), -- 5MB max
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.provider_audio_intros TO authenticated;
GRANT ALL ON public.provider_audio_intros TO service_role;
ALTER TABLE public.provider_audio_intros ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view audio intros
CREATE POLICY "Audio intros public read" ON public.provider_audio_intros FOR SELECT TO anon, authenticated USING (true);

-- Policy: Providers can manage their own audio intros
CREATE POLICY "Providers manage own audio" ON public.provider_audio_intros FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.user_id = auth.uid() AND p.id = provider_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.user_id = auth.uid() AND p.id = provider_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER provider_audio_intros_touch BEFORE UPDATE ON public.provider_audio_intros FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
