-- 20261031150000_image_quarantine_and_storage
-- Fail-Closed Image Quarantine, Moderation Queue & Storage Policies
-- Ensures no unmoderated profile photos reach public storage

-- 1. Create Quarantine and Verification Buckets in storage.buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('quarantine', 'quarantine', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profile_images', 'profile_images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('verification_documents', 'verification_documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'quarantine' bucket
-- Authenticated users can only upload into quarantine/{auth.uid()}/*
CREATE POLICY "Users upload to quarantine"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'quarantine' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only user can read their own quarantined uploads (or service role)
CREATE POLICY "Users read own quarantine"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'quarantine' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Storage Policies for 'profile_images' bucket (Public view, Service-Role write only)
CREATE POLICY "Public read profile images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile_images');

-- 4. Storage Policies for 'verification_documents' bucket (Strictly private)
CREATE POLICY "Users upload verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Image Moderation Queue Table
CREATE TABLE IF NOT EXISTS public.image_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarantined_path TEXT NOT NULL,
  public_path TEXT,
  status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'approved', 'rejected', 'manual_review')),
  category TEXT CHECK (category IN ('safe', 'explicit_nudity', 'violence', 'copyright', 'low_quality')),
  rejection_reason TEXT,
  confidence_score NUMERIC(5, 4),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.image_moderation_queue TO authenticated;
GRANT ALL ON public.image_moderation_queue TO service_role;
ALTER TABLE public.image_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own image queue"
  ON public.image_moderation_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own image queue"
  ON public.image_moderation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER image_moderation_queue_touch
  BEFORE UPDATE ON public.image_moderation_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
