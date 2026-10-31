# Image Moderation Edge Function

This Supabase Edge Function provides fail-closed image moderation for profile pictures.

## Architecture

**Workflow:**
1. User uploads image to private `quarantine` bucket
2. Function is triggered with quarantined path
3. Image is analyzed for explicit content using Sightengine AI
4. Result determines approval/rejection/manual review
5. Approved images are moved to public `profile_images` bucket
6. All decisions are logged in `image_moderation_queue` and `content_moderation_logs`

## Configuration

Required environment variables in Supabase Edge Function settings:

```
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MODERATION_API_USER=your-sightengine-api-user
MODERATION_API_KEY=your-sightengine-api-secret
```

## Sightengine Integration

The function uses Sightengine's nudity-2.1 model for adult content detection:

- **sexual_activity > 0.5**: Rejected
- **sexual_display > 0.5**: Rejected
- **erotica > 0.5**: Rejected
- **suggestive > 0.5**: Manual review
- **sexual score 0.25-0.5**: Manual review
- **API unavailable**: Manual review (fail-closed)

## Security Features

1. **User ownership validation**: Path must start with user.id
2. **Authentication**: Requires valid JWT token
3. **Service-role only**: Only Edge Function can move files between buckets
4. **Fail-closed**: Default to manual review if automation fails
5. **Audit trail**: All decisions logged with timestamps

## Filename Heuristics

Before AI analysis, filenames are checked for explicit markers:
- nude, porn, xxx, nsfw, naked, explicit, sex

If found, image is immediately rejected.

## Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy function
supabase functions deploy moderate-image
```

## Testing

Test the function with a sample image:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/moderate-image' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "quarantinedPath": "user-id/filename.jpg",
    "providerId": "provider-uuid"
  }'
```

## Alternative Providers

To use a different moderation provider, modify the API call section (lines 108-151):

- **Cloudflare AI**: Replace with Cloudflare Workers AI endpoint
- **Google Vision**: Replace with Google Cloud Vision API
- **AWS Rekognition**: Replace with AWS Rekognition endpoint

## Cost Considerations

Sightengine pricing:
- Free tier: 2,000 API calls/month
- Paid: $0.002 per call after free tier

For high-volume deployments, consider volume-based pricing or implement caching.
