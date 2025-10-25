# CivicSight Backend - FastAPI with Groq Vision AI

AI-powered civic infrastructure issue detection backend using Groq's Llama 4 Vision API.

## Features

- **Image Analysis**: AI-powered civic issue detection using Groq Vision
- **Mobile Image Support**: Handles HEIC, JPEG, PNG formats
- **GPS Integration**: Location-aware issue reporting
- **Fast & Reliable**: Groq provides ultra-low latency inference
- **Structured Output**: JSON mode for consistent responses

## Detected Issue Categories

- Road Crack
- Sidewalk Crack
- Graffiti
- Overflowing Trash
- Faded Street Markings
- Broken Street Light
- Fallen Tree

## API Endpoints

### Main Pipeline
- `POST /api/submit-civic-issue` - Upload image with GPS, get AI analysis

### Utility Endpoints
- `GET /` - API info
- `GET /health` - Health check
- `GET /api/reports` - Get all reports
- `GET /api/reports/{report_id}` - Get specific report
- `GET /api/analytics` - Analytics data

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Get Groq API Key

1. Go to https://console.groq.com
2. Sign up (free)
3. Get API key from https://console.groq.com/keys

### 3. Configure Environment

Create `.env` file:

```bash
GROQ_API_KEY=your_groq_api_key_here
USE_MOCK_AGENT=false
```

### 4. Run Server

```bash
uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000/docs for interactive API documentation.

## Usage Example

```bash
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@pothole.jpg" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

**Response:**
```json
{
  "tracking_id": "REPORT-ABC12345",
  "status": "analyzed",
  "message": "Issue detected: Road Crack. Large pothole visible in road surface",
  "issue_type": "Road Crack",
  "confidence": 0.87,
  "created_at": "2025-10-25T14:30:00"
}
```

## File Structure

```
backend/
├── main.py              # FastAPI application & endpoints
├── image_agent.py       # Groq Vision AI integration
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (create this)
├── uploads/             # Processed images storage
├── GROQ_SETUP.md       # Detailed Groq setup guide
└── README.md           # This file
```

## Mock Mode (No API Key)

For testing without a Groq API key, enable mock mode in `.env`:

```bash
USE_MOCK_AGENT=true
```

Returns realistic fake data for development.

## Groq Free Tier Limits

- 30 requests per minute
- 14,400 requests per day
- 600,000 tokens per minute

More than enough for development and demos!

## Next Steps

1. ✅ AI image analysis working
2. 🔨 Add form submission automation (Playwright)
3. 🔨 Add Twitter bot integration
4. 🔨 Replace in-memory database with PostgreSQL/MongoDB
5. 🔨 Deploy to production

## Troubleshooting

See [GROQ_SETUP.md](./GROQ_SETUP.md) for detailed troubleshooting.

**Common Issues:**
- `GROQ_API_KEY not found`: Check `.env` file exists and is properly formatted
- Rate limits: Wait a moment between requests (free tier: 30/min)
- Invalid category: AI always returns one of the 7 valid categories

## Resources

- [Groq Console](https://console.groq.com)
- [Groq Vision Docs](https://console.groq.com/docs/vision)
- [FastAPI Docs](https://fastapi.tiangolo.com)
