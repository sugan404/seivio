# Provider Verification Admin Setup

This guide explains how to configure the provider verification system and set up administrative accounts.

## Overview

The verification system allows providers to submit identification documents for review by authorized administrators. Only administrators can approve provider verification status.

## Verification Workflow

1. **Provider submits verification** via VerificationScreen
   - Uploads document to `verification_documents` storage bucket
   - Enters document details (type, number, legal business name)
   - Status set to `submitted`
   - Provider `verification_status` in providers table set to `submitted`

2. **Administrator reviews** via AdminVerificationReviewScreen
   - Views pending applications
   - Inspects submitted documents
   - Approves, rejects, or requests resubmission
   - Records rejection reason if applicable

3. **Status synchronization**
   - Trigger automatically updates provider record
   - `verified_at` timestamp set on approval
   - Badge displayed in UI when `verification_status = 'verified'`

## Setting Up Administrators

### Step 1: Create Supabase User

Ensure the administrator has a Supabase auth account:
- Sign up through the app or Supabase dashboard
- Note the user UUID

### Step 2: Add to admin_users Table

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

**Available roles:**
- `admin` - Full administrative access
- `moderator` - Can review verifications but not change system settings
- `superadmin` - Full system access (future use)

### Step 3: Verify Admin Access

The admin can now access the AdminVerificationReviewScreen through the mobile app:
- Navigate to Account → Admin Verification Center
- If access is granted, they will see pending applications
- If denied, they will see "Access Restricted" message

## Admin Permissions

### What Admins Can Do

- View all pending verification applications
- View all verification details (documents, numbers, etc.)
- Approve applications (sets status to `verified`)
- Reject applications (sets status to `rejected`)
- Request resubmission (sets status to `resubmission_required`)
- Add rejection reasons

### What Admins Cannot Do

- Verify themselves (RLS prevents self-verification)
- Modify other admins without proper permissions
- Access user passwords or private auth data
- Delete providers (separate permission)

## Security Features

### RLS Policies

1. **admin_users table**
   - Anyone can view if they are an admin
   - Only service-role can insert/update

2. **provider_verifications table**
   - Admins can view all applications
   - Users can only view their own applications
   - Only admins can update verification status

3. **Providers table**
   - Verification status updated via trigger only
   - Client-side cannot directly set `verification_status = 'verified'`

### Server-Side Enforcement

The `is_admin()` function checks:
- JWT role claim (if set)
- Presence in `admin_users` table

This double-check prevents privilege escalation.

## Trigger Synchronization

The `trg_sync_provider_verification` trigger automatically:

1. When verification is approved:
   - Sets `providers.verification_status = 'verified'`
   - Sets `providers.verified_at = now()`
   - Sets `providers.identity_verified_at = now()`

2. When verification is rejected:
   - Sets `providers.verification_status = 'rejected'`

This ensures the public provider table always reflects the verification decision.

## Document Storage

Verification documents are stored in the `verification_documents` bucket:

- **Private bucket** - Not publicly accessible
- **10MB limit** - Sufficient for ID documents
- **Per-user folders** - `user-id/filename.pdf`
- **RLS policies** - Users can only access their own documents

## Removing Admin Access

To revoke admin access:

```sql
DELETE FROM public.admin_users
WHERE user_id = 'user-uuid-here';
```

The user will immediately lose admin access on next request.

## Auditing

All administrative actions are logged:

- `reviewed_by` field in `provider_verifications` tracks who approved/rejected
- `reviewed_at` timestamp records when
- `rejection_reason` stores justification for rejections

## Testing Admin Setup

1. Create a test user account
2. Add to `admin_users` table
3. Sign in as test user
4. Navigate to Admin Verification Center
5. Verify you can see pending applications
6. Remove from `admin_users` table
7. Verify access is now denied

## Troubleshooting

### Admin cannot see verification center

- Check user is in `admin_users` table
- Verify `role` column is one of: admin, moderator, superadmin
- Check for RLS policy errors in Supabase logs

### Verification status not syncing

- Check trigger `trg_sync_provider_verification` exists
- Verify trigger is on `provider_verifications` table
- Check Supabase function logs for errors

### Documents not accessible

- Verify document is in `verification_documents` bucket
- Check path format: `user-id/filename`
- Verify RLS policies on storage bucket

## Migration Reference

The verification system uses these migrations:

- `20261031120000_provider_verification.sql` - Base verification tables
- `20261031140000_provider_verification_submissions.sql` - Submission workflow
- `20261031160000_verification_admin_policies.sql` - Admin policies and triggers

Apply in order for complete setup.
