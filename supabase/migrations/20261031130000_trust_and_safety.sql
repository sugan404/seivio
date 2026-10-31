-- 20261031130000_trust_and_safety
-- Trust & Safety Moderation Logs and Appeals Table
-- Authoritative tracking of content moderation across Seivio

CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('profile_image', 'business_name', 'bio', 'description', 'review', 'general')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'flagged_for_review')),
  flagged_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.content_moderation_logs TO authenticated;
GRANT ALL ON public.content_moderation_logs TO service_role;
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own moderation logs"
  ON public.content_moderation_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own moderation logs"
  ON public.content_moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Moderation Appeals Table
CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
  flagged_reason TEXT NOT NULL,
  user_explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.moderation_appeals TO authenticated;
GRANT ALL ON public.moderation_appeals TO service_role;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own appeals"
  ON public.moderation_appeals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users submit own appeals"
  ON public.moderation_appeals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
