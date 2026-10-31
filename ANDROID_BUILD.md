# Android Build Configuration

## Status

**Local Android export successful.** Production build via EAS requires Expo account authentication.

## Local Export

### Command Run
```bash
npx expo export --platform android
```

### Result
✅ **Success**
- Bundle size: 3.08 MB
- Assets: 25 files bundled
- Export location: `dist/` directory
- Output: Android-compatible JavaScript bundle

### What This Means
The exported bundle can be used with:
- Development builds (`expo run:android`)
- Custom local Android builds
- EAS Build (with account)

## Production Build via EAS

### Prerequisites
1. **Expo Account**
   - Sign up at https://expo.dev
   - Verify email address
   - Create an organization

2. **EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Project Configuration**
   ```bash
   eas build:configure
   ```

### Build Commands

#### Development Build (APK)
```bash
eas build --profile development --platform android
```
- Distribution: Internal
- Fast build time
- Suitable for testing
- Not for Play Store

#### Preview Build (APK)
```bash
eas build --profile preview --platform android
```
- Distribution: Internal
- Optimized build
- Can be shared via link
- Not for Play Store

#### Production Build (AAB)
```bash
eas build --profile production --platform android
```
- Distribution: Google Play Store
- App Bundle format (.aab)
- Required for Play Store submission
- Longest build time

### Current EAS Configuration

File: `eas.json`
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Current App Configuration

File: `app.json`
```json
{
  "expo": {
    "name": "Seivio",
    "slug": "seivio",
    "scheme": "seivio",
    "version": "1.0.0",
    "orientation": "portrait",
    "android": {
      "package": "com.seivio.app",
      "adaptiveIcon": {
        "foregroundColor": "#2563EB",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

## Android Permissions

Currently configured:
- `RECORD_AUDIO` - For voice search and introductions
- `ACCESS_FINE_LOCATION` - For city and area discovery

Future permissions to consider:
- `CAMERA` - For profile pictures (already in iOS config)
- `READ_EXTERNAL_STORAGE` - For image picker
- `WRITE_EXTERNAL_STORAGE` - For saving cards

## Deep Linking

### Android Intent Filter

To enable deep linking from QR codes, add to `app.json`:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "seivio.app",
              "pathPrefix": "/p"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Deep Link Format
```
https://seivio.app/p/{provider-slug}
```

## Build without Expo Account

### Option 1: Custom Development Build

Requires:
- Android Studio
- React Native development environment
- More complex setup

Steps:
1. Create development build: `npx expo run:android`
2. Configure in Android Studio
3. Generate signed APK/AAB
4. Manual signing and distribution

### Option 2: Use Expo Go (Testing Only)

For testing without building:
1. Install Expo Go on Android device
2. Run `npx expo start`
3. Scan QR code from Expo Go
4. Test on device

**Limitations:**
- Cannot be distributed
- Contains Expo watermark
- Development build only
- Not for production

## Current Blocker

**EAS Build requires Expo account authentication.**

Without an Expo account:
- Cannot use EAS Build
- Cannot generate production APK/AAB
- Cannot submit to Play Store
- Limited to local testing with Expo Go

## Resolution Path

1. **Create Expo Account**
   - Visit https://expo.dev
   - Sign up (free tier available)
   - Verify email

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Configure Project**
   ```bash
   eas build:configure
   ```

4. **Build Preview APK**
   ```bash
   eas build --profile preview --platform android
   ```

5. **Test on Device**
   - Download APK from EAS
   - Install on Android device
   - Test all functionality

6. **Build Production AAB** (when ready for Play Store)
   ```bash
   eas build --profile production --platform android
   ```

## Alternative: Pre-built APK from Previous Session

The mission brief mentions:
> Latest reported commit: 603eeb5
> Reported previous validation: Android export: successful

This suggests a previous APK may exist. Check:
- EAS build history at https://expo.dev
- Local `dist/` directory
- Previous CI/CD artifacts

## Verification Steps Once Build is Available

1. **Install APK on Android device**
2. **Test App Startup**
   - Splash screen displays
   - Home screen loads
   - No crashes on launch

3. **Test Navigation**
   - Tab navigation works
   - Stack navigation works
   - Back button works

4. **Test Authentication**
   - Sign in flow
   - Sign up flow
   - Sign out
   - Session persistence

5. **Test Provider Discovery**
   - Browse categories
   - Search functionality
   - Provider profiles
   - Contact actions

6. **Test Provider Features**
   - Onboarding flow
   - Growth Kit
   - Verification
   - Visiting cards

7. **Test QR Codes**
   - Generate QR code
   - Scan QR code
   - Deep link opens app
   - Public profile accessible

8. **Test Permissions**
   - Location permission dialog
   - Camera permission (if added)
   - Audio permission (if using voice features)

## Current Status Summary

✅ **Local export successful** - Bundle ready for use
✅ **Expo Doctor passed** - 18/18 checks
✅ **TypeScript compiled** - 0 errors
✅ **Tests passing** - 89/89 tests
❌ **EAS Build blocked** - Requires Expo account authentication
❌ **Production APK unavailable** - Cannot generate without EAS

## Recommendation

For production deployment:
1. Create Expo account (free)
2. Authenticate EAS CLI
3. Build preview APK for testing
4. Build production AAB for Play Store
5. Configure Play Store listing
6. Submit for review

For immediate testing:
1. Use Expo Go with `npx expo start`
2. Test all functionality
3. Document any device-specific issues
4. Proceed with EAS build when account is available
