# Supabase Migrations for Seivio Application

## Overview
This directory contains Supabase SQL migrations for the Seivio application.
**These migrations are prepared for review and local validation only — do not apply to a remote database without explicit authorization.**

## Migration Files

### 1. 20261029120000_provider_likes.sql
- Creates `provider_likes` table with uniqueness constraint (one like per user per provider)
- Foreign keys to `auth.users` and `public.providers`
- Row-level security policies for authenticated users
- Users can: view their own likes, insert likes, delete their own likes

### 2. 20261029120100_provider_audio_intros.sql
- Creates `provider_audio_intros` table with duration limit (max 30 seconds)
- MIME type restrictions (mp3, mpeg, wav, ogg)
- File size limit (5MB max)
- Public read access, authenticated write with provider ownership check
- Trigger to maintain `updated_at` timestamp

### 3. 20261029120200_persistent_favorites.sql
- Creates `provider_favorites` table distinct from likes and reviews
- Uniqueness constraint (one favorite per user per provider)
- Foreign keys to `auth.users` and `public.providers`
- Row-level security policies for user-owned favorites only

## Prerequisites for Application

### 1. Environment Variables
Create a `.env` file in the mobile application root with:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit real `.env` files or service-role keys to the repository.**

### 2. Supabase Project Setup
- Create a new Supabase project or use an existing one
- Ensure the `public.providers` table exists with appropriate columns
- The migrations reference `public.providers(id, user_id)` — verify this table exists

### 3. Storage Bucket (for audio introductions)
- Create a storage bucket named `provider-audio` or similar
- Configure public read access and authenticated write policies
- The migration includes RLS policies for provider audio management

### 4. Database Functions
The audio intros migration creates a `touch_updated_at()` trigger function.
If re-running migrations, ensure this function exists or migrate accordingly.

## Important Security Notes

- **Service-role key**: Never expose the Supabase service-role key in the mobile application.
- **Environment separation**: Use `EXPO_PUBLIC_` prefix for variables accessible in the Expo app.
- **RLS policies**: The migrations enforce Row-Level Security. Ensure the `auth.users` table is properly configured.
- **Public access**: Audio intros are publicly readable but write-access is restricted to authenticated providers.

## Validation (Local Only)

To validate migrations locally without affecting a remote database:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your local project
supabase login

# Start a local development container
supabase init
supabase start

# Create a test database and run migrations
supabase db execute < supabase/migrations/20261029120000_provider_likes.sql
```

**Do not run `supabase start` or apply migrations to a production remote database without explicit authorization.**

## Applying Migrations

When ready to apply migrations to a development or staging Supabase project:

```bash
supabase migration new 20261029120000_init
supabase migration add 20261029120000_provider_likes.sql
supabase db push
```

Or use the Supabase dashboard SQL editor to run the migration files manually.

## Migration Order
Migrations must be applied in chronological order:
1. `20261029120000_provider_likes.sql` — Likes table foundation
2. `20261029120100_provider_audio_intros.sql` — Audio introductions
3. `20261029120200_persistent_favorites.sql` — Persistent favorites

Each migration assumes the previous ones have been applied, particularly table dependencies and RLS policy foundations.

## Troubleshooting

- **FK constraint errors**: Ensure `public.providers` table exists before running likes/audio/favorites migrations
- **RLS policy conflicts**: If policies already exist, use `DROP POLICY IF EXISTS` before creating new ones
- **Type mapping changes**: Adjust TypeScript types in the client to match any schema changes