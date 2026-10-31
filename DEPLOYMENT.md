# Seivio Deployment Guide

## Overview

This guide covers deployment for both the mobile application and the web application.

## Mobile Application Deployment

### Prerequisites

1. **Expo Account**
   - Create account at https://expo.dev
   - Verify email address
   - Create organization (optional but recommended)

2. **EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Environment Variables**
   - Configure in Expo dashboard (https://expo.dev)
   - Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Optional: `EXPO_PUBLIC_SEIVIO_WEB_URL`

### Environment Configuration

#### Mobile App (.env)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
EXPO_PUBLIC_SEIVIO_WEB_URL=https://seivio.app
```

#### Edge Function Environment Variables
Configure in Supabase dashboard for `moderate-image` function:
```
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MODERATION_API_USER=your-sightengine-user
MODERATION_API_KEY=your-sightengine-secret
```

### Deployment Steps

#### 1. Configure EAS Project
```bash
cd /home/sugan/Documents/seivio/mobile
eas build:configure
```

#### 2. Build Preview APK (Testing)
```bash
eas build --profile preview --platform android
```
- Generates APK for internal testing
- Can be shared via link
- Takes ~10-15 minutes

#### 3. Build Production AAB (Play Store)
```bash
eas build --profile production --platform android
```
- Generates AAB for Play Store
- Takes ~20-30 minutes
- Optimized and signed

#### 4. Submit to Play Store
```bash
eas submit --platform android --latest
```
- Requires Google Play Console account
- Requires app listing setup
- Requires privacy policy URL

### iOS Deployment (Future)

#### Build for iOS
```bash
eas build --profile production --platform ios
```

#### Submit to App Store
```bash
eas submit --platform ios --latest
```

Requires:
- Apple Developer account ($99/year)
- App Store Connect setup
- Proper provisioning profiles

## Web Application Deployment

### Prerequisites

1. **Hosting Platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - Railway
   - Self-hosted (Node.js server)

2. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deployment to Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
cd /home/sugan/Documents/seivio/web
vercel
```

#### 3. Configure Environment Variables
In Vercel dashboard:
- Add `NEXT_PUBLIC_SUPABASE_URL`
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 4. Custom Domain (Optional)
- Purchase domain (e.g., seivio.app)
- Configure in Vercel dashboard
- Update DNS records

### Deployment to Netlify

#### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. Build
```bash
cd /home/sugan/Documents/seivio/web
npm run build
```

#### 3. Deploy
```bash
netlify deploy --prod --dir=.next
```

#### 4. Configure Environment Variables
In Netlify dashboard:
- Add `NEXT_PUBLIC_SUPABASE_URL`
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Self-Hosted Deployment

#### 1. Build
```bash
cd /home/sugan/Documents/seivio/web
npm run build
```

#### 2. Start Server
```bash
npm start
```

#### 3. Process Manager (Production)
Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "seivio-web" -- start
pm2 save
pm2 startup
```

#### 4. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name seivio.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. SSL Certificate (Let's Encrypt)
```bash
sudo certbot --nginx -d seivio.app
```

## Database Deployment

### Supabase Migrations

#### 1. Install Supabase CLI
```bash
npm install -g supabase
```

#### 2. Login
```bash
supabase login
```

#### 3. Link Project
```bash
cd /home/sugan/Documents/seivio/mobile
supabase link --project-ref your-project-id
```

#### 4. Push Migrations
```bash
supabase db push
```

#### 5. Verify Migrations
Check Supabase dashboard SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### Storage Buckets

Create via Supabase dashboard or migration:
- `quarantine` - Private, 5MB limit
- `profile_images` - Public, 5MB limit
- `verification_documents` - Private, 10MB limit

### Edge Functions

#### Deploy Image Moderation Function
```bash
cd /home/sugan/Documents/seivio/mobile
supabase functions deploy moderate-image
```

## Environment Configuration Summary

### Mobile (.env)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_SEIVIO_WEB_URL=https://seivio.app
```

### Web (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Supabase Edge Functions
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (service-role, NOT anon)
MODERATION_API_USER=your-sightengine-user
MODERATION_API_KEY=your-sightengine-secret
```

## Domain Configuration

### seivio.app

#### DNS Records (if using custom domain)

**A Records:**
```
@    A    76.76.21.21    (Vercel)
www  A    76.76.21.21    (Vercel)
```

**CNAME Records:**
```
p    CNAME    seivio.app
```

#### Deep Linking

Configure deep linking in `app.json`:
```json
{
  "expo": {
    "scheme": "seivio",
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
    },
    "ios": {
      "bundleIdentifier": "com.seivio.app",
      "associatedDomains": ["applinks:seivio.app"]
    }
  }
}
```

## CI/CD Configuration (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mobile && npm ci
      - run: cd mobile && npm test
      - run: cd mobile && eas build --profile preview --platform android
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd web && npm ci
      - run: cd web && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./web
```

### Required Secrets

Add to GitHub repository settings:
- `EXPO_TOKEN` - From Expo account
- `VERCEL_TOKEN` - From Vercel account
- `ORG_ID` - Vercel organization ID
- `PROJECT_ID` - Vercel project ID

## Monitoring and Analytics

### Mobile (Expo)

Configure in Expo dashboard:
- Crash reports
- Performance monitoring
- Update channel management

### Web (Vercel)

Available in Vercel dashboard:
- Analytics
- Logs
- Performance metrics
- Error tracking

### Database (Supabase)

Available in Supabase dashboard:
- Database logs
- API usage
- Storage usage
- Edge function logs

## Rollback Procedures

### Mobile Rollback

```bash
# List previous builds
eas build:list

# Rebuild from specific commit
eas build --profile production --platform android --non-interactive
```

### Web Rollback

#### Vercel
- Go to Vercel dashboard
- Deployments tab
- Click rollback on previous deployment

#### Self-hosted
```bash
git checkout previous-commit
npm run build
pm2 restart seivio-web
```

### Database Rollback

```bash
# View migration history
supabase migration list

# Rollback specific migration
supabase migration down
```

## Security Checklist

### Before Production Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] Service-role keys only in Edge Functions
- [ ] RLS policies applied and tested
- [ ] HTTPS enabled everywhere
- [ ] Domain DNS configured
- [ ] SSL certificates valid
- [ ] Image moderation API configured
- [ ] Admin users created
- [ ] Database migrations applied
- [ ] Storage buckets created
- [ ] Deep linking configured
- [ ] Error monitoring set up
- [ ] Backup strategy configured

## Post-Deployment Verification

### Mobile
1. Download APK/AAB from build
2. Install on test device
3. Test all user flows
4. Verify deep linking
5. Check permissions
6. Test contact actions
7. Verify QR code scanning

### Web
1. Access deployed URL
2. Test provider profile pages
3. Verify SEO metadata
4. Check Open Graph tags
5. Test responsive design
6. Verify Supabase connection
7. Test not-found pages

### Database
1. Verify migrations applied
2. Check RLS policies active
3. Test admin access
4. Verify storage buckets
5. Test Edge Functions
6. Check moderation logs

## Support and Troubleshooting

### Common Issues

**Build failures:**
- Check Expo dashboard for build logs
- Verify environment variables
- Check dependency conflicts

**Runtime errors:**
- Check Expo client logs
- Verify Supabase connection
- Check environment variables

**Database errors:**
- Check Supabase logs
- Verify RLS policies
- Check migration status

**Edge Function errors:**
- Check function logs in Supabase
- Verify environment variables
- Check API credentials

## Contact and Resources

- **Expo Documentation:** https://docs.expo.dev
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Vercel Documentation:** https://vercel.com/docs
- **EAS Build Documentation:** https://docs.expo.dev/build/introduction
