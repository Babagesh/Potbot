from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import asyncio
from datetime import datetime
from PIL import Image
import io
from pillow_heif import register_heif_opener

# Register HEIF opener for HEIC support
register_heif_opener()

app = FastAPI(title="CivicSight API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads folder
os.makedirs("uploads", exist_ok=True)

def process_mobile_image(image_file: UploadFile) -> tuple[str, str]:
    """
    Process mobile images (HEIC, JPEG) and convert to standard format
    Returns: (processed_filename, file_path)
    """
    # Read the uploaded file
    content = image_file.file.read()
    image_file.file.seek(0)  # Reset file pointer
    
    # Get original filename and extension
    original_filename = image_file.filename or "unknown"
    original_ext = os.path.splitext(original_filename)[1].lower()
    
    try:
        # Open image with PIL (handles HEIC, JPEG, PNG, etc.)
        image = Image.open(io.BytesIO(content))
        
        # Convert to RGB if necessary (HEIC -> RGB)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Generate new filename (always save as .jpg for consistency)
        processed_filename = f"processed_{uuid.uuid4().hex[:8]}.jpg"
        file_path = os.path.join("uploads", processed_filename)
        
        # Save as JPEG (universally compatible)
        image.save(file_path, "JPEG", quality=85, optimize=True)
        
        return processed_filename, file_path
        
    except Exception as e:
        # If PIL can't handle it, save original file
        fallback_filename = f"original_{uuid.uuid4().hex[:8]}{original_ext}"
        file_path = os.path.join("uploads", fallback_filename)
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        return fallback_filename, file_path

# Pydantic models
class PipelineResponse(BaseModel):
    report_id: str
    status: str
    message: str
    issue_type: Optional[str] = None
    confidence: Optional[float] = None
    tracking_number: Optional[str] = None
    social_post_url: Optional[str] = None
    created_at: datetime

# In-memory storage (replace with database)
reports_db = {}

@app.get("/")
def home():
    return {"message": "CivicSight API - AI Agents for Civic Issue Detection"}

@app.get("/health")
def health():
    return {"status": "OK", "timestamp": datetime.now()}

# MAIN PIPELINE API - Single endpoint that handles everything
@app.post("/api/submit-civic-issue", response_model=PipelineResponse)
async def submit_civic_issue(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Main pipeline: Upload image with GPS coordinates
    -> Analyze with Agentverse agent
    -> Submit form with Playwright
    -> Post to Twitter
    """
    # TODO: Implement the full pipeline
    # 1. Generate unique report ID
    # 2. Save uploaded image to uploads directory
    # 3. Store report data in database
    # 4. Call Agentverse agent for analysis
    # 5. Run Playwright script to submit form
    # 6. Post to Twitter with tracking number
    # 7. Update database with all results
    # 8. Return success response
    
    # Process mobile image (handles HEIC, JPEG, etc.)
    processed_filename, file_path = process_mobile_image(image)
    print(f'Mobile image processed and saved as {processed_filename} (GPS: {latitude}, {longitude})')

    image_analysis_results = await analyze_with_agent(file_path, latitude, longitude)
    
    
    
        
       

# ASYNC HELPER FUNCTIONS (implement these)
async def analyze_with_agent(image_path: str, lat: float, lng: float):
    """Call Agentverse agent for image analysis"""
    # TODO: Implement Agentverse API call
    # - Send image to your configured agent
    # - Parse JSON response
    # - Return analysis results
    pass

async def submit_city_form(analysis_data: dict, lat: float, lng: float):
    """Run Playwright script to submit form to city department"""
    # TODO: Implement Playwright automation
    # - Determine correct city department based on location
    # - Fill out form with analysis data
    # - Submit form and get tracking number
    # - Return tracking number
    pass

async def post_to_twitter(tracking_number: str, issue_data: dict):
    """Post tracking number and issue details to Twitter"""
    # TODO: Implement Twitter bot
    # - Create tweet with tracking number and issue details
    # - Post to Twitter
    # - Return social post URL
    pass

# UTILITY ENDPOINTS (for testing/debugging)
@app.get("/api/reports/{report_id}")
def get_report_status(report_id: str):
    """Get status of a specific report"""
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports_db[report_id]

@app.get("/api/reports")
def get_all_reports():
    """Get all reports for map visualization"""
    return {"reports": list(reports_db.values()), "total": len(reports_db)}

@app.get("/api/analytics")
def get_analytics():
    """Get analytics data for dashboard"""
    # TODO: Calculate analytics from reports_db
    return {"total_reports": len(reports_db), "status_breakdown": {}}

# TODO: Add database integration
# TODO: Add error handling and logging
# TODO: Add authentication if needed
# TODO: Add rate limiting