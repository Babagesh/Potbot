# 🎯 Updated Setup - Using snscrape (NO API KEYS!)

## ✅ What Changed

**OLD:** Required Twitter API (5 credentials)  
**NEW:** Uses `snscrape` - NO API KEYS NEEDED!

**OLD:** AppLovin API (doesn't exist)  
**NEW:** Already using mock data (no changes needed)

---

## 🚀 Quick Setup (5 Minutes!)

### **Step 1: Install snscrape**

```bash
cd /Users/yongjaelee/Potbot/backend
pip3 install snscrape
```

### **Step 2: Verify Installation**

```bash
snscrape --version
```

Should show: `snscrape 0.x.x`

### **Step 3: Test Scraping**

```bash
python3 corpus_scraper.py
```

**What happens:**
- Scrapes real tweets from Twitter (no login!)
- Searches for civic posts in Mission District
- Searches for general viral posts
- Saves to `corpus_data/`

---

## 📝 Your .env File (Simplified!)

You now ONLY need Groq:

```bash
# Agent #1: Groq Vision API (REQUIRED)
GROQ_API_KEY=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

# Optional settings
CONFIDENCE_THRESHOLD=0.6
```

**That's it!** No Twitter API credentials needed! 🎉

---

## 🔍 How snscrape Works

### **Location-Based Scraping:**

```python
# Searches for tweets mentioning both keyword AND location
query = '"pothole" "Mission District" since:2024-01-01 lang:en'

# Examples:
"graffiti" "Mission District"      # Civic posts
"Mission District" min_faves:50    # General viral posts
"311" "San Francisco"              # City reports
```

### **What It Finds:**

- ✅ Tweets mentioning the location
- ✅ Engagement data (likes, retweets)
- ✅ Hashtags
- ✅ Tweet text
- ✅ NO API key required!

### **Limitations:**

- Can't filter by exact GPS coordinates
- Uses text matching for location
- Slower than official API
- **BUT: It's FREE and works great!**

---

## 🧪 Test Commands

### **1. Install snscrape:**
```bash
pip3 install snscrape
```

### **2. Quick test:**
```bash
snscrape --jsonl --max-results 5 twitter-search '"Mission District" pothole'
```

Should show 5 tweets about potholes in Mission District!

### **3. Run full scraper:**
```bash
python3 corpus_scraper.py
```

### **4. Extract features:**
```bash
python3 feature_extractor.py
```

### **5. Test pipeline:**
```bash
python3 test_pipeline.py pothole.jpg 37.7749 -122.4194
```

---

## 📊 What You'll Get

### **Civic Posts Example:**
```json
{
  "id": "1234567890",
  "text": "Huge pothole on Mission St! @SF311 please fix #FixSF",
  "engagement": 342,
  "likes": 205,
  "retweets": 89,
  "hashtags": ["FixSF", "SF311"]
}
```

### **General Viral Posts Example:**
```json
{
  "id": "9876543210",
  "text": "Best tacos in Mission District! 🌮 #MissionDistrict #SF",
  "engagement": 856,
  "likes": 612,
  "retweets": 178,
  "hashtags": ["MissionDistrict", "SF"]
}
```

---

## ✅ Complete Setup Checklist

- [ ] Install snscrape: `pip3 install snscrape`
- [ ] Verify Groq API in .env (you already have this!)
- [ ] Run scraper: `python3 corpus_scraper.py`
- [ ] Wait 2-5 minutes (scraping takes time)
- [ ] Check `corpus_data/` folder for results
- [ ] Run feature extractor: `python3 feature_extractor.py`
- [ ] Test pipeline: `python3 test_pipeline.py pothole.jpg`

---

## 🎯 Benefits of snscrape

✅ **No API key** - Just install and go!  
✅ **No rate limits** - (well, Twitter might block if too aggressive)  
✅ **Location filtering** - Searches by text mentions  
✅ **Free forever** - Open source tool  
✅ **Perfect for hackathons** - Quick setup  
✅ **Real data** - Actual tweets from Twitter  

---

## 🚨 Troubleshooting

### **"snscrape command not found"**
```bash
# Install it
pip3 install snscrape

# Or if pip3 doesn't work:
python3 -m pip install snscrape
```

### **"No tweets found"**
- Twitter might be rate limiting
- Try different search terms
- Falls back to sample data (still works!)

### **Scraping is slow**
- Normal! Scraping takes 2-5 minutes
- Let it finish - don't interrupt
- It's downloading real tweets

---

## 🎉 You're Ready!

Now run:

```bash
cd /Users/yongjaelee/Potbot/backend
pip3 install snscrape
python3 corpus_scraper.py
```

**NO API KEYS NEEDED!** 🚀

