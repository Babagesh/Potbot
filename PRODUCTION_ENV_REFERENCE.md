# Production Environment Variables Reference

## 🎯 Quick Reference for Deployment

### Backend Environment Variables (17 total)

```bash
# ===== DATABASE (2) =====
SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ===== AI/ML SERVICES (4) =====
GROQ_API_KEY=<your-groq-api-key>
CONFIDENCE_THRESHOLD=0.6
BRIGHTDATA_API_KEY=<your-brightdata-api-key>
BRIGHTDATA_DATASET_ID=gd_mfz5x93lmsjjjylob

# ===== SOCIAL MEDIA (7) =====
TWITTER_BEARER_TOKEN=<your-bearer-token>
TWITTER_API_KEY=<your-api-key>
TWITTER_API_SECRET=<your-api-secret>
TWITTER_ACCESS_TOKEN=<your-access-token>
TWITTER_ACCESS_TOKEN_SECRET=<your-access-token-secret>
APPLOVIN_API_KEY=<your-applovin-key>                    # OPTIONAL
APPLOVIN_API_BASE_URL=https://api.applovin.com/v1       # OPTIONAL

# ===== FORM SUBMISSION (2) =====
SF_311_API_KEY=<your-sf-311-key>                        # OPTIONAL
SUBMITTER_EMAIL=potbot@example.com

# ===== API CONFIGURATION (2) =====
ALLOW_CORS_ORIGINS=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.com
```

### Frontend Environment Variables (4 total)

```bash
# ===== DATABASE (2) =====
NEXT_PUBLIC_SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# ===== EXTERNAL SERVICES (1) =====
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>

# ===== BACKEND API (1) =====
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

---

## 📋 Variable Usage Map

### Backend

| Variable | File(s) Used In | Required | Notes |
|----------|----------------|----------|-------|
| `SUPABASE_URL` | `supabase_client.py` | ✅ Yes | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase_client.py` | ✅ Yes | Full database access |
| `GROQ_API_KEY` | `image_agent.py` | ✅ Yes | Agent #1 - Image analysis |
| `CONFIDENCE_THRESHOLD` | `image_agent.py` | ✅ Yes | AI confidence threshold (0.6 recommended) |
| `BRIGHTDATA_API_KEY` | `brightdata_search.py` | ✅ Yes | Agent #2 - Form search |
| `BRIGHTDATA_DATASET_ID` | `brightdata_search.py` | ✅ Yes | BrightData dataset ID |
| `TWITTER_BEARER_TOKEN` | `social_media_agent.py` | ✅ Yes | Agent #3 - Twitter auth |
| `TWITTER_API_KEY` | `social_media_agent.py` | ✅ Yes | Agent #3 - Twitter auth |
| `TWITTER_API_SECRET` | `social_media_agent.py` | ✅ Yes | Agent #3 - Twitter auth |
| `TWITTER_ACCESS_TOKEN` | `social_media_agent.py` | ✅ Yes | Agent #3 - Twitter auth |
| `TWITTER_ACCESS_TOKEN_SECRET` | `social_media_agent.py` | ✅ Yes | Agent #3 - Twitter auth |
| `APPLOVIN_API_KEY` | `applovin_analyzer.py` | ⚪ Optional | Social media optimization |
| `APPLOVIN_API_BASE_URL` | `applovin_analyzer.py` | ⚪ Optional | AppLovin API endpoint |
| `SF_311_API_KEY` | `form_submission_agent.py` | ⚪ Optional | Direct city API submission |
| `SUBMITTER_EMAIL` | `form_submission_agent.py` | ✅ Yes | Default email for submissions |
| `ALLOW_CORS_ORIGINS` | `main.py` | ✅ Yes | Security - Allowed domains |
| `BASE_URL` | `main.py` | ✅ Yes | Public URL for image links |

### Frontend

| Variable | File(s) Used In | Required | Notes |
|----------|----------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `app/lib/supabase.ts` | ✅ Yes | Database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `app/lib/supabase.ts` | ✅ Yes | Public database access |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `app/components/Map.tsx` | ✅ Yes | Map display |
| `NEXT_PUBLIC_BACKEND_URL` | `next.config.js`, `ImageUpload.tsx` | ✅ Yes | Backend API endpoint |

---

## 🚀 Platform-Specific Deployment

### Vercel (Frontend)

In your Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### Render/Railway (Backend)

Add these environment variables in your service settings:

```
SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GROQ_API_KEY=<your-groq-key>
CONFIDENCE_THRESHOLD=0.6
BRIGHTDATA_API_KEY=<your-brightdata-key>
BRIGHTDATA_DATASET_ID=gd_mfz5x93lmsjjjylob
TWITTER_BEARER_TOKEN=<your-bearer-token>
TWITTER_API_KEY=<your-api-key>
TWITTER_API_SECRET=<your-api-secret>
TWITTER_ACCESS_TOKEN=<your-access-token>
TWITTER_ACCESS_TOKEN_SECRET=<your-access-token-secret>
SUBMITTER_EMAIL=potbot@example.com
ALLOW_CORS_ORIGINS=https://your-frontend.vercel.app
BASE_URL=https://your-backend.onrender.com
```

### Docker

Create a `.env` file and use `--env-file` flag:

```bash
docker run --env-file .env -p 8080:8080 your-backend-image
```

---

## ⚠️ Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Rotate keys regularly** - Especially for production
3. **Use separate credentials** - Development vs Production
4. **CORS Configuration** - Always specify exact origins in production
5. **HTTPS Only** - Use HTTPS URLs for all production endpoints

---

## 🧪 Testing Environment Variables

### Validate Backend:
```bash
cd backend
python validate_apis.py
```

### Validate Frontend:
```bash
cd frontend
npm run build  # Will fail if env vars are missing
```

---

## 🔄 Migration from Old Configuration

If upgrading from the old configuration:

1. **Backup existing files:**
   ```bash
   cp backend/.env backend/.env.old
   cp frontend/.env.local frontend/.env.local.old
   ```

2. **Update configurations:**
   - Remove: `SUPABASE_TABLE_NAME`, `UPLOAD_DIRECTORY`, `NEXT_PUBLIC_ENV`
   - Keep all others as documented above

3. **Test thoroughly** before deploying to production

---

**Last Updated:** October 26, 2025
**Configuration Version:** 1.0 (Production Ready)
