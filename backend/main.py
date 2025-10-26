from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
from form_submission_agent import submit_civic_issue_to_city
from social_media_agent import publish_civic_issue_to_social_media
from database_helper import DatabaseHelper
from supabase_client import SupabaseDB
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Register HEIF opener for HEIC support
register_heif_opener()

app = FastAPI(title="CivicSight API", version="1.0.0")

# CORS middleware - Use environment variable for allowed origins
allowed_origins = os.getenv("ALLOW_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file server for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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

    # Generate unique tracking ID as UUID
    tracking_id = str(uuid.uuid4())

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

        print(f"\n✅ Agent #1 Complete: {analysis_results['category']}")
        print(f"✅ Analysis complete: {analysis_results['category']} (confidence: {analysis_results.get('confidence', 0.85)})")

        # Check if spam/non-civic infrastructure image
        if analysis_results['category'] == "None":
            print(f"⚠️ Image rejected: {analysis_results['Text_Description']}")
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
            # ================================================================
            # AGENT #2: Submit to City Department & Get Tracking Number
            # ================================================================
            print(f"\n{'='*60}")
            print(f"📋 AGENT #2: Form Submission to City")
            print(f"{'='*60}")
            
            form_submission_result = await submit_civic_issue_to_city(
                category=analysis_results['category'],
                description=analysis_results['Text_Description'],
                latitude=latitude,
                longitude=longitude,
                confidence=analysis_results['confidence'],
                image_path=file_path,
                tracking_id=tracking_id
            )
            
            city_tracking_number = form_submission_result['tracking_number']
            address = form_submission_result['address']
            
            print(f"\n✅ Agent #2 Complete: {city_tracking_number}")
            print(f"📍 Address: {address}")
            
            # ================================================================
            # AGENT #3: Post to Social Media with AppLovin Optimization
            # ================================================================
            print(f"\n{'='*60}")
            print(f"🐦 AGENT #3: Social Media Publishing")
            print(f"{'='*60}")
            
            social_media_result = await publish_civic_issue_to_social_media(
                # Agent #1 data
                image_path=file_path,
                category=analysis_results['category'],
                description=analysis_results['Text_Description'],
                latitude=latitude,
                longitude=longitude,
                confidence=analysis_results['confidence'],
                tracking_id=tracking_id,
                
                # Agent #2 data
                tracking_number=city_tracking_number,
                address=address
            )
            
            post_url = social_media_result.get('post_url')
            
            print(f"\n✅ Agent #3 Complete")
            if post_url:
                print(f"🔗 Post URL: {post_url}")
            else:
                print(f"⚠️ Social media post created (demo mode)")
            
            # ================================================================
            # PIPELINE COMPLETE
            # ================================================================
            print(f"\n{'='*60}")
            print(f"✅ ALL AGENTS COMPLETE - PIPELINE SUCCESS")
            print(f"{'='*60}")
            print(f"🆔 Tracking ID: {tracking_id}")
            print(f"🔢 City Tracking: {city_tracking_number}")
            print(f"📍 Address: {address}")
            if post_url:
                print(f"🐦 Social Media: {post_url}")
            print(f"{'='*60}\n")
            
            # Build success response
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
                address = playwright_result.get('address', 'Address not available')
                status = "submitted"

                # Use SF.gov tracking number as primary ID if available
                if tracking_number:
                    final_tracking_id = tracking_number
                    message = f"Issue submitted successfully! Tracking number: {tracking_number}"
                    print(f"✅ Form submitted! Using SF.gov tracking number: {tracking_number}")
                else:
                    message = f"Issue submitted successfully! Internal ID: {tracking_id}"
                    print(f"✅ Form submitted! Using internal tracking ID: {tracking_id}")

                if address:
                    print(f"📍 Address: {address}")

                # Call Agent #3: Social Media Publishing (only if form submission succeeded)
                social_post_url = None
                if tracking_number:  # Only post to social media if we have a real tracking number
                    print(f"\n🐦 Agent #3: Publishing to social media...")
                    try:
                        social_media_result = await publish_civic_issue_to_social_media(
                            # Agent #1 data
                            image_path=file_path,
                            category=issue_type,
                            description=analysis_results.get('Text_Description', ''),
                            latitude=latitude,
                            longitude=longitude,
                            confidence=analysis_results.get('confidence', 0.85),
                            tracking_id=final_tracking_id,
                            # Agent #2 data
                            tracking_number=tracking_number,
                            address=address
                        )

                        if social_media_result['success']:
                            social_post_url = social_media_result.get('post_url')
                            print(f"✅ Posted to social media: {social_post_url}")
                            message = f"Issue submitted! Tracking: {tracking_number}. Posted: {social_post_url}"
                        else:
                            # Silently skip if social media fails (rate limits, etc.)
                            pass

                    except Exception as e:
                        # Silently continue - social media failure shouldn't fail the whole pipeline
                        pass

            else:
                error = playwright_result.get('error', 'Unknown error')
                print(f"⚠️ Form submission failed: {error}")
                message = f"Issue detected: {issue_type}. Form submission failed: {error}"
                social_post_url = None

            response = PipelineResponse(
                tracking_id=final_tracking_id,  # Use SF.gov number if available
                status=status,
                message=message,
                issue_type=issue_type,
                confidence=analysis_results.get('confidence', 0.85),
                reporting_url=reporting_url,
                location_description=analysis_results.get('locationDescription', ''),
                form_fields=analysis_results.get('formFields', {}),
                tracking_number=tracking_number,
                social_post_url=social_post_url,
                created_at=datetime.now()
            )

    except HTTPException:
        # Re-raise HTTPExceptions (form search failures, validation errors)
        raise
    except Exception as e:
        # If any agent fails, return error response
        print(f"\n❌ PIPELINE FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        
        response = PipelineResponse(
            tracking_id=tracking_id,
            status="error",
            message=f"Pipeline error: {str(e)}",
            issue_type=None,
            confidence=None,
            reporting_url=None,
            location_description=None,
            form_fields=None,
            tracking_number=None,
            social_post_url=None,
            created_at=datetime.now()
        )

    # Store in database (Supabase)
    try:
        # Generate public URL for the image that works properly in production
        base_url = os.environ.get('BASE_URL', 'http://localhost:8080')
        # ALWAYS use absolute URL for database storage (works in both dev and prod)
        image_url = f"{base_url}/uploads/{processed_filename}" if processed_filename else None
        print(f"📷 Image URL (absolute): {image_url}")
        
        # Prepare record for database - use the numeric tracking ID format
        db_record = None
        try:
            # Use the tracking ID directly - we've modified the schema to accept TEXT instead of UUID
            db_tracking_id = response.tracking_id
            
            # If tracking number is available from form submission, use that as tracking_id
            if response.tracking_number:
                db_tracking_id = response.tracking_number
            
            # Try to extract numeric tracking number from description text (like "101002861293")
            elif response.message and "Tracking number:" in response.message:
                try:
                    # Extract the tracking number using a simple pattern match
                    import re
                    match = re.search(r'Tracking number:\s*(\d+)', response.message)
                    if match:
                        db_tracking_id = match.group(1)
                        print(f"📌 Extracted tracking number from message: {db_tracking_id}")
                except Exception as extract_err:
                    print(f"⚠️ Failed to extract tracking number from message: {str(extract_err)}")
                    # Keep the original tracking_id
            
            print(f"ℹ️ Using tracking ID for database: {db_tracking_id}")
            
            db_record = DatabaseHelper.prepare_record_for_database(
                tracking_id=db_tracking_id,
                latitude=latitude,
                longitude=longitude,
                category=response.issue_type or 'Unknown',
                description=response.message,
                # Add additional fields with proper URLs
                image_url=image_url,
                location_address=response.location_description,
                twitter_url=response.social_post_url
            )
        except Exception as e:
            print(f"⚠️ Error preparing database record: {str(e)}")
            db_record = None
        
        # Save to Supabase
        if DatabaseHelper.validate_required_fields(db_record):
            saved_record = SupabaseDB.insert_record(db_record)
            print(f"✅ Record saved to Supabase: {saved_record}")
        else:
            print(f"⚠️ Record validation failed, not saved to database")
    except Exception as e:
        print(f"⚠️ Database save error: {str(e)}")
    
    # Add absolute image URL to the API response
    response_dict = response.model_dump()
    if image_url:
        response_dict['image_url'] = image_url
    
    # Keep in memory for API access
    reports_db[tracking_id] = response_dict

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
    try:
        # Get records from Supabase
        db_records = SupabaseDB.get_all_records()
        if db_records:
            print(f"✅ Retrieved {len(db_records)} records from database")
            return {"reports": db_records, "total": len(db_records)}
        else:
            # Fall back to in-memory if database is empty
            print("⚠️ No records in database, using in-memory data")
            return {"reports": list(reports_db.values()), "total": len(reports_db)}
    except Exception as e:
        print(f"⚠️ Error getting records from database: {str(e)}")
        # Fall back to in-memory
        return {"reports": list(reports_db.values()), "total": len(reports_db)}

@app.get("/api/reports/all")
async def get_reports():
    """Get all submitted reports (from both memory and database)"""
    # First get reports from memory
    memory_reports = list(reports_db.values())
    
    # Then get reports from Supabase database
    try:
        db_records = SupabaseDB.get_all_records()
        print(f"Retrieved {len(db_records)} records from Supabase")
        
        # Combine records, prioritizing memory records
        combined_records = memory_reports.copy()
        
        # Add database records if not already in memory
        memory_tracking_ids = {r.get('tracking_id') for r in memory_reports}
        for db_record in db_records:
            if db_record.get('tracking_id') not in memory_tracking_ids:
                # Convert database record to match memory format
                record_dict = dict(db_record)
                record_dict['issue_type'] = record_dict.get('category')
                record_dict['message'] = record_dict.get('description')
                combined_records.append(record_dict)
        
        return {"reports": combined_records}
    
    except Exception as e:
        print(f"Error fetching reports from database: {str(e)}")
        # Fall back to memory-only reports
        return {"reports": memory_reports}

@app.get("/api/analytics")
def get_analytics():
    """Get analytics data for dashboard"""
    # TODO: Calculate analytics from reports_db
    return {"total_reports": len(reports_db), "status_breakdown": {}}

# TODO: Add database integration
# TODO: Add error handling and logging
# TODO: Add authentication if needed
# TODO: Add rate limiting