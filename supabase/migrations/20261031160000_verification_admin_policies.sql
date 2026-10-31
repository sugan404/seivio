-- 20261031160000_verification_admin_policies
-- Authoritative Admin Verification Review and Status Synchronization
-- Enforces server-side security: providers cannot self-verify.

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('admin', 'moderator', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

CREATE POLICY "Admins can view admin list"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (auth.jwt() ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
END;
$$;

-- 2. Enhanced RLS for provider_verifications
-- Allow admins to view all verification applications
CREATE POLICY "Admins view all verifications"
  ON public.provider_verifications
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR auth.uid() = user_id);

-- Only admins (or service role) can update verification status
CREATE POLICY "Admins update verifications"
  ON public.provider_verifications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Automatic Status Synchronization Trigger
-- When an admin marks an application as 'verified', synchronize public.providers
CREATE OR REPLACE FUNCTION public.sync_provider_verification_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
    UPDATE public.providers
    SET 
      verification_status = 'verified',
      identity_verified_at = COALESCE(identity_verified_at, now()),
      verified_at = COALESCE(verified_at, now())
    WHERE id = NEW.provider_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'verified' THEN
    UPDATE public.providers
    SET verification_status = 'rejected'
    WHERE id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_provider_verification ON public.provider_verifications;
CREATE TRIGGER trg_sync_provider_verification
  AFTER UPDATE OF status ON public.provider_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_provider_verification_status();
