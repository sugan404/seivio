# Provider Onboarding Workflow

## Overview

The provider onboarding flow allows service providers to register their business on Seivio through a structured five-step process.

## Onboarding Flow

### Step 1: Profession Selection
- User selects primary profession from predefined categories
- Categories: Plumbing, Electrician, Carpentry, Painting, AC Repair, Cleaning, Pest Control, Appliance Repair
- Validation: Category must be selected

### Step 2: Business Details
- Business name (minimum 3 characters)
- Description (minimum 15 characters)
- **Text moderation applied** to both fields
- Rejection if profanity or abusive language detected
- Validation before proceeding

### Step 3: Pricing & Location
- Starting price (numeric, in ₹)
- Primary operating city
- State/region
- Validation: Price must be valid number, city required

### Step 4: Contact Information
- Phone number (optional if WhatsApp provided)
- WhatsApp number (optional if phone provided)
- Email address (optional, defaults to user email)
- Validation: At least one contact method required

### Step 5: Profile Image (Optional)
- Upload profile picture or logo
- **Image moderation applied** via quarantine bucket
- Only approved images become publicly visible
- Can proceed without image

### Draft Saving
- Progress saved to AsyncStorage after each step
- Can resume onboarding later
- Draft cleared on successful publish

### Publishing
- Creates slug from business name (lowercase, hyphen-separated)
- Inserts record into `providers` table
- Status set to `approved` (auto-approval for testing)
- Redirects to Growth Kit screen

## Code Implementation

### File: ProviderOnboardingScreen.tsx

**Key Functions:**
- `validateStep(currentStep)` - Validates each step's inputs
- `saveDraft()` - Saves progress to AsyncStorage
- `handlePublish()` - Creates provider record in Supabase

**Moderation Integration:**
```typescript
const nameMod = moderateText(businessName.trim(), "business_name");
if (nameMod.status === "rejected") {
  setStepError(nameMod.reason || "Business name contains inappropriate terminology.");
  return false;
}
```

**Supabase Insert:**
```typescript
const { data, error } = await supabase
  .from("providers")
  .insert(providerPayload)
  .select("*")
  .maybeSingle();
```

## Database Schema

### providers table columns used:
- `user_id` - Authenticated user UUID
- `slug` - URL-friendly identifier
- `business_name` - Display name
- `description` - Service description
- `category_slugs` - Array of category slugs
- `city_slug` - Operating city
- `state` - State/region
- `starting_price` - Minimum service price
- `experience_years` - Years in business
- `phone` - Contact phone
- `whatsapp` - WhatsApp number
- `email` - Contact email
- `status` - "approved" (auto-approval)
- `plan` - "free" (default)

## Security Considerations

### Client-Side
- Text moderation via `moderateText()` function
- Input validation before submission
- Authentication required before publish

### Server-Side
- Database triggers enforce text moderation (migration 20261031153000)
- RLS policies prevent unauthorized inserts
- Image moderation via Edge Function before public visibility

## Testing Without Real Supabase

### Mock Testing
Tests use mocked Supabase client to verify:
- Step validation logic
- Text moderation integration
- Draft save/load functionality
- Form state management

### Manual Testing (Requires Supabase)
1. Configure `.env` with Supabase credentials
2. Run `npx expo start`
3. Navigate to Account → List Your Business
4. Complete all five steps
5. Verify provider appears in database
6. Verify slug generation works
7. Verify Growth Kit redirect

## Known Limitations

### Image Upload
- Image upload UI exists but requires image picker integration
- Image moderation requires Supabase Edge Function deployment
- Quarantine bucket must be created via migration

### Category Management
- Categories are hardcoded in onboarding screen
- Should be fetched from `categories` table in production
- Dynamic category selection recommended

### Status Management
- Currently auto-approves all providers (status = "approved")
- Production should require moderation or admin approval
- Consider adding `status = "pending"` for moderation workflow

## Future Enhancements

1. **Dynamic Categories** - Fetch from database
2. **Image Upload Integration** - Full image picker and moderation flow
3. **Edit Profile** - Allow providers to update existing listings
4. **Multi-location Support** - Add multiple service areas
5. **Service Tier Selection** - Free vs Pro vs Premium plans
6. **Portfolio Upload** - Add multiple work photos
7. **Business Hours** - Add availability schedule
8. **Social Media Links** - Add Facebook, Instagram, etc.

## Integration Points

### After Onboarding
- Redirects to Growth Kit screen
- Can generate visiting cards immediately
- Can submit verification application
- QR codes point to public profile

### Public Profile
- Displayed on web application
- Accessible via QR codes
- Shows all onboarding information
- Privacy controls apply

## Error Handling

### Network Errors
- Show "Please check your connection and try again"
- Preserve draft for retry
- Allow resumption from current step

### Validation Errors
- Show specific error messages
- Highlight problematic field
- Prevent progression until fixed

### Moderation Rejections
- Clear explanation of rejection reason
- Suggest alternative wording
- Allow editing and resubmission

## Accessibility

- Form labels are clear and descriptive
- Error messages are specific
- Progress indicator shows current step
- Navigation back to previous steps allowed
- Draft auto-save prevents data loss
