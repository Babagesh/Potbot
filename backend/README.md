# Infrastructure Damage Reporter - Python FastAPI Backend

This is a Python FastAPI backend for the Infrastructure Damage Reporter application, designed to be deployed on Vercel.

## Features

- **Image Upload**: Handle image uploads with metadata
- **File Validation**: Validate file types and sizes
- **CORS Support**: Configured for frontend integration
- **Vercel Compatible**: Ready for serverless deployment

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/upload` - Upload image with metadata
- `POST /api/v1/process` - Trigger CV processing
- `GET /api/v1/results/{image_id}` - Get processing results
- `GET /api/v1/history` - Get upload history

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload --port 3001
```

## Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

The `vercel.json` configuration file is already set up for Python deployment.

## Environment Variables

Create a `.env` file for local development:
```
# Add any environment variables here
```

## File Structure

```
backend/
├── main.py              # FastAPI application
├── api/
│   └── index.py         # Vercel serverless entry point
├── requirements.txt     # Python dependencies
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## Notes

- The backend is designed to replace the Node.js Express server
- All endpoints match the original API specification
- File uploads are saved to the `uploads/` directory
- CORS is configured to allow all origins (configure properly for production)