# Supabase Database Migrations

Complete set of database migrations for Seivio application.

## Migration Order

Apply migrations in chronological order:

1. **20261029120000_provider_likes.sql** - Provider likes table
2. **20261029120100_provider_audio_intros.sql** - Audio introductions storage
3. **20261029120200_persistent_favorites.sql** - Persistent favorites
4. **20261030120000_provider_reviews.sql** - Reviews system
5. **20261031120000_provider_verification.sql** - Verification tables
6. **20261031130000_trust_and_safety.sql** - Content moderation logs
7. **20261031140000_provider_verification_submissions.sql** - Verification submissions
8. **20261031150000_image_quarantine_and_storage.sql** - Image moderation storage
9. **20261031153000_text_moderation_db_triggers.sql** - Server-side text moderation
10. **20261031160000_verification_admin_policies.sql** - Admin verification policies

## Applying Migrations

### Via Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste each migration file
3. Run in order

### Via Supabase CLI

```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

## Critical Security Features

### Text Moderation Triggers (20261031153000)

- Server-side validation for reviews and provider content
- Normalizes leetspeak and character substitutions
- Checks against English and Tamil profanity
- Logs violations in `content_moderation_logs`
- **Cannot be bypassed by client-side code**

### Image Quarantine (20261031150000)

- Private `quarantine` bucket for uploads
- Public `profile_images` bucket only for approved images
- `image_moderation_queue` tracks all moderation decisions
- RLS policies ensure users can only access their own uploads

### Verification Security (20261031160000)

- `admin_users` table for authorized reviewers
- `is_admin()` function for permission checks
- RLS policies prevent self-verification
- Automatic status synchronization between tables

## Prerequisites

Before applying migrations, ensure:

1. Supabase project is created
2. `auth.users` table exists (automatic in Supabase)
3. `public.providers` table exists with basic schema
4. Storage buckets will be created by migration 20261031150000

## Rollback

To rollback a migration, use the SQL Editor to:

1. Drop triggers: `DROP TRIGGER IF EXISTS trigger_name ON table_name`
2. Drop functions: `DROP FUNCTION IF EXISTS function_name CASCADE`
3. Drop tables: `DROP TABLE IF EXISTS table_name CASCADE`

## Testing

After applying migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Migration Details

### Text Moderation (20261031153000)

**Triggers:**
- `trg_validate_review_content` on `reviews` table
- `trg_validate_provider_content` on `providers` table

**Function:**
- `check_text_safety(input_text)` - Returns boolean

**Blocked patterns:** (normalized)
- English profanity: fuck, shit, bitch, asshole, etc.
- Tamil abusive terms: thevidiya, sunni, punda, koothi, etc.
- Leetspeak variants: fuk, fvck, @ss, etc.

### Image Moderation (20261031150000)

**Storage Buckets:**
- `quarantine` - Private, 5MB limit, auth users only
- `profile_images` - Public, 5MB limit, service-role write
- `verification_documents` - Private, 10MB limit, auth users only

**Tables:**
- `image_moderation_queue` - Tracks all moderation decisions

### Verification (20261031160000)

**Table:**
- `admin_users` - Authorized administrators

**Function:**
- `is_admin()` - Check if current user is admin

**Trigger:**
- `trg_sync_provider_verification` - Sync verification status to providers table

**RLS Policies:**
- Admins can view all verifications
- Only admins can update verification status
- Users can only view their own verifications
