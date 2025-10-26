from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import asyncio
import json
from datetime import datetime
from PIL import Image
import io
from pillow_heif import register_heif_opener
from image_agent import analyze_image_with_agent
from brightdata_search import search_reporting_form
from playwright_integration import submit_to_sfgov
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

        # Use absolute path for Playwright script compatibility
        uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)  # Ensure directory exists
        file_path = os.path.join(uploads_dir, processed_filename)

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
    tracking_id: str
    status: str
    message: str
    issue_type: Optional[str] = None
    confidence: Optional[float] = None
    reporting_url: Optional[str] = None  # URL to civic reporting form
    location_description: Optional[str] = None  # Specific location details from AI
    form_fields: Optional[dict] = None  # Form-ready fields for Playwright
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
    # 3. Call Agentverse agent for analysis
    # 4. Run Playwright script to submit form
    # 5. Store report data in database
    # 6. Post to Twitter with tracking number
    # 7. Update database with all results
    # 8. Return success response
    
    # Process mobile image (handles HEIC, JPEG, etc.)
    processed_filename, file_path = process_mobile_image(image)

    # Generate unique tracking ID
    tracking_id = f"REPORT-{uuid.uuid4().hex[:8].upper()}"

    print("\n" + "="*80)
    print(f"🚀 STARTING PIPELINE: {tracking_id}")
    print("="*80)
    print(f"📸 Image: {processed_filename}")
    print(f"📍 GPS: ({latitude}, {longitude})")
    print("="*80 + "\n")

    try:
        # Analyze image with Groq Vision AI
        print(f"🔍 Starting AI analysis...")
        analysis_results = await analyze_image_with_agent(
            file_path, latitude, longitude
        )

        print(f"✅ Analysis complete: {analysis_results['category']} (confidence: {analysis_results.get('confidence', 0.85)})")

        # Check if spam/non-civic infrastructure image
        if analysis_results['category'] == "None":
            print(f"❌ Image rejected: Not civic infrastructure")
            response = PipelineResponse(
                tracking_id=tracking_id,
                status="rejected",
                message=f"Image rejected: {analysis_results['Text_Description']}",
                issue_type=None,
                confidence=0.0,
                reporting_url=None,
                location_description=None,
                form_fields=None,
                tracking_number=None,
                social_post_url=None,
                created_at=datetime.now()
            )
        else:
            # Valid civic infrastructure issue detected
            issue_type = analysis_results['category']
            print(f"✓ Valid civic issue detected: {issue_type}")

            # Search for reporting form using BrightData (REQUIRED for Playwright form submission)
            print(f"\n🔍 Searching for reporting form...")
            form_search_result = await search_reporting_form(
                latitude=latitude,
                longitude=longitude,
                issue_type=issue_type
            )

            # Validate that we got a reporting URL (required for form submission)
            if not form_search_result['success']:
                error_msg = form_search_result.get('error', 'Unknown error')
                print(f"❌ Form search failed: {error_msg}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to find reporting form: {error_msg}"
                )

            if not form_search_result.get('top_link') or not form_search_result['top_link'].get('url'):
                print(f"❌ No reporting URL found for {issue_type}")
                raise HTTPException(
                    status_code=500,
                    detail=f"No reporting form URL found for {issue_type}. Cannot proceed with form submission."
                )

            reporting_url = form_search_result['top_link']['url']
            print(f"\n✅ Found reporting form: {reporting_url}")

            # Submit form to SF.gov using Playwright
            print(f"\n🎭 Submitting form to SF.gov via Playwright...")
            playwright_result = await submit_to_sfgov(
                category=issue_type,
                form_fields=analysis_results.get('formFields', {}),
                latitude=latitude,
                longitude=longitude,
                location_description=analysis_results.get('locationDescription', ''),
                request_description=analysis_results.get('Text_Description', ''),
                image_path=file_path
            )

            # Check Playwright submission result
            tracking_number = None
            status = "analyzed"
            message = f"Issue detected: {issue_type}. {analysis_results['Text_Description']}"
            final_tracking_id = tracking_id  # Default to generated ID

            if playwright_result['success']:
                tracking_number = playwright_result.get('tracking_number')
                status = "submitted"

                # Use SF.gov tracking number as primary ID if available
                if tracking_number:
                    final_tracking_id = tracking_number
                    message = f"Issue submitted successfully! Tracking number: {tracking_number}"
                    print(f"✅ Form submitted! Using SF.gov tracking number: {tracking_number}")
                else:
                    message = f"Issue submitted successfully! Internal ID: {tracking_id}"
                    print(f"✅ Form submitted! Using internal tracking ID: {tracking_id}")

                if playwright_result.get('address'):
                    print(f"📍 Address: {playwright_result['address']}")
            else:
                error = playwright_result.get('error', 'Unknown error')
                print(f"⚠️ Form submission failed: {error}")
                message = f"Issue detected: {issue_type}. Form submission failed: {error}"

            response = PipelineResponse(
                tracking_id=final_tracking_id,  # Use SF.gov number if available
                status=status,
                message=message,
                issue_type=issue_type,
                confidence=analysis_results.get('confidence', 0.85),
                reporting_url=reporting_url,
                location_description=analysis_results.get('locationDescription', ''),
                form_fields=analysis_results.get('formFields', {}),
                tracking_number=tracking_number,  # Keep original field for backward compatibility
                social_post_url=None,   # TODO: Add after Twitter post
                created_at=datetime.now()
            )

    except HTTPException:
        # Re-raise HTTPExceptions (form search failures, validation errors)
        raise
    except Exception as e:
        # If agent analysis fails, return basic response
        print(f"Agent analysis failed: {str(e)}")
        response = PipelineResponse(
            tracking_id=tracking_id,
            status="received",
            message=f"Issue submitted successfully. Analysis failed: {str(e)}",
            issue_type=None,
            confidence=None,
            reporting_url=None,
            location_description=None,
            form_fields=None,
            tracking_number=None,
            social_post_url=None,
            created_at=datetime.now()
        )

    #Call script for form submission and get tracking number

    #Post to twitter
    #Update database

    # Store in database (in-memory for now)
    reports_db[tracking_id] = response.model_dump()

    # Print final pipeline response for visibility
    print("\n" + "="*80)
    print("📋 PIPELINE RESPONSE")
    print("="*80)
    print(f"Tracking ID:       {response.tracking_id}")
    print(f"Status:            {response.status}")
    print(f"Issue Type:        {response.issue_type or 'N/A'}")
    print(f"Confidence:        {response.confidence if response.confidence else 'N/A'}")
    print(f"Reporting URL:     {response.reporting_url or 'N/A'}")
    print(f"Location Details:  {response.location_description or 'N/A'}")
    if response.form_fields:
        print(f"Form Fields:       {json.dumps(response.form_fields, indent=19)}")
    print(f"Message:           {response.message[:100]}...")
    print("="*80 + "\n")

    return response

# TEST ENDPOINT for BrightData Form Search
@app.get("/api/test/search-form")
async def test_search_reporting_form(
    latitude: float = Query(..., description="GPS latitude"),
    longitude: float = Query(..., description="GPS longitude"),
    issue_type: str = Query(..., description="Issue type (e.g., 'Road Crack')")
):
    """
    Test endpoint to search for civic reporting forms

    Example:
    GET /api/test/search-form?latitude=37.7749&longitude=-122.4194&issue_type=Road%20Crack
    """
    try:
        result = await search_reporting_form(latitude, longitude, issue_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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