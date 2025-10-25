# Groq Vision API Setup Guide

Your app now uses **Groq's Llama 4 Vision API** for fast, reliable civic issue detection!

## Why Groq?

✅ **Fast**: Ultra-low latency inference
✅ **Reliable**: No timeout issues like AgentVerse
✅ **Free tier**: Generous free API usage
✅ **JSON Mode**: Structured outputs guaranteed
✅ **Multimodal**: Text + Vision in one API

## Quick Setup (2 minutes)

### 1. Get Your Free Groq API Key

1. Go to https://console.groq.com
2. Sign up (free, no credit card required)
3. Go to https://console.groq.com/keys
4. Click "Create API Key"
5. Copy your key (starts with `gsk_...`)

### 2. Add Key to .env

Edit `backend/.env` and add your key:

```bash
GROQ_API_KEY=gsk_your_actual_key_here
USE_MOCK_AGENT=false
```

### 3. Restart Your Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 4. Test It!

Upload an image from your frontend. You should see:

```
Mobile image processed and saved as processed_abc123.jpg
Starting AgentVerse analysis for REPORT-XYZ...
Encoding image: uploads/processed_abc123.jpg
Image size: 245.3 KB
Sending request to Groq (meta-llama/llama-4-scout-17b-16e-instruct)...
Received response from Groq
✅ Analysis complete: Road Crack (confidence: 0.87)
```

## Usage Limits (Free Tier)

Groq offers generous free usage:
- **Requests per minute**: 30
- **Requests per day**: 14,400
- **Tokens per minute**: 600,000

More than enough for development and demos!

## Mock Mode (No API Key Needed)

If you don't want to get an API key yet, keep mock mode enabled:

```bash
USE_MOCK_AGENT=true
```

This will return realistic fake data for testing.

## Models Available

### Llama 4 Scout (Default)
- Model ID: `meta-llama/llama-4-scout-17b-16e-instruct`
- Best for: Fast, general-purpose vision tasks
- Context: 128K tokens

### Llama 4 Maverick (Alternative)
- Model ID: `meta-llama/llama-4-maverick-17b-128e-instruct`
- Best for: More complex reasoning
- Context: 128K tokens

To change models, edit `image_agent.py` line 73:
```python
model: str = "meta-llama/llama-4-maverick-17b-128e-instruct"
```

## Features Used

Your integration uses these Groq features:

✅ **Vision API**: Analyzes images with Llama 4 Vision
✅ **JSON Mode**: Forces structured output
✅ **Base64 Images**: Sends processed images directly
✅ **Temperature Control**: 0.3 for consistent outputs

## Troubleshooting

### "GROQ_API_KEY not found"
- Make sure `.env` file exists in `backend/` directory
- Check that the key is properly set (no quotes needed)
- Restart your server after changing `.env`

### Rate Limit Errors
- Free tier: 30 requests/min, 14,400/day
- Wait a moment and try again
- Consider upgrading to paid tier for production

### Invalid Category Returned
- The AI will always choose from your 7 categories
- If uncertain, it defaults to "Road Crack"
- Confidence score reflects certainty

### Image Too Large
- Images are automatically resized to 1024px max
- JPEG quality set to 85% for optimization
- Groq limit: 4MB for base64 images

## Example Response

```json
{
  "tracking_id": "REPORT-ABC12345",
  "status": "analyzed",
  "message": "Issue detected: Road Crack. Large pothole visible in the road surface",
  "issue_type": "Road Crack",
  "confidence": 0.87,
  "tracking_number": null,
  "social_post_url": null,
  "created_at": "2025-10-25T14:30:00"
}
```

## Cost Estimate (Paid Tier)

If you exceed free tier:
- **Llama 4 Scout**: ~$0.0004 per image
- **Llama 4 Maverick**: ~$0.0006 per image

Example: 1,000 images/day = ~$0.40-0.60/day

Much cheaper than OpenAI GPT-4 Vision (~$0.01-0.03 per image)!

## Production Tips

1. **Monitor usage**: Check Groq console for usage stats
2. **Add retry logic**: Handle rate limits gracefully (already built-in)
3. **Cache results**: Store analysis to avoid re-analyzing same images
4. **Batch processing**: Process multiple images if needed

## Next Steps

Now that you have working AI vision:

1. ✅ Build your frontend to display results
2. ✅ Add form submission (Playwright automation)
3. ✅ Integrate Twitter posting
4. ✅ Set up real database
5. ✅ Deploy to production

## Resources

- [Groq Console](https://console.groq.com)
- [Groq Docs - Vision](https://console.groq.com/docs/vision)
- [Groq API Cookbook](https://github.com/groq/groq-api-cookbook)
- [Pricing](https://groq.com/pricing)

---

**You're all set!** 🎉

Get your API key and start detecting civic issues with blazing-fast AI vision.
