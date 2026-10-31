# Visiting Card Export - Current Limitations

## Status

**PNG/PDF export is currently unavailable** due to React Native 0.76 dependency conflicts.

## What Works

✅ **Share functionality** - Share via system share sheet (WhatsApp, email, etc.)
✅ **Copy Link** - Copy public profile URL to clipboard
✅ **Print Guide** - Show print specifications and dimensions
✅ **Live Preview** - Real-time card preview with all 8 templates
✅ **Privacy Controls** - Toggle visibility of phone, WhatsApp, price, rating
✅ **QR Code Generation** - Generate scannable QR codes linking to public profiles

## What Doesn't Work

❌ **PNG Download** - Cannot save card as PNG image
❌ **PDF Export** - Cannot export card as PDF document

## Root Cause

React Native 0.76 was released in October 2024. The commonly used libraries for view capture and PDF generation have not yet been updated for compatibility:

- `react-native-view-shot@6.2.1` requires React Native >=0.80.0
- `react-native-html-to-pdf` has not been updated for React Native 0.76
- `expo-capture` does not exist yet (planned for future Expo SDK)

Attempting to install these libraries results in peer dependency conflicts that cannot be resolved without using `--legacy-peer-deps` or `--force`, which creates unstable production builds.

## Alternative Solutions

### Option 1: Wait for Compatible Libraries (Recommended)

Monitor for library updates:
- Watch `react-native-view-shot` for React Native 0.76 support
- Watch Expo for official capture API
- Check React Native community for alternative solutions

### Option 2: Server-Side Rendering

Implement card rendering in a Supabase Edge Function:
- Generate PNG/PDF on the server
- Return downloadable URL to mobile app
- Pros: Works with current React Native version
- Cons: Requires additional infrastructure

### Option 3: Use --legacy-peer-deps (Not Recommended)

```bash
npm install react-native-view-shot --legacy-peer-deps
```

**Why not recommended:**
- Bypasses dependency resolution
- May cause runtime crashes
- Not suitable for production
- Violates best practices

### Option 4: Downgrade React Native (Not Recommended)

Downgrade to React Native 0.73 or 0.72 where these libraries work.

**Why not recommended:**
- Loses latest React Native features and improvements
- Security vulnerabilities in older versions
- Breaking changes required throughout codebase
- Goes against project goal of using latest stable SDK

## Current Workaround

Users can:
1. **Share** the card directly to WhatsApp, email, or other apps
2. **Copy the link** to the public profile
3. **Take a screenshot** of the card preview (manual workaround)
4. **Use the print guide** to print professionally via external service

## Implementation When Available

When compatible libraries become available, implement:

```typescript
// app/lib/card-export.ts
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

export async function exportCardAsPNG(cardRef: React.RefObject<View>): Promise<string> {
  const uri = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'file',
  });

  const asset = await MediaLibrary.createAssetAsync(uri);
  return asset.uri;
}
```

## Testing

Current tests verify:
- ✅ Export functions throw informative errors
- ✅ `isExportAvailable()` returns false
- ✅ `getAvailableMethods()` returns only ["share", "copy-link"]
- ✅ Share functionality works correctly

Update tests when export is implemented to verify actual PNG/PDF generation.

## Documentation Updates

When export is implemented:
1. Update this file to reflect working status
2. Remove alert in GrowthKitScreen
4. Add Download button back to action toolbar
5. Update user-facing copy to advertise PNG/PDF export
