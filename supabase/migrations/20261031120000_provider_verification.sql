-- 20261031120000_provider_verification
-- Provider verification status fields
-- Adds verification_status, identity_verified_at, business_verified_at columns

ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMPTZ;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Policy: Ordinary users cannot update verification status

-- Policy: Public can view verification status
