-- 20261031153000_text_moderation_db_triggers
-- Server-Side Content Moderation Triggers
-- Prevents database inserts or updates containing offensive or abusive text,
-- guaranteeing safety even if the client-side checks are bypassed.

CREATE OR REPLACE FUNCTION public.check_text_safety(input_text TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  normalized TEXT;
  prohibited_pattern TEXT := '\b(fuck|fuk|fvck|shit|bitch|asshole|bastard|dick|pussy|porn|thevidiya|othal|punda|sunni|omala|kamnati|poolu)\b';
BEGIN
  IF input_text IS NULL OR length(trim(input_text)) = 0 THEN
    RETURN TRUE;
  END IF;

  -- Lowercase and collapse common leet substitutions
  normalized := lower(input_text);
  normalized := replace(normalized, '@', 'a');
  normalized := replace(normalized, '0', 'o');
  normalized := replace(normalized, '$', 's');
  normalized := replace(normalized, '!', 'i');
  normalized := replace(normalized, '1', 'i');
  normalized := replace(normalized, '3', 'e');
  normalized := replace(normalized, '+', 't');

  IF normalized ~* prohibited_pattern THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Trigger Function for reviews table
CREATE OR REPLACE FUNCTION public.validate_review_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.review_text IS NOT NULL AND NOT public.check_text_safety(NEW.review_text) THEN
    -- Log the violation in content_moderation_logs
    INSERT INTO public.content_moderation_logs (user_id, content_type, status, flagged_terms, reason)
    VALUES (NEW.user_id, 'review', 'rejected', ARRAY['prohibited_language'], 'Offensive or abusive language in review text');

    RAISE EXCEPTION 'Review text contains prohibited language. Content violates Seivio Community Standards.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_review_content ON public.reviews;
CREATE TRIGGER trg_validate_review_content
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_content();

-- Trigger Function for providers table
CREATE OR REPLACE FUNCTION public.validate_provider_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.business_name IS NOT NULL AND NOT public.check_text_safety(NEW.business_name) THEN
    RAISE EXCEPTION 'Business name contains prohibited language.' USING ERRCODE = '23514';
  END IF;

  IF NEW.description IS NOT NULL AND NOT public.check_text_safety(NEW.description) THEN
    RAISE EXCEPTION 'Provider description contains prohibited language.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_provider_content ON public.providers;
CREATE TRIGGER trg_validate_provider_content
  BEFORE INSERT OR UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.validate_provider_content();
