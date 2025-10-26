# 🔐 Environment Setup Guide for PotBot

This guide will help you set up all the API keys needed for the 3-agent pipeline.

## 📋 Quick Setup Checklist

- [ ] Groq Vision API (REQUIRED - Agent #1)
- [ ] Twitter API credentials (REQUIRED - Agent #3)
- [ ] AppLovin Ad Intelligence (OPTIONAL - Agent #3 enhancement)
- [ ] SF 311 API (OPTIONAL - Agent #2 enhancement)

---

## 🚀 Quick Start (Minimum Required)

For CalHacks demo, you only NEED these two:

1. **Groq API Key** - For image analysis
2. **Twitter API credentials** - For posting (5 keys total)

---

## 1️⃣ GROQ VISION API (Agent #1) - REQUIRED ✅

Used for analyzing civic infrastructure images with Llama 4 Vision.

### Setup Steps:

1. Visit: https://console.groq.com/keys
2. Sign up for a free account (no credit card required)
3. Click "Create API Key"
4. Copy your API key (starts with `gsk_`)
5. Add to your `.env` file:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Free Tier:
- **14,400 requests per day** (plenty for CalHacks!)
- Fast inference (~200 tokens/second)
- Access to Llama 4 Vision models

### Optional Settings:
```bash
# Confidence threshold for issue detection (0.0 - 1.0)
CONFIDENCE_THRESHOLD=0.6
```

---

## 2️⃣ TWITTER API (Agent #3) - REQUIRED ✅

Used for posting civic issues to social media with optimized content.

### Why 5 Credentials?

Twitter requires both OAuth 1.0a (for media upload) and OAuth 2.0 (for tweeting):
- **Bearer Token** (OAuth 2.0) - For v2 API
- **API Key + Secret** (OAuth 1.0a) - For authentication
- **Access Token + Secret** (OAuth 1.0a) - For posting on behalf of user

### Setup Steps:

#### Step 1: Create Twitter Developer Account

1. Go to: https://developer.twitter.com/
2. Sign in with your Twitter account
3. Click "Sign up for Free Account"
4. Fill out the application:
   - **Use case:** Civic tech / Hackathon project
   - **Description:** "Automated civic infrastructure reporting system for CalHacks"
5. Wait for approval (usually instant to 15 minutes)

#### Step 2: Create a Twitter App

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Click "Create Project"
3. Project details:
   - **Name:** "PotBot CalHacks" (or your project name)
   - **Use case:** "Making API requests"
   - **Description:** "Civic infrastructure reporting bot"
4. Click "Create App" within the project
5. **App name:** "potbot-agent" (must be unique on Twitter)
6. Save your **API Key** and **API Secret** (you'll need these!)

#### Step 3: Configure App Settings

1. In your app dashboard, go to **"Settings"** tab
2. Scroll to "User authentication settings"
3. Click **"Set up"**
4. Configure OAuth 1.0a:
   - **App permissions:** ✅ **Read and Write** (NOT read-only!)
   - **Type of App:** Web App
   - **Callback URL:** `http://localhost:8000/callback`
   - **Website URL:** `http://localhost:3000`
5. Save settings

#### Step 4: Generate Access Tokens

1. Go to **"Keys and Tokens"** tab
2. Under "Access Token and Secret", click **"Generate"**
3. Save all credentials:
   ```
   API Key (Consumer Key)
   API Secret (Consumer Secret)
   Access Token
   Access Token Secret
   ```

#### Step 5: Get Bearer Token

1. Still in **"Keys and Tokens"** tab
2. Under "Bearer Token", click **"Generate"**
3. Copy the Bearer Token

#### Step 6: Request Elevated Access (Important!)

Twitter Free tier has limited media upload. For reliable posting:

1. Go to: https://developer.twitter.com/en/portal/products/elevated
2. Click **"Apply for Elevated"**
3. Fill out form (takes 5-10 minutes)
4. Usually approved in 1-24 hours

**Without Elevated:** Posts work but may have upload limits  
**With Elevated:** Full media upload capability

#### Step 7: Add to .env File

Create `backend/.env` file:

```bash
# Twitter API v2 Bearer Token (OAuth 2.0)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twitter API OAuth 1.0a Credentials
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testing Twitter Setup

Run this to test your Twitter credentials:

```bash
cd backend
python3 -c "
import os
from dotenv import load_dotenv
import tweepy

load_dotenv()

client = tweepy.Client(
    bearer_token=os.getenv('TWITTER_BEARER_TOKEN'),
    consumer_key=os.getenv('TWITTER_API_KEY'),
    consumer_secret=os.getenv('TWITTER_API_SECRET'),
    access_token=os.getenv('TWITTER_ACCESS_TOKEN'),
    access_token_secret=os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
)

try:
    user = client.get_me()
    print(f'✅ Twitter API working! Authenticated as: @{user.data.username}')
except Exception as e:
    print(f'❌ Twitter API error: {e}')
"
```

---

## 3️⃣ APPLOVIN AD INTELLIGENCE (Agent #3) - OPTIONAL 🎯

Used for analyzing 1000s of viral civic posts to optimize your social media content.

### What is AppLovin Ad Intelligence?

AppLovin's Ad Intelligence API lets you analyze millions of ad creatives to understand what makes content go viral. We use it to:
- Find top-performing civic posts in your neighborhood
- Extract viral features (hashtags, text length, emoji usage)
- Optimize post timing and CTAs
- Analyze district-specific engagement patterns

### Setup Steps:

1. Visit: https://www.applovin.com/ad-intelligence/
2. Sign up for an account
3. Request API access (may require contacting sales)
4. Get your API key from the dashboard
5. Add to `.env`:

```bash
APPLOVIN_API_KEY=your_applovin_api_key_here
APPLOVIN_API_BASE_URL=https://api.applovin.com/v1
```

### If You Don't Have AppLovin:

**No problem!** The app includes realistic mock data that demonstrates:
- Geographic optimization (SF vs Oakland vs Berkeley)
- Category-specific patterns (potholes vs graffiti)
- City-specific viral features
- 100-1000 analyzed posts per location

The mock data is based on real civic engagement research and shows exactly what the real API would return.

---

## 4️⃣ SF 311 API (Agent #2) - OPTIONAL 🏛️

Used for submitting real reports to San Francisco's 311 system.

### Setup Steps:

1. Visit: https://sf311.org/api
2. Request API access
3. Get your API key
4. Add to `.env`:

```bash
SF_311_API_KEY=your_sf311_api_key_here
```

### If You Don't Have SF 311 API:

The app automatically generates realistic demo tracking numbers:
- Format: `SF311-2025-XXXXXX`
- Looks like real 311 tracking numbers
- Works great for CalHacks demo

---

## 📄 Complete .env File Template

Create `backend/.env` with this template:

```bash
# ============================================================================
# REQUIRED APIs
# ============================================================================

# Agent #1: Groq Vision API (Image Analysis)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CONFIDENCE_THRESHOLD=0.6

# Agent #3: Twitter API (Social Media Publishing)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# OPTIONAL APIs
# ============================================================================

# Agent #3: AppLovin Ad Intelligence (Social Media Optimization)
# APPLOVIN_API_KEY=your_applovin_api_key_here
# APPLOVIN_API_BASE_URL=https://api.applovin.com/v1

# Agent #2: SF 311 API (City Form Submission)
# SF_311_API_KEY=your_sf311_api_key_here

# Optional: Submitter Info
# SUBMITTER_EMAIL=your_email@example.com
# SUBMITTER_PHONE=+1-555-0100

# ============================================================================
# DEVELOPMENT SETTINGS
# ============================================================================

ENVIRONMENT=development
PORT=8000
LOG_LEVEL=INFO

# Demo mode (uses mock data for all optional APIs)
DEMO_MODE=false
```

---

## 🧪 Testing Your Setup

### Test Individual Agents:

```bash
cd backend

# Test Agent #1 (Image Analysis)
python image_agent.py path/to/pothole.jpg

# Test Agent #2 (Form Submission)
python form_submission_agent.py

# Test Agent #3 (Social Media)
python social_media_agent.py

# Test AppLovin Analyzer
python applovin_analyzer.py
```

### Test Full Pipeline:

```bash
# Start the FastAPI server
cd backend
uvicorn main:app --reload --port 8000

# In another terminal, test with curl
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@pothole.jpg" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

---

## 🐛 Troubleshooting

### "Twitter API Error: 403 Forbidden"
- **Cause:** App doesn't have Read & Write permissions
- **Fix:** Go to app settings → User authentication → Change to "Read and Write"

### "Twitter API Error: Could not authenticate you"
- **Cause:** Wrong credentials or expired tokens
- **Fix:** Regenerate tokens in Developer Portal → Keys and Tokens

### "Groq API Error: Invalid API key"
- **Cause:** API key copied incorrectly
- **Fix:** Make sure key starts with `gsk_` and has no extra spaces

### "Media upload failed"
- **Cause:** Need Elevated access for media upload
- **Fix:** Apply for Elevated access in Twitter Developer Portal

### "ModuleNotFoundError: No module named 'tweepy'"
- **Cause:** Dependencies not installed
- **Fix:** Run `pip install -r requirements.txt`

---

## 🎓 CalHacks Tips

### Minimum Setup for Demo:
1. **Groq API** (5 minutes to set up)
2. **Twitter API** (15-30 minutes to set up)
3. Use mock data for AppLovin and SF 311

### Recommended for Full Demo:
- Set up all APIs
- Request Twitter Elevated access (may take hours, do early!)
- Test pipeline before demo day

### During Demo:
- Have backup screenshots in case API limits hit
- Explain mock data is based on real civic engagement research
- Show the optimization logic even if using mock data

---

## 📚 Additional Resources

- [Groq API Docs](https://console.groq.com/docs)
- [Twitter API Docs](https://developer.twitter.com/en/docs/twitter-api)
- [AppLovin Ad Intelligence](https://www.applovin.com/ad-intelligence/)
- [SF Open311 API](https://sf311.org/api)

---

## 🆘 Need Help?

**Twitter API Issues:** Most common problem is permissions. Make sure:
1. App has "Read and Write" permissions (not Read-only)
2. You regenerated tokens AFTER changing permissions
3. You're using OAuth 1.0a credentials (not just Bearer Token)

**Groq API Issues:** Make sure:
1. API key is correctly copied (starts with `gsk_`)
2. No spaces or newlines in the key
3. Account is verified

**Still stuck?** Check the troubleshooting section above or create an issue in the repo.

---

**Good luck with CalHacks! 🚀**

