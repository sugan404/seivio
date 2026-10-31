-- 20261031140000_provider_verification_submissions
-- Provider Verification Submissions & Lifecycle Tracking
-- Secure storage of identity documents with strict RLS

CREATE TABLE IF NOT EXISTS public.provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_business_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'driving_license', 'voter_id', 'gst_registration', 'trade_license')),
  document_number TEXT NOT NULL,
  document_uri TEXT,
  trade_license_number TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('not_submitted', 'submitted', 'under_review', 'verified', 'rejected', 'resubmission_required')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.provider_verifications TO authenticated;
GRANT ALL ON public.provider_verifications TO service_role;
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Providers can only view their own verification applications
CREATE POLICY "Providers view own verifications"
  ON public.provider_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Providers can insert verification applications for their own identity
CREATE POLICY "Providers submit verification"
  ON public.provider_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger to maintain updated_at
CREATE TRIGGER provider_verifications_touch
  BEFORE UPDATE ON public.provider_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
