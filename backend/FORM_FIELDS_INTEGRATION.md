# Form Fields Integration - Complete ✅

## Summary

The Groq Vision AI model now returns **form-ready fields** for Playwright automation, in addition to detecting the civic issue category. The AI analyzes the image and generates structured data that can be directly passed to Playwright scripts.

## Changes Made

### 1. Enhanced AI Prompt ([image_agent.py:109-216](image_agent.py#L109-L216))

The prompt now instructs the AI to generate form fields based on the issue type:

**For all issues:**
- `locationDescription`: Specific location details ("on the sidewalk in front of building")
- `requestType`: Primary form field value
- `issueType`: Form category

**For Graffiti:**
- `propertyType`: "private" or "public"
- `isOffensive`: "yes" or "no"
- `structureType`: "Building - Commercial", "Pole", "Bridge", etc.

**For Fallen Tree:**
- `treeCondition`: "fallen", "damaged", "blocking", etc.

**For Sidewalk Crack:**
- `defectType`: "Collapsed sidewalk", "Raised sidewalk", "Cracked sidewalk"
- `severity`: "minor", "moderate", "severe"

**For Road Crack:**
- `defectType`: "Pothole", "Pavement crack", "Missing manhole cover"

### 2. Response Structure ([image_agent.py:289-308](image_agent.py#L289-L308))

The AI now returns:

```python
{
    "category": "Road Crack",
    "Lat": 37.7749,
    "Long": -122.4194,
    "Text_Description": "Large pothole in the center of the right lane...",
    "confidence": 0.87,
    "locationDescription": "In the center of the right lane, 20 feet before intersection",
    "formFields": {
        "requestType": "Pothole/Pavement Defect",
        "issueType": "Street",
        "defectType": "Pothole",
        "severity": "severe"
    }
}
```

### 3. Updated Response Model ([main.py:77-88](main.py#L77-L88))

```python
class PipelineResponse(BaseModel):
    tracking_id: str
    status: str
    message: str
    issue_type: Optional[str] = None
    confidence: Optional[float] = None
    reporting_url: Optional[str] = None
    location_description: Optional[str] = None  # NEW
    form_fields: Optional[dict] = None          # NEW
    tracking_number: Optional[str] = None
    social_post_url: Optional[str] = None
    created_at: datetime
```

### 4. Enhanced Logging ([main.py:238-251](main.py#L238-L251))

The pipeline now prints form fields in the response:

```
================================================================================
📋 PIPELINE RESPONSE
================================================================================
Tracking ID:       REPORT-ABC123
Status:            analyzed
Issue Type:        Road Crack
Confidence:        0.87
Reporting URL:     https://www.sf.gov/report-pothole-and-street-issues
Location Details:  In the center of the right lane, 20 feet before intersection
Form Fields:       {
                     "requestType": "Pothole/Pavement Defect",
                     "issueType": "Street",
                     "defectType": "Pothole",
                     "severity": "severe"
                   }
Message:           Issue detected: Road Crack. Large pothole in the center...
================================================================================
```

## Example Outputs

### Example 1: Pothole (Road Crack)

**Image Analysis Result:**
```json
{
  "category": "Road Crack",
  "confidence": 0.87,
  "Text_Description": "Large pothole in the center of the right lane with exposed rebar and missing asphalt chunks. Poses significant safety hazard to vehicles.",
  "locationDescription": "In the center of the right lane, approximately 20 feet before the intersection",
  "formFields": {
    "requestType": "Pothole/Pavement Defect",
    "issueType": "Street",
    "defectType": "Pothole",
    "severity": "severe"
  }
}
```

**Playwright Script:** `unified-sf-form-automation.js`

**Playwright Input:**
```json
{
  "damageType": "pothole",
  "issueType": "Street",
  "coordinates": "37.7749, -122.4194",
  "locationDescription": "In the center of the right lane, approximately 20 feet before the intersection",
  "requestType": "Pothole/Pavement Defect",
  "requestDescription": "Large pothole in the center of the right lane with exposed rebar and missing asphalt chunks. Poses significant safety hazard to vehicles.",
  "imagePath": "/path/to/image.jpg"
}
```

---

### Example 2: Graffiti on Private Building

**Image Analysis Result:**
```json
{
  "category": "Graffiti",
  "confidence": 0.92,
  "Text_Description": "Spray-painted graffiti tags covering approximately 10 square feet of the exterior wall. Non-offensive content.",
  "locationDescription": "On the side wall of commercial building facing the street, near the main entrance",
  "formFields": {
    "requestType": "Building - Commercial",
    "issueType": "Graffiti on Private Property",
    "propertyType": "private",
    "isOffensive": "no",
    "structureType": "Building - Commercial"
  }
}
```

**Playwright Script:** `graffiti-all-types-tester.js`

**Playwright Input:**
```json
{
  "name": "Graffiti on Private Property",
  "issueType": "Graffiti on Private Property",
  "requestRegarding": "Not Offensive (no racial slurs or profanity)",
  "requestType": "Building - Commercial",
  "requestDescription": "Spray-painted graffiti tags covering approximately 10 square feet of the exterior wall. Non-offensive content.",
  "coordinates": "37.7749, -122.4194",
  "locationDescription": "On the side wall of commercial building facing the street, near the main entrance",
  "imagePath": "/path/to/image.jpg"
}
```

---

### Example 3: Fallen Tree

**Image Analysis Result:**
```json
{
  "category": "Fallen Tree",
  "confidence": 0.95,
  "Text_Description": "Large oak tree has fallen across the sidewalk and is completely blocking pedestrian access. Immediate removal required for safety.",
  "locationDescription": "Fallen across the entire width of the sidewalk near the intersection",
  "formFields": {
    "requestType": "Fallen tree",
    "issueType": "Damaged Tree",
    "treeCondition": "fallen",
    "severity": "severe"
  }
}
```

**Playwright Script:** `fallen-tree-form-tester.js`

**Playwright Input:**
```json
{
  "name": "Damaged Tree - Fallen tree",
  "requestRegarding": "Damaged Tree",
  "requestType": "Fallen tree",
  "coordinates": "37.7749, -122.4194",
  "locationDescription": "Fallen across the entire width of the sidewalk near the intersection",
  "requestDescription": "Large oak tree has fallen across the sidewalk and is completely blocking pedestrian access. Immediate removal required for safety.",
  "imagePath": "/path/to/image.jpg"
}
```

---

### Example 4: Sidewalk Crack

**Image Analysis Result:**
```json
{
  "category": "Sidewalk Crack",
  "confidence": 0.83,
  "Text_Description": "Deep crack running across the sidewalk, creating a significant tripping hazard. Crack is approximately 2 inches wide.",
  "locationDescription": "On the main sidewalk in front of the building entrance, running perpendicular to the street",
  "formFields": {
    "requestType": "Sidewalk Defect",
    "issueType": "Sidewalk/Curb",
    "secondaryRequestType": "Cracked sidewalk",
    "defectType": "Cracked sidewalk",
    "severity": "moderate"
  }
}
```

**Playwright Script:** `unified-sf-form-automation.js`

**Playwright Input:**
```json
{
  "damageType": "sidewalk",
  "issueType": "Sidewalk/Curb",
  "coordinates": "37.7749, -122.4194",
  "locationDescription": "On the main sidewalk in front of the building entrance, running perpendicular to the street",
  "requestType": "Sidewalk Defect",
  "requestDescription": "Deep crack running across the sidewalk, creating a significant tripping hazard. Crack is approximately 2 inches wide.",
  "secondaryRequestType": "Cracked sidewalk",
  "imagePath": "/path/to/image.jpg"
}
```

## Mapping to Playwright Scripts

Based on the `category` and `formFields`, determine which Playwright script to use:

```python
def select_playwright_script(analysis_results):
    category = analysis_results['category']

    if category == "Graffiti":
        return "graffiti-all-types-tester.js"
    elif category == "Fallen Tree":
        return "fallen-tree-form-tester.js"
    elif category in ["Road Crack", "Sidewalk Crack"]:
        return "unified-sf-form-automation.js"
    else:
        return "unified-sf-form-automation.js"  # Default fallback
```

## Benefits

1. **Direct Playwright Integration**: Form fields are ready to pass to automation scripts
2. **AI-Powered Field Detection**: No manual mapping required
3. **Detailed Location Context**: AI provides specific location descriptions
4. **Smart Categorization**: AI determines property type, severity, structure type, etc.
5. **Flexible Structure**: `formFields` dict can contain category-specific fields

## Next Steps

1. **Call Playwright Script**: Use the `reporting_url` and `form_fields` to automate form submission
2. **Get Tracking Number**: Extract confirmation number from form submission
3. **Update Response**: Add `tracking_number` to pipeline response

## Example Integration

```python
# After getting the pipeline response
if response.status == "analyzed":
    # Prepare Playwright input
    playwright_input = {
        "coordinates": f"{latitude}, {longitude}",
        "locationDescription": response.location_description,
        "requestDescription": response.message,
        "imagePath": file_path,
        **response.form_fields  # Spread form fields
    }

    # Call Playwright script
    tracking_number = await submit_form_with_playwright(
        response.reporting_url,
        response.issue_type,
        playwright_input
    )

    # Update response
    response.tracking_number = tracking_number
```

The AI vision model is now fully integrated with form automation! 🎉
