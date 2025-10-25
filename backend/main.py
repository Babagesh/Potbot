from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uuid
import json
from datetime import datetime
from typing import Optional
import aiofiles
from PIL import Image
import io

app = FastAPI(
    title="Infrastructure Damage Reporter API",
    description="Backend API for infrastructure damage reporting with computer vision processing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Infrastructure Damage Reporter API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Backend server is running"}

@app.post("/api/v1/upload")
async def upload_image(
    image: UploadFile = File(...),
    metadata: str = Form("{}")
):
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Check file size (10MB limit)
        content = await image.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
        
        # Generate unique filename
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Parse metadata
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            metadata_dict = {}
        
        # Generate response
        image_id = str(uuid.uuid4())
        response = {
            "success": True,
            "message": "Image uploaded successfully",
            "data": {
                "id": image_id,
                "filename": unique_filename,
                "originalName": image.filename,
                "path": file_path,
                "size": len(content),
                "type": image.content_type,
                "uploadedAt": datetime.now().isoformat(),
                "metadata": metadata_dict,
                "processingStatus": "pending"
            }
        }
        
        print(f"Image uploaded: {image_id}, filename: {unique_filename}")
        print(f"Has GPS: {bool(metadata_dict.get('location'))}")
        
        return JSONResponse(status_code=201, content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/process")
async def process_image(data: dict):
    image_id = data.get("imageId")
    
    if not image_id:
        raise HTTPException(status_code=400, detail="imageId is required")
    
    # TODO: Implement actual CV processing
    # This would trigger your computer vision models
    
    return {
        "success": True,
        "message": "Processing started",
        "imageId": image_id,
        "status": "processing"
    }

@app.get("/api/v1/results/{image_id}")
async def get_results(image_id: str):
    # TODO: Fetch results from database
    # This is a mock response
    return {
        "id": image_id,
        "status": "completed",
        "damageType": "pothole",
        "severity": "moderate",
        "confidence": 0.89,
        "analysis": {
            "description": "Medium-sized pothole detected",
            "recommendations": ["Schedule repair within 30 days"]
        },
        "processedAt": datetime.now().isoformat()
    }

@app.get("/api/v1/history")
async def get_history(limit: int = 50, offset: int = 0):
    # TODO: Fetch from database
    return {
        "data": [],
        "total": 0,
        "limit": limit,
        "offset": offset
    }

# Vercel handler
handler = app
