# 🚀 PotBot Backend - Quick Start Guide

CalHacks project for automated civic infrastructure reporting with AI agents.

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up API Keys (Required)

Create a `.env` file:

```bash
# Get Groq API key from: https://console.groq.com/keys
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Get Twitter API credentials from: https://developer.twitter.com/
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**📖 Detailed setup:** See `ENV_SETUP.md`

### 3. Validate Your Setup

```bash
python validate_apis.py
```

This will test all your API credentials and tell you what's working!

### 4. Start the Backend

```bash
uvicorn main:app --reload --port 8000
```

Backend will be running at: http://localhost:8000

### 5. Test the Pipeline

```bash
# Test individual agents
python image_agent.py pothole.jpg
python form_submission_agent.py
python social_media_agent.py

# Test full pipeline
python test_pipeline.py pothole.jpg 37.7749 -122.4194
```

---

## 🤖 How It Works

PotBot uses a 3-agent pipeline:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  AGENT #1   │ ───> │  AGENT #2   │ ───> │  AGENT #3   │
│   Image     │      │    Form     │      │   Social    │
│  Analysis   │      │ Submission  │      │   Media     │
└─────────────┘      └─────────────┘      └─────────────┘
    Groq Vision         SF 311 API          Twitter +
   Llama 4 Scout                           AppLovin AI
```

### Agent #1: Image Analysis
- **Tech:** Groq Vision API (Llama 4 Scout)
- **Input:** Photo of civic issue + GPS coordinates
- **Output:** Issue type, description, confidence score
- **File:** `image_agent.py`

### Agent #2: Form Submission
- **Tech:** City 311 APIs (SF 311, SeeClickFix)
- **Input:** Issue details from Agent #1
- **Output:** City tracking number, address
- **File:** `form_submission_agent.py`

### Agent #3: Social Media Publishing
- **Tech:** Twitter API + AppLovin Ad Intelligence
- **Input:** Issue details + tracking number
- **Process:** Analyzes 100-1000 viral civic posts in area
- **Output:** Optimized post, published to Twitter
- **Files:** `social_media_agent.py`, `applovin_analyzer.py`

---

## 📡 API Endpoints

### Main Pipeline Endpoint

```bash
POST /api/submit-civic-issue
```

**Request:**
```bash
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@pothole.jpg" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

**Response:**
```json
{
  "tracking_id": "REPORT-A3B5C7D9",
  "status": "completed",
  "message": "Issue successfully reported!",
  "issue_type": "Road Crack",
  "confidence": 0.92,
  "tracking_number": "SF311-2025-123456",
  "social_post_url": "https://twitter.com/user/status/123456",
  "created_at": "2025-01-01T12:00:00"
}
```

### Utility Endpoints

```bash
GET  /                              # API info
GET  /health                        # Health check
GET  /api/reports/{report_id}       # Get report status
GET  /api/reports                   # List all reports
GET  /api/analytics                 # Get analytics
```

---

## 🧪 Testing

### Validate APIs
```bash
python validate_apis.py
```
✅ Tests all API credentials  
✅ Provides helpful error messages  
✅ Shows which features are available

### Test Individual Agents

```bash
# Test Agent #1 - Image Analysis
python image_agent.py pothole.jpg

# Test Agent #2 - Form Submission
python form_submission_agent.py

# Test Agent #3 - Social Media
python social_media_agent.py

# Test AppLovin Analyzer
python applovin_analyzer.py
```

### Test Full Pipeline

```bash
# With default SF location
python test_pipeline.py pothole.jpg

# With custom location
python test_pipeline.py pothole.jpg 37.7749 -122.4194

# Run full test suite
python test_pipeline.py suite
```

---

## 🌟 AppLovin Ad Intelligence Integration

The coolest part! Agent #3 uses AppLovin to analyze viral civic posts:

### What It Does:
1. **Finds 100-1000 viral posts** in your neighborhood
2. **Extracts features:**
   - Optimal text length
   - Top-performing hashtags
   - Emoji usage patterns
   - CTA effectiveness
   - Best posting times
3. **Applies insights** to optimize your post
4. **Posts to Twitter** with maximum engagement potential

### How to Use:

**With Real AppLovin API:**
```bash
# Add to .env
APPLOVIN_API_KEY=your_api_key_here
```

**Without AppLovin API:**
- App uses realistic mock data
- Based on civic engagement research
- City-specific patterns (SF vs Oakland)
- Category-specific optimization
- Works great for demos!

---

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI app + main pipeline
├── image_agent.py               # Agent #1: Image analysis
├── form_submission_agent.py     # Agent #2: Form submission
├── social_media_agent.py        # Agent #3: Social media
├── applovin_analyzer.py         # AppLovin integration
├── validate_apis.py             # API validation helper
├── test_pipeline.py             # E2E testing script
├── requirements.txt             # Python dependencies
├── ENV_SETUP.md                 # Detailed API setup guide
└── QUICK_START.md              # This file
```

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `GROQ_API_KEY` - Groq Vision API key
- `TWITTER_BEARER_TOKEN` - Twitter OAuth 2.0
- `TWITTER_API_KEY` - Twitter OAuth 1.0a
- `TWITTER_API_SECRET` - Twitter OAuth 1.0a
- `TWITTER_ACCESS_TOKEN` - Twitter user token
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter token secret

**Optional:**
- `APPLOVIN_API_KEY` - AppLovin Ad Intelligence
- `SF_311_API_KEY` - SF 311 API
- `CONFIDENCE_THRESHOLD` - Detection threshold (0.6)

### Feature Flags

```bash
# Enable/disable agents
ENABLE_AGENT_1=true
ENABLE_AGENT_2=true
ENABLE_AGENT_3=true

# Use mock data
DEMO_MODE=false
```

---

## 🐛 Troubleshooting

### "Groq API Error"
```bash
# Check API key
echo $GROQ_API_KEY

# Should start with gsk_
# Get from: https://console.groq.com/keys
```

### "Twitter Authentication Failed"
```bash
# Most common: App doesn't have Write permissions
# Fix:
# 1. Go to Developer Portal → App Settings
# 2. User authentication → Read and Write
# 3. Regenerate tokens AFTER changing permissions
```

### "Module Not Found"
```bash
# Install dependencies
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn groq tweepy
```

### "Image Rejected"
```bash
# Agent #1 filters non-civic images
# Make sure image shows:
# - Potholes, cracks, graffiti, etc.
# - Not indoor scenes, people, or random objects
```

---

## 📊 Performance

Typical pipeline timing:
- **Agent #1:** 1-3 seconds (Groq Vision)
- **Agent #2:** 0.5-2 seconds (Geocoding + form)
- **Agent #3:** 2-5 seconds (AppLovin + Twitter)
- **Total:** 4-10 seconds end-to-end

---

## 🎓 For CalHacks Judges

### Innovation Highlights:

1. **3-Agent Architecture**
   - Modular, scalable design
   - Each agent can be improved independently
   - Easy to add new agents (email, SMS, etc.)

2. **AppLovin Ad Intelligence**
   - Novel use case: civic engagement optimization
   - Analyzes 1000s of posts in real-time
   - Geographic + category-specific insights
   - Demonstrates advanced feature extraction

3. **Real-World Impact**
   - Addresses actual problem (unreported civic issues)
   - Uses real APIs (SF 311, Twitter)
   - Production-ready architecture

4. **Robust Error Handling**
   - Graceful fallbacks for all APIs
   - Mock data maintains UX
   - Comprehensive validation

### Tech Stack:
- **AI/ML:** Groq (Llama 4 Vision), AppLovin ML
- **APIs:** Twitter, SF 311, OpenStreetMap
- **Backend:** FastAPI, Python asyncio
- **Frontend:** Next.js, React, TypeScript

---

## 📚 Documentation

- **`ENV_SETUP.md`** - Detailed API setup instructions
- **`QUICK_START.md`** - This file
- **`VALIDATION_LOGIC.md`** - Image validation logic
- **`GROQ_SETUP.md`** - Groq API setup

---

## 🤝 Need Help?

1. **Check validation:** `python validate_apis.py`
2. **Read detailed setup:** `ENV_SETUP.md`
3. **Test individual agents** before full pipeline
4. **Look at terminal output** - very detailed!

---

## 🎉 You're Ready!

If `validate_apis.py` shows ✅ for Groq and Twitter, you're good to go!

Start the server:
```bash
uvicorn main:app --reload
```

Test the pipeline:
```bash
python test_pipeline.py pothole.jpg
```

**Happy hacking! 🚀**

