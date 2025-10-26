# Backend to Playwright Integration Guide

This document provides the JSON input formats required for each Playwright script and a decision tree to help the backend determine which form to submit and what data to provide.

## Overview

The workflow is:
1. **Image Upload** → Frontend receives image
2. **Location Extraction** → Backend extracts GPS coordinates and metadata
3. **LLM Analysis** → Backend analyzes image to determine damage category
4. **Form Selection** → Backend determines which SF.gov form to use
5. **Playwright Execution** → Automated form submission

## Available Playwright Scripts

### 1. Graffiti Form Automation (`graffiti-all-types-tester.js`)
**Form URL:** `https://www.sf.gov/report-graffiti-issues`

### 2. Fallen Tree Form Automation (`fallen-tree-form-tester.js`)
**Form URL:** `https://www.sf.gov/report-damaged-or-fallen-tree`

### 3. Unified SF Form Automation (`unified-sf-form-automation.js`)
**Form URLs:**
- Pothole/Street: `https://www.sf.gov/report-pothole-and-street-issues`
- Sidewalk/Curb: `https://www.sf.gov/report-curb-and-sidewalk-problems`
- Graffiti: `https://www.sf.gov/report-graffiti-issues`
- Trash: `https://www.sf.gov/report-garbage-container-issues`
- Street Markings: `https://www.sf.gov/report-faded-street-and-pavement-markings`
- Streetlight: `https://www.sf.gov/report-problem-streetlight`

## JSON Input Formats

### 1. Graffiti Form Input Format

```json
{
  "name": "Graffiti on Private Property",
  "issueType": "Graffiti on Private Property",
  "requestRegarding": "Not Offensive (no racial slurs or profanity)",
  "requestType": "Building - Commercial",
  "requestDescription": "Graffiti spray painted on the side of a commercial building. Needs immediate removal.",
  "coordinates": "37.755196, -122.423207",
  "locationDescription": "Graffiti spray painted on the side of the building near the main entrance.",
  "imagePath": "/path/to/image.jpg"
}
```

**Required Fields:**
- `issueType`: One of:
  - `"Graffiti on Private Property"`
  - `"Graffiti on Public Property"`
  - `"Illegal Postings on Public Property"`
- `requestRegarding`: Depends on issueType (see decision tree)
- `requestType`: Depends on issueType (see decision tree)
- `requestDescription`: Detailed description of the graffiti issue
- `coordinates`: GPS coordinates as "lat, lng"
- `locationDescription`: Specific location details
- `imagePath`: Path to the evidence image

### 2. Fallen Tree Form Input Format

```json
{
  "name": "Damaged Tree - Fallen tree",
  "requestRegarding": "Damaged Tree",
  "requestType": "Fallen tree",
  "coordinates": "37.755196, -122.423207",
  "locationDescription": "Large tree has fallen across the sidewalk blocking pedestrian access.",
  "requestDescription": "Emergency: Large oak tree has fallen across the sidewalk and is blocking pedestrian access. Immediate removal required for safety.",
  "imagePath": "/path/to/image.jpg"
}
```

**Required Fields:**
- `requestRegarding`: One of:
  - `"Damaged Tree"`
  - `"Damaging Property"`
  - `"Landscaping"`
  - `"Overgrown Tree"`
  - `"Other"`
- `requestType`: Depends on requestRegarding (see decision tree)
- `coordinates`: GPS coordinates as "lat, lng"
- `locationDescription`: Specific location details (can be empty)
- `requestDescription`: Detailed description of the tree issue
- `imagePath`: Path to the evidence image

### 3. Unified SF Form Input Format

```json
{
  "damageType": "sidewalk",
  "issueType": "Sidewalk/Curb",
  "coordinates": "37.755196, -122.423207",
  "locationDescription": "On the sidewalk in front of the building, large crack running across the entire width.",
  "requestType": "Sidewalk Defect",
  "requestDescription": "Large crack in the sidewalk that poses a tripping hazard for pedestrians.",
  "secondaryRequestType": "Collapsed sidewalk",
  "imagePath": "/path/to/image.jpg"
}
```

**Required Fields:**
- `damageType`: One of:
  - `"pothole"`
  - `"sidewalk"`
  - `"graffiti"`
  - `"trash"`
  - `"streetMarkings"`
  - `"streetlight"`
  - `"fallenTree"`
- `issueType`: `"Street"` or `"Sidewalk/Curb"` (for pothole/sidewalk)
- `coordinates`: GPS coordinates as "lat, lng"
- `locationDescription`: Specific location details
- `requestType`: Depends on damageType (see decision tree)
- `requestDescription`: Detailed description of the issue
- `secondaryRequestType`: Optional, for specific subcategories
- `imagePath`: Path to the evidence image

## Decision Tree for Backend LLM

### Step 1: Primary Damage Category Detection

```
Image Analysis → Primary Category:
├── Tree Issues
│   ├── Fallen/Damaged Tree
│   ├── Tree Roots Damaging Infrastructure
│   ├── Overgrown Tree Blocking Access
│   └── Tree Maintenance/Landscaping
├── Graffiti/Vandalism
│   ├── Graffiti on Private Property
│   ├── Graffiti on Public Property
│   └── Illegal Postings
├── Street/Sidewalk Issues
│   ├── Potholes
│   ├── Sidewalk Cracks/Defects
│   ├── Curb Issues
│   └── Street Markings
├── Infrastructure Issues
│   ├── Streetlights
│   ├── Traffic Signals
│   └── Utility Issues
└── Other Issues
    ├── Trash/Overflowing Containers
    ├── Sewer Issues
    └── General Maintenance
```

### Step 2: Form Selection Logic

```python
def select_form_and_data(image_analysis, location_data):
    primary_category = image_analysis['primary_category']
    confidence = image_analysis['confidence']
    
    if primary_category == 'tree_issues':
        return {
            'script': 'fallen-tree-form-tester.js',
            'form_data': generate_fallen_tree_data(image_analysis, location_data)
        }
    elif primary_category == 'graffiti':
        return {
            'script': 'graffiti-all-types-tester.js', 
            'form_data': generate_graffiti_data(image_analysis, location_data)
        }
    else:
        return {
            'script': 'unified-sf-form-automation.js',
            'form_data': generate_unified_data(image_analysis, location_data)
        }
```

### Step 3: Detailed Field Mapping

#### Graffiti Form Field Mapping

```python
def generate_graffiti_data(image_analysis, location_data):
    # Determine if graffiti is on private or public property
    if image_analysis['property_type'] == 'private':
        issue_type = "Graffiti on Private Property"
        request_regarding = "Not Offensive (no racial slurs or profanity)"  # Default
        request_type = determine_building_type(image_analysis)  # Building - Commercial/Residential/Other
    elif image_analysis['property_type'] == 'public':
        issue_type = "Graffiti on Public Property"
        request_regarding = "Not Offensive (no racial slurs or profanity)"  # Default
        request_type = determine_public_structure(image_analysis)  # Pole/Bridge/Street/etc
    else:
        issue_type = "Illegal Postings on Public Property"
        request_regarding = determine_posting_violation(image_analysis)  # Multiple Postings/etc
        request_type = determine_public_structure(image_analysis)
    
    return {
        "issueType": issue_type,
        "requestRegarding": request_regarding,
        "requestType": request_type,
        "requestDescription": image_analysis['description'],
        "coordinates": f"{location_data['lat']}, {location_data['lng']}",
        "locationDescription": generate_location_description(image_analysis, location_data),
        "imagePath": image_analysis['image_path']
    }
```

#### Fallen Tree Form Field Mapping

```python
def generate_fallen_tree_data(image_analysis, location_data):
    # Determine tree issue category
    if 'fallen' in image_analysis['description'].lower():
        request_regarding = "Damaged Tree"
        request_type = "Fallen tree"
    elif 'roots' in image_analysis['description'].lower() and 'sidewalk' in image_analysis['description'].lower():
        request_regarding = "Damaging Property"
        request_type = "Lifted sidewalk - tree roots"
    elif 'overgrown' in image_analysis['description'].lower() or 'blocking' in image_analysis['description'].lower():
        request_regarding = "Overgrown Tree"
        request_type = "Blocking sidewalk"  # Default
    elif 'suckers' in image_analysis['description'].lower() or 'maintenance' in image_analysis['description'].lower():
        request_regarding = "Landscaping"
        request_type = "Remove tree suckers"  # Default
    else:
        request_regarding = "Other"
        request_type = "N/A"
    
    return {
        "requestRegarding": request_regarding,
        "requestType": request_type,
        "coordinates": f"{location_data['lat']}, {location_data['lng']}",
        "locationDescription": generate_location_description(image_analysis, location_data),
        "requestDescription": image_analysis['description'],
        "imagePath": image_analysis['image_path']
    }
```

#### Unified Form Field Mapping

```python
def generate_unified_data(image_analysis, location_data):
    # Determine damage type
    if 'pothole' in image_analysis['description'].lower():
        damage_type = "pothole"
        issue_type = "Street"
        request_type = "Pothole/Pavement Defect"
    elif 'sidewalk' in image_analysis['description'].lower() or 'curb' in image_analysis['description'].lower():
        damage_type = "sidewalk"
        issue_type = "Sidewalk/Curb"
        request_type = "Sidewalk Defect"
        secondary_request_type = determine_sidewalk_subtype(image_analysis)
    elif 'street' in image_analysis['description'].lower() and 'marking' in image_analysis['description'].lower():
        damage_type = "streetMarkings"
        issue_type = "Street"
        request_type = "Faded Street Markings"
    elif 'trash' in image_analysis['description'].lower() or 'garbage' in image_analysis['description'].lower():
        damage_type = "trash"
        issue_type = "Street"
        request_type = "Overflowing Trash Container"
    elif 'streetlight' in image_analysis['description'].lower() or 'light' in image_analysis['description'].lower():
        damage_type = "streetlight"
        issue_type = "Street"
        request_type = "Streetlight Out"
    else:
        damage_type = "pothole"  # Default fallback
        issue_type = "Street"
        request_type = "Other"
    
    return {
        "damageType": damage_type,
        "issueType": issue_type,
        "coordinates": f"{location_data['lat']}, {location_data['lng']}",
        "locationDescription": generate_location_description(image_analysis, location_data),
        "requestType": request_type,
        "requestDescription": image_analysis['description'],
        "secondaryRequestType": secondary_request_type if 'secondary_request_type' in locals() else None,
        "imagePath": image_analysis['image_path']
    }
```

## Helper Functions for Backend

### Location Description Generation

```python
def generate_location_description(image_analysis, location_data):
    """Generate specific location description based on image analysis and GPS data"""
    base_description = image_analysis.get('location_context', '')
    
    # Add GPS-based context if available
    if location_data.get('address'):
        return f"{base_description} Located at {location_data['address']}"
    else:
        return f"{base_description} GPS coordinates: {location_data['lat']}, {location_data['lng']}"
```

### Building Type Detection

```python
def determine_building_type(image_analysis):
    """Determine if graffiti is on commercial, residential, or other building"""
    description = image_analysis['description'].lower()
    
    if any(word in description for word in ['store', 'shop', 'business', 'office', 'commercial']):
        return "Building - Commercial"
    elif any(word in description for word in ['house', 'home', 'residential', 'apartment']):
        return "Building - Residential"
    else:
        return "Building - Other"
```

### Public Structure Detection

```python
def determine_public_structure(image_analysis):
    """Determine what public structure has graffiti"""
    description = image_analysis['description'].lower()
    
    if 'pole' in description:
        return "Pole"
    elif 'bridge' in description:
        return "Bridge"
    elif 'street' in description:
        return "Street"
    elif 'sidewalk' in description:
        return "Sidewalk structure"
    elif 'meter' in description:
        return "Parking meter"
    elif 'hydrant' in description:
        return "Fire hydrant"
    else:
        return "Pole"  # Default fallback
```

## Backend Output Format

The backend should output a JSON object with this structure:

```json
{
  "success": true,
  "form_selection": {
    "script": "unified-sf-form-automation.js",
    "form_url": "https://www.sf.gov/report-pothole-and-street-issues",
    "confidence": 0.95
  },
  "form_data": {
    "damageType": "pothole",
    "issueType": "Street",
    "coordinates": "37.755196, -122.423207",
    "locationDescription": "On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "The manhole is completely missing a sewer cover, which is a huge safety liability.",
    "imagePath": "/path/to/uploaded/image.jpg"
  },
  "metadata": {
    "analysis_timestamp": "2024-01-15T10:30:00Z",
    "gps_accuracy": "high",
    "image_quality": "good",
    "processing_time_ms": 1250
  }
}
```

## Error Handling

The backend should handle these error cases:

1. **Low Confidence Analysis** (< 0.7): Return multiple possible form options
2. **GPS Extraction Failure**: Use image-based location detection
3. **Unclear Damage Type**: Default to unified form with "Other" category
4. **Image Quality Issues**: Still attempt form submission with available data

## Testing Recommendations

1. **Test each form type** with sample images
2. **Validate GPS coordinate extraction** accuracy
3. **Test edge cases** like unclear damage types
4. **Verify form field mapping** matches SF.gov requirements
5. **Test error handling** for various failure scenarios

This guide ensures the backend can properly analyze images and generate the correct JSON input for each Playwright script to successfully submit SF.gov forms.
