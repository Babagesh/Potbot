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

        # Create structured prompt for JSON output with strict validation
        prompt = f"""You are a civic infrastructure damage detector. Analyze this image taken at coordinates ({latitude}, {longitude}).

STEP 1: Is this a civic infrastructure image?
- Indoor scenes → "None"
- Personal items (laptops, phones, food, people, pets) → "None"
- Nature/landscapes without infrastructure → "None"

STEP 2: Identify the infrastructure type (if applicable):
- Road/pavement
- Sidewalk/walkway
- Wall/building (public property)
- Trash bin/dumpster
- Street markings/crosswalk
- Street light/lamp post
- Tree near road/sidewalk

STEP 3: Check for ACTUAL damage/issue (BE VERY STRICT):

🚨 CRITICAL: Only return a category if you see ACTUAL DAMAGE/ISSUE:

Road Crack:
- ✓ Visible cracks, potholes, holes, severe damage in road surface
- ✗ Clean, normal, well-maintained roads → "None"

Sidewalk Crack:
- ✓ Visible cracks, breaks, uneven surfaces in sidewalk
- ✗ Normal, intact sidewalks → "None"

Graffiti:
- ✓ Spray paint, vandalism, unauthorized markings clearly visible
- ✗ Clean walls, normal surfaces → "None"

Overflowing Trash:
- ✓ Trash bin visibly full, overflowing, trash spilling out
- ✗ Normal/empty bins, no trash visible → "None"

Faded Street Markings:
- ✓ Crosswalk/lane markings that are clearly faded, worn, barely visible
- ✗ Clear, visible markings → "None"

Broken Street Light:
- ✓ Light post damaged, broken, tilted, or clearly non-functional
- ✗ Normal street lights → "None"

Fallen Tree:
- ✓ Tree or large branch BLOCKING road/sidewalk, fallen across path
- ✗ Standing trees, normal landscaping → "None"

EXAMPLES TO REJECT (return "None"):
- "A photo of a normal, undamaged road" → "None"
- "A standing tree next to a sidewalk" → "None"
- "An empty trash bin" → "None"
- "A working street light" → "None"
- "A clean wall" → "None"

Return JSON:
{{
  "category": "<exact category name or None>",
  "Lat": {latitude},
  "Long": {longitude},
  "Text_Description": "<what you see and why you made this determination>",
  "confidence": <0.0 for None, 0.6-1.0 for real issues based on visibility>
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
            max_completion_tokens=512,
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

        # Build final response
        analysis_result = {
            "category": category,
            "Lat": result.get("Lat", latitude),
            "Long": result.get("Long", longitude),
            "Text_Description": text_desc,
            "confidence": confidence
        }

        if category == "None":
            print(f"⚠️ Image rejected: {text_desc}")
        else:
            print(f"✅ Issue detected: {category} (confidence: {confidence:.2f})")

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
