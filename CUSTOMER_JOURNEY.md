# Customer Journey Documentation

## Overview

This document describes the complete customer journey through the Seivio application, from discovery to service engagement.

## Unauthenticated Customer Journey

### 1. App Launch
- **Screen:** HomeScreen
- **Behavior:**
  - Seivio branding displayed with tagline "Find. Connect. Get It Done."
  - Categories loaded from Supabase
  - Approved providers loaded (up to 20)
  - Search bar available
  - No user greeting (not signed in)

### 2. Browse Categories
- **Screen:** HomeScreen → SearchScreen
- **Behavior:**
  - Tap category chip (e.g., "Plumbing")
  - Navigate to SearchScreen with category filter
  - Show filtered providers in that category
  - Can tap "All" to clear filter

### 3. Search for Services
- **Screen:** SearchScreen
- **Behavior:**
  - Type search query in text input
  - Real-time filtering (client-side)
  - Searches across: business name, categories, city, state, description
  - Results update immediately
  - Can combine with category filter

### 4. View Provider Profile
- **Screen:** ProviderProfileScreen
- **Behavior:**
  - Tap provider card from Home or Search
  - Navigate with slug parameter
  - Display:
    - Provider name and verification badge
    - Profession/category
    - Location (city, state)
    - Rating and review count
    - Starting price
    - Years of experience
    - Description
    - Profile/banner images
    - Contact buttons (Phone, WhatsApp, Email)
    - Reviews list
  - Actions:
    - Call phone
    - Open WhatsApp
    - Send email
    - View reviews
    - Save as favorite (requires sign in)
    - Submit review (requires sign in)

### 5. Contact Provider
- **Deep Links:**
  - Phone: `tel:{phone-number}`
  - WhatsApp: `https://wa.me/{digits}`
  - Email: `mailto:{email}`
- **Behavior:**
  - Opens system dialer for phone
  - Opens WhatsApp app for WhatsApp
  - Opens email client for email
  - No authentication required

## Authenticated Customer Journey

### 1. Sign In / Sign Up
- **Screen:** AuthScreen
- **Behavior:**
  - Enter email and password
  - Sign in with existing account
  - Sign up for new account
  - Auth state persists across app restarts
  - Session managed by Supabase Auth

### 2. Save Provider as Favorite
- **Screen:** ProviderProfileScreen
- **Behavior:**
  - Tap heart icon
  - Check authentication (redirect to Auth if not signed in)
  - Insert record into `provider_favorites` table
  - Update UI to show saved state
  - Can remove by tapping again

### 3. View Saved Providers
- **Screen:** FavoritesScreen
- **Navigation:** Account → Saved providers
- **Behavior:**
  - Load user's favorites from Supabase
  - Fetch provider details for each favorite
  - Display list with:
    - Provider name
    - Category
    - Location
    - Remove button
  - Empty state if no favorites
  - Can navigate to provider profile
  - Can remove from favorites

### 4. Submit Review
- **Screen:** ProviderProfileScreen → ReviewModal
- **Behavior:**
  - Tap "Write a Review" button
  - Check authentication (redirect to Auth if not signed in)
  - Show modal with:
    - Star rating (1-5)
    - Text input (10-1000 characters)
    - Submit button
  - **Text moderation applied** to review text
  - Insert into `reviews` table
  - Server-side trigger validates content
  - Rejection if profanity detected
  - Success: "Review submitted" alert
  - Provider rating recalculated

### 5. View Own Reviews
- **Screen:** ProviderProfileScreen
- **Behavior:**
  - Check if user has submitted review for this provider
  - Display "Your Review" section if exists
  - Show rating and text
  - Can update by submitting new review

## Persistence

### Favorites Persistence
- Stored in Supabase `provider_favorites` table
- Survives app reinstall (cloud storage)
- Accessible across devices (same account)

### Reviews Persistence
- Stored in Supabase `reviews` table
- Survives app reinstall
- Publicly visible to all users
- Cannot be deleted by user (future enhancement)

### Auth Persistence
- Managed by Supabase Auth
- JWT tokens stored securely
- Auto-refresh enabled
- Persists across app restarts

## Error Handling

### Network Errors
- "We couldn't load the marketplace. Please check your connection and try again."
- Retry button available
- Graceful degradation

### Not Found Errors
- "We couldn't find this provider."
- Go back button
- No crash or unhandled errors

### Moderation Rejections
- Review text: "Review contains prohibited language"
- Prevents submission
- Suggests rewording

## Account Screen

### Actions Available
- View saved providers
- Discover providers (navigate to Search)
- Grow Your Business (navigate to Growth Kit)
- Get Verified (navigate to Verification)
- List Your Business (navigate to Onboarding)
- Admin Verification Center (admin only)
- Sign out

### Sign Out Behavior
- Clears local auth state
- Clears Supabase session
- Returns to Auth screen
- Does not delete server-side data

## Navigation Flow

```
HomeScreen
├── SearchScreen (via search)
├── ProviderProfileScreen (via provider card)
├── AuthScreen (via Account)
└── FavoritesScreen (via Account)

ProviderProfileScreen
├── Back (to previous screen)
├── GrowthKit (if provider is current user)
└── Verification (if provider is current user)

AccountScreen
├── FavoritesScreen
├── SearchScreen
├── GrowthKitScreen
├── VerificationScreen
├── ProviderOnboardingScreen
└── AdminVerificationReviewScreen (admin only)
```

## Responsive Design

### Layout
- Mobile-first design
- Safe area handling for notched devices
- Responsive card layouts
- Horizontal scrolling for category chips

### Typography
- Consistent design tokens
- Readable font sizes
- High contrast for accessibility
- Truncation for long text

### Touch Targets
- Minimum 44px touch targets
- Clear visual feedback
- Loading states for async operations
- Error states with retry options

## Performance

### Loading States
- Activity indicators during data fetch
- Skeleton loading not implemented (future enhancement)
- Optimistic UI updates for favorites

### Caching
- No client-side caching implemented
- Each fetch queries Supabase directly
- Future: Implement React Query or similar

### Pagination
- Home: Limited to 20 providers
- Search: Loads all providers (client-side filter)
- Reviews: Limited to 10 per provider
- Future: Implement infinite scroll

## Security

### RLS Policies
- Users can only view their own favorites
- Users can only edit their own reviews
- Public can view approved providers
- Unauthenticated cannot submit reviews or favorites

### Data Privacy
- Contact information only shown if provider provided it
- No private provider data exposed
- Reviews are public but anonymized (no user ID exposed in UI)

## Known Limitations

### Missing Features
1. **Advanced Search** - Location-based search, radius filters
2. **Sorting** - Sort by rating, price, distance
3. **Filters** - Price range, availability, verification status
4. **Message Provider** - In-app messaging system
5. **Book Service** - Appointment scheduling
6. **Notifications** - Push notifications for updates
7. **Offline Mode** - Offline data access
8. **Multiple Locations** - Multi-city providers

### UX Improvements
1. Pull-to-refresh on all lists
2. Swipe actions on favorites
3. Photo gallery in provider profile
4. Video introductions
5. Service catalog/detailed services
6. Availability calendar
7. Real-time chat
8. Voice search

## Testing

### Manual Testing
Without Supabase credentials, testing is limited to:
- UI navigation flows
- Form validation
- Error state display
- Mock data rendering

### With Supabase
Full end-to-end testing requires:
1. Configure `.env` with Supabase credentials
2. Apply database migrations
3. Create test user accounts
4. Create test provider data
5. Test each journey with real data

### Automated Tests
Test coverage includes:
- ✅ Auth flow (auth.test.tsx)
- ✅ Favorites (favorites.test.tsx)
- ✅ Reviews (reviews.test.tsx)
- ✅ Search (search.test.tsx)
- ✅ Provider profiles (implicit in other tests)

## Analytics (Future)

Recommended events to track:
- Screen views
- Provider profile views
- Favorite adds/removes
- Review submissions
- Search queries
- Category selections
- Contact actions (call, WhatsApp, email)
- Sign up/sign in
- Conversion funnels
