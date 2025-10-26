# 🚀 Quick Deploy Reference - SnapDev/Cofoundry.AI

## Backend Deployment

### Build & Start Commands
```bash
# Build
pip install -r requirements.txt

# Start
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
```

### Environment Variables (17 total)
```
SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
GROQ_API_KEY=<your-groq-key>
CONFIDENCE_THRESHOLD=0.6
BRIGHTDATA_API_KEY=<your-brightdata-key>
BRIGHTDATA_DATASET_ID=gd_mfz5x93lmsjjjylob
TWITTER_BEARER_TOKEN=<your-bearer-token>
TWITTER_API_KEY=<your-api-key>
TWITTER_API_SECRET=<your-api-secret>
TWITTER_ACCESS_TOKEN=<your-access-token>
TWITTER_ACCESS_TOKEN_SECRET=<your-access-secret>
APPLOVIN_API_KEY=your_applovin_api_key_here
APPLOVIN_API_BASE_URL=https://api.applovin.com/v1
SF_311_API_KEY=placeholder_sf311_api_key
SUBMITTER_EMAIL=potbot@example.com
ALLOW_CORS_ORIGINS=https://your-frontend-url.com
BASE_URL=https://your-backend-url.com
```

---

## Frontend Deployment

### Build & Start Commands
```bash
# Build
npm install && npm run build

# Start
npm start
```

### Environment Variables (4 total)
```
NEXT_PUBLIC_SUPABASE_URL=https://ybqelfyfhuxdmjobupxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

---

## Service Configuration

### Backend
- **Root Directory:** `backend`
- **Runtime:** Python 3.12
- **Port:** 8080 (or $PORT)
- **Resources:** 1-2 GB RAM

### Frontend
- **Root Directory:** `frontend`
- **Runtime:** Node.js 20+
- **Port:** 3000
- **Resources:** 512 MB - 1 GB RAM

---

## Critical: After Deployment

1. Update `ALLOW_CORS_ORIGINS` with frontend URL
2. Update `NEXT_PUBLIC_BACKEND_URL` with backend URL
3. Update `BASE_URL` with backend URL
4. Test: Visit `https://backend-url/docs`
5. Test: Visit `https://frontend-url`

---

## Status: ✅ PRODUCTION READY
