"""
Groq Vision API Image Analysis Client
Analyzes civic infrastructure issues using Groq's Llama 4 Vision models
Fast, reliable, and no AgentVerse dependencies!
"""

import base64
import json
from typing import Dict, Any
import os
from groq import Groq
from PIL import Image
import io

# Valid categories for civic issues
VALID_CATEGORIES = [
    "Road Crack",
    "Sidewalk Crack",
    "Graffiti",
    "Overflowing Trash",
    "Faded Street Markings",
    "Broken Street Light",
    "Fallen Tree",
    "None"  # For non-civic infrastructure images
]


def encode_image_to_base64(image_path: str, max_size: int = 1024) -> str:
    """
    Read an image file, resize if needed, and encode it as base64 string
    Groq max: 4MB for base64 encoded images

    Args:
        image_path: Path to the image file
        max_size: Maximum dimension (width or height) in pixels (default: 1024)

    Returns:
        Base64 encoded string of the image
    """
    try:
        # Open and resize image to reduce payload size
        img = Image.open(image_path)

        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        # Resize if too large
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            print(f"Resized image from original to {new_size}")

        # Encode to base64
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85, optimize=True)
        img_bytes = buffer.getvalue()

        print(f"Image size: {len(img_bytes) / 1024:.1f} KB")
        return base64.b64encode(img_bytes).decode('utf-8')

    except Exception as e:
        # Fallback to simple encoding if PIL fails
        print(f"Warning: Could not resize image, using original: {e}")
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')


async def analyze_image_with_groq(
    image_path: str,
    latitude: float,
    longitude: float,
    model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
    confidence_threshold: float = None
) -> Dict[str, Any]:
    """
    Analyze civic infrastructure issues using Groq Vision API

    Args:
        image_path: Path to the image file
        latitude: GPS latitude
        longitude: GPS longitude
        model: Groq model to use (default: llama-4-scout)

    Returns:
        Dictionary with analysis results:
        {
            "category": str,           # One of VALID_CATEGORIES
            "Lat": float,
            "Long": float,
            "Text_Description": str,
            "confidence": float
        }
    """
    try:
        # Get API key
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY not found in environment variables")

        # Initialize Groq client
        client = Groq(api_key=api_key)

        # Encode image
        print(f"Encoding image: {image_path}")
        base64_image = encode_image_to_base64(image_path)

        # Create structured prompt for JSON output with DECISION TREE and exact dropdown options
        prompt = f"""You are a civic infrastructure damage detector for San Francisco's reporting system. Analyze this image taken at coordinates ({latitude}, {longitude}).

🎯 DECISION TREE - Follow these steps EXACTLY:

═══════════════════════════════════════════════════════════════════════════════
STEP 1: FILTER OUT NON-CIVIC ISSUES
═══════════════════════════════════════════════════════════════════════════════
If the image shows ANY of these, return category="None":
- Indoor scenes (inside buildings, homes, offices)
- Personal items (phones, laptops, food, clothing, people, pets)
- Nature scenes without infrastructure (parks, forests, beaches)
- Normal/undamaged infrastructure (clean roads, intact sidewalks)

═══════════════════════════════════════════════════════════════════════════════
STEP 2: IDENTIFY ISSUE CATEGORY
═══════════════════════════════════════════════════════════════════════════════
Choose ONE category that best matches the ACTUAL DAMAGE you see:

A) ROAD/STREET DAMAGE → category="Road Crack"
   ✓ Potholes, cracks, holes in road/pavement
   ✓ Shifted construction plates, manhole covers
   ✓ Pavement defects in the street
   ✗ NOT sidewalks, curbs, or pedestrian areas

B) SIDEWALK/CURB DAMAGE → category="Sidewalk Crack"
   ✓ Cracks, breaks, defects in sidewalks
   ✓ Lifted/collapsed/uneven sidewalk surfaces
   ✓ Curb damage, missing vent covers
   ✗ NOT roads or vehicle driving surfaces

C) GRAFFITI/VANDALISM → category="Graffiti"
   ✓ Spray paint, tags, unauthorized markings
   ✓ On buildings, poles, public structures
   ✓ Illegal postings, stickers, flyers
   ✗ NOT normal signage or murals

D) TREE ISSUES → category="Fallen Tree"
   ✓ Fallen trees blocking paths
   ✓ Damaged, dead, or hanging limbs
   ✓ Trees damaging property/sidewalks
   ✗ NOT healthy, standing trees

═══════════════════════════════════════════════════════════════════════════════
STEP 3: SELECT FORM FIELDS FROM EXACT DROPDOWN OPTIONS
═══════════════════════════════════════════════════════════════════════════════

📋 CATEGORY A: ROAD/STREET DAMAGE
────────────────────────────────────────────────────────────────────────────────
formFields = {{
  "damageType": "pothole",
  "issueType": "Street",
  "requestType": "<SELECT ONE OPTION FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS (choose the MOST FITTING):
  1. "Pothole/Pavement Defect" - holes, potholes, pavement damage
  2. "Construction Plate Shifted" - metal plates out of place
  3. "Manhole Cover Off" - missing or displaced manhole cover
  4. "Utility Excavation" - utility work damage
  5. "Other" - doesn't fit above categories

────────────────────────────────────────────────────────────────────────────────
📋 CATEGORY B: SIDEWALK/CURB DAMAGE
────────────────────────────────────────────────────────────────────────────────
formFields = {{
  "damageType": "sidewalk",
  "issueType": "Sidewalk/Curb",
  "requestType": "<SELECT ONE OPTION FROM BELOW>",
  "secondaryRequestType": "<IF requestType='Sidewalk Defect', SELECT FROM SECONDARY OPTIONS>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS (choose the MOST FITTING):
  1. "Sidewalk Defect" - cracks, breaks, surface damage (MOST COMMON)
  2. "Curb or Curb Ramp Defect" - damaged curbs or ramps
  3. "Missing Side Sewer Vent Cover" - missing vent cover
  4. "Damaged Side Sewer Vent Cover" - broken vent cover
  5. "Public Stairway Defect" - damaged stairs
  6. "Pothole/Pavement Defect" - pothole in pedestrian area

IF requestType = "Sidewalk Defect", secondaryRequestType OPTIONS:
  - "Collapsed sidewalk" - sidewalk has sunken/collapsed
  - "Lifted sidewalk" - sidewalk raised/uneven (often tree roots)
  - "Cracked sidewalk" - visible cracks but surface still level
  - Options containing "tree roots" - if tree damage visible

────────────────────────────────────────────────────────────────────────────────
📋 CATEGORY C: GRAFFITI
────────────────────────────────────────────────────────────────────────────────

FIRST: Determine if graffiti is on PRIVATE or PUBLIC property
  - Private: buildings, commercial properties, residential homes
  - Public: poles, bridges, streets, sidewalk structures, city property

THEN SELECT FIELDS BASED ON PROPERTY TYPE:

─── C1: GRAFFITI ON PRIVATE PROPERTY ───
formFields = {{
  "issueType": "Graffiti on Private Property",
  "requestRegarding": "<SELECT ONE>",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestRegarding OPTIONS:
  1. "Not Offensive (no racial slurs or profanity)" - MOST COMMON
  2. "Offensive (racial slurs or profanity)" - contains hate speech

requestType OPTIONS (property type):
  1. "Building - Commercial" - stores, offices, businesses
  2. "Building - Residential" - homes, apartments
  3. "Building - Other" - other private structures
  4. "Sidewalk in front of property" - sidewalk adjacent to building

─── C2: GRAFFITI ON PUBLIC PROPERTY ───
formFields = {{
  "issueType": "Graffiti on Public Property",
  "requestRegarding": "<SELECT ONE>",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestRegarding OPTIONS:
  1. "Not Offensive (no racial slurs or profanity)" - MOST COMMON
  2. "Offensive (racial slurs or profanity)" - contains hate speech

requestType OPTIONS (structure type):
  1. "Pole" - utility poles, light poles (MOST COMMON)
  2. "Bridge" - bridge structures
  3. "Street" - street surface/pavement
  4. "Sidewalk structure" - sidewalk surface
  5. "Signal box" - traffic signal boxes
  6. "Transit Shelter/ Platform" - bus stops, transit areas
  7. "City receptacle" - trash cans, public bins
  8. "Bike rack" - bicycle parking
  9. "Fire hydrant" - hydrants
  10. "Fire/ Police Call Box" - emergency boxes
  11. "Mail box" - postal boxes
  12. "News rack" - newspaper stands
  13. "Parking meter" - parking meters
  14. "Pay phone" - payphones
  15. "Sign - Parking and Traffic" - traffic signs
  16. "ATT Property" - AT&T infrastructure
  17. "Other - enter additional details" - doesn't fit above

─── C3: ILLEGAL POSTINGS ON PUBLIC PROPERTY ───
formFields = {{
  "issueType": "Illegal Postings on Public Property",
  "requestRegarding": "<SELECT ONE FROM BELOW>",
  "requestType": "Pole",
  "requestDescription": "<Detailed description>"
}}

requestRegarding OPTIONS (violation type):
  1. "Multiple Postings" - multiple flyers/posters
  2. "Affixed Improperly" - improperly attached
  3. "No Posting Date" - missing date
  4. "Posted Over 70 Days" - old posting
  5. "Posting Too Large in Size" - oversized
  6. "Posting Too High on Pole" - too high
  7. "Posted on Traffic Light" - on traffic signals
  8. "Posted on Historic Street Light" - on historic lights
  9. "Posted on Directional Sign" - on directional signs

────────────────────────────────────────────────────────────────────────────────
📋 CATEGORY D: TREE ISSUES
────────────────────────────────────────────────────────────────────────────────

FIRST: Determine the tree problem type, THEN select specific issue

─── D1: DAMAGED TREE ───
formFields = {{
  "requestRegarding": "Damaged Tree",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS:
  1. "Fallen tree" - tree has fallen (MOST COMMON FOR CATEGORY)
  2. "Hanging limb" - limb hanging dangerously
  3. "About to fall" - tree leaning/unstable
  4. "Dead tree" - dead tree standing
  5. "Damaged Tree" - general damage
  6. "Vandalized Tree" - intentional damage
  7. "Other - Enter Details" - other damage

─── D2: TREE DAMAGING PROPERTY ───
formFields = {{
  "requestRegarding": "Damaging Property",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS:
  1. "Lifted sidewalk - tree roots" - roots lifting sidewalk
  2. "Hitting window or building" - branches hitting structure
  3. "Property damage" - general property damage
  4. "Sewer damage - tree roots" - roots damaging sewer
  5. "Other - Enter Details" - other property damage

─── D3: TREE LANDSCAPING ISSUES ───
formFields = {{
  "requestRegarding": "Landscaping",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS:
  1. "Weeding" - needs weeding
  2. "Remove tree suckers" - remove shoots
  3. "Backfill tree basin" - fill tree basin
  4. "Empty tree basin" - empty basin
  5. "Remove garden debris" - clean debris
  6. "Restake tree" - re-stake tree
  7. "Shrubbery blocking visibility" - blocking view
  8. "Lawn mowing" - needs mowing
  9. "Vacant lot weeding" - vacant lot needs work
  10. "Sprinkler system issues" - irrigation problems
  11. "Request water meter" - meter request
  12. "Other - Enter Details" - other landscaping

─── D4: OVERGROWN TREE ───
formFields = {{
  "requestRegarding": "Overgrown Tree",
  "requestType": "<SELECT ONE FROM BELOW>",
  "requestDescription": "<Detailed description>"
}}

requestType OPTIONS:
  1. "Pruning request" - needs pruning (MOST COMMON)
  2. "Blocking sidewalk" - branches blocking path
  3. "Blocking street lights" - blocking lights
  4. "Blocking traffic signal" - blocking signals
  5. "Blocking signs" - blocking signs
  6. "Near communication line" - near power lines
  7. "Other - Enter Details" - other overgrowth

─── D5: OTHER TREE ISSUES ───
formFields = {{
  "requestRegarding": "Other",
  "requestType": "N/A",
  "requestDescription": "<Detailed description>"
}}

═══════════════════════════════════════════════════════════════════════════════
STEP 4: GENERATE RESPONSE JSON
═══════════════════════════════════════════════════════════════════════════════

Return this EXACT structure:
{{
  "category": "<Road Crack|Sidewalk Crack|Graffiti|Fallen Tree|None>",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "<Detailed description of damage for civic report>",
  "confidence": <0.0 for None, 0.6-1.0 for issues based on visibility>,
  "locationDescription": "<Specific location description (e.g., 'center of right lane', 'in front of building entrance')>",
  "formFields": {{
    <fields from decision tree above>
  }}
}}

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Example 1: Large pothole
{{
  "category": "Road Crack",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "Large pothole approximately 2 feet in diameter in the center of the right lane with exposed aggregate and chunks of missing asphalt. Creating significant hazard for vehicles.",
  "confidence": 0.92,
  "locationDescription": "Center of right lane, approximately 20 feet before the intersection",
  "formFields": {{
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "Large pothole approximately 2 feet in diameter in the center of the right lane with exposed aggregate and chunks of missing asphalt. Creating significant hazard for vehicles."
  }}
}}

Example 2: Lifted sidewalk from tree roots
{{
  "category": "Sidewalk Crack",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "Sidewalk lifted and uneven due to tree root growth beneath the surface. Section raised approximately 4 inches creating tripping hazard.",
  "confidence": 0.88,
  "locationDescription": "Main pedestrian sidewalk directly in front of the tree, adjacent to the curb",
  "formFields": {{
    "damageType": "sidewalk",
    "issueType": "Sidewalk/Curb",
    "requestType": "Sidewalk Defect",
    "secondaryRequestType": "Lifted sidewalk",
    "requestDescription": "Sidewalk lifted and uneven due to tree root growth beneath the surface. Section raised approximately 4 inches creating tripping hazard."
  }}
}}

Example 3: Graffiti on commercial building
{{
  "category": "Graffiti",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "Spray-painted graffiti tags covering approximately 8 square feet of exterior wall. Multiple colors used, non-offensive tags and designs.",
  "confidence": 0.95,
  "locationDescription": "Side exterior wall of commercial building facing the street, near the main entrance",
  "formFields": {{
    "issueType": "Graffiti on Private Property",
    "requestRegarding": "Not Offensive (no racial slurs or profanity)",
    "requestType": "Building - Commercial",
    "requestDescription": "Spray-painted graffiti tags covering approximately 8 square feet of exterior wall. Multiple colors used, non-offensive tags and designs."
  }}
}}

Example 4: Fallen tree blocking sidewalk
{{
  "category": "Fallen Tree",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "Large tree has completely fallen across the sidewalk blocking all pedestrian access. Tree appears to be approximately 20 feet tall with trunk diameter of 12 inches. Immediate removal required for public safety.",
  "confidence": 0.97,
  "locationDescription": "Fallen across entire width of sidewalk, trunk resting on curb, branches extending into street",
  "formFields": {{
    "requestRegarding": "Damaged Tree",
    "requestType": "Fallen tree",
    "requestDescription": "Large tree has completely fallen across the sidewalk blocking all pedestrian access. Tree appears to be approximately 20 feet tall with trunk diameter of 12 inches. Immediate removal required for public safety."
  }}
}}

Example 5: Normal road (NO ISSUE)
{{
  "category": "None",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "Image shows a normal, well-maintained road surface with no visible damage or defects.",
  "confidence": 0.0,
  "locationDescription": "",
  "formFields": {{}}
}}"""

        print(f"Sending request to Groq ({model})...")

        # Call Groq Vision API with JSON mode
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent outputs
            max_completion_tokens=1024,  # Increased for form fields
            response_format={"type": "json_object"},  # Force JSON output
            stop=None,
        )

        # Parse JSON response
        response_text = completion.choices[0].message.content
        print(f"Received response from Groq")

        result = json.loads(response_text)

        # Validate and normalize category
        category = result.get("category", "None")

        # Normalize "None" variations
        if category.lower() in ["none", "no issue", "not applicable", "n/a"]:
            category = "None"

        if category not in VALID_CATEGORIES:
            # Try to find closest match
            category_lower = category.lower()
            matched = False
            for valid_cat in VALID_CATEGORIES:
                if valid_cat.lower() in category_lower or category_lower in valid_cat.lower():
                    category = valid_cat
                    matched = True
                    break

            if not matched:
                # Default to "None" for unrecognized categories (spam filter)
                print(f"Warning: Invalid category '{result.get('category')}', marking as spam")
                category = "None"

        # Get confidence score
        confidence = result.get("confidence", 0.0)
        confidence = min(max(confidence, 0.0), 1.0)  # Clamp between 0-1

        # Get confidence threshold from env or use default
        if confidence_threshold is None:
            confidence_threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))

        # Additional validation: Low confidence on real categories should be rejected
        # If the model is unsure, better to reject than report false positive
        if category != "None" and confidence < confidence_threshold:
            print(f"⚠️ Low confidence ({confidence:.2f}) for {category}, changing to 'None'")
            category = "None"
            confidence = 0.0
            text_desc = f"Low confidence detection. {result.get('Text_Description', '')}"
        else:
            text_desc = result.get("Text_Description", "Civic infrastructure issue detected")

        # Build final response with form fields
        analysis_result = {
            "category": category,
            "Lat": result.get("Lat", latitude),
            "Long": result.get("Long", longitude),
            "Text_Description": text_desc,
            "confidence": confidence,
            "locationDescription": result.get("locationDescription", ""),
            "formFields": result.get("formFields", {})
        }

        if category == "None":
            print(f"⚠️ Image rejected: {text_desc}")
        else:
            print(f"✅ Issue detected: {category} (confidence: {confidence:.2f})")
            # Log form fields for debugging
            if analysis_result["formFields"]:
                print(f"   Form fields: {json.dumps(analysis_result['formFields'], indent=2)}")

        return analysis_result

    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON response: {e}")
        print(f"Raw response: {response_text}")
        raise Exception(f"Invalid JSON response from Groq: {e}")

    except Exception as e:
        print(f"Error analyzing image with Groq: {str(e)}")
        raise


async def analyze_image_with_agent(
    image_path: str,
    latitude: float,
    longitude: float
) -> Dict[str, Any]:
    """
    Main entry point for image analysis using Groq Vision API

    Args:
        image_path: Path to image file
        latitude: GPS latitude
        longitude: GPS longitude

    Returns:
        Analysis results dictionary
    """
    return await analyze_image_with_groq(image_path, latitude, longitude)


# ============================================================================
# Testing
# ============================================================================

async def test_analysis():
    """Test function"""
    import sys

    if len(sys.argv) > 1:
        test_image = sys.argv[1]
    else:
        print("Usage: python image_agent.py path/to/image.jpg")
        return

    result = await analyze_image_with_agent(
        image_path=test_image,
        latitude=37.7749,
        longitude=-122.4194
    )

    print("\n" + "="*60)
    print("Analysis Results:")
    print(json.dumps(result, indent=2))
    print("="*60 + "\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_analysis())
