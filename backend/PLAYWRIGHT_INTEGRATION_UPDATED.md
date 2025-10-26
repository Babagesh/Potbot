# Playwright Integration - Updated to Match Scripts ✅

## Summary

The AI prompt has been updated to generate form fields that **exactly match** the existing Playwright automation scripts in `/scripts/sf-forms/`.

## Changes Made

### 1. Updated AI Prompt Structure

The AI now generates fields matching these exact scripts:

| Issue Type | Playwright Script | Required Fields |
|------------|------------------|-----------------|
| Road Crack | `unified-sf-form-automation.js` | damageType, issueType, requestType, coordinates, locationDescription |
| Sidewalk Crack | `unified-sf-form-automation.js` | damageType, issueType, requestType, secondaryRequestType |
| Graffiti | `graffiti-all-types-tester.js` | issueType, requestRegarding, requestType |
| Fallen Tree | `fallen-tree-form-tester.js` | requestRegarding, requestType |

### 2. Form Fields Structure

#### For Road Crack & Sidewalk Crack (Unified Script)

```json
{
  "category": "Road Crack",
  "formFields": {
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "Large pothole in the center of the right lane..."
  }
}
```

```json
{
  "category": "Sidewalk Crack",
  "formFields": {
    "damageType": "sidewalk",
    "issueType": "Sidewalk/Curb",
    "requestType": "Sidewalk Defect",
    "secondaryRequestType": "Cracked sidewalk",
    "requestDescription": "Deep crack running across the sidewalk..."
  }
}
```

#### For Graffiti

```json
{
  "category": "Graffiti",
  "formFields": {
    "issueType": "Graffiti on Private Property",
    "requestRegarding": "Not Offensive (no racial slurs or profanity)",
    "requestType": "Building - Commercial",
    "requestDescription": "Spray-painted graffiti tags..."
  }
}
```

#### For Fallen Tree

```json
{
  "category": "Fallen Tree",
  "formFields": {
    "requestRegarding": "Damaged Tree",
    "requestType": "Fallen tree",
    "requestDescription": "Large oak tree has fallen..."
  }
}
```

## Playwright Script Mapping

```python
def get_playwright_script(category):
    """Map AI category to Playwright script"""

    if category == "Road Crack":
        return {
            "script": "scripts/sf-forms/unified-sf-form-automation.js",
            "method": "submitSFReport"
        }
    elif category == "Sidewalk Crack":
        return {
            "script": "scripts/sf-forms/unified-sf-form-automation.js",
            "method": "submitSFReport"
        }
    elif category == "Graffiti":
        return {
            "script": "scripts/sf-forms/graffiti-all-types-tester.js",
            "method": "testGraffitiType"
        }
    elif category == "Fallen Tree":
        return {
            "script": "scripts/sf-forms/fallen-tree-form-tester.js",
            "method": "testFallenTreeType"
        }
```

## Integration Example

```python
# After getting analysis results from AI
analysis_results = await analyze_image_with_agent(image_path, lat, lon)

if analysis_results['category'] != "None":
    # Prepare Playwright input
    playwright_data = {
        "coordinates": f"{lat}, {lon}",
        "locationDescription": analysis_results['locationDescription'],
        "imagePath": image_path,
        **analysis_results['formFields']  # Spread all form fields
    }

    # Call appropriate Playwright script
    script_info = get_playwright_script(analysis_results['category'])

    # Execute Playwright
    result = subprocess.run([
        'node',
        script_info['script'],
        json.dumps(playwright_data)
    ], capture_output=True, text=True)

    # Extract tracking number from result
    tracking_number = extract_tracking_number(result.stdout)
```

## Field Validation

The AI is instructed to return exact dropdown values as they appear in SF.gov forms:

### Road/Sidewalk (Unified Script)

**damageType:**
- `"pothole"` - for roads
- `"sidewalk"` - for sidewalks

**issueType:**
- `"Street"` - for road issues
- `"Sidewalk/Curb"` - for sidewalk issues

**requestType:** (varies by form)
- Road: `"Pothole/Pavement Defect"`, `"Pavement crack"`, etc.
- Sidewalk: `"Sidewalk Defect"`, `"Curb Defect"`

**secondaryRequestType:** (optional, for sidewalks)
- `"Collapsed sidewalk"`
- `"Lifted sidewalk"`
- `"Cracked sidewalk"`
- `"Uneven sidewalk"`

**Note:** The Playwright script uses fuzzy matching (case-insensitive `.includes()`), so partial matches like "cracked", "collapsed", "lifted" will work correctly.

### Graffiti Script

**issueType:**
- `"Graffiti on Private Property"`
- `"Graffiti on Public Property"`
- `"Illegal Postings on Public Property"`

**requestRegarding:**
- Graffiti: `"Not Offensive (no racial slurs or profanity)"` or `"Offensive (racial slurs or profanity)"`
- Postings: `"Multiple Postings"`, `"No Posting Date"`, etc.

**requestType:**
- Private: `"Building - Commercial"`, `"Building - Residential"`, `"Building - Other"`, `"Sidewalk in front of property"`
- Public: `"Pole"`, `"Bridge"`, `"Street"`, `"Sidewalk structure"`, `"Signal box"`, etc.

### Fallen Tree Script

**requestRegarding:**
- `"Damaged Tree"`
- `"Damaging Property"`
- `"Landscaping"`
- `"Overgrown Tree"`
- `"Other"`

**requestType:** (based on requestRegarding)
- Damaged Tree: `"Fallen tree"`, `"Hanging limb"`, `"Dead tree"`, etc.
- Damaging Property: `"Lifted sidewalk - tree roots"`, `"Damaging sewer pipes"`, etc.
- Landscaping: `"Remove tree suckers"`, `"Clean tree well"`, etc.
- Overgrown Tree: `"Blocking sidewalk"`, `"Blocking light (street or property)"`, etc.
- Other: `"N/A"`

## Benefits

1. **Direct Compatibility**: AI output directly feeds into existing Playwright scripts
2. **No Translation Layer**: No need to map AI fields to Playwright fields
3. **Exact Form Values**: AI trained on actual SF.gov form dropdown options
4. **Tested Scripts**: All Playwright scripts are already tested and working

## Next Steps

1. Call Playwright script with form fields from AI
2. Extract service request number from Playwright output
3. Update `tracking_number` in pipeline response

The AI and Playwright integration is now fully aligned! 🎉
